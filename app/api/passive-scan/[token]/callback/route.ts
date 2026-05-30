import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase'
import { BRAND_NAME } from '@/lib/brand'

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
    .select('email, url')
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

  try {
    if (!failed && row?.email && process.env.RESEND_API_KEY && process.env.NEXT_PUBLIC_APP_URL) {
      const reportUrl = `${process.env.NEXT_PUBLIC_APP_URL}/scan/${params.token}`
      const resend = new Resend(process.env.RESEND_API_KEY)
      const from = process.env.RESEND_FROM_EMAIL ?? `${BRAND_NAME} <onboarding@resend.dev>`
      const label = row.url ?? 'your site'
      await resend.emails.send({
        from,
        to: row.email,
        subject: `Your ${BRAND_NAME} scan finished — ${counts.total} issues found`,
        html: `
          <p style="font-family:Georgia, serif; font-size:18px; color:#111010; margin-bottom:14px;">
            Scan complete for <strong>${label}</strong>
          </p>
          <p style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#444240;margin-bottom:20px;">
            We found ${counts.total} issues · ${counts.critical} critical, ${counts.high} high,
            ${counts.medium} medium, ${counts.low} low.
          </p>
          <p style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#444240;margin-bottom:32px;">
            Open your report to see what surfaced. Unlock full details and fix prompts for $29.
          </p>
          <a href="${reportUrl}" style="
            display:inline-block;
            padding:14px 24px;
            background:#111010;
            color:#ffffff;
            text-decoration:none;
            font-family:system-ui,sans-serif;
            font-size:14px;
          ">View report →</a>
        `,
      })
    }
  } catch (e) {
    console.error('Passive completion email skipped/failed:', e)
  }

  return NextResponse.json({ ok: true })
}
