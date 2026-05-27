'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { createBrowserClient } from '@/lib/supabase.client'
import type { User } from '@supabase/supabase-js'
import GitHubModal from '@/components/GitHubModal'
import ScanProgress from '@/components/ScanProgress'
import { CountUp } from '@/components/motion/CountUp'
import { BackgroundPathsHero, HeroAnimatedTitle } from '@/components/ui/background-paths'
import { encodeGithubInstallState, normalizeSiteUrl } from '@/lib/url'

type UIState = 'default' | 'modal' | 'scanning'

const EASE = [0.16, 1, 0.3, 1] as const
const DARK = '#0e0c0b'
const WARM = '#f7f5f2'

const STATS = [
  { value: 94, suffix: '%', label: 'of scanned apps have at\nleast one exposed secret' },
  { value: 12, suffix: '', label: 'average vulnerabilities\nfound per scan' },
  { value: 3, suffix: ' min', label: 'average time from\nURL to full report' },
]

const STEPS = [
  { n: '01', title: 'Enter your deployed URL', body: 'Paste the live address of anything you shipped — Vercel, Netlify, Railway, it doesn\'t matter. We\'ll figure out the rest.' },
  { n: '02', title: 'Connect your repository', body: 'Authorise VibeSec to read your source code. Read-only access, single repo, revokable at any time. We clone it once then delete everything.' },
  { n: '03', title: 'Get your report in minutes', body: 'We run gitleaks, semgrep, trivy, and a suite of custom checks tailored for AI-built apps. Free scan shows totals. Unlock for full details and AI-written fix prompts.' },
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
  .vs-link-dim { font-size: 0.8rem; text-decoration: none; letter-spacing: 0.01em; transition: opacity 0.15s; opacity: 0.65; }
  .vs-link-dim:hover { opacity: 1; }
  .vs-footer-link { font-size: 0.7rem; color: var(--ink4); text-decoration: none; transition: color 0.15s; }
  .vs-footer-link:hover { color: var(--ink3); }
  .vs-stat-cell { padding: 20px 36px; text-align: left; cursor: default; transition: transform 0.2s ease, background 0.2s ease; }
  .vs-stat-cell:hover { background: #faf9f7; transform: translateY(-1px); }
  .vs-input-dark { display: flex; border: 1px solid rgba(247,245,242,0.18); background: rgba(247,245,242,0.06); transition: border-color 0.2s, box-shadow 0.2s; }
  .vs-input-dark:focus-within { border-color: rgba(247,245,242,0.55); box-shadow: 0 0 0 3px rgba(247,245,242,0.06); }
  .vs-input-dark.error { border-color: #c0392b; }
  .vs-finding-card { padding: 28px; border: 1px solid var(--border); background: var(--white); transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: default; }
  .vs-finding-card:hover { transform: translateY(-2px); box-shadow: 0 4px 24px rgba(17,16,16,0.06); }
  .vs-tool-tag { display: inline-block; padding: 6px 16px; border: 1px solid var(--border); font-size: 0.8rem; color: var(--ink3); font-weight: 300; transition: color 0.15s, border-color 0.15s; cursor: default; }
  .vs-tool-tag:hover { color: var(--ink); border-color: var(--ink3); }
  @media (max-width: 640px) {
    .vs-stats { flex-direction: column !important; }
    .vs-stat-cell { border-right: none !important; border-bottom: 1px solid var(--border) !important; }
    .vs-stat-cell:last-child { border-bottom: none !important; }
    .vs-hero-title { font-size: clamp(2.8rem, 10vw, 5rem) !important; }
    .vs-hero-inner { padding: 64px 24px 80px !important; }
    .vs-section-inner { padding-left: 24px !important; padding-right: 24px !important; }
    .vs-steps-grid { grid-template-columns: 1fr !important; }
    .vs-split-grid { grid-template-columns: 1fr !important; }
    .vs-pricing-grid { grid-template-columns: 1fr !important; }
  }
`

function ScrollReveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { rootMargin: '0px 0px -80px 0px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 22 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.55, delay, ease: EASE }} style={style}>
      {children}
    </motion.div>
  )
}

function DrawLine({ delay = 0 }: { delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ height: '1px', overflow: 'hidden', width: '100%' }}>
      <motion.div initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : {}} transition={{ duration: 0.9, delay, ease: EASE }}
        style={{ height: '100%', background: 'var(--border)', transformOrigin: 'left' }} />
    </div>
  )
}

function HomeInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const [pastHero, setPastHero] = useState(false)

  useEffect(() => {
    const supabase = createBrowserClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  // Detect whether we've scrolled past the dark hero
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const obs = new IntersectionObserver(([e]) => setPastHero(!e.isIntersecting), { threshold: 0.15 })
    obs.observe(hero)
    return () => obs.disconnect()
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

  const navDark = !pastHero

  return (
    <>
      <style>{PAGE_CSS}</style>

      {/* ── STICKY NAV — transitions between dark (hero) and light (content) ── */}
      <motion.nav
        animate={{
          background: navDark ? 'rgba(14,12,11,0.85)' : 'rgba(247,245,242,0.97)',
          borderBottomColor: navDark ? 'rgba(247,245,242,0.08)' : '#e2deda',
        }}
        transition={{ duration: 0.35, ease: EASE }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 48px',
        }}
      >
        <motion.div
          animate={{ color: navDark ? WARM : DARK }}
          transition={{ duration: 0.35 }}
          style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', letterSpacing: '-0.01em' }}
        >
          VibeSec
        </motion.div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {['How it works', 'What we scan', 'Pricing'].map((label) => {
            const href = label === 'Pricing' ? '/pricing' : label === 'How it works' ? '#how-it-works' : '#what-we-scan'
            const isLink = label === 'Pricing'
            return isLink
              ? (
                <motion.div key={label} animate={{ color: navDark ? 'rgba(247,245,242,0.6)' : '#888580' }} transition={{ duration: 0.35 }}>
                  <Link href={href} className="vs-link-dim" style={{ color: 'inherit' }}>{label}</Link>
                </motion.div>
              ) : (
                <motion.div key={label} animate={{ color: navDark ? 'rgba(247,245,242,0.6)' : '#888580' }} transition={{ duration: 0.35 }}>
                  <a href={href} className="vs-link-dim" style={{ color: 'inherit' }}>{label}</a>
                </motion.div>
              )
          })}
          {user ? (
            <motion.div animate={{ color: navDark ? WARM : DARK }} transition={{ duration: 0.35 }}>
              <Link href="/dashboard" className="vs-link-dim" style={{ color: 'inherit', opacity: 0.75 }}>Dashboard</Link>
            </motion.div>
          ) : (
            <motion.a
              href="/sign-in"
              animate={{
                color: navDark ? WARM : DARK,
                borderColor: navDark ? 'rgba(247,245,242,0.3)' : '#111010',
              }}
              transition={{ duration: 0.35 }}
              style={{ fontSize: '0.8rem', textDecoration: 'none', border: '1px solid', padding: '7px 18px', fontFamily: 'var(--sans)', fontWeight: 400, letterSpacing: '0.01em', transition: 'background 0.15s, color 0.15s', display: 'inline-block' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = navDark ? 'rgba(247,245,242,0.1)' : '#111010'; (e.currentTarget as HTMLElement).style.color = navDark ? WARM : WARM }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = navDark ? WARM : DARK }}
            >
              Sign in
            </motion.a>
          )}
        </div>
      </motion.nav>

      {/* ── DARK HERO with animated paths ── */}
      <div ref={heroRef}>
        <BackgroundPathsHero>
          <div
            className="vs-hero-inner"
            style={{
              minHeight: '100svh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '120px 24px 100px',
              textAlign: 'center',
            }}
          >
            {/* Eyebrow */}
            <motion.p
              initial={{ opacity: 0, letterSpacing: '0.04em' }}
              animate={{ opacity: 1, letterSpacing: '0.14em' }}
              transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
              style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'rgba(247,245,242,0.45)', marginBottom: '36px', letterSpacing: '0.14em' }}
            >
              Security scanning for vibe-coded apps
            </motion.p>

            {/* Animated title */}
            <div
              className="vs-hero-title"
              style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(3.2rem, 7vw, 5.8rem)', fontWeight: 400, lineHeight: 1.04, letterSpacing: '-0.025em', marginBottom: '36px' }}
            >
              <HeroAnimatedTitle line1="Your app is live." line2="Is it secure?" line2Accent />
            </div>

            {/* Sub-copy */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1, ease: EASE }}
              style={{ fontSize: '0.95rem', color: 'rgba(247,245,242,0.5)', lineHeight: 1.75, maxWidth: '400px', fontWeight: 300, marginBottom: '52px' }}
            >
              Lovable, Bolt, Cursor — they build fast. Security doesn&apos;t come included.
              Enter your site and we&apos;ll scan the codebase for what got missed.
            </motion.p>

            {/* Input — dark variant */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 1.25, ease: EASE }}
              style={{ width: '100%', maxWidth: '520px' }}
            >
              <div className={`vs-input-dark${inputError ? ' error' : ''}`}>
                <span style={{ padding: '0 14px', display: 'flex', alignItems: 'center', fontSize: '0.82rem', color: 'rgba(247,245,242,0.25)', borderRight: '1px solid rgba(247,245,242,0.12)', background: 'rgba(247,245,242,0.03)', userSelect: 'none', whiteSpace: 'nowrap' }}>
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
                  style={{ flex: 1, border: 'none', outline: 'none', padding: '15px 16px', fontFamily: 'var(--sans)', fontSize: '0.9rem', fontWeight: 300, color: WARM, background: 'transparent', minWidth: 0 }}
                />
                {/* Ink-fill button on dark bg */}
                <div style={{ position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    style={{ position: 'absolute', inset: 0, background: 'rgba(247,245,242,0.12)', transformOrigin: 'left', zIndex: 0 }}
                  />
                  <button
                    onClick={handleScan}
                    style={{ position: 'relative', zIndex: 1, padding: '0 22px', height: '100%', background: 'transparent', border: 'none', color: WARM, fontFamily: 'var(--sans)', fontSize: '0.8rem', fontWeight: 400, letterSpacing: '0.03em', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Scan now
                  </button>
                </div>
              </div>

              <p style={{ marginTop: '12px', fontSize: '0.72rem', color: 'rgba(247,245,242,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '5px', height: '5px', background: '#5a9e6f', borderRadius: '50%', flexShrink: 0 }} />
                Code is never stored — scanned in an isolated container, then deleted
              </p>
            </motion.div>

            {/* Stats bar */}
            <motion.div
              className="vs-stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.45, ease: EASE }}
              style={{ display: 'flex', marginTop: '72px', border: '1px solid rgba(247,245,242,0.1)', background: 'rgba(247,245,242,0.04)' }}
            >
              {STATS.map((stat, i) => (
                <div
                  key={i}
                  className="vs-stat-cell"
                  style={{
                    borderRight: i < STATS.length - 1 ? '1px solid rgba(247,245,242,0.1)' : 'none',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'rgba(247,245,242,0.06)'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <span style={{ fontFamily: 'var(--serif)', fontSize: '1.7rem', color: WARM, display: 'block', lineHeight: 1, marginBottom: '4px' }}>
                    <CountUp to={stat.value} suffix={stat.suffix} duration={1.4} />
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(247,245,242,0.4)', letterSpacing: '0.02em', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
                    {stat.label}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Scroll cue */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.0, duration: 0.8 }}
              style={{ marginTop: '56px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, transparent, rgba(247,245,242,0.25))' }}
              />
            </motion.div>
          </div>
        </BackgroundPathsHero>
      </div>

      {/* ── Light editorial sections below ── */}
      <div style={{ background: 'var(--bg)', color: 'var(--ink)', fontFamily: 'var(--sans)', fontWeight: 300 }}>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="vs-section-inner" style={{ maxWidth: '1100px', margin: '0 auto', padding: '96px 48px' }}>
            <ScrollReveal>
              <p style={{ fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink4)', marginBottom: '16px' }}>How it works</p>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.1, maxWidth: '560px', marginBottom: '80px' }}>
                From URL to report<br />
                <em style={{ fontStyle: 'italic', color: 'var(--ink3)' }}>in under three minutes.</em>
              </h2>
            </ScrollReveal>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {STEPS.map((step, i) => (
                <ScrollReveal key={step.n} delay={i * 0.1}>
                  <DrawLine />
                  <div className="vs-steps-grid" style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '32px', padding: '40px 0', alignItems: 'start' }}>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '3.5rem', color: 'var(--border)', lineHeight: 1, userSelect: 'none', letterSpacing: '-0.02em' }}>{step.n}</div>
                    <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', fontWeight: 400, color: 'var(--ink)', lineHeight: 1.2, letterSpacing: '-0.01em', paddingTop: '6px' }}>{step.title}</h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--ink3)', lineHeight: 1.7, fontWeight: 300, paddingTop: '6px' }}>{step.body}</p>
                  </div>
                </ScrollReveal>
              ))}
              <DrawLine delay={0.3} />
            </div>
          </div>
        </section>

        {/* ── WHAT WE SCAN ── */}
        <section id="what-we-scan" style={{ borderTop: '1px solid var(--border)', background: '#fff' }}>
          <div className="vs-section-inner" style={{ maxWidth: '1100px', margin: '0 auto', padding: '96px 48px' }}>
            <ScrollReveal>
              <p style={{ fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink4)', marginBottom: '16px' }}>What we scan for</p>
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
                    <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1.1rem', color: 'var(--ink)', marginBottom: '10px', letterSpacing: '-0.01em' }}>{f.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--ink3)', lineHeight: 1.65, fontWeight: 300, margin: 0 }}>{f.body}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── BUILT FOR VIBE CODERS ── */}
        <section style={{ borderTop: '1px solid var(--border)' }}>
          <div className="vs-section-inner" style={{ maxWidth: '1100px', margin: '0 auto', padding: '96px 48px' }}>
            <div className="vs-split-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
              <ScrollReveal>
                <p style={{ fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink4)', marginBottom: '16px' }}>Built for</p>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.1, marginBottom: '24px' }}>
                  Anyone who ships<br />
                  <em style={{ fontStyle: 'italic', color: '#c0392b' }}>with AI at the wheel.</em>
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--ink3)', lineHeight: 1.7, fontWeight: 300, maxWidth: '360px', marginBottom: '36px' }}>
                  AI coding tools are extraordinary at building features. They are not trained to be security engineers. VibeSec fills that gap — one scan at a time.
                </p>
                <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
                  <motion.div initial={{ scaleX: 0 }} whileHover={{ scaleX: 1 }} transition={{ duration: 0.28, ease: EASE }}
                    style={{ position: 'absolute', inset: 0, background: '#2a2928', transformOrigin: 'left', zIndex: 0 }} />
                  <button onClick={handleScan} style={{ position: 'relative', zIndex: 1, padding: '13px 28px', background: 'var(--ink)', color: '#fff', border: 'none', fontFamily: 'var(--sans)', fontSize: '0.9rem', fontWeight: 400, cursor: 'pointer', letterSpacing: '0.01em' }}>
                    Scan your app free →
                  </button>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={0.15}>
                <p style={{ fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink4)', marginBottom: '20px' }}>Compatible tools</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {TOOLS.map((tool, i) => (
                    <motion.span key={tool} className="vs-tool-tag" initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.04, ease: EASE }}>
                      {tool}
                    </motion.span>
                  ))}
                </div>

                <div style={{ marginTop: '40px', padding: '24px', border: '1px solid var(--border)', background: 'var(--bg)' }}>
                  <p style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 400, color: 'var(--ink)', lineHeight: 1.55, margin: 0, fontStyle: 'italic' }}>
                    &ldquo;We found a Supabase service role key in the client bundle on the very first scan. It had been there since launch.&rdquo;
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--ink4)', marginTop: '14px', fontWeight: 300 }}>— Developer, solo SaaS on Lovable</p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── PRICING TEASER — dark ── */}
        <section style={{ borderTop: '1px solid var(--border)', background: 'var(--ink)' }}>
          <div className="vs-section-inner" style={{ maxWidth: '1100px', margin: '0 auto', padding: '96px 48px' }}>
            <ScrollReveal>
              <p style={{ fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(247,245,242,0.35)', marginBottom: '48px' }}>Pricing</p>
            </ScrollReveal>
            <div className="vs-pricing-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: 'rgba(247,245,242,0.06)' }}>
              {[
                { price: 'Free', note: 'always', cta: 'Start scanning', href: '/', features: ['Unlimited scans', 'Severity totals', 'Finding counts'] },
                { price: '$29', note: 'per scan', cta: 'Unlock report', href: '/pricing', features: ['Full finding details', 'File + line numbers', 'AI fix prompts for Lovable / Cursor'] },
                { price: '$149', note: 'per scan', cta: 'Fix my app', href: '/pricing', features: ['Everything in Unlock', 'We apply all fixes', 'PR opened within 24 hours'] },
              ].map((tier, i) => (
                <ScrollReveal key={tier.price} delay={i * 0.1}>
                  <div style={{ padding: '40px', background: 'var(--ink)' }}>
                    <p style={{ fontFamily: 'var(--serif)', fontSize: '2.4rem', color: '#f7f5f2', fontWeight: 400, lineHeight: 1, marginBottom: '4px' }}>{tier.price}</p>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(247,245,242,0.35)', marginBottom: '28px', fontWeight: 300 }}>{tier.note}</p>
                    <ul style={{ padding: 0, margin: '0 0 32px 0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {tier.features.map((f) => (
                        <li key={f} style={{ fontSize: '0.85rem', color: 'rgba(247,245,242,0.6)', fontWeight: 300, display: 'flex', gap: '10px' }}>
                          <span style={{ color: 'rgba(247,245,242,0.2)', flexShrink: 0, marginTop: '2px' }}>—</span>{f}
                        </li>
                      ))}
                    </ul>
                    <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
                      <motion.div initial={{ scaleX: 0 }} whileHover={{ scaleX: 1 }} transition={{ duration: 0.28, ease: EASE }}
                        style={{ position: 'absolute', inset: 0, background: 'rgba(247,245,242,0.1)', transformOrigin: 'left', zIndex: 0 }} />
                      <Link href={tier.href} style={{ position: 'relative', zIndex: 1, display: 'inline-block', padding: '10px 20px', border: '1px solid rgba(247,245,242,0.2)', color: '#f7f5f2', fontSize: '0.82rem', fontFamily: 'var(--sans)', fontWeight: 400, textDecoration: 'none', letterSpacing: '0.01em' }}>
                        {tier.cta} →
                      </Link>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── BOTTOM CTA ── */}
        <section style={{ borderTop: '1px solid var(--border)' }}>
          <div className="vs-section-inner" style={{ maxWidth: '1100px', margin: '0 auto', padding: '120px 48px', textAlign: 'center' }}>
            <ScrollReveal>
              <p style={{ fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink4)', marginBottom: '20px' }}>Ready when you are</p>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2.4rem, 5vw, 4.2rem)', fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--ink)', lineHeight: 1.05, marginBottom: '40px' }}>
                Ship fast.<br /><em style={{ fontStyle: 'italic', color: '#c0392b' }}>Ship secure.</em>
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                  <motion.div initial={{ scaleX: 0 }} whileHover={{ scaleX: 1 }} transition={{ duration: 0.28, ease: EASE }}
                    style={{ position: 'absolute', inset: 0, background: '#2a2928', transformOrigin: 'left', zIndex: 0 }} />
                  <button onClick={handleScan} style={{ position: 'relative', zIndex: 1, padding: '14px 32px', background: 'var(--ink)', color: '#fff', border: 'none', fontFamily: 'var(--sans)', fontSize: '0.95rem', fontWeight: 400, cursor: 'pointer' }}>
                    Scan your app free
                  </button>
                </div>
                <Link href="/demo" style={{ fontSize: '0.88rem', color: 'var(--ink3)', textDecoration: 'none', borderBottom: '1px solid var(--border)', paddingBottom: '1px' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--ink)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--ink)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--ink3)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}>
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
            <span style={{ width: '5px', height: '5px', background: '#5a9e6f', borderRadius: '50%', display: 'inline-block' }} />
            Source code deleted after every scan
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="mailto:hello@vibesec.app" className="vs-footer-link">Contact</a>
            <Link href="/pricing" className="vs-footer-link">Pricing</Link>
            <Link href="/demo" className="vs-footer-link">Demo</Link>
          </div>
        </footer>
      </div>

      {/* ── OVERLAYS ── */}
      <AnimatePresence>
        {uiState === 'modal' && (
          <GitHubModal key="gh-modal" siteUrl={normalizeSiteUrl(siteUrl)} onClose={() => setUiState('default')} onConfirm={handleConnectGithub} onDemo={handleDemo} />
        )}
      </AnimatePresence>

      {uiState === 'scanning' && (
        <ScanProgress siteUrl={normalizeSiteUrl(siteUrl)} scanId={scanId} onComplete={handleScanComplete} />
      )}
    </>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: DARK }} />}>
      <HomeInner />
    </Suspense>
  )
}
