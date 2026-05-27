import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import type { Finding } from '@/types'

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
    .select('id, status, repo_name, site_url, created_at, completed_at, user_id')
    .eq('id', params.scanId)
    .single()

  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (job.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: findingsRow } = await supabase
    .from('scan_findings')
    .select('total_count, critical_count, high_count, medium_count, low_count, findings')
    .eq('scan_job_id', params.scanId)
    .single()

  // CRITICAL: check unlock before returning any finding details
  const { data: unlock } = await supabase
    .from('scan_unlocks')
    .select('id, unlock_type')
    .eq('scan_job_id', params.scanId)
    .eq('user_id', userId)
    .single()

  const base = {
    scanId: params.scanId,
    status: job.status,
    repoName: job.repo_name,
    siteUrl: job.site_url,
    createdAt: job.created_at,
    completedAt: job.completed_at,
    totalCount: findingsRow?.total_count ?? 0,
    criticalCount: findingsRow?.critical_count ?? 0,
    highCount: findingsRow?.high_count ?? 0,
    mediumCount: findingsRow?.medium_count ?? 0,
    lowCount: findingsRow?.low_count ?? 0,
    unlocked: !!unlock,
    unlockType: unlock?.unlock_type ?? null,
  }

  if (unlock && findingsRow?.findings) {
    return NextResponse.json({ ...base, findings: findingsRow.findings })
  }

  const allFindings = findingsRow?.findings as Finding[] | null
  const preview = allFindings ? [allFindings[0]].filter(Boolean) : []
  const lockedStubs = allFindings
    ? allFindings.slice(1).map((f) => ({ severity: f.severity, file: f.file, id: f.id }))
    : []

  return NextResponse.json({ ...base, findings: preview, lockedStubs })
}
