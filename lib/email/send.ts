import { sendEmail } from './client'
import { displayHost, homeUrl, reportUrl, unsubscribeUrl } from './urls'
import { ReportReadyEmail } from './templates/ReportReady'
import { StillVulnerableEmail } from './templates/StillVulnerable'
import { LastCallEmail } from './templates/LastCall'
import { UnlockReceiptEmail } from './templates/UnlockReceipt'
import { ScanFailedEmail } from './templates/ScanFailed'
import type { FollowUpStage, PassiveScanEmailRow } from './types'
import { BRAND_NAME } from '@/lib/brand'

function counts(row: PassiveScanEmailRow) {
  return {
    totalCount: row.total_count ?? 0,
    criticalCount: row.critical_count ?? 0,
    highCount: row.high_count ?? 0,
    mediumCount: row.medium_count ?? 0,
    lowCount: row.low_count ?? 0,
  }
}

export async function sendReportReady(row: PassiveScanEmailRow) {
  const host = displayHost(row.url)
  const href = reportUrl(row.token)
  const c = counts(row)
  const issueWord = c.totalCount === 1 ? 'issue' : 'issues'

  return sendEmail({
    to: row.email,
    subject: `Your ${BRAND_NAME} report is ready — ${c.totalCount} ${issueWord} on ${host}`,
    react: ReportReadyEmail({
      host,
      reportHref: href,
      ...c,
    }),
  })
}

export async function sendScanFailed(row: Pick<PassiveScanEmailRow, 'email' | 'url'>) {
  const host = displayHost(row.url)

  return sendEmail({
    to: row.email,
    subject: `Scan could not finish for ${host}`,
    react: ScanFailedEmail({
      host,
      retryHref: homeUrl(),
    }),
  })
}

export async function sendUnlockReceipt(row: PassiveScanEmailRow) {
  const host = displayHost(row.url)
  const c = counts(row)

  return sendEmail({
    to: row.email,
    subject: `Report unlocked for ${host}`,
    react: UnlockReceiptEmail({
      host,
      reportHref: reportUrl(row.token),
      totalCount: c.totalCount,
    }),
  })
}

export async function sendFollowUp(row: PassiveScanEmailRow, stage: FollowUpStage) {
  const host = displayHost(row.url)
  const href = reportUrl(row.token)
  const c = counts(row)
  const token = row.unsubscribe_token
  const unsub = token ? unsubscribeUrl(token) : undefined

  const headers: Record<string, string> = {}
  if (unsub) {
    headers['List-Unsubscribe'] = `<${unsub}>`
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
  }

  if (stage === 1) {
    return sendEmail({
      to: row.email,
      subject: `${host} is still vulnerable — ${c.totalCount} issues unfixed`,
      react: StillVulnerableEmail({
        host,
        reportHref: href,
        totalCount: c.totalCount,
        criticalCount: c.criticalCount,
        unsubscribeHref: unsub ?? href,
      }),
      headers,
    })
  }

  return sendEmail({
    to: row.email,
    subject: `Last reminder: fix ${c.totalCount} issues on ${host}`,
    react: LastCallEmail({
      host,
      reportHref: href,
      totalCount: c.totalCount,
      unsubscribeHref: unsub ?? href,
    }),
    headers,
  })
}
