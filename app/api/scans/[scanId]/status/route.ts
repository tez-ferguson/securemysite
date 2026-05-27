import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: { scanId: string } },
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const supabase = createServiceClient()

  const { data: job } = await supabase
    .from('scan_jobs')
    .select('id, status, user_id')
    .eq('id', params.scanId)
    .single()

  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (job.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: findings } = await supabase
    .from('scan_findings')
    .select('total_count, critical_count, high_count, medium_count, low_count')
    .eq('scan_job_id', params.scanId)
    .single()

  const { data: unlock } = await supabase
    .from('scan_unlocks')
    .select('id, unlock_type')
    .eq('scan_job_id', params.scanId)
    .eq('user_id', userId)
    .single()

  return NextResponse.json({
    status: job.status,
    totalCount: findings?.total_count ?? 0,
    criticalCount: findings?.critical_count ?? 0,
    highCount: findings?.high_count ?? 0,
    mediumCount: findings?.medium_count ?? 0,
    lowCount: findings?.low_count ?? 0,
    unlocked: !!unlock,
    unlockType: unlock?.unlock_type ?? null,
  })
}
