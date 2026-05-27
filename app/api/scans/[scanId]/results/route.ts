import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: { scanId: string } }
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()

  // Verify ownership
  const { data: job } = await supabase
    .from('scan_jobs')
    .select('id, status, repo_name, site_url, created_at, completed_at, user_id')
    .eq('id', params.scanId)
    .single()

  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (job.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Get counts (always safe to return)
  const { data: findingsRow } = await supabase
    .from('scan_findings')
    .select('total_count, critical_count, high_count, medium_count, low_count, findings')
    .eq('scan_job_id', params.scanId)
    .single()

  // CRITICAL: Check unlock status BEFORE returning any finding details.
  // If no row exists in scan_unlocks for this (scan_job_id, user_id), finding
  // details are NEVER returned — only counts and locked stubs.
  const { data: unlock } = await supabase
    .from('scan_unlocks')
    .select('id, unlock_type')
    .eq('scan_job_id', params.scanId)
    .eq('user_id', userId)
    .single()

  const baseResponse = {
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

  // Only attach full findings if a confirmed unlock row exists
  if (unlock && findingsRow?.findings) {
    return NextResponse.json({
      ...baseResponse,
      findings: findingsRow.findings,
    })
  }

  // Return preview: first finding only (teaser), rest as locked stubs
  const findings = findingsRow?.findings as any[] | null
  const preview = findings ? [findings[0]].filter(Boolean) : []
  const lockedStubs = findings
    ? findings.slice(1).map((f: any) => ({ severity: f.severity, file: f.file, id: f.id }))
    : []

  return NextResponse.json({
    ...baseResponse,
    findings: preview,
    lockedStubs,
  })
}
