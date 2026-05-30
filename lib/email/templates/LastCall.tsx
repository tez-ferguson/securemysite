import { Heading, Link, Text } from '@react-email/components'
import { EmailLayout, emailStyles } from './Layout'
import { BRAND_NAME } from '@/lib/brand'

type LastCallProps = {
  host: string
  reportHref: string
  totalCount: number
  unsubscribeHref: string
}

export function LastCallEmail({
  host,
  reportHref,
  totalCount,
  unsubscribeHref,
}: LastCallProps) {
  return (
    <EmailLayout
      preview={`Last reminder: ${totalCount} issues on ${host}`}
      unsubscribeHref={unsubscribeHref}
    >
      <Heading style={emailStyles.serifHeading}>
        Last call before you ship again
      </Heading>
      <Text style={emailStyles.body}>
        This is our final reminder about your {BRAND_NAME} scan for{' '}
        <strong>{host}</strong>. <strong>{totalCount}</strong>{' '}
        {totalCount === 1 ? 'issue remains' : 'issues remain'} unaddressed on your
        production URL.
      </Text>
      <Text style={emailStyles.body}>
        Teams that fix findings within a week of discovery avoid the expensive breach
        conversations. You already did the hard part — the scan is done. Unlock the
        report, apply the fix prompts, and move on.
      </Text>
      <Text style={emailStyles.bodySmall}>
        After this email we will not send more reminders about this scan.
      </Text>
      <Link href={reportHref} style={emailStyles.cta}>
        View report &amp; unlock →
      </Link>
    </EmailLayout>
  )
}
