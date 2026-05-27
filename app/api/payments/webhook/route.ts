import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase'
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
    const { scanId, userId, type } = session.metadata!

    const supabase = createServiceClient()

    // Create unlock row — this is the authoritative gate checked by the results route
    await supabase.from('scan_unlocks').insert({
      user_id: userId,
      scan_job_id: scanId,
      unlock_type: type,
      stripe_payment_intent_id: session.payment_intent as string,
      stripe_session_id: session.id,
    })

    // If agent_fix, mark fix pipeline (scan job stays `complete` once results exist)
    if (type === 'agent_fix') {
      await supabase.from('scan_jobs').update({ fix_status: 'queued' }).eq('id', scanId)
    }
  }

  return NextResponse.json({ received: true })
}
