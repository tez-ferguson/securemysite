'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createBrowserClient } from '@/lib/supabase.client'

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

export default function SignUpPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createBrowserClient()
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}
        >
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '2rem', color: 'var(--ink)', marginBottom: '12px' }}>
            Check your email
          </h1>
          <p style={{ fontWeight: 300, fontSize: '0.9rem', color: 'var(--ink3)', lineHeight: 1.65 }}>
            We sent a confirmation link to <strong style={{ color: 'var(--ink)', fontWeight: 400 }}>{email}</strong>.
            Click it to activate your account, then come back and sign in.
          </p>
          <Link href="/sign-in" style={{ display: 'inline-block', marginTop: '28px', fontSize: '0.88rem', color: 'var(--ink)', fontWeight: 400, textDecoration: 'none', borderBottom: '1px solid var(--border)' }}>
            Go to sign in →
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', fontFamily: 'var(--sans)' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--white)', padding: '0 40px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', color: 'var(--ink)', textDecoration: 'none' }}>VibeSec</Link>
        <Link href="/sign-in" style={{ color: 'var(--ink2)', fontSize: '0.88rem', textDecoration: 'none' }}>
          Already have an account? Sign in →
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
              Create your account
            </h1>
            <p style={{ fontWeight: 300, fontSize: '0.88rem', color: 'var(--ink3)', margin: 0 }}>
              Free to start. Scan your app in under a minute.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ border: '1px solid var(--border)', background: '#fff', padding: '32px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
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
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              <span style={{ fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink4)' }}>
                Password
              </span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(17,16,16,0.06)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e2deda'; e.currentTarget.style.boxShadow = 'none' }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--ink4)' }}>Minimum 8 characters</span>
            </label>

            {error && (
              <p style={{ fontSize: '0.82rem', color: 'var(--red)', marginBottom: '16px', lineHeight: 1.5 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '13px', background: loading ? '#444240' : 'var(--ink)', color: '#fff', border: 'none', fontFamily: 'var(--sans)', fontSize: '0.9rem', fontWeight: 400, cursor: loading ? 'wait' : 'pointer', transition: 'background 0.15s' }}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.82rem', color: 'var(--ink3)', fontWeight: 300 }}>
              Already have an account?{' '}
              <Link href="/sign-in" style={{ color: 'var(--ink)', fontWeight: 400, textDecoration: 'none' }}>
                Sign in →
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
