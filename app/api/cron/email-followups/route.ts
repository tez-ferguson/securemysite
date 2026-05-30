import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { sendFollowUp } from '@/lib/email/send'
import type { FollowUpStage } from '@/lib/email/types'
import { verifySecret } from '@/lib/crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const BATCH_LIMIT = 50
const MS_DAY = 24 * 60 * 60 * 1000

function authorize(req: NextRequest): boolean {
  const auth = req.headers.get('authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  return verifySecret(token, process.env.CRON_SECRET)
}

type ScanRow = {
  token: string
  email: string
  url: string
  total_count: number
  critical_count: number
  high_count: number
  medium_count: number
  low_count: number
  unsubscribe_token: string
  completed_at: string
  followup_1_sent_at: string | null
  followup_2_sent_at: string | null
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = Date.now()
  const twoDaysAgo = new Date(now - 2 * MS_DAY).toISOString()
  const sixDaysAgo = new Date(now - 6 * MS_DAY).toISOString()

  const supabase = createServiceClient()
  const results = { stage1: 0, stage2: 0, errors: 0 as number, skipped: 0 }

  const { data: stage1Candidates, error: q1Error } = await supabase
    .from('passive_scans')
    .select(
      'token, email, url, total_count, critical_count, high_count, medium_count, low_count, unsubscribe_token, completed_at, followup_1_sent_at, followup_2_sent_at',
    )
    .eq('status', 'complete')
    .eq('paid', false)
    .is('unsubscribed_at', null)
    .is('followup_1_sent_at', null)
    .gt('total_count', 0)
    .lte('completed_at', twoDaysAgo)
    .limit(BATCH_LIMIT)

  if (q1Error) {
    console.error('Follow-up stage 1 query failed:', q1Error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  for (const row of (stage1Candidates ?? []) as ScanRow[]) {
    const sent = await processFollowUp(supabase, row, 1)
    if (sent) results.stage1++
    else results.skipped++
  }

  const { data: stage2Candidates, error: q2Error } = await supabase
    .from('passive_scans')
    .select(
      'token, email, url, total_count, critical_count, high_count, medium_count, low_count, unsubscribe_token, completed_at, followup_1_sent_at, followup_2_sent_at',
    )
    .eq('status', 'complete')
    .eq('paid', false)
    .is('unsubscribed_at', null)
    .not('followup_1_sent_at', 'is', null)
    .is('followup_2_sent_at', null)
    .gt('total_count', 0)
    .lte('completed_at', sixDaysAgo)
    .limit(BATCH_LIMIT)

  if (q2Error) {
    console.error('Follow-up stage 2 query failed:', q2Error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  for (const row of (stage2Candidates ?? []) as ScanRow[]) {
    const sent = await processFollowUp(supabase, row, 2)
    if (sent) results.stage2++
    else results.skipped++
  }

  return NextResponse.json({ ok: true, ...results })
}

async function processFollowUp(
  supabase: ReturnType<typeof createServiceClient>,
  row: ScanRow,
  stage: FollowUpStage,
): Promise<boolean> {
  const result = await sendFollowUp(
    {
      token: row.token,
      email: row.email,
      url: row.url,
      total_count: row.total_count,
      critical_count: row.critical_count,
      high_count: row.high_count,
      medium_count: row.medium_count,
      low_count: row.low_count,
      unsubscribe_token: row.unsubscribe_token,
    },
    stage,
  )

  if (!result.ok) {
    console.error(`Follow-up stage ${stage} failed for ${row.token}:`, result.error)
    return false
  }

  const field = stage === 1 ? 'followup_1_sent_at' : 'followup_2_sent_at'
  const { error } = await supabase
    .from('passive_scans')
    .update({ [field]: new Date().toISOString() })
    .eq('token', row.token)
    .eq('paid', false)

  if (error) {
    console.error(`Failed to stamp ${field}:`, error)
    return false
  }

  return true
}
