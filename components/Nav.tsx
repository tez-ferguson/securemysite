'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useUser, SignInButton, UserButton } from '@clerk/nextjs'

interface NavProps {
  backHref?: string
  backLabel?: string
}

const EASE = [0.16, 1, 0.3, 1] as const

export default function Nav({ backHref, backLabel }: NavProps) {
  const { isSignedIn } = useUser()

  return (
    <motion.nav
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 48px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}
    >
      <Link href="/" style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', letterSpacing: '-0.01em', color: 'var(--ink)', textDecoration: 'none' }}>
        VibeSec
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        {backHref ? (
          <Link href={backHref} style={{ fontSize: '0.8rem', color: 'var(--ink3)', textDecoration: 'none', letterSpacing: '0.01em', transition: 'color 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink3)')}
          >
            ← {backLabel ?? 'Back'}
          </Link>
        ) : (
          <>
            <Link href="/#how-it-works" style={{ fontSize: '0.8rem', color: 'var(--ink3)', textDecoration: 'none', letterSpacing: '0.01em', transition: 'color 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink3)')}
            >
              How it works
            </Link>
            <Link href="/pricing" style={{ fontSize: '0.8rem', color: 'var(--ink3)', textDecoration: 'none', letterSpacing: '0.01em', transition: 'color 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink3)')}
            >
              Pricing
            </Link>
          </>
        )}

        {isSignedIn ? (
          <UserButton afterSignOutUrl="/" />
        ) : (
          <SignInButton mode="modal">
            <button style={{ fontSize: '0.8rem', color: 'var(--ink)', background: 'none', border: '1px solid var(--ink)', padding: '8px 18px', cursor: 'pointer', fontFamily: 'var(--sans)', fontWeight: 400, letterSpacing: '0.01em', transition: 'background 0.15s, color 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--ink)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--bg)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink)' }}
            >
              Sign in
            </button>
          </SignInButton>
        )}
      </div>
    </motion.nav>
  )
}
