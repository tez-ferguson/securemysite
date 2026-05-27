import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'

export default function SignInPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f7f5f2',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          borderBottom: '1px solid #e2deda',
          backgroundColor: '#ffffff',
          padding: '0 40px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: '1.1rem',
            color: '#111010',
            textDecoration: 'none',
          }}
        >
          VibeSec
        </Link>
        <Link
          href="/sign-up"
          style={{ color: '#444240', fontSize: '0.88rem', textDecoration: 'none' }}
        >
          Create account →
        </Link>
      </nav>

      {/* Centered content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 24px',
          minHeight: 'calc(100vh - 56px)',
        }}
      >
        {/* Heading above the Clerk component */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontWeight: 400,
              fontSize: '2rem',
              color: '#111010',
              margin: '0 0 8px 0',
            }}
          >
            Welcome back
          </h1>
          <p
            style={{
              fontWeight: 300,
              fontSize: '0.88rem',
              color: '#888580',
              margin: 0,
            }}
          >
            Sign in to view your scan reports
          </p>
        </div>

        {/* Clerk SignIn component */}
        <div
          style={{
            width: '100%',
            maxWidth: '400px',
          }}
        >
          <SignIn
            appearance={{
              variables: {
                colorBackground: '#ffffff',
                colorText: '#111010',
                colorTextSecondary: '#444240',
                colorInputBackground: '#ffffff',
                colorInputText: '#111010',
                colorPrimary: '#111010',
                borderRadius: '0px',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: { normal: 300, medium: 400, bold: 400 },
              },
              elements: {
                card: {
                  boxShadow: 'none',
                  border: '1px solid #e2deda',
                  borderRadius: '0',
                  backgroundColor: '#ffffff',
                },
                headerTitle: {
                  display: 'none',
                },
                headerSubtitle: {
                  display: 'none',
                },
                socialButtonsBlockButton: {
                  border: '1px solid #e2deda',
                  borderRadius: '0',
                  backgroundColor: '#ffffff',
                  color: '#111010',
                  fontWeight: 400,
                },
                formButtonPrimary: {
                  backgroundColor: '#111010',
                  borderRadius: '0',
                  fontWeight: 400,
                  fontSize: '0.9rem',
                },
                formFieldInput: {
                  border: '1px solid #e2deda',
                  borderRadius: '0',
                  fontSize: '0.9rem',
                },
                footerActionLink: {
                  color: '#111010',
                  fontWeight: 400,
                },
                dividerLine: {
                  backgroundColor: '#e2deda',
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}
