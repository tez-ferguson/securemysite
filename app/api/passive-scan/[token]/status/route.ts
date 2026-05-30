import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import type { Finding } from '@/types'

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

  // Stuck on running = callback never reached the app (wrong URL, redirect, or old deploy)
  const STALE_MS = 4 * 60 * 1000
  if ((status === 'running' || status === 'queued') && row.created_at) {
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

  return NextResponse.json(payload)
}
