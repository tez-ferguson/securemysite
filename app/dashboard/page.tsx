import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import type { ScanJob, SeverityLevel } from '../../types'
import DashboardRows from '../../components/DashboardRows'

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

type ScanStatus = 'locked' | 'report_unlocked' | 'fix_in_progress' | 'fix_complete'

interface ScanRow extends ScanJob {
  user_id: string
  total_count?: number
  critical_count?: number
  high_count?: number
  medium_count?: number
  low_count?: number
  unlocked?: boolean
  fix_status?: string
}

function riskLevel(row: ScanRow): SeverityLevel | null {
  if ((row.critical_count ?? 0) > 0) return 'critical'
  if ((row.high_count ?? 0) > 0) return 'high'
  if ((row.medium_count ?? 0) > 0) return 'medium'
  if ((row.low_count ?? 0) > 0) return 'low'
  return null
}

function scanStatus(row: ScanRow): ScanStatus {
  if (row.fix_status === 'complete') return 'fix_complete'
  if (
    row.fix_status === 'queued' ||
    row.fix_status === 'in_progress' ||
    row.fix_status === 'running'
  ) {
    return 'fix_in_progress'
  }
  if (row.unlocked) return 'report_unlocked'
  return 'locked'
}

function RiskBadge({ severity }: { severity: SeverityLevel }) {
  const map: Record<SeverityLevel, { bg: string; color: string }> = {
    critical: { bg: '#fff5f5', color: '#c0392b' },
    high: { bg: '#fff8f2', color: '#c05c1a' },
    medium: { bg: '#fffbee', color: '#856404' },
    low: { bg: '#f0faf4', color: '#2d6a4f' },
  }
  const s = map[severity]
  return (
    <span
      style={{
        backgroundColor: s.bg,
        color: s.color,
        border: `1px solid ${s.color}`,
        fontSize: '0.65rem',
        fontVariant: 'small-caps',
        fontWeight: 600,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        padding: '2px 7px',
        display: 'inline-block',
      }}
    >
      {severity}
    </span>
  )
}

function StatusLabel({ status }: { status: ScanStatus }) {
  const map: Record<ScanStatus, { label: string; color: string }> = {
    locked: { label: 'Locked', color: '#bbb8b4' },
    report_unlocked: { label: 'Report unlocked', color: '#5a9e6f' },
    fix_in_progress: { label: 'Fix in progress', color: '#e67e22' },
    fix_complete: { label: 'Fix complete', color: '#5a9e6f' },
  }
  const s = map[status]
  return (
    <span
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 300,
        fontSize: '0.85rem',
        color: s.color,
      }}
    >
      {s.label}
    </span>
  )
}

export default async function DashboardPage() {
  const supabaseAuth = createServerSupabaseClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  const userId = user?.id
  if (!userId) redirect('/sign-in')

  const supabase = createServiceClient()

  const { data: scans } = await supabase
    .from('scan_jobs')
    .select(
      `
      *,
      scan_findings (
        total_count,
        critical_count,
        high_count,
        medium_count,
        low_count
      ),
      scan_unlocks (
        id,
        unlock_type
      )
    `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const rows: ScanRow[] = (scans ?? []).map((s: Record<string, unknown>) => {
    const sfRaw = s.scan_findings
    const sf = Array.isArray(sfRaw) ? sfRaw[0] : sfRaw
    const uRaw = s.scan_unlocks
    const unlockRows = Array.isArray(uRaw) ? uRaw : uRaw ? [uRaw] : []
    const unlocked = unlockRows.length > 0

    const { scan_findings: _a, scan_unlocks: _b, ...rest } = s
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const job = rest as any

    return {
      ...job,
      user_id: userId,
      total_count: (sf as { total_count?: number } | undefined)?.total_count ?? 0,
      critical_count: (sf as { critical_count?: number } | undefined)?.critical_count ?? 0,
      high_count: (sf as { high_count?: number } | undefined)?.high_count ?? 0,
      medium_count: (sf as { medium_count?: number } | undefined)?.medium_count ?? 0,
      low_count: (sf as { low_count?: number } | undefined)?.low_count ?? 0,
      unlocked,
      fix_status: (job.fix_status as string | null | undefined) ?? undefined,
    } as ScanRow
  })

  const hasScans = rows.length > 0

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
          }}
        >
          VibeSec
        </Link>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link
            href="/pricing"
            style={{ color: '#444240', fontSize: '0.88rem', textDecoration: 'none' }}
          >
            Pricing
          </Link>
          <Link
            href="/"
            style={{
              backgroundColor: '#111010',
              color: '#ffffff',
              padding: '8px 18px',
              fontSize: '0.88rem',
              textDecoration: 'none',
            }}
          >
            New scan
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '56px 24px 96px' }}>
        {/* Page heading */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '40px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <h1
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontWeight: 400,
              fontSize: '2.2rem',
              color: '#111010',
              margin: 0,
            }}
          >
            Your scans
          </h1>
          {hasScans && (
            <Link
              href="/"
              style={{
                backgroundColor: '#111010',
                color: '#ffffff',
                padding: '10px 20px',
                fontSize: '0.88rem',
                textDecoration: 'none',
              }}
            >
              + New scan
            </Link>
          )}
        </div>

        {/* Empty state */}
        {!hasScans && (
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2deda',
              padding: '72px 48px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: '1.4rem',
                color: '#111010',
                margin: '0 0 8px 0',
              }}
            >
              No scans yet
            </p>
            <p
              style={{
                fontWeight: 300,
                fontSize: '0.88rem',
                color: '#888580',
                margin: '0 0 32px 0',
              }}
            >
              Scan your first app to find security vulnerabilities.
            </p>
            <Link
              href="/"
              style={{
                display: 'inline-block',
                backgroundColor: '#111010',
                color: '#ffffff',
                padding: '12px 28px',
                fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              Scan your first app →
            </Link>
          </div>
        )}

        {/* Scans table */}
        {hasScans && (
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2deda',
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 80px 90px 130px 100px',
                padding: '12px 24px',
                borderBottom: '1px solid #e2deda',
                backgroundColor: '#faf9f7',
                gap: '16px',
              }}
            >
              {['Repo', 'Scanned', 'Findings', 'Risk', 'Status', 'Action'].map((col) => (
                <span
                  key={col}
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.72rem',
                    fontWeight: 400,
                    color: '#888580',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {col}
                </span>
              ))}
            </div>

            <DashboardRows rows={rows} />
          </div>
        )}
      </div>
    </div>
  )
}
