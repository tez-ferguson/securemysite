'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export type ScanProgressMode = 'code' | 'passive'

interface ScanProgressProps {
  siteUrl: string
  scanId: string
  onComplete: (scanId: string) => void
  mode?: ScanProgressMode
}

type StepState = 'pending' | 'active' | 'done'

interface Step {
  label: string
  findingLabel: string | null
  state: StepState
}

type PollPayload = {
  status: string
  totalCount: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
}

const EASE = [0.16, 1, 0.3, 1] as const

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_TIMELINE: [number, number, number][] = [
  [0,    1800,  20],
  [1900, 4200,  42],
  [4300, 7400,  64],
  [7500, 9800,  82],
  [9900, 12200, 100],
]

const DEMO_TERMINAL_LINES = [
  'Cloning repository…',
  '$ git clone --depth 1 https://github.com/acme/app.git',
  'remote: Counting objects: 1242',
  '$ gitleaks detect --source ./app --report-format json',
  'Found: src/lib/supabase.js:14 — generic-api-key',
  'Found: .env.local:3 — stripe-access-token',
  '$ semgrep --config=auto --json ./app',
  'semgrep: 18 rules ran, 6 findings',
  'Found: app/api/admin/route.ts:4 — missing-auth-check',
  'Found: lib/db.ts:47 — sql-injection',
  '$ trivy fs --format json ./app',
  'lodash@4.17.15 — prototype-pollution (CVE-2021-23337)',
  'node-fetch@2.6.1 — ReDoS (CVE-2022-0235)',
  '$ python custom_checks.py',
  'SUPABASE_SERVICE_ROLE exposed in components/Analytics.tsx',
  '$ kimi generate-fix-prompts (20 findings)',
  'Fix prompts drafted. Sending results…',
  '→ Callback OK',
]

function makeBaseSteps(mode: ScanProgressMode): Step[] {
  if (mode === 'passive') {
    return [
      { label: 'Checking SSL/TLS certificate', findingLabel: null, state: 'pending' },
      { label: 'Testing security headers', findingLabel: null, state: 'pending' },
      { label: 'Auditing cookies & CORS', findingLabel: null, state: 'pending' },
      { label: 'Scanning DNS & exposed paths', findingLabel: null, state: 'pending' },
      { label: 'Generating fix recommendations', findingLabel: null, state: 'pending' },
    ]
  }
  return [
    { label: 'Cloning repository', findingLabel: null, state: 'pending' },
    { label: 'Scanning for exposed secrets', findingLabel: null, state: 'pending' },
    { label: 'Analysing code vulnerabilities', findingLabel: null, state: 'pending' },
    { label: 'Checking dependencies', findingLabel: null, state: 'pending' },
    { label: 'Generating fix recommendations', findingLabel: null, state: 'pending' },
  ]
}

function hydrateFinished(payload: PollPayload, mode: ScanProgressMode): Step[] {
  const n = payload.totalCount ?? 0
  const suffix =
    payload.status === 'failed'
      ? 'Scan encountered an error.'
      : `${n} ${n === 1 ? 'issue' : 'issues'} · ${payload.criticalCount}c ${payload.highCount}h ${payload.mediumCount}m ${payload.lowCount}l`
  return makeBaseSteps(mode).map((s, i) => ({
    ...s,
    state: 'done',
    findingLabel: i === 4 ? suffix : null,
  }))
}

// ─── SVG Arc Spinner ─────────────────────────────────────────────────────────

function ArcSpinner() {
  return (
    <motion.svg
      width="18" height="18" viewBox="0 0 18 18"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, ease: 'linear', repeat: Infinity }}
      style={{ flexShrink: 0 }}
    >
      <circle cx="9" cy="9" r="7" fill="none" stroke="#e2deda" strokeWidth="1.5" />
      <motion.circle
        cx="9" cy="9" r="7" fill="none"
        stroke="#111010" strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="44"
        strokeDashoffset="33"
        style={{ transformOrigin: 'center' }}
      />
    </motion.svg>
  )
}

// ─── Tick mark ───────────────────────────────────────────────────────────────

function Tick() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5a9e6f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <motion.polyline
        points="20 6 9 17 4 12"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: EASE }}
      />
    </svg>
  )
}

