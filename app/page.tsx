'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, useInView, AnimatePresence } from 'framer-motion'
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

const STEPS = [
  {
    n: '01',
    title: 'Enter your deployed URL',
    body: 'Paste the live address of anything you shipped — Vercel, Netlify, Railway, it doesn\'t matter. We\'ll figure out the rest.',
  },
  {
    n: '02',
    title: 'Connect your repository',
    body: 'Authorise VibeSec to read your source code. Read-only access, single repo, revokable at any time. We clone it once then delete everything.',
  },
  {
    n: '03',
    title: 'Get your report in minutes',
    body: 'We run gitleaks, semgrep, trivy, and a suite of custom checks tailored for AI-built apps. Free scan shows totals. Unlock for full details and AI-written fix prompts.',
  },
]

const FINDINGS = [
  { icon: '🔑', title: 'Exposed secrets', body: 'API keys, tokens, and credentials committed to source or bundled into the client.' },
  { icon: '⚠️', title: 'Auth vulnerabilities', body: 'Unprotected API routes, missing session checks, overpermissioned role logic.' },
  { icon: '💉', title: 'Injection risks', body: 'SQL injection, XSS entry points, and unsafe eval() patterns in generated code.' },
  { icon: '📦', title: 'Vulnerable dependencies', body: 'Known CVEs in your npm or pip packages surfaced with severity and fix version.' },
  { icon: '🔓', title: 'RLS misconfigurations', body: 'Supabase Row Level Security disabled in migrations or service role keys on the client.' },
  { icon: '🌐', title: 'Open CORS and headers', body: 'Wildcard origins, missing CSP, and other HTTP header misconfigurations.' },
]

const TOOLS = ['Lovable', 'Bolt', 'Cursor', 'v0', 'Replit', 'ChatGPT', 'Claude', 'Windsurf']

const PAGE_CSS = `
  .vs-nav-link { font-size: 0.8rem; color: var(--ink3); text-decoration: none; letter-spacing: 0.01em; transition: color 0.15s; }
  .vs-nav-link:hover { color: var(--ink); }
  .vs-nav-cta { font-size: 0.8rem; color: var(--ink); background: none; border: 1px solid var(--ink); padding: 8px 18px; cursor: pointer; font-family: var(--sans); font-weight: 400; letter-spacing: 0.01em; transition: background 0.15s, color 0.15s; text-decoration: none; display: inline-block; }
  .vs-nav-cta:hover { background: var(--ink); color: var(--bg); }
  .vs-submit-btn { padding: 0 22px; background: var(--ink); border: none; color: #fff; font-family: var(--sans); font-size: 0.8rem; font-weight: 400; letter-spacing: 0.03em; cursor: pointer; white-space: nowrap; transition: background 0.15s; flex-shrink: 0; }
  .vs-submit-btn:hover { background: #2a2928; }
  .vs-footer-link { font-size: 0.7rem; color: var(--ink4); text-decoration: none; transition: color 0.15s; }
  .vs-footer-link:hover { color: var(--ink3); }
  .vs-stat-cell { padding: 20px 36px; text-align: left; cursor: default; transition: transform 0.2s ease, background 0.2s ease; }
  .vs-stat-cell:hover { background: #faf9f7; transform: translateY(-1px); }
  .vs-input-wrap { display: flex; border: 1px solid var(--border); background: var(--white); transition: border-color 0.2s, box-shadow 0.2s; }
  .vs-input-wrap:focus-within { border-color: var(--ink); box-shadow: 0 0 0 3px rgba(17,16,16,0.06); }
  .vs-input-wrap.error { border-color: var(--red); box-shadow: 0 0 0 3px rgba(192,57,43,0.08); }
  .vs-finding-card { padding: 28px; border: 1px solid var(--border); background: var(--white); transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: default; }
  .vs-finding-card:hover { transform: translateY(-2px); box-shadow: 0 4px 24px rgba(17,16,16,0.06); }
  .vs-tool-tag { display: inline-block; padding: 6px 16px; border: 1px solid var(--border); font-size: 0.8rem; color: var(--ink3); font-weight: 300; transition: color 0.15s, border-color 0.15s; cursor: default; }
  .vs-tool-tag:hover { color: var(--ink); border-color: var(--ink3); }
  @media (max-width: 640px) {
    .vs-nav { padding: 20px 24px !important; }
    .vs-nav-link-item { display: none !important; }
    .vs-stats { flex-direction: column !important; }
    .vs-stat-cell { border-right: none !important; border-bottom: 1px solid var(--border) !important; }
    .vs-stat-cell:last-child { border-bottom: none !important; }
    .vs-h1 { font-size: 2.6rem !important; }
    .vs-section-inner { padding-left: 24px !important; padding-right: 24px !important; }
  }
`

