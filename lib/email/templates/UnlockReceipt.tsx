import { Heading, Link, Text } from '@react-email/components'
import { EmailLayout, emailStyles } from './Layout'
import { BRAND_NAME } from '@/lib/brand'

type UnlockReceiptProps = {
  host: string
  reportHref: string
  totalCount: number
}

export function UnlockReceiptEmail({ host, reportHref, totalCount }: UnlockReceiptProps) {
  return (
    <EmailLayout preview={`Report unlocked for ${host}`}>
      <Heading style={emailStyles.serifHeading}>
        Report unlocked — thank you
      </Heading>
      <Text style={emailStyles.body}>
        Your payment went through. You now have full access to all{' '}
        <strong>{totalCount}</strong> findings for <strong>{host}</strong>, including AI
        fix prompts for SSL, headers, DNS, and hosting issues.
      </Text>
      <Link href={reportHref} style={emailStyles.cta}>
        Open full report →
      </Link>
      <Text style={{ ...emailStyles.body, marginTop: '32px' }}>
        <strong>Next step: full codebase scan</strong>
      </Text>
      <Text style={emailStyles.bodySmall}>
        From your report page, connect GitHub to scan your repository for exposed secrets,
        vulnerable dependencies, and code-level vulnerabilities across the whole codebase.
      </Text>
      <Text style={emailStyles.bodySmall}>
        Questions? Reply to this email or contact us — we read every message at {BRAND_NAME}.
      </Text>
    </EmailLayout>
  )
}
