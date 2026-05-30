import Link from 'next/link'
import { BRAND_NAME } from '@/lib/brand'

type PageProps = {
  searchParams: { done?: string; token?: string }
}

export default function UnsubscribePage({ searchParams }: PageProps) {
  const done = searchParams.done === '1'

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        background: '#f7f5f2',
        fontFamily: 'var(--sans)',
      }}
    >
      <div style={{ maxWidth: '420px', textAlign: 'center' }}>
        <p
          style={{
            fontFamily: 'var(--serif)',
            fontSize: '1.5rem',
            color: 'var(--ink)',
            marginBottom: '16px',
          }}
        >
          {BRAND_NAME}
        </p>
        {done ? (
          <>
            <h1
              style={{
                fontFamily: 'var(--serif)',
                fontSize: '1.75rem',
                fontWeight: 400,
                marginBottom: '12px',
              }}
            >
              You&apos;re unsubscribed
            </h1>
            <p style={{ color: 'var(--ink3)', lineHeight: 1.6, marginBottom: '28px' }}>
              You will not receive follow-up reminders about unpaid scans. Transactional emails
              (like scan-complete notices for new scans) may still be sent when you request a
              new report.
            </p>
          </>
        ) : (
          <>
            <h1
              style={{
                fontFamily: 'var(--serif)',
                fontSize: '1.75rem',
                fontWeight: 400,
                marginBottom: '12px',
              }}
            >
              Unsubscribe
            </h1>
            <p style={{ color: 'var(--ink3)', lineHeight: 1.6, marginBottom: '28px' }}>
              Use the unsubscribe link in your email to confirm. If the link did not work,
              contact us and we will remove you manually.
            </p>
          </>
        )}
        <Link
          href="/"
          style={{
            color: 'var(--ink)',
            fontSize: '0.9rem',
            textDecoration: 'none',
            borderBottom: '1px solid var(--border)',
          }}
        >
          Back to home →
        </Link>
      </div>
    </main>
  )
}
