'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase.client'
import type { User } from '@supabase/supabase-js'

interface NavProps {
  backHref?: string
  backLabel?: string
}

const EASE = [0.16, 1, 0.3, 1] as const

export default function Nav({ backHref, backLabel }: NavProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = createBrowserClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

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

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link href="/dashboard" style={{ fontSize: '0.8rem', color: 'var(--ink3)', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink3)')}
            >
              Dashboard
            </Link>
            <button
              onClick={handleSignOut}
              style={{ fontSize: '0.8rem', color: 'var(--ink3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'color 0.15s', padding: 0 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink3)')}
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link
            href="/sign-in"
            style={{ fontSize: '0.8rem', color: 'var(--ink)', background: 'none', border: '1px solid var(--ink)', padding: '8px 18px', fontFamily: 'var(--sans)', fontWeight: 400, letterSpacing: '0.01em', textDecoration: 'none', transition: 'background 0.15s, color 0.15s', display: 'inline-block' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--ink)'; (e.currentTarget as HTMLElement).style.color = 'var(--bg)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'var(--ink)' }}
          >
            Sign in
          </Link>
        )}
      </div>
    </motion.nav>
  )
}
