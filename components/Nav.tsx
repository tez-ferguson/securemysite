'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase.client'
import type { User } from '@supabase/supabase-js'
import { BRAND_NAME } from '@/lib/brand'

interface NavProps {
  backHref?: string
  backLabel?: string
}

const EASE = [0.16, 1, 0.3, 1] as const

const NAV_CSS = `
  .vs-nav-root { display: flex; align-items: center; justify-content: space-between; padding: 20px 40px; border-bottom: 1px solid var(--border); background: var(--bg); }
  .vs-nav-links { display: flex; align-items: center; gap: 28px; }
  .vs-nav-text-link { font-size: 0.8rem; color: var(--ink3); text-decoration: none; letter-spacing: 0.01em; transition: color 0.15s; }
  .vs-nav-text-link:hover { color: var(--ink); }
  .vs-nav-sign-in { font-size: 0.8rem; color: var(--ink); background: none; border: 1px solid var(--ink); padding: 7px 16px; font-family: var(--sans); font-weight: 400; letter-spacing: 0.01em; text-decoration: none; display: inline-block; transition: background 0.15s, color 0.15s; }
  .vs-nav-sign-in:hover { background: var(--ink); color: var(--bg); }
  .vs-nav-sign-out { font-size: 0.8rem; color: var(--ink3); background: none; border: none; cursor: pointer; font-family: var(--sans); padding: 0; transition: color 0.15s; }
  .vs-nav-sign-out:hover { color: var(--ink); }
  .vs-nav-brand { font-family: var(--serif); letter-spacing: -0.02em; color: var(--ink); text-decoration: none; font-size: clamp(0.85rem, 2.5vw, 1.2rem); white-space: nowrap; }
  @media (max-width: 640px) {
    .vs-nav-root { padding: 16px 20px; }
    .vs-nav-hide-mobile { display: none !important; }
    .vs-nav-links { gap: 16px; }
  }
`

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
    <>
      <style>{NAV_CSS}</style>
      <motion.nav
        className="vs-nav-root"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <Link href="/" className="vs-nav-brand">
          {BRAND_NAME}
        </Link>

        <div className="vs-nav-links">
          {backHref ? (
            <Link href={backHref} className="vs-nav-text-link">
              ← {backLabel ?? 'Back'}
            </Link>
          ) : (
            <>
              <Link href="/#how-it-works" className="vs-nav-text-link vs-nav-hide-mobile">How it works</Link>
              <Link href="/pricing" className="vs-nav-text-link vs-nav-hide-mobile">Pricing</Link>
            </>
          )}

          {user ? (
            <>
              <Link href="/dashboard" className="vs-nav-text-link vs-nav-hide-mobile">Dashboard</Link>
              <button onClick={handleSignOut} className="vs-nav-sign-out">Sign out</button>
            </>
          ) : (
            <Link href="/sign-in" className="vs-nav-sign-in">Sign in</Link>
          )}
        </div>
      </motion.nav>
    </>
  )
}
