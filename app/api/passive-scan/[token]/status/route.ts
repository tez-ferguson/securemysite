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
  const status = row.status as string

  const payload: Record<string, unknown> = {
    status,
    url: row.url,
    totalCount: row.total_count ?? 0,
    criticalCount: row.critical_count ?? 0,
    highCount: row.high_count ?? 0,
    mediumCount: row.medium_count ?? 0,
    lowCount: row.low_count ?? 0,
    paid,
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
