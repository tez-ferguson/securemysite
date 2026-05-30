import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { sendReportReady, sendScanFailed } from '@/lib/email/send'

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } },
) {
  const secret = req.headers.get('x-scanner-secret')?.trim()
  const expected = process.env.SCANNER_CALLBACK_SECRET?.trim()
  if (!secret || !expected || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { findings, counts, failed, error_message: errorMessage } = body as {
    findings: unknown[]
    counts: {
      total: number
      critical: number
      high: number
      medium: number
      low: number
    }
    failed?: boolean
    error_message?: string
  }

  const supabase = createServiceClient()

  const { data: row } = await supabase
    .from('passive_scans')
    .select('token, email, url, unsubscribe_token')
    .eq('token', params.token)
    .maybeSingle()

  const scanStatus = failed ? 'failed' : 'complete'

  const { error: updateError } = await supabase
    .from('passive_scans')
    .update({
      status: scanStatus,
      findings: failed ? [] : findings,
      total_count: counts.total,
      critical_count: counts.critical,
      high_count: counts.high,
      medium_count: counts.medium,
      low_count: counts.low,
      completed_at: new Date().toISOString(),
      error_message: failed ? (errorMessage?.slice(0, 500) ?? 'Scan failed on Modal') : null,
    })
    .eq('token', params.token)

  if (updateError) {
    console.error('Failed to update passive scan:', updateError)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!row?.email) {
    return NextResponse.json({ ok: true })
  }

  try {
    if (failed) {
      await sendScanFailed({ email: row.email, url: row.url })
    } else {
      const result = await sendReportReady({
        token: row.token,
        email: row.email,
        url: row.url,
        total_count: counts.total,
        critical_count: counts.critical,
        high_count: counts.high,
        medium_count: counts.medium,
        low_count: counts.low,
        unsubscribe_token: row.unsubscribe_token,
      })
      if (result.ok) {
        await supabase
          .from('passive_scans')
          .update({ report_ready_email_sent_at: new Date().toISOString() })
          .eq('token', params.token)
      }
    }
  } catch (e) {
    console.error('Passive completion email skipped/failed:', e)
  }

  return NextResponse.json({ ok: true })
}
