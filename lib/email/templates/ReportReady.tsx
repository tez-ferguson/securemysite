import { Heading, Link, Section, Text } from '@react-email/components'
import { EmailLayout, emailStyles } from './Layout'
import { BRAND_NAME } from '@/lib/brand'

type ReportReadyProps = {
  host: string
  reportHref: string
  totalCount: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
}

export function ReportReadyEmail({
  host,
  reportHref,
  totalCount,
  criticalCount,
  highCount,
  mediumCount,
  lowCount,
}: ReportReadyProps) {
  const issueWord = totalCount === 1 ? 'issue' : 'issues'

  return (
    <EmailLayout preview={`${totalCount} ${issueWord} found on ${host}`}>
      <Heading style={emailStyles.serifHeading}>
        Your scan is ready
      </Heading>
      <Text style={emailStyles.body}>
        We finished scanning <strong>{host}</strong>. {BRAND_NAME} found{' '}
        <strong>{totalCount}</strong> {issueWord} from the outside in — SSL, headers,
        DNS, and more.
      </Text>
      <Section style={emailStyles.statRow}>
        <Text style={emailStyles.statNumber}>{totalCount}</Text>
        <Text style={emailStyles.statLabel}>Total issues</Text>
      </Section>
      <Text style={emailStyles.bodySmall}>
        {criticalCount > 0 ? (
          <>
            <span style={{ color: '#c0392b', fontWeight: 600 }}>{criticalCount} critical</span>
            {' · '}
          </>
        ) : null}
        {highCount} high · {mediumCount} medium · {lowCount} low
      </Text>
      <Text style={emailStyles.body}>
        Open your report to preview findings. Unlock the full report for $29 to see every
        issue with AI fix prompts you can paste into Lovable, Bolt, or Cursor.
      </Text>
      <Link href={reportHref} style={emailStyles.cta}>
        View your report →
      </Link>
    </EmailLayout>
  )
}
