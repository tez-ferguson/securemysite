'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { createBrowserClient } from '@/lib/supabase.client'
import { Suspense } from 'react'

const EASE = [0.16, 1, 0.3, 1] as const

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  border: '1px solid #e2deda',
  background: '#fff',
  fontFamily: 'var(--sans)',
  fontSize: '0.9rem',
  fontWeight: 300,
  color: '#111010',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect_url') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createBrowserClient()
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    router.push(redirectUrl)
    router.refresh()
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', fontFamily: 'var(--sans)' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--white)', padding: '0 40px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', color: 'var(--ink)', textDecoration: 'none' }}>VibeSec</Link>
        <Link href="/sign-up" style={{ color: 'var(--ink2)', fontSize: '0.88rem', textDecoration: 'none' }}>
          Create account →
        </Link>
      </nav>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', padding: '64px 24px' }}>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          style={{ width: '100%', maxWidth: '400px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '2rem', color: 'var(--ink)', margin: '0 0 8px 0' }}>
              Welcome back
            </h1>
            <p style={{ fontWeight: 300, fontSize: '0.88rem', color: 'var(--ink3)', margin: 0 }}>
              Sign in to view your scan reports
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ border: '1px solid var(--border)', background: '#fff', padding: '32px' }}>
            <motion.label
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15, ease: EASE }}
              style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink4)' }}>
                Email
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(17,16,16,0.06)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e2deda'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </motion.label>

            <motion.label
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.22, ease: EASE }}
              style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              <span style={{ fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink4)' }}>
                Password
              </span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(17,16,16,0.06)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e2deda'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </motion.label>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                style={{ fontSize: '0.82rem', color: 'var(--red)', marginBottom: '16px', lineHeight: 1.5 }}>
                {error}
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.3, ease: EASE }}
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              <motion.div
                initial={{ scaleX: 0 }} whileHover={!loading ? { scaleX: 1 } : {}}
                transition={{ duration: 0.25, ease: [0.16,1,0.3,1] }}
                style={{ position: 'absolute', inset: 0, background: '#2a2928', transformOrigin: 'left', zIndex: 0 }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{ position: 'relative', zIndex: 1, width: '100%', padding: '13px', background: loading ? '#444240' : 'var(--ink)', color: '#fff', border: 'none', fontFamily: 'var(--sans)', fontSize: '0.9rem', fontWeight: 400, cursor: loading ? 'wait' : 'pointer' }}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.38 }}
              style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.82rem', color: 'var(--ink3)', fontWeight: 300 }}>
              No account?{' '}
              <Link href="/sign-up" style={{ color: 'var(--ink)', fontWeight: 400, textDecoration: 'none' }}>
                Create one →
              </Link>
            </motion.p>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
      <SignInForm />
    </Suspense>
  )
}
