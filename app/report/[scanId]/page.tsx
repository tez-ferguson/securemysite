import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import FindingCard from '../../../components/FindingCard'
import LockedFinding from '../../../components/LockedFinding'
import PaywallPanel from '../../../components/PaywallPanel'
import { CountUp } from '../../../components/motion/CountUp'
import type { Finding, ScanJob, ScanResult, SeverityLevel } from '../../../types'
import { BRAND_NAME } from '@/lib/brand'

interface ReportPageProps {
  params: { scanId: string }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }) + ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const REPORT_CSS = ``

function overallRisk(result: ScanResult): SeverityLevel | null {
  if (result.criticalCount > 0) return 'critical'
  if (result.highCount > 0) return 'high'
  if (result.mediumCount > 0) return 'medium'
  if (result.lowCount > 0) return 'low'
  return null
}

function RiskBadge({ severity }: { severity: SeverityLevel }) {
  const styles: Record<SeverityLevel, React.CSSProperties> = {
    critical: { backgroundColor: '#c0392b', color: '#ffffff', border: '1px solid #c0392b' },
    high: { backgroundColor: '#e67e22', color: '#ffffff', border: '1px solid #e67e22' },
    medium: { backgroundColor: '#f39c12', color: '#ffffff', border: '1px solid #f39c12' },
    low: { backgroundColor: '#5a9e6f', color: '#ffffff', border: '1px solid #5a9e6f' },
  }
  return (
    <span
      style={{
        ...styles[severity],
        display: 'inline-block',
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 400,
        fontSize: '0.8rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        padding: '5px 14px',
      }}
    >
      {severity} risk
    </span>
  )
}

