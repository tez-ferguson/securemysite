import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { stripe, PRICES } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase'
import { z } from 'zod'

const schema = z.object({
  scanId: z.string().uuid(),
  type: z.enum(['report', 'agent_fix']),
})

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { scanId, type } = parsed.data
  const supabase = createServiceClient()

  const { data: job } = await supabase
    .from('scan_jobs')
    .select('id, user_id, repo_name')
    .eq('id', scanId)
    .single()

  if (!job) return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
  if (job.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const price = type === 'report' ? PRICES.report : PRICES.agent_fix

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/report/${scanId}?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/report/${scanId}?payment=cancelled`,
    metadata: { scanId, userId, type },
    payment_intent_data: { metadata: { scanId, userId, type } },
  })

  return NextResponse.json({ checkoutUrl: session.url })
}
