import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase'
import { sendUnlockReceipt } from '@/lib/email/send'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const type = session.metadata?.type
    const supabase = createServiceClient()

    if (type === 'passive_unlock') {
      const token = session.metadata?.token
      if (token) {
        await supabase
          .from('passive_scans')
          .update({
            paid: true,
            stripe_session_id: session.id,
          })
          .eq('token', token)

        const { data: scan } = await supabase
          .from('passive_scans')
          .select('token, email, url, total_count, critical_count, high_count, medium_count, low_count')
          .eq('token', token)
          .maybeSingle()

        if (scan?.email) {
          try {
            await sendUnlockReceipt({
              token: scan.token,
              email: scan.email,
              url: scan.url,
              total_count: scan.total_count ?? 0,
              critical_count: scan.critical_count ?? 0,
              high_count: scan.high_count ?? 0,
              medium_count: scan.medium_count ?? 0,
              low_count: scan.low_count ?? 0,
            })
          } catch (e) {
            console.error('Unlock receipt email failed:', e)
          }
        }
      }
      return NextResponse.json({ received: true })
    }

    const { scanId, userId } = session.metadata!
    const unlockType = type ?? session.metadata?.type

    if (!scanId || !userId || !unlockType) {
      return NextResponse.json({ received: true })
    }

    // Create unlock row — this is the authoritative gate checked by the results route
    await supabase.from('scan_unlocks').insert({
      user_id: userId,
      scan_job_id: scanId,
      unlock_type: unlockType,
      stripe_payment_intent_id: session.payment_intent as string,
      stripe_session_id: session.id,
    })

    // If agent_fix, mark fix pipeline (scan job stays `complete` once results exist)
    if (unlockType === 'agent_fix') {
      await supabase.from('scan_jobs').update({ fix_status: 'queued' }).eq('id', scanId)
    }
  }

  return NextResponse.json({ received: true })
}
