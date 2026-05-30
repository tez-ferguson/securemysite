import { Heading, Link, Text } from '@react-email/components'
import { EmailLayout, emailStyles } from './Layout'

type ScanFailedProps = {
  host: string
  retryHref: string
}

export function ScanFailedEmail({ host, retryHref }: ScanFailedProps) {
  return (
    <EmailLayout preview={`Scan could not finish for ${host}`}>
      <Heading style={emailStyles.serifHeading}>
        We could not finish your scan
      </Heading>
      <Text style={emailStyles.body}>
        Something went wrong while scanning <strong>{host}</strong>. This is usually
        temporary — the site was unreachable, timed out, or our scanner hit a brief error.
      </Text>
      <Text style={emailStyles.bodySmall}>
        Try again with the same URL. If it keeps failing, check that the site is publicly
        reachable over HTTPS.
      </Text>
      <Link href={retryHref} style={emailStyles.cta}>
        Scan again →
      </Link>
    </EmailLayout>
  )
}
