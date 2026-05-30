'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import ScanProgress from '@/components/ScanProgress'
import FindingCard from '@/components/FindingCard'
import LockedFinding from '@/components/LockedFinding'
import PassivePaywallPanel from '@/components/PassivePaywallPanel'
import GitHubModal from '@/components/GitHubModal'
import { CountUp } from '@/components/motion/CountUp'
import { createBrowserClient } from '@/lib/supabase.client'
import { encodeGithubInstallState, normalizeSiteUrl } from '@/lib/url'
import type { Finding, SeverityLevel } from '@/types'
import type { User } from '@supabase/supabase-js'

const EASE = [0.16, 1, 0.3, 1] as const

type StatusPayload = {
  status: string
  url: string
  totalCount: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  paid: boolean
  previewFinding?: Finding
  lockedCount?: number
  findings?: Finding[]
  error?: string
  errorMessage?: string | null
}

function RiskBadge({ severity }: { severity: SeverityLevel }) {
  const styles: Record<SeverityLevel, React.CSSProperties> = {
    critical: { backgroundColor: '#c0392b', color: '#ffffff' },
    high: { backgroundColor: '#e67e22', color: '#ffffff' },
    medium: { backgroundColor: '#f39c12', color: '#ffffff' },
    low: { backgroundColor: '#5a9e6f', color: '#ffffff' },
  }
  return (
    <span
      style={{
        ...styles[severity],
        display: 'inline-block',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        padding: '5px 12px',
      }}
    >
      {severity}
    </span>
  )
}

