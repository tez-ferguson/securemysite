import { NextRequest, NextResponse } from 'next/server'
import { getUserEmail } from '@/lib/auth'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase'
import { BRAND_NAME } from '@/lib/brand'
import { verifySecret } from '@/lib/crypto'

/** Escape HTML special characters to prevent injection in email bodies. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function POST(
  req: NextRequest,
  { params }: { params: { scanId: string } },
) {
  const secret = req.headers.get('x-scanner-secret')
  if (!verifySecret(secret, process.env.SCANNER_CALLBACK_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { findings, counts } = body as {
    findings: unknown[]
    counts: {
      total: number
      critical: number
      high: number
      medium: number
      low: number
    }
  }

  const supabase = createServiceClient()

  const { data: job } = await supabase
    .from('scan_jobs')
    .select('user_id, repo_name, site_url')
    .eq('id', params.scanId)
    .maybeSingle()

  const { error: findingsError } = await supabase.from('scan_findings').insert({
    scan_job_id: params.scanId,
    findings: findings,
    total_count: counts.total,
    critical_count: counts.critical,
    high_count: counts.high,
    medium_count: counts.medium,
    low_count: counts.low,
  })

  if (findingsError) {
    console.error('Failed to write findings:', findingsError)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  await supabase
    .from('scan_jobs')
    .update({ status: 'complete', completed_at: new Date().toISOString() })
    .eq('id', params.scanId)

  try {
    if (job?.user_id && process.env.RESEND_API_KEY && process.env.NEXT_PUBLIC_APP_URL) {
      const addr = await getUserEmail(job.user_id)
      if (addr) {
        const subject = `Your ${BRAND_NAME} scan finished — ${counts.total} vulnerabilities found`
        // Escape user-supplied values to prevent HTML injection in the email body
        const label = escapeHtml(job.repo_name ?? job.site_url ?? 'your project')
        const reportUrl = encodeURI(`${process.env.NEXT_PUBLIC_APP_URL}/report/${params.scanId}`)
        const resend = new Resend(process.env.RESEND_API_KEY)
        const from = process.env.RESEND_FROM_EMAIL ?? `${BRAND_NAME} <onboarding@resend.dev>`
        await resend.emails.send({
          from,
          to: addr,
          subject,
          html: `
            <p style="font-family:Georgia, serif; font-size:18px; color:#111010; margin-bottom:14px;">
              Scan complete for <strong>${label}</strong>
            </p>
            <p style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#444240;margin-bottom:20px;">
              We found ${counts.total} issues · ${counts.critical} critical, ${counts.high} high,
              ${counts.medium} medium, ${counts.low} low.
            </p>
            <p style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#444240;margin-bottom:32px;">
              Open your report to see what surfaced.
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
    }
  } catch (e) {
    console.error('Completion email skipped/failed:', e)
  }

  return NextResponse.json({ ok: true })
}
