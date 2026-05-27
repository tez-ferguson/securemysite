'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createBrowserClient } from '@/lib/supabase.client'
import type { User } from '@supabase/supabase-js'
import GitHubModal from '@/components/GitHubModal'
import ScanProgress from '@/components/ScanProgress'
import { CountUp } from '@/components/motion/CountUp'
import { encodeGithubInstallState, normalizeSiteUrl } from '@/lib/url'

type UIState = 'default' | 'modal' | 'scanning'

const EASE = [0.16, 1, 0.3, 1] as const

const STATS = [
  { value: 94, suffix: '%', label: 'of scanned apps have at\nleast one exposed secret' },
  { value: 12, suffix: '', label: 'average vulnerabilities\nfound per scan' },
  { value: 3, suffix: ' min', label: 'average time from\nURL to full report' },
]

const PAGE_CSS = `
  .vs-nav-link { font-size: 0.8rem; color: var(--ink3); text-decoration: none; letter-spacing: 0.01em; transition: color var(--dur-fast); }
  .vs-nav-link:hover { color: var(--ink); }
  .vs-nav-cta { font-size: 0.8rem; color: var(--ink); background: none; border: 1px solid var(--ink); padding: 8px 18px; cursor: pointer; font-family: var(--sans); font-weight: 400; letter-spacing: 0.01em; transition: background var(--dur-fast), color var(--dur-fast); text-decoration: none; display: inline-block; }
  .vs-nav-cta:hover { background: var(--ink); color: var(--bg); }
  .vs-submit-btn { padding: 0 22px; background: var(--ink); border: none; color: #fff; font-family: var(--sans); font-size: 0.8rem; font-weight: 400; letter-spacing: 0.03em; cursor: pointer; white-space: nowrap; transition: background var(--dur-fast); flex-shrink: 0; }
  .vs-submit-btn:hover { background: #2a2928; }
  .vs-footer-link { font-size: 0.7rem; color: var(--ink4); text-decoration: none; transition: color var(--dur-fast); }
  .vs-footer-link:hover { color: var(--ink3); }
  .vs-stat-cell { padding: 20px 36px; text-align: left; cursor: default; transition: transform 0.2s ease, background 0.2s ease; }
  .vs-stat-cell:hover { background: #faf9f7; transform: translateY(-1px); }
  .vs-input-wrap { display: flex; border: 1px solid var(--border); background: var(--white); transition: border-color 0.2s, box-shadow 0.2s; }
  .vs-input-wrap:focus-within { border-color: var(--ink); box-shadow: 0 0 0 3px rgba(17,16,16,0.06); }
  .vs-input-wrap.error { border-color: var(--red); box-shadow: 0 0 0 3px rgba(192,57,43,0.08); }
  @media (max-width: 640px) {
    .vs-nav { padding: 20px 24px !important; }
    .vs-nav-link-item { display: none !important; }
    .vs-footer { padding: 14px 24px !important; }
    .vs-stats { flex-direction: column !important; }
    .vs-stat-cell { border-right: none !important; border-bottom: 1px solid var(--border) !important; }
    .vs-stat-cell:last-child { border-bottom: none !important; }
    .vs-h1 { font-size: 2.6rem !important; }
  }
`

function HomeInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = createBrowserClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const [uiState, setUiState] = useState<UIState>('default')
  const [siteUrl, setSiteUrl] = useState('')
  const [inputError, setInputError] = useState(false)
  const [scanId, setScanId] = useState('demo-123')

  // Handle ?scan= returned from GitHub callback
  useEffect(() => {
    const id = searchParams.get('scan')
    if (!id) return
    setScanId(id)
    try {
      const pending = sessionStorage.getItem('vibesec_pending_site')
      if (pending) {
        setSiteUrl(pending.replace(/^https?:\/\//i, ''))
        sessionStorage.removeItem('vibesec_pending_site')
      }
    } catch { /* ignore */ }
    setUiState('scanning')
    router.replace('/', { scroll: false })
  }, [searchParams, router])

  function handleScan() {
    const trimmed = siteUrl.trim()
    if (!trimmed) { setInputError(true); return }
    setInputError(false)
    setUiState('modal')
  }

  function handleConnectGithub() {
    const normalized = normalizeSiteUrl(siteUrl)
    try { sessionStorage.setItem('vibesec_pending_site', normalized) } catch { /* ignore */ }

    if (!user) {
      router.push('/sign-in?redirect_url=' + encodeURIComponent('/'))
      return
    }
    const slug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG
    if (!slug) {
      alert('Missing NEXT_PUBLIC_GITHUB_APP_SLUG — see SETUP.md.')
      return
    }
    const state = encodeGithubInstallState({ siteUrl: normalized })
    window.location.assign(`https://github.com/apps/${slug}/installations/new?state=${encodeURIComponent(state)}`)
  }

  function handleScanComplete(id: string) {
    router.push(`/report/${id}`)
  }

  function handleDemo() {
    router.push('/demo')
  }

  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <style>{PAGE_CSS}</style>

      <div style={{ background: 'var(--bg)', color: 'var(--ink)', fontFamily: 'var(--sans)', fontWeight: 300, minHeight: '100vh', WebkitFontSmoothing: 'antialiased' }}>

        {/* ─── NAV ─── */}
        <motion.nav
          className="vs-nav"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 48px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}
        >
          <div style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', letterSpacing: '-0.01em', color: 'var(--ink)' }}>
            VibeSec
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <Link href="/pricing" className="vs-nav-link vs-nav-link-item">Pricing</Link>
            <Link href="/demo" className="vs-nav-link vs-nav-link-item">Demo</Link>
            {user ? (
              <Link href="/dashboard" style={{ fontSize: '0.8rem', color: 'var(--ink3)', textDecoration: 'none', letterSpacing: '0.01em', transition: 'color 0.15s' }}>
                Dashboard
              </Link>
            ) : (
              <Link href="/sign-in" className="vs-nav-cta">Sign in</Link>
            )}
          </div>
        </motion.nav>

        {/* ─── MAIN ─── */}
        <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 81px)', padding: '80px 24px 120px', textAlign: 'center' }}>

          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, letterSpacing: '0.05em' }}
            animate={{ opacity: 1, letterSpacing: '0.12em' }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: '32px' }}
          >
            Security scanning for vibe-coded apps
          </motion.p>

          {/* H1 line 1 */}
          <motion.h1
            className="vs-h1"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.22, ease: EASE }}
            style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(3rem, 6vw, 5.2rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--ink)', maxWidth: '680px', marginBottom: '28px' }}
          >
            Your app is live.
            <br />
            {/* Italic ink-dry reveal */}
            <motion.em
              initial={{ clipPath: 'inset(0 100% 0 0)' }}
              animate={{ clipPath: 'inset(0 0% 0 0)' }}
              transition={{ duration: 0.65, delay: 0.55, ease: EASE }}
              style={{ fontStyle: 'italic', color: 'var(--red)', display: 'inline-block' }}
            >
              Is it secure?
            </motion.em>
          </motion.h1>

          {/* Sub-copy */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.38, ease: EASE }}
            style={{ fontSize: '0.95rem', color: 'var(--ink3)', lineHeight: 1.7, maxWidth: '420px', fontWeight: 300, marginBottom: '52px' }}
          >
            Lovable, Bolt, Cursor — they build fast. Security doesn&apos;t come included.
            Enter your site and we&apos;ll scan the codebase for what got missed.
          </motion.p>

          {/* Input */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: EASE }}
            style={{ width: '100%', maxWidth: '520px' }}
          >
            <div className={`vs-input-wrap${inputError ? ' error' : ''}`}>
              <span style={{ padding: '0 14px', display: 'flex', alignItems: 'center', fontSize: '0.82rem', color: 'var(--ink4)', borderRight: '1px solid var(--border)', background: '#faf9f7', userSelect: 'none', whiteSpace: 'nowrap' }}>
                https://
              </span>
              <input
                ref={inputRef}
                type="text"
                placeholder="yourapp.vercel.app"
                spellCheck={false}
                autoComplete="off"
                value={siteUrl}
                onChange={(e) => { setSiteUrl(e.target.value); if (e.target.value.trim()) setInputError(false) }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleScan() }}
                style={{ flex: 1, border: 'none', outline: 'none', padding: '15px 16px', fontFamily: 'var(--sans)', fontSize: '0.9rem', fontWeight: 300, color: 'var(--ink)', background: 'transparent', minWidth: 0 }}
              />
              <button className="vs-submit-btn" onClick={handleScan}>
                Scan now
              </button>
            </div>
            <p style={{ marginTop: '12px', fontSize: '0.72rem', color: 'var(--ink4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '5px', height: '5px', background: 'var(--green)', borderRadius: '50%', flexShrink: 0 }} />
              Code is never stored — scanned in an isolated container, then deleted
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            id="how-it-works"
            className="vs-stats"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.65, ease: EASE }}
            style={{ display: 'flex', marginTop: '72px', border: '1px solid var(--border)', background: 'var(--white)' }}
          >
            {STATS.map((stat, i) => (
              <div
                key={stat.suffix + i}
                className="vs-stat-cell"
                style={{ borderRight: i < STATS.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <span style={{ fontFamily: 'var(--serif)', fontSize: '1.7rem', color: 'var(--ink)', display: 'block', lineHeight: 1, marginBottom: '4px' }}>
                  <CountUp to={stat.value} suffix={stat.suffix} duration={1.4} />
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--ink3)', letterSpacing: '0.02em', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>
        </main>

        {/* ─── FOOTER ─── */}
        <footer
          className="vs-footer"
          style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '14px 48px', borderTop: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ fontSize: '0.7rem', color: 'var(--ink4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '5px', height: '5px', background: 'var(--green)', borderRadius: '50%', display: 'inline-block' }} />
            Source code deleted after every scan
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="#" className="vs-footer-link">Privacy</a>
            <a href="#" className="vs-footer-link">Terms</a>
            <a href="mailto:hello@vibesec.app" className="vs-footer-link">Contact</a>
          </div>
        </footer>

        {/* ─── OVERLAYS ─── */}
        <AnimatePresence>
          {uiState === 'modal' && (
            <GitHubModal
              key="gh-modal"
              siteUrl={normalizeSiteUrl(siteUrl)}
              onClose={() => setUiState('default')}
              onConfirm={handleConnectGithub}
              onDemo={handleDemo}
            />
          )}
        </AnimatePresence>

        {uiState === 'scanning' && (
          <ScanProgress
            siteUrl={normalizeSiteUrl(siteUrl)}
            scanId={scanId}
            onComplete={handleScanComplete}
          />
        )}
      </div>
    </>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--sans)', color: 'var(--ink3)' }}>
        Loading…
      </div>
    }>
      <HomeInner />
    </Suspense>
  )
}
