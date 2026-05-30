import { Heading, Link, Text } from '@react-email/components'
import { EmailLayout, emailStyles } from './Layout'
import { BRAND_NAME } from '@/lib/brand'

type StillVulnerableProps = {
  host: string
  reportHref: string
  totalCount: number
  criticalCount: number
  unsubscribeHref: string
}

export function StillVulnerableEmail({
  host,
  reportHref,
  totalCount,
  criticalCount,
  unsubscribeHref,
}: StillVulnerableProps) {
  return (
    <EmailLayout
      preview={`${host} still has ${totalCount} open security issues`}
      unsubscribeHref={unsubscribeHref}
    >
      <Heading style={emailStyles.serifHeading}>
        Your site is still <span style={emailStyles.accent}>exposed</span>
      </Heading>
      <Text style={emailStyles.body}>
        A few days ago you scanned <strong>{host}</strong> with {BRAND_NAME}. Those{' '}
        <strong>{totalCount}</strong> issues are still sitting on your live site — and
        unfixed vulnerabilities are how data breaches start.
      </Text>
      {criticalCount > 0 ? (
        <Text style={emailStyles.body}>
          <strong style={{ color: '#c0392b' }}>{criticalCount} critical</strong>{' '}
          {criticalCount === 1 ? 'issue needs' : 'issues need'} attention now. Headers,
          SSL misconfigurations, and exposed paths do not fix themselves.
        </Text>
      ) : null}
      <Text style={emailStyles.bodySmall}>
        Pay $29 once to unlock the full report: every finding, severity, and an AI fix
        prompt for each one. Connect GitHub afterward for a full codebase scan.
      </Text>
      <Link href={reportHref} style={emailStyles.cta}>
        Unlock full report — $29 →
      </Link>
    </EmailLayout>
  )
}