export default async function ReportPage({ params }: ReportPageProps) {
  const supabaseAuth = createServerSupabaseClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  const userId = user?.id
  if (!userId) redirect('/sign-in')

  const supabase = createServiceClient()

  // Fetch scan job
  const { data: scanJob, error: jobError } = await supabase
    .from('scan_jobs')
    .select('*')
    .eq('id', params.scanId)
    .eq('user_id', userId)
    .single()

  if (jobError || !scanJob) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#f7f5f2',
          fontFamily: "'DM Sans', sans-serif",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontWeight: 400,
              fontSize: '1.8rem',
              color: '#111010',
              marginBottom: '12px',
            }}
          >
            Scan not found
          </h1>
          <Link
            href="/dashboard"
            style={{ color: '#111010', fontWeight: 400, fontSize: '0.9rem' }}
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  const job = scanJob as ScanJob & { user_id: string }

  const { data: countsRow } = await supabase
    .from('scan_findings')
    .select('total_count, critical_count, high_count, medium_count, low_count')
    .eq('scan_job_id', params.scanId)
    .maybeSingle()

  const { data: unlock } = await supabase
    .from('scan_unlocks')
    .select('id, unlock_type')
    .eq('scan_job_id', params.scanId)
    .eq('user_id', userId)
    .maybeSingle()

  const unlocked = !!unlock?.id

  const { data: findingsRow } = await supabase
    .from('scan_findings')
    .select('findings')
    .eq('scan_job_id', params.scanId)
    .maybeSingle()

  const allFindings = (findingsRow?.findings as Finding[] | null) ?? []

  const previewFinding = !unlocked && allFindings.length > 0 ? allFindings[0] : null
  const lockedStubs = !unlocked
    ? allFindings.slice(1).map((f) => ({
        id: f.id,
        severity: f.severity,
        file: f.file,
      }))
    : []
  const unlockedFindingsList = unlocked ? allFindings : []

  const result: ScanResult = {
    status: job.status,
    totalCount: countsRow?.total_count ?? 0,
    criticalCount: countsRow?.critical_count ?? 0,
    highCount: countsRow?.high_count ?? 0,
    mediumCount: countsRow?.medium_count ?? 0,
    lowCount: countsRow?.low_count ?? 0,
    unlocked,
    findings: unlockedFindingsList,
  }

  const risk = overallRisk(result)
  const displayName = job.repo_name ?? job.repo_url ?? job.site_url ?? 'Scan'

  // Scanning / queued state
  if (job.status === 'queued' || job.status === 'running') {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#f7f5f2',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Nav */}
        <nav
          style={{
            borderBottom: '1px solid #e2deda',
            backgroundColor: '#ffffff',
            padding: '0 40px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            href="/"
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: '1.1rem',
              color: '#111010',
              textDecoration: 'none',
              fontWeight: 400,
            }}
          >
            {BRAND_NAME}
          </Link>
          <Link
            href="/dashboard"
            style={{ color: '#444240', fontSize: '0.88rem', textDecoration: 'none' }}
          >
            ← Dashboard
          </Link>
        </nav>

        <div
          style={{
            maxWidth: '600px',
            margin: '120px auto',
            textAlign: 'center',
            padding: '0 24px',
          }}
        >
          {/* Spinner */}
          <div
            style={{
              width: '36px',
              height: '36px',
              border: '2px solid #e2deda',
              borderTopColor: '#111010',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 28px',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <h1
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontWeight: 400,
              fontSize: '1.8rem',
              color: '#111010',
              marginBottom: '12px',
            }}
          >
            Scanning in progress
          </h1>
          <p
            style={{
              fontWeight: 300,
              fontSize: '0.9rem',
              color: '#888580',
              lineHeight: '1.6',
            }}
          >
            {job.status === 'queued'
              ? 'Your scan is queued and will begin shortly.'
              : 'Running security analysis. This usually takes under a minute.'}
          </p>
        </div>
      </div>
    )
  }

  // Failed state
  if (job.status === 'failed') {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#f7f5f2',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <nav
          style={{
            borderBottom: '1px solid #e2deda',
            backgroundColor: '#ffffff',
            padding: '0 40px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            href="/"
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: '1.1rem',
              color: '#111010',
              textDecoration: 'none',
            }}
          >
            {BRAND_NAME}
          </Link>
          <Link
            href="/dashboard"
            style={{ color: '#444240', fontSize: '0.88rem', textDecoration: 'none' }}
          >
            ← Dashboard
          </Link>
        </nav>
        <div
          style={{
            maxWidth: '600px',
            margin: '120px auto',
            textAlign: 'center',
            padding: '0 24px',
          }}
        >
          <h1
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontWeight: 400,
              fontSize: '1.8rem',
              color: '#c0392b',
              marginBottom: '12px',
            }}
          >
            Scan failed
          </h1>
          <p
            style={{
              fontWeight: 300,
              fontSize: '0.9rem',
              color: '#888580',
              lineHeight: '1.6',
              marginBottom: '32px',
            }}
          >
            Something went wrong while scanning {displayName}. Please try again or contact support.
          </p>
          <Link
            href="/dashboard"
            style={{
              display: 'inline-block',
              backgroundColor: '#111010',
              color: '#ffffff',
              padding: '12px 28px',
              fontWeight: 400,
              fontSize: '0.9rem',
              textDecoration: 'none',
            }}
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Normal report layout (complete)
  const knownLockedRows = lockedStubs.length + (previewFinding ? 1 : 0)

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f7f5f2',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Nav */}
      <nav
        className="report-nav"
        style={{
          borderBottom: '1px solid #e2deda',
          backgroundColor: '#ffffff',
          padding: '0 24px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Link href="/" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '1.1rem', color: '#111010', textDecoration: 'none' }}>
          {BRAND_NAME}
        </Link>
        <Link href="/dashboard" style={{ color: '#444240', fontSize: '0.88rem', textDecoration: 'none' }}>
          ← Dashboard
        </Link>
      </nav>

      <div className="report-inner" style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <h1
              className="report-title"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400, fontSize: '2.2rem', color: '#111010', margin: 0, lineHeight: '1.15', wordBreak: 'break-word' }}
            >
              {displayName}
            </h1>
            {risk && <RiskBadge severity={risk} />}
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {job.site_url && <span style={{ fontSize: '0.83rem', color: '#888580', wordBreak: 'break-all' }}>{job.site_url}</span>}
            {job.completed_at && <span style={{ fontSize: '0.83rem', color: '#888580' }}>Scanned {formatDate(job.completed_at)}</span>}
            {!job.completed_at && <span style={{ fontSize: '0.83rem', color: '#888580' }}>Started {formatDate(job.created_at)}</span>}
          </div>
        </div>

        {/* Summary bar — 2×2 on mobile */}
        <div className="report-summary" style={{ border: '1px solid #e2deda', backgroundColor: '#ffffff', display: 'flex', marginBottom: '36px' }}>
          {([
            { label: 'Critical', count: result.criticalCount, color: '#c0392b' },
            { label: 'High',     count: result.highCount,     color: '#e67e22' },
            { label: 'Medium',   count: result.mediumCount,   color: '#856404' },
            { label: 'Low',      count: result.lowCount,      color: '#5a9e6f' },
          ] as const).map((item, i) => (
            <div key={item.label} className="report-summary-cell" style={{ flex: 1, padding: '16px 20px', borderLeft: i > 0 ? '1px solid #e2deda' : 'none', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '1.8rem', color: item.count > 0 ? item.color : '#bbb8b4', fontWeight: 400, lineHeight: 1, marginBottom: '4px' }}>
                <CountUp to={item.count} duration={1.0} />
              </div>
              <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#888580' }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Main content */}
        {result.totalCount === 0 ? (
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2deda',
              padding: '48px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: '1.4rem',
                color: '#5a9e6f',
                marginBottom: '8px',
              }}
            >
              No vulnerabilities found
            </p>
            <p style={{ fontSize: '0.88rem', color: '#888580', fontWeight: 300 }}>
              Your codebase looks clean based on our analysis.
            </p>
          </div>
        ) : unlocked ? (
          /* Unlocked: full single-column layout */
          <div>
            <p
              style={{
                fontSize: '0.82rem',
                color: '#888580',
                fontWeight: 300,
                marginBottom: '20px',
              }}
            >
              {result.totalCount} {result.totalCount === 1 ? 'vulnerability' : 'vulnerabilities'}{' '}
              found
            </p>
            {unlockedFindingsList.map((f, i) => (
              <FindingCard key={f.id} finding={f} delay={i * 0.06} />
            ))}
          </div>
        ) : (
          /* Locked: two-column layout — stacks on mobile, paywall first */
          <div
            className="report-locked-grid"
            style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: '32px', alignItems: 'start' }}
          >
            {/* Findings column */}
            <div>
              <p style={{ fontSize: '0.82rem', color: '#888580', fontWeight: 300, marginBottom: '20px' }}>
                Showing 1 of {result.totalCount}{' '}
                {result.totalCount === 1 ? 'vulnerability' : 'vulnerabilities'} — unlock to see all
              </p>
              {previewFinding && <FindingCard finding={previewFinding} delay={0} />}
              {lockedStubs.map((f, i) => (
                <LockedFinding key={f.id} severity={f.severity} file={f.file} index={i} delay={i * 0.06} />
              ))}
              {result.totalCount > knownLockedRows &&
                Array.from({ length: Math.max(0, result.totalCount - knownLockedRows) }).map((_, i) => (
                  <LockedFinding key={`placeholder-${i}`} severity="medium" file="…" index={i} />
                ))}
            </div>

            {/* Paywall column */}
            <div className="report-paywall-col">
              <PaywallPanel scanId={params.scanId} totalCount={result.totalCount} criticalCount={result.criticalCount} highCount={result.highCount} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