// ─── Terminal log ─────────────────────────────────────────────────────────────

interface TerminalProps {
  lines: string[]
}

function TerminalLog({ lines }: TerminalProps) {
  return (
    <div style={{
      fontFamily: "'IBM Plex Mono', 'Fira Mono', monospace",
      fontSize: '0.7rem',
      lineHeight: 1.6,
      color: '#888580',
      height: '88px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column-reverse',
      gap: 0,
    }}>
      <AnimatePresence initial={false}>
        {[...lines].reverse().slice(0, 5).map((line, i) => (
          <motion.div
            key={line + i}
            initial={{ opacity: 0.3, y: 6 }}
            animate={{ opacity: i === 0 ? 1 : Math.max(0.2, 1 - i * 0.2), y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {line}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ScanProgress({ siteUrl, scanId, onComplete, mode = 'code' }: ScanProgressProps) {
  const [visible, setVisible] = useState(false)
  const [steps, setSteps] = useState<Step[]>(() => makeBaseSteps(mode))
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('Preparing scan…')
  const [termLines, setTermLines] = useState<string[]>([])
  const [done, setDone] = useState(false)

  const completedRef = useRef(false)
  const isDemo = scanId === 'demo-123'

  // Reset when scanId or mode changes
  useEffect(() => {
    completedRef.current = false
    setSteps(makeBaseSteps(mode))
    setProgress(0)
    setStatusText('Preparing scan…')
    setTermLines([])
    setDone(false)
  }, [scanId, mode])

  const STATUS_LABELS =
    mode === 'passive'
      ? [
          'Verifying certificate chain and expiry…',
          'Checking CSP, HSTS, X-Frame-Options…',
          'Reviewing Set-Cookie and CORS headers…',
          'Looking up SPF/DMARC and sensitive paths…',
          'Drafting hosting fix prompts…',
        ]
      : [
          'Connecting to repository…',
          'Looking for API keys, tokens, and credentials…',
          'Checking for SQL injection, XSS, and auth issues…',
          'Auditing npm packages for known CVEs…',
          'Building remediation guide…',
        ]

  // ── Demo choreography ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isDemo) return

    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(setTimeout(() => setVisible(true), 10))

    // Terminal drip — one line per 750ms from step 1 onwards
    DEMO_TERMINAL_LINES.forEach((line, i) => {
      timers.push(setTimeout(() => setTermLines((prev) => [...prev, line]), 2200 + i * 680))
    })

    DEMO_TIMELINE.forEach(([activeAt, doneAt, pct], idx) => {
      timers.push(setTimeout(() => {
        setSteps((prev) => prev.map((s, i) => i === idx ? { ...s, state: 'active' } : s))
        setStatusText(STATUS_LABELS[idx])
      }, activeAt))

      timers.push(setTimeout(() => {
        setSteps((prev) => prev.map((s, i) => i === idx ? { ...s, state: 'done' } : s))
        setProgress(pct)
        if (idx === DEMO_TIMELINE.length - 1) {
          setDone(true)
          setStatusText('Scan complete')
          timers.push(setTimeout(() => {
            if (!completedRef.current) {
              completedRef.current = true
              onComplete(scanId)
            }
          }, 700))
        }
      }, doneAt))
    })

    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, scanId])

  // ── Production: soft UX animation + real polling ──────────────────────────
  useEffect(() => {
    if (isDemo) return

    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(setTimeout(() => setVisible(true), 10))

    // Soft staged UX (35% speed of demo) — overridden by real poll
    DEMO_TIMELINE.forEach(([activeAt, doneAt, pct], idx) => {
      timers.push(setTimeout(() => {
        if (completedRef.current) return
        setSteps((prev) => prev.map((s, i) => ({
          ...s,
          state: i < idx ? 'done' : i === idx ? 'active' : 'pending',
        })))
        setStatusText(STATUS_LABELS[idx])
      }, activeAt * 0.35))

      timers.push(setTimeout(() => {
        if (completedRef.current) return
        setSteps((prev) => prev.map((s, i) => ({ ...s, state: i <= idx ? 'done' : 'pending' })))
        setProgress(pct)
      }, doneAt * 0.35))
    })

    function finalize(data: PollPayload) {
      if (completedRef.current) return
      completedRef.current = true
      setSteps(hydrateFinished(data, mode))
      setProgress(100)
      setDone(true)
      const isFail = data.status === 'failed'
      setStatusText(isFail ? 'Scan finished with errors.' : 'Scan complete')
      timers.push(setTimeout(() => onComplete(scanId), 700))
    }

    async function poll() {
      try {
        const statusPath =
          mode === 'passive'
            ? `/api/passive-scan/${scanId}/status`
            : `/api/scans/${scanId}/status`
        const res = await fetch(statusPath)
        if (!res.ok) return
        const data = await res.json() as PollPayload & { error?: string }
        if (data.error) return
        if (data.status === 'complete' || data.status === 'failed') {
          finalize(data)
        } else {
          setProgress((p) => Math.max(p, data.status === 'queued' ? 8 : Math.min(p + 10, 88)))
        }
      } catch { /* network hiccup */ }
    }

    timers.push(setTimeout(poll, 500))
    const interval = window.setInterval(poll, 3000)

    return () => { clearInterval(interval); timers.forEach(clearTimeout) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, scanId, mode])

  const displayHost = siteUrl?.trim()
    ? siteUrl.replace(/^https?:\/\//i, '')
    : 'yourapp.vercel.app'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', pointerEvents: visible ? 'all' : 'none' }}
    >
      <div style={{ width: '100%', maxWidth: '460px' }}>

        {/* Header */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: EASE }}
          style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: '4px' }}
        >
          {mode === 'passive' ? 'Scanning your site' : 'Scanning your app'}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2, ease: EASE }}
          style={{ fontSize: '0.8rem', color: 'var(--ink4)', marginBottom: '36px' }}
        >
          {displayHost}
        </motion.p>

        {/* Steps */}
        <div style={{ marginBottom: '28px' }}>
          {steps.map((step, i) => {
            const isDone = step.state === 'done'
            const isActive = step.state === 'active'
            const isPending = step.state === 'pending'

            return (
              <motion.div
                key={`${scanId}-step-${i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: isPending ? 0.3 : 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.05 * i, ease: EASE }}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 0', borderBottom: '1px solid #e2deda', borderTop: i === 0 ? '1px solid #e2deda' : undefined }}
              >
                {/* Icon */}
                <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isActive ? <ArcSpinner /> : isDone ? <Tick /> : (
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e2deda' }} />
                  )}
                </div>

                {/* Label */}
                <span style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 300, flex: 1 }}>
                  {step.label}
                  {isDone && <span style={{ color: 'var(--ink3)' }}> — done</span>}
                </span>

                {/* Finding label — animates in when done */}
                <AnimatePresence>
                  {step.findingLabel && isDone && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.15, ease: EASE }}
                      style={{ fontSize: '0.68rem', color: 'var(--red)', fontWeight: 400, whiteSpace: 'nowrap', maxWidth: '45%', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}
                    >
                      {step.findingLabel}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        {/* Terminal log */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          style={{ marginBottom: '28px', paddingTop: '4px' }}
        >
          <TerminalLog lines={termLines.length > 0 ? termLines : ['Initialising scanner…']} />
        </motion.div>

        {/* Progress bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <AnimatePresence mode="wait">
              <motion.span
                key={statusText}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                style={{ fontSize: '0.72rem', color: 'var(--ink3)', fontWeight: 300 }}
              >
                {statusText}
              </motion.span>
            </AnimatePresence>
            <span style={{ fontFamily: 'var(--serif)', fontSize: '0.85rem', color: 'var(--ink)' }}>
              {Math.round(progress)}%
            </span>
          </div>

          {/* Track */}
          <div style={{ height: '1px', background: '#e2deda', position: 'relative', overflow: 'hidden' }}>
            {/* Fill */}
            <motion.div
              style={{ position: 'absolute', top: 0, left: 0, bottom: 0, background: 'var(--ink)', transformOrigin: 'left' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: EASE }}
            />
            {/* Shimmer — only while running */}
            {!done && (
              <motion.div
                style={{ position: 'absolute', top: 0, bottom: 0, width: '20px', background: 'rgba(255,255,255,0.35)' }}
                animate={{ left: ['-20px', '110%'] }}
                transition={{ duration: 1.8, ease: 'linear', repeat: Infinity, repeatDelay: 0.4 }}
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