function ScanReportInner({ token }: { token: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [data, setData] = useState<StatusPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [showScanning, setShowScanning] = useState(false)
  const [ghModal, setGhModal] = useState(false)

  const paymentSuccess = searchParams.get('payment') === 'success'

  useEffect(() => {
    const supabase = createBrowserClient()
    supabase.auth.getUser().then(({ data: u }) => setUser(u.user))
  }, [])

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/passive-scan/${token}/status`)
      if (!res.ok) return null
      return (await res.json()) as StatusPayload
    } catch {
      return null
    }
  }, [token])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const payload = await fetchStatus()
      if (cancelled) return
      setLoading(false)
      if (!payload || payload.error) return
      setData(payload)
      if (payload.status === 'queued' || payload.status === 'running') {
        setShowScanning(true)
      }
    }

    load()
    return () => { cancelled = true }
  }, [fetchStatus])

  useEffect(() => {
    if (!showScanning && data?.status !== 'queued' && data?.status !== 'running') return

    const interval = setInterval(async () => {
      const payload = await fetchStatus()
      if (!payload) return
      setData(payload)
      if (payload.status === 'complete' || payload.status === 'failed') {
        setShowScanning(false)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [showScanning, data?.status, fetchStatus])

  useEffect(() => {
    if (paymentSuccess) {
      fetchStatus().then((p) => { if (p) setData(p) })
      router.replace(`/scan/${token}`, { scroll: false })
    }
  }, [paymentSuccess, fetchStatus, router, token])

  function handleConnectGithub() {
    if (!data?.url) return
    const normalized = normalizeSiteUrl(data.url)
    try {
      sessionStorage.setItem('vibesec_pending_site', normalized)
    } catch { /* ignore */ }
    if (!user) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent(`/scan/${token}`)}`)
      return
    }
    const slug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG
    if (!slug) {
      alert('Missing NEXT_PUBLIC_GITHUB_APP_SLUG — see SETUP.md.')
      return
    }
    const state = encodeGithubInstallState({ siteUrl: normalized })
    window.location.assign(
      `https://github.com/apps/${slug}/installations/new?state=${encodeURIComponent(state)}`,
    )
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f7f5f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--sans)', color: 'var(--ink3)' }}>Loading report…</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', background: '#f7f5f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem' }}>Scan not found</h1>
        <Link href="/" style={{ color: 'var(--ink)' }}>← Back home</Link>
      </div>
    )
  }

  if (showScanning || data.status === 'queued' || data.status === 'running') {
    return (
      <ScanProgress
        siteUrl={data.url}
        scanId={token}
        mode="passive"
        onComplete={() => {
          setShowScanning(false)
          fetchStatus().then((p) => { if (p) setData(p) })
        }}
      />
    )
  }

  if (data.status === 'failed') {
    const hint = data.errorMessage ?? ''
    const isConfig =
      hint.includes('MODAL_PASSIVE') ||
      hint.includes('Unauthorized') ||
      hint.includes('401') ||
      hint.includes('callback') ||
      hint.includes('secret')
    return (
      <main style={{ maxWidth: '560px', margin: '80px auto', padding: '24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', marginBottom: '12px' }}>Scan could not finish</h1>
        <p style={{ color: 'var(--ink3)', lineHeight: 1.55, marginBottom: '16px' }}>
          {isConfig
            ? 'Server configuration issue — see checklist below.'
            : 'The scanner hit an error before results could be saved.'}
        </p>
        {hint ? (
          <p
            style={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: 'var(--ink4)',
              background: '#f7f5f2',
              border: '1px solid #e2deda',
              padding: '12px',
              marginBottom: '20px',
              textAlign: 'left',
              wordBreak: 'break-word',
            }}
          >
            {hint}
          </p>
        ) : null}
        <ul style={{ textAlign: 'left', color: 'var(--ink3)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '24px', paddingLeft: '20px' }}>
          <li>Vercel: <code>MODAL_PASSIVE_FUNCTION_URL</code> = your Modal deploy URL</li>
          <li>Vercel: <code>NEXT_PUBLIC_APP_URL</code> = your live site (not localhost)</li>
          <li>Same secret in Vercel <code>SCANNER_CALLBACK_SECRET</code> and Modal <code>APP_CALLBACK_SECRET</code></li>
          <li>Redeploy Modal: <code>modal deploy passive.py</code></li>
        </ul>
        <Link href="/" style={{ color: 'var(--ink)' }}>Try again →</Link>
      </main>
    )
  }

  const paid = data.paid
  const allFindings = data.findings ?? []
  const preview = data.previewFinding
  const lockedStubs =
    !paid && preview
      ? Array.from({ length: data.lockedCount ?? 0 }, (_, i) => ({
          id: `locked-${i}`,
          severity: 'medium' as SeverityLevel,
          file: 'Hidden',
        }))
      : []

  const host = data.url.replace(/^https?:\/\//i, '')

  return (
    <>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(247,245,242,0.97)',
          borderBottom: '1px solid #e2deda',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link href="/" style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', color: 'var(--ink)', textDecoration: 'none' }}>
          VibeSec
        </Link>
        <span style={{ fontSize: '0.8rem', color: 'var(--ink3)' }}>{host}</span>
      </nav>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px 80px' }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <p style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink4)', marginBottom: '12px' }}>
            Passive security scan
          </p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 400, marginBottom: '8px' }}>
            {data.totalCount} {data.totalCount === 1 ? 'issue' : 'issues'} found
          </h1>
          <p style={{ color: 'var(--ink3)', fontWeight: 300, marginBottom: '32px' }}>
            External scan of <strong style={{ fontWeight: 400, color: 'var(--ink)' }}>{host}</strong> — SSL, headers, DNS, and more.
          </p>
        </motion.div>

        <div
          className="report-summary-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1px',
            background: '#e2deda',
            border: '1px solid #e2deda',
            marginBottom: '40px',
          }}
        >
          {(
            [
              ['Critical', data.criticalCount, 'critical'],
              ['High', data.highCount, 'high'],
              ['Medium', data.mediumCount, 'medium'],
              ['Low', data.lowCount, 'low'],
            ] as const
          ).map(([label, count, sev], i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.4, ease: EASE }}
              style={{ background: '#fff', padding: '20px 24px' }}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--ink4)', marginBottom: '8px' }}>{label}</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '2rem' }}>
                <CountUp to={count} duration={0.8} />
              </div>
              <RiskBadge severity={sev} />
            </motion.div>
          ))}
        </div>

        <div className="passive-report-layout" style={{ display: 'grid', gridTemplateColumns: paid ? '1fr' : '1fr 320px', gap: '32px', alignItems: 'start' }}>
          <div>
            {paid && allFindings.length === 0 && (
              <p style={{ color: 'var(--ink3)' }}>No issues detected — great work.</p>
            )}

            {!paid && preview && (
              <>
                <p style={{ fontSize: '0.85rem', color: 'var(--ink3)', marginBottom: '16px' }}>
                  Preview — unlock to see all {data.totalCount} findings and fix prompts.
                </p>
                <FindingCard finding={preview} delay={0} />
              </>
            )}

            {!paid &&
              lockedStubs.map((stub, i) => (
                <LockedFinding key={stub.id} severity={stub.severity} file={stub.file} index={i} delay={0.08 * (i + 1)} />
              ))}

            {paid &&
              allFindings.map((f, i) => (
                <FindingCard key={f.id} finding={f} delay={0.06 * i} />
              ))}

            {paid && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5, ease: EASE }}
                style={{
                  marginTop: '48px',
                  padding: '28px 32px',
                  background: '#0e0c0b',
                  color: '#f7f5f2',
                  border: '1px solid rgba(247,245,242,0.12)',
                }}
              >
                <p style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.5, marginBottom: '12px' }}>
                  Go deeper
                </p>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 400, marginBottom: '12px' }}>
                  Want code-level findings?
                </h2>
                <p style={{ fontSize: '0.9rem', opacity: 0.75, fontWeight: 300, lineHeight: 1.55, marginBottom: '20px', maxWidth: '520px' }}>
                  Connect your GitHub repo for a deeper scan — we&apos;ll check for exposed secrets,
                  vulnerable dependencies, and SQL injection in your source code.
                </p>
                <button
                  type="button"
                  onClick={() => setGhModal(true)}
                  style={{
                    padding: '12px 24px',
                    background: '#f7f5f2',
                    color: '#0e0c0b',
                    border: 'none',
                    fontFamily: 'var(--sans)',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                >
                  Connect GitHub for code scan →
                </button>
              </motion.div>
            )}
          </div>

          {!paid && (
            <PassivePaywallPanel
              token={token}
              totalCount={data.totalCount}
              criticalCount={data.criticalCount}
            />
          )}
        </div>
      </main>

      {ghModal && (
        <GitHubModal
          siteUrl={normalizeSiteUrl(data.url)}
          onClose={() => setGhModal(false)}
          onConfirm={() => {
            setGhModal(false)
            handleConnectGithub()
          }}
          onDemo={() => router.push('/demo')}
        />
      )}
    </>
  )
}

export default function PassiveScanPage({ params }: { params: { token: string } }) {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', background: '#f7f5f2' }} />
      }
    >
      <ScanReportInner token={params.token} />
    </Suspense>
  )
}
