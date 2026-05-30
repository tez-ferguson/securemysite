import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import type { Finding } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } },
) {
  const supabase = createServiceClient()

  const { data: row, error } = await supabase
    .from('passive_scans')
    .select('*')
    .eq('token', params.token)
    .maybeSingle()

  if (error || !row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const findings = (row.findings as Finding[] | null) ?? []
  const paid = row.paid as boolean
  let status = row.status as string
  let errorMessage = (row.error_message as string | null) ?? null

  // Callback finished but status column may still say running briefly, or was wrongly marked failed
  const hasResults =
    !!row.completed_at || (row.total_count ?? 0) > 0 || findings.length > 0
  if (hasResults && status !== 'complete') {
    status = 'complete'
    errorMessage = null
    if (row.status !== 'complete') {
      await supabase
        .from('passive_scans')
        .update({ status: 'complete', error_message: null })
        .eq('token', params.token)
    }
  }

  // Stuck on running with no results = callback never reached the app
  const STALE_MS = 4 * 60 * 1000
  if (
    (status === 'running' || status === 'queued') &&
    !hasResults &&
    row.created_at
  ) {
    const age = Date.now() - new Date(row.created_at as string).getTime()
    if (age > STALE_MS) {
      errorMessage =
        'Scan timed out — results never reached the server. Set NEXT_PUBLIC_APP_URL to your live site URL (no redirect), redeploy Vercel, run modal deploy passive.py, then start a new scan.'
      await supabase
        .from('passive_scans')
        .update({ status: 'failed', error_message: errorMessage })
        .eq('token', params.token)
      status = 'failed'
    }
  }

  const payload: Record<string, unknown> = {
    status,
    url: row.url,
    totalCount: row.total_count ?? 0,
    criticalCount: row.critical_count ?? 0,
    highCount: row.high_count ?? 0,
    mediumCount: row.medium_count ?? 0,
    lowCount: row.low_count ?? 0,
    paid,
    errorMessage,
  }

  if (status === 'complete' || status === 'failed') {
    if (paid) {
      payload.findings = findings
    } else if (findings.length > 0) {
      payload.previewFinding = findings[0]
      payload.lockedCount = Math.max(0, findings.length - 1)
    }
  }

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'CDN-Cache-Control': 'no-store',
      'Vercel-CDN-Cache-Control': 'no-store',
    },
  })
}