// ── Reusable scroll-reveal wrapper ──────────────────────────────────────────
function ScrollReveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -80px 0px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 22 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: EASE }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

// ── Ink line that draws across on scroll ─────────────────────────────────────
function DrawLine({ delay = 0 }: { delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  return (
    <div ref={ref} style={{ height: '1px', background: 'var(--border)', overflow: 'hidden', width: '100%' }}>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.9, delay, ease: EASE }}
        style={{ height: '100%', background: 'var(--border)', transformOrigin: 'left' }}
      />
    </div>
  )
}

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

  useEffect(() => {
    const id = searchParams.get('scan')
    if (!id) return
    setScanId(id)
    try {
      const pending = sessionStorage.getItem('vibesec_pending_site')
      if (pending) { setSiteUrl(pending.replace(/^https?:\/\//i, '')); sessionStorage.removeItem('vibesec_pending_site') }
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
    if (!user) { router.push('/sign-in?redirect_url=' + encodeURIComponent('/')); return }
    const slug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG
    if (!slug) { alert('Missing NEXT_PUBLIC_GITHUB_APP_SLUG — see SETUP.md.'); return }
    const state = encodeGithubInstallState({ siteUrl: normalized })
    window.location.assign(`https://github.com/apps/${slug}/installations/new?state=${encodeURIComponent(state)}`)
  }

  function handleScanComplete(id: string) { router.push(`/report/${id}`) }
  function handleDemo() { router.push('/demo') }

  return (
    <>
      <style>{PAGE_CSS}</style>

      <div style={{ background: 'var(--bg)', color: 'var(--ink)', fontFamily: 'var(--sans)', fontWeight: 300, WebkitFontSmoothing: 'antialiased' }}>

        {/* ── NAV ── */}
        <motion.nav
          className="vs-nav"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 48px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 50 }}
        >
          <div style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', letterSpacing: '-0.01em', color: 'var(--ink)' }}>VibeSec</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <a href="#how-it-works" className="vs-nav-link vs-nav-link-item">How it works</a>
            <a href="#what-we-scan" className="vs-nav-link vs-nav-link-item">What we scan</a>
            <Link href="/pricing" className="vs-nav-link vs-nav-link-item">Pricing</Link>
            {user
              ? <Link href="/dashboard" style={{ fontSize: '0.8rem', color: 'var(--ink3)', textDecoration: 'none', letterSpacing: '0.01em' }}>Dashboard</Link>
              : <Link href="/sign-in" className="vs-nav-cta">Sign in</Link>
            }
          </div>
        </motion.nav>

        {/* ── HERO ── */}
        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100svh - 81px)', padding: '80px 24px 100px', textAlign: 'center' }}>
          <motion.p
            initial={{ opacity: 0, letterSpacing: '0.05em' }}
            animate={{ opacity: 1, letterSpacing: '0.12em' }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: '32px' }}
          >
            Security scanning for vibe-coded apps
          </motion.p>

          <motion.h1
            className="vs-h1"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.22, ease: EASE }}
            style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(3rem, 6vw, 5.2rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--ink)', maxWidth: '680px', marginBottom: '28px' }}
          >
            Your app is live.
            <br />
            <motion.em
              initial={{ clipPath: 'inset(0 100% 0 0)' }}
              animate={{ clipPath: 'inset(0 0% 0 0)' }}
              transition={{ duration: 0.65, delay: 0.55, ease: EASE }}
              style={{ fontStyle: 'italic', color: 'var(--red)', display: 'inline-block' }}
            >
              Is it secure?
            </motion.em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.38, ease: EASE }}
            style={{ fontSize: '0.95rem', color: 'var(--ink3)', lineHeight: 1.7, maxWidth: '420px', fontWeight: 300, marginBottom: '52px' }}
          >
            Lovable, Bolt, Cursor — they build fast. Security doesn&apos;t come included.
            Enter your site and we&apos;ll scan the codebase for what got missed.
          </motion.p>

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
                type="text"
                placeholder="yourapp.vercel.app"
                spellCheck={false}
                autoComplete="off"
                value={siteUrl}
                onChange={(e) => { setSiteUrl(e.target.value); if (e.target.value.trim()) setInputError(false) }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleScan() }}
                style={{ flex: 1, border: 'none', outline: 'none', padding: '15px 16px', fontFamily: 'var(--sans)', fontSize: '0.9rem', fontWeight: 300, color: 'var(--ink)', background: 'transparent', minWidth: 0 }}
              />
              <button className="vs-submit-btn" onClick={handleScan}>Scan now</button>
            </div>
            <p style={{ marginTop: '12px', fontSize: '0.72rem', color: 'var(--ink4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '5px', height: '5px', background: 'var(--green)', borderRadius: '50%', flexShrink: 0 }} />
              Code is never stored — scanned in an isolated container, then deleted
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="vs-stats"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.65, ease: EASE }}
            style={{ display: 'flex', marginTop: '72px', border: '1px solid var(--border)', background: 'var(--white)' }}
          >
            {STATS.map((stat, i) => (
              <div key={i} className="vs-stat-cell" style={{ borderRight: i < STATS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: '1.7rem', color: 'var(--ink)', display: 'block', lineHeight: 1, marginBottom: '4px' }}>
                  <CountUp to={stat.value} suffix={stat.suffix} duration={1.4} />
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--ink3)', letterSpacing: '0.02em', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Scroll cue */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            style={{ marginTop: '52px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
          >
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: '1px', height: '36px', background: 'linear-gradient(to bottom, transparent, var(--ink4))', transformOrigin: 'top' }}
            />
          </motion.div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="vs-section-inner" style={{ maxWidth: '1100px', margin: '0 auto', padding: '96px 48px' }}>
            <ScrollReveal>
              <p style={{ fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink4)', marginBottom: '16px' }}>
                How it works
              </p>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.1, maxWidth: '560px', marginBottom: '80px' }}>
                From URL to report<br />
                <em style={{ fontStyle: 'italic', color: 'var(--ink3)' }}>in under three minutes.</em>
              </h2>
            </ScrollReveal>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {STEPS.map((step, i) => (
                <ScrollReveal key={step.n} delay={i * 0.1}>
                  <DrawLine />
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '32px', padding: '40px 0', alignItems: 'start' }}>
                    {/* Large muted number — fromanother.love style */}
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '3.5rem', color: 'var(--border)', lineHeight: 1, userSelect: 'none', letterSpacing: '-0.02em' }}>
                      {step.n}
                    </div>
                    <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', fontWeight: 400, color: 'var(--ink)', lineHeight: 1.2, letterSpacing: '-0.01em', paddingTop: '6px' }}>
                      {step.title}
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--ink3)', lineHeight: 1.7, fontWeight: 300, paddingTop: '6px' }}>
                      {step.body}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
              <DrawLine delay={0.3} />
            </div>
          </div>
        </section>

        {/* ── WHAT WE SCAN ── */}
        <section id="what-we-scan" style={{ borderTop: '1px solid var(--border)', background: 'var(--white)' }}>
          <div className="vs-section-inner" style={{ maxWidth: '1100px', margin: '0 auto', padding: '96px 48px' }}>
            <ScrollReveal>
              <p style={{ fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink4)', marginBottom: '16px' }}>
                What we scan for
              </p>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.1, maxWidth: '560px', marginBottom: '64px' }}>
                Six categories.<br />
                <em style={{ fontStyle: 'italic', color: 'var(--ink3)' }}>All common in AI-built apps.</em>
              </h2>
            </ScrollReveal>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1px', background: 'var(--border)' }}>
              {FINDINGS.map((f, i) => (
                <ScrollReveal key={f.title} delay={i * 0.06}>
                  <div className="vs-finding-card">
                    <div style={{ fontSize: '1.4rem', marginBottom: '16px', lineHeight: 1 }}>{f.icon}</div>
                    <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1.1rem', color: 'var(--ink)', marginBottom: '10px', letterSpacing: '-0.01em' }}>
                      {f.title}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--ink3)', lineHeight: 1.65, fontWeight: 300, margin: 0 }}>
                      {f.body}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── BUILT FOR VIBE CODERS ── */}
        <section style={{ borderTop: '1px solid var(--border)' }}>
          <div className="vs-section-inner" style={{ maxWidth: '1100px', margin: '0 auto', padding: '96px 48px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
              <ScrollReveal>
                <p style={{ fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink4)', marginBottom: '16px' }}>
                  Built for
                </p>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.1, marginBottom: '24px' }}>
                  Anyone who ships<br />
                  <em style={{ fontStyle: 'italic', color: 'var(--red)' }}>with AI at the wheel.</em>
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--ink3)', lineHeight: 1.7, fontWeight: 300, maxWidth: '360px', marginBottom: '36px' }}>
                  AI coding tools are extraordinary at building features. They are not trained to be security engineers. VibeSec fills that gap — one scan at a time.
                </p>
                <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.28, ease: EASE }}
                    style={{ position: 'absolute', inset: 0, background: '#2a2928', transformOrigin: 'left', zIndex: 0 }}
                  />
                  <button
                    onClick={handleScan}
                    style={{ position: 'relative', zIndex: 1, padding: '13px 28px', background: 'var(--ink)', color: '#fff', border: 'none', fontFamily: 'var(--sans)', fontSize: '0.9rem', fontWeight: 400, cursor: 'pointer', letterSpacing: '0.01em' }}
                  >
                    Scan your app free →
                  </button>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={0.15}>
                <p style={{ fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink4)', marginBottom: '20px' }}>
                  Compatible tools
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {TOOLS.map((tool, i) => (
                    <motion.span
                      key={tool}
                      className="vs-tool-tag"
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: i * 0.04, ease: EASE }}
                    >
                      {tool}
                    </motion.span>
                  ))}
                </div>

                <div style={{ marginTop: '40px', padding: '24px', border: '1px solid var(--border)', background: 'var(--bg)' }}>
                  <p style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 400, color: 'var(--ink)', lineHeight: 1.55, margin: 0, fontStyle: 'italic' }}>
                    &ldquo;We found a Supabase service role key in the client bundle on the very first scan. It had been there since launch.&rdquo;
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--ink4)', marginTop: '14px', fontWeight: 300 }}>
                    — Developer, solo SaaS on Lovable
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── PRICING TEASER ── */}
        <section style={{ borderTop: '1px solid var(--border)', background: 'var(--ink)' }}>
          <div className="vs-section-inner" style={{ maxWidth: '1100px', margin: '0 auto', padding: '96px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px' }}>
            {[
              { price: 'Free', note: 'always', cta: 'Start scanning', href: '/', features: ['Unlimited scans', 'Severity totals', 'Finding counts'] },
              { price: '$29', note: 'per scan', cta: 'Unlock report', href: '/pricing', features: ['Full finding details', 'File + line numbers', 'AI fix prompts for Lovable / Cursor'] },
              { price: '$149', note: 'per scan', cta: 'Fix my app', href: '/pricing', features: ['Everything in Unlock', 'We apply all fixes', 'PR opened within 24 hours'] },
            ].map((tier, i) => (
              <ScrollReveal key={tier.price} delay={i * 0.1}>
                <div style={{ padding: '40px', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                  <p style={{ fontFamily: 'var(--serif)', fontSize: '2.4rem', color: '#fff', fontWeight: 400, lineHeight: 1, marginBottom: '4px' }}>
                    {tier.price}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '28px', fontWeight: 300 }}>{tier.note}</p>
                  <ul style={{ padding: 0, margin: '0 0 32px 0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {tier.features.map((f) => (
                      <li key={f} style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)', fontWeight: 300, display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0, marginTop: '2px' }}>—</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
                    <motion.div
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.28, ease: EASE }}
                      style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.12)', transformOrigin: 'left', zIndex: 0 }}
                    />
                    <Link href={tier.href} style={{ position: 'relative', zIndex: 1, display: 'inline-block', padding: '10px 20px', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.82rem', fontFamily: 'var(--sans)', fontWeight: 400, textDecoration: 'none', letterSpacing: '0.01em' }}>
                      {tier.cta} →
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* ── BOTTOM CTA ── */}
        <section style={{ borderTop: '1px solid var(--border)' }}>
          <div className="vs-section-inner" style={{ maxWidth: '1100px', margin: '0 auto', padding: '120px 48px', textAlign: 'center' }}>
            <ScrollReveal>
              <p style={{ fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink4)', marginBottom: '20px' }}>
                Ready when you are
              </p>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2.4rem, 5vw, 4.2rem)', fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--ink)', lineHeight: 1.05, marginBottom: '40px' }}>
                Ship fast.<br />
                <em style={{ fontStyle: 'italic', color: 'var(--red)' }}>Ship secure.</em>
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.28, ease: EASE }}
                    style={{ position: 'absolute', inset: 0, background: '#2a2928', transformOrigin: 'left', zIndex: 0 }}
                  />
                  <button
                    onClick={handleScan}
                    style={{ position: 'relative', zIndex: 1, padding: '14px 32px', background: 'var(--ink)', color: '#fff', border: 'none', fontFamily: 'var(--sans)', fontSize: '0.95rem', fontWeight: 400, cursor: 'pointer' }}
                  >
                    Scan your app free
                  </button>
                </div>
                <Link href="/demo" style={{ fontSize: '0.88rem', color: 'var(--ink3)', textDecoration: 'none', borderBottom: '1px solid var(--border)', paddingBottom: '1px', transition: 'color 0.15s, border-color 0.15s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--ink)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--ink)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--ink3)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
                >
                  View demo report →
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: '1px solid var(--border)', padding: '24px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '1rem', color: 'var(--ink)', letterSpacing: '-0.01em' }}>VibeSec</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--ink4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '5px', height: '5px', background: 'var(--green)', borderRadius: '50%', display: 'inline-block' }} />
            Source code deleted after every scan
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <a href="mailto:hello@vibesec.app" className="vs-footer-link">Contact</a>
            <Link href="/pricing" className="vs-footer-link">Pricing</Link>
            <Link href="/demo" className="vs-footer-link">Demo</Link>
          </div>
        </footer>

        {/* ── OVERLAYS ── */}
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
