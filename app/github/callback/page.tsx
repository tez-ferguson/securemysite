'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { normalizeSiteUrl } from '@/lib/url'
import { createBrowserClient } from '@/lib/supabase.client'
import { BRAND_NAME } from '@/lib/brand'

const EASE = [0.16, 1, 0.3, 1] as const

function decodeState(b64: string): { siteUrl?: string } {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(b64))))
  } catch {
    return {}
  }
}

function CallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const installationId = searchParams.get('installation_id')
  const stateParam = searchParams.get('state')

  const [repos, setRepos] = useState<{ fullName: string; cloneUrl: string }[]>([])
  const [selected, setSelected] = useState('')
  const [siteUrlField, setSiteUrlField] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!stateParam) return
    const { siteUrl: s } = decodeState(stateParam)
    if (s) setSiteUrlField(normalizeSiteUrl(s))
  }, [stateParam])

  useEffect(() => {
    if (!installationId) {
      setError('Missing installation from GitHub. Try connecting again from the home page.')
      setLoading(false)
      return
    }

    // Verify session first
    const supabase = createBrowserClient()
    let cancelled = false

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push(`/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`)
        return
      }

      // Register this installation to the current user before listing repos.
      // This binds the installation ID to the user, preventing cross-user abuse.
      fetch('/api/github/installations/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installationId: parseInt(installationId, 10) }),
      })
        .then(() => fetch(`/api/github/installations/${installationId}/repos`))
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return
          if (data.error) throw new Error(data.error)
          const list = data.repos as { fullName: string; cloneUrl: string }[]
          setRepos(list)
          if (list.length === 1) setSelected(list[0].cloneUrl)
        })
        .catch((e: unknown) => {
          if (!cancelled) setError(e instanceof Error ? e.message : 'Something went wrong')
        })
        .finally(() => { if (!cancelled) setLoading(false) })
    })

    return () => { cancelled = true }
  }, [installationId, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!installationId || !selected) return
    const site = normalizeSiteUrl(siteUrlField.trim())
    if (!site) {
      setError('Enter the deployed site URL for this scan.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/scans/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: selected,
          siteUrl: site,
          githubInstallationId: installationId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not create scan')
      try {
        sessionStorage.setItem('vibesec_pending_site', site)
      } catch {
        /* ignore */
      }
      router.push(`/?scan=${encodeURIComponent(data.scanId)}`)
    } catch (e: unknown) {
      setSubmitting(false)
      setError(e instanceof Error ? e.message : 'Could not create scan')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f7f5f2',
        color: '#111010',
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 300,
        padding: '48px 24px',
      }}
    >
      <nav
        style={{
          marginBottom: 40,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: 520,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: '1.15rem',
            color: '#111010',
            textDecoration: 'none',
          }}
        >
          {BRAND_NAME}
        </Link>
        <Link href="/" style={{ fontSize: '0.8rem', color: '#888580', textDecoration: 'none' }}>
          ← Home
        </Link>
      </nav>

      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <motion.h1
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '1.85rem', fontWeight: 400, marginBottom: 12, letterSpacing: '-0.02em' }}
        >
          Choose a repository
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: EASE }}
          style={{ fontSize: '0.88rem', color: '#888580', lineHeight: 1.65, marginBottom: 28 }}>
          GitHub authorized this installation. Pick the repo that powers your deployed site —
          then we&apos;ll queue the scan.
        </motion.p>

        <AnimatePresence mode="wait">
          {loading && (
            <motion.p key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ color: '#888580', fontSize: '0.9rem' }}>
              Loading repositories…
            </motion.p>
          )}
          {error && (
            <motion.p key="error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ color: '#c0392b', fontSize: '0.88rem', marginBottom: 20 }}>
              {error}
            </motion.p>
          )}
          {!loading && !error && repos.length === 0 && (
            <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ fontSize: '0.88rem', color: '#888580', marginBottom: 24 }}>
              No repositories are visible for this installation. Re-install the GitHub App and grant
              access to at least one repository.
            </motion.p>
          )}
        </AnimatePresence>

        {!loading && repos.length > 0 && (
          <motion.form
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15, ease: EASE }}
            onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#bbb8b4' }}>
                Repository
              </span>
              <select
                required
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                style={{
                  padding: '12px 14px',
                  border: '1px solid #e2deda',
                  background: '#ffffff',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.88rem',
                  color: '#111010',
                }}
              >
                <option value="">Select a repository…</option>
                {repos.map((r) => (
                  <option key={r.fullName} value={r.cloneUrl}>
                    {r.fullName}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#bbb8b4' }}>
                Deployed site URL
              </span>
              <input
                type="text"
                required
                value={siteUrlField}
                onChange={(e) => setSiteUrlField(e.target.value)}
                placeholder="https://yourapp.vercel.app"
                style={{
                  padding: '12px 14px',
                  border: '1px solid #e2deda',
                  background: '#ffffff',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.88rem',
                  color: '#111010',
                }}
              />
            </label>

            <div style={{ position: 'relative', overflow: 'hidden', marginTop: 8 }}>
              <motion.div
                initial={{ scaleX: 0 }} whileHover={!submitting && !!selected ? { scaleX: 1 } : {}}
                transition={{ duration: 0.25, ease: [0.16,1,0.3,1] }}
                style={{ position: 'absolute', inset: 0, background: '#2a2928', transformOrigin: 'left', zIndex: 0 }}
              />
              <button
                type="submit"
                disabled={submitting || !selected}
                style={{ position: 'relative', zIndex: 1, padding: '14px 22px', background: submitting ? '#444240' : '#111010', color: '#ffffff', border: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', fontWeight: 400, cursor: submitting ? 'wait' : 'pointer', width: '100%' }}
              >
                {submitting ? 'Starting scan…' : 'Start security scan'}
              </button>
            </div>
          </motion.form>
        )}
      </div>
    </div>
  )
}

export default function GitHubCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: '#f7f5f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'DM Sans', sans-serif",
            color: '#888580',
          }}
        >
          Loading…
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  )
}
