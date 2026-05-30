import { NextRequest, NextResponse } from 'next/server'
import { stripe, PRICES } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase'
import { getCallbackAppUrl } from '@/lib/url'

export async function POST(
  _req: NextRequest,
  { params }: { params: { token: string } },
) {
  const supabase = createServiceClient()

  const { data: row } = await supabase
    .from('passive_scans')
    .select('token, status, paid, url')
    .eq('token', params.token)
    .maybeSingle()

  if (!row) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
  }

  if (row.paid) {
    return NextResponse.json({ error: 'Already unlocked' }, { status: 400 })
  }

  if (row.status !== 'complete') {
    return NextResponse.json({ error: 'Scan not complete' }, { status: 400 })
  }

  const appUrl = getCallbackAppUrl()
  if (!appUrl) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  if (!PRICES.report) {
    return NextResponse.json({ error: 'Payments not configured' }, { status: 503 })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: PRICES.report, quantity: 1 }],
      success_url: `${appUrl}/scan/${params.token}?payment=success`,
      cancel_url: `${appUrl}/scan/${params.token}?payment=cancelled`,
      metadata: {
        token: params.token,
        type: 'passive_unlock',
      },
      payment_intent_data: {
        metadata: {
          token: params.token,
          type: 'passive_unlock',
        },
      },
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Checkout unavailable' }, { status: 502 })
    }

    return NextResponse.json({ checkoutUrl: session.url })
  } catch (err) {
    console.error('Passive checkout failed:', err)
    return NextResponse.json({ error: 'Could not start checkout' }, { status: 502 })
  }
}
