import { NextRequest, NextResponse } from 'next/server'
import { stripe, PRICES } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase'

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

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

  return NextResponse.json({ checkoutUrl: session.url })
}
