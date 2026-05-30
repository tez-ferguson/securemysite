import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { ReactNode } from 'react'
import { BRAND_NAME } from '@/lib/brand'

const INK = '#111010'
const INK3 = '#888580'
const BORDER = '#e2deda'
const WARM = '#f7f5f2'

type EmailLayoutProps = {
  preview: string
  children: ReactNode
  unsubscribeHref?: string
}

export function EmailLayout({ preview, children, unsubscribeHref }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={wordmark}>{BRAND_NAME}</Text>
          </Section>
          <Section style={main}>{children}</Section>
          <Hr style={hr} />
          <Text style={footer}>
            {BRAND_NAME} — security scanning for sites built with AI tools.
          </Text>
          {unsubscribeHref ? (
            <Text style={footerMuted}>
              <Link href={unsubscribeHref} style={footerLink}>
                Unsubscribe from follow-up emails
              </Link>
            </Text>
          ) : null}
        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = {
  backgroundColor: WARM,
  margin: 0,
  fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
}

const container: React.CSSProperties = {
  margin: '0 auto',
  padding: '32px 20px 40px',
  maxWidth: '560px',
}

const header: React.CSSProperties = {
  marginBottom: '28px',
}

const wordmark: React.CSSProperties = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: '22px',
  color: INK,
  margin: 0,
  letterSpacing: '-0.02em',
}

const main: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: `1px solid ${BORDER}`,
  padding: '32px 28px',
}

const hr: React.CSSProperties = {
  borderColor: BORDER,
  margin: '28px 0 16px',
}

const footer: React.CSSProperties = {
  fontSize: '12px',
  color: INK3,
  lineHeight: '1.5',
  margin: '0 0 8px',
}

const footerMuted: React.CSSProperties = {
  fontSize: '11px',
  color: INK3,
  margin: 0,
}

const footerLink: React.CSSProperties = {
  color: INK3,
  textDecoration: 'underline',
}

export const emailStyles = {
  serifHeading: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: '26px',
    fontWeight: 400 as const,
    color: INK,
    lineHeight: '1.2',
    margin: '0 0 16px',
    letterSpacing: '-0.02em',
  },
  body: {
    fontSize: '15px',
    lineHeight: '1.65',
    color: '#444240',
    margin: '0 0 20px',
  },
  bodySmall: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: INK3,
    margin: '0 0 24px',
  },
  cta: {
    display: 'inline-block' as const,
    backgroundColor: INK,
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 400 as const,
    textDecoration: 'none',
    padding: '14px 28px',
    letterSpacing: '0.02em',
  },
  ctaSecondary: {
    display: 'inline-block' as const,
    backgroundColor: 'transparent',
    color: INK,
    fontSize: '14px',
    textDecoration: 'none',
    padding: '12px 20px',
    border: `1px solid ${INK}`,
  },
  accent: {
    color: '#c0392b',
    fontStyle: 'italic' as const,
  },
  statRow: {
    margin: '0 0 24px',
    padding: '16px',
    backgroundColor: WARM,
    border: `1px solid ${BORDER}`,
  },
  statNumber: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: '28px',
    color: INK,
    margin: '0 0 4px',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '12px',
    color: INK3,
    margin: 0,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  severityGrid: {
    width: '100%',
    marginBottom: '24px',
  },
  pill: {
    display: 'inline-block',
    fontSize: '11px',
    padding: '4px 10px',
    marginRight: '8px',
    marginBottom: '8px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
}
