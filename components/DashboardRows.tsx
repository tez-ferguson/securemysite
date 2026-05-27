'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { SeverityLevel } from '../types'

type ScanStatus = 'locked' | 'report_unlocked' | 'fix_in_progress' | 'fix_complete'

interface ScanRow {
  id: string
  repo_name?: string | null
  repo_url?: string
  site_url?: string | null
  status: string
  created_at: string
  completed_at?: string | null
  fix_status?: string | null
  total_count?: number
  critical_count?: number
  high_count?: number
  medium_count?: number
  low_count?: number
  unlocked?: boolean
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
  if (row.fix_status === 'queued' || row.fix_status === 'in_progress' || row.fix_status === 'running') return 'fix_in_progress'
  if (row.unlocked) return 'report_unlocked'
  return 'locked'
}

const RISK_MAP: Record<SeverityLevel, { bg: string; color: string }> = {
  critical: { bg: '#fff5f5', color: '#c0392b' },
  high:     { bg: '#fff8f2', color: '#c05c1a' },
  medium:   { bg: '#fffbee', color: '#856404' },
  low:      { bg: '#f0faf4', color: '#2d6a4f' },
}

function RiskBadge({ severity }: { severity: SeverityLevel }) {
  const s = RISK_MAP[severity]
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.color}`, fontSize: '0.65rem', fontVariant: 'small-caps', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 7px', display: 'inline-block' }}
    >
      {severity}
    </motion.span>
  )
}

const STATUS_MAP: Record<ScanStatus, { label: string; color: string }> = {
  locked:          { label: 'Locked',          color: '#bbb8b4' },
  report_unlocked: { label: 'Unlocked',         color: '#5a9e6f' },
  fix_in_progress: { label: 'Fix in progress',  color: '#e67e22' },
  fix_complete:    { label: 'Fix complete',      color: '#5a9e6f' },
}

const EASE = [0.16, 1, 0.3, 1] as const

const ROW_CSS = `
  .dash-row-desktop {
    display: grid;
    grid-template-columns: 2fr 1fr 70px 90px 120px 100px;
    padding: 16px 24px;
    align-items: center;
    gap: 16px;
  }
  .dash-row-mobile {
    display: none;
    padding: 16px 20px;
    flex-direction: column;
    gap: 8px;
  }
  @media (max-width: 680px) {
    .dash-row-desktop { display: none !important; }
    .dash-row-mobile  { display: flex !important; }
    .dash-header      { display: none !important; }
  }
`

export default function DashboardRows({ rows }: { rows: ScanRow[] }) {
  return (
    <>
      <style>{ROW_CSS}</style>
      {rows.map((row, i) => {
        const risk = riskLevel(row)
        const status = scanStatus(row)
        const displayName = row.repo_name ?? row.repo_url ?? row.site_url ?? 'Unnamed scan'
        const isRunning = row.status === 'queued' || row.status === 'running'
        const isFailed = row.status === 'failed'
        const { label: statusLabel, color: statusColor } = STATUS_MAP[status]
        const borderBottom = i < rows.length - 1 ? '1px solid #e2deda' : 'none'

        return (
          <motion.div
            key={row.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.04, ease: EASE }}
          >
            {/* ── Desktop row ── */}
            <div className="dash-row-desktop" style={{ borderBottom }}>
              <div>
                <div style={{ fontFamily: 'var(--sans)', fontWeight: 400, fontSize: '0.9rem', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}
                </div>
                {row.site_url && (
                  <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#bbb8b4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.site_url}
                  </div>
                )}
              </div>

              <span style={{ fontSize: '0.82rem', color: 'var(--ink3)', fontWeight: 300 }}>
                {formatDate(row.completed_at ?? row.created_at)}
              </span>

              <span style={{ fontSize: '0.88rem', color: isRunning ? '#bbb8b4' : (row.total_count ?? 0) > 0 ? '#c0392b' : '#5a9e6f', fontWeight: 300 }}>
                {isRunning ? '—' : (row.total_count ?? 0)}
              </span>

              <div>
                {isRunning && <span style={{ fontSize: '0.75rem', color: '#bbb8b4' }}>Scanning…</span>}
                {isFailed && <span style={{ fontSize: '0.75rem', color: '#c0392b' }}>Failed</span>}
                {!isRunning && !isFailed && risk && <RiskBadge severity={risk} />}
                {!isRunning && !isFailed && !risk && <span style={{ fontSize: '0.75rem', color: '#5a9e6f' }}>Clean</span>}
              </div>

              <span style={{ fontSize: '0.82rem', color: isRunning ? '#e67e22' : isFailed ? '#c0392b' : statusColor, fontWeight: 300 }}>
                {isRunning ? 'Scanning…' : isFailed ? 'Failed' : statusLabel}
              </span>

              <Link href={`/report/${row.id}`} style={{ fontSize: '0.85rem', color: 'var(--ink)', textDecoration: 'none', fontWeight: 400, transition: 'opacity 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.55')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                View →
              </Link>
            </div>

            {/* ── Mobile card ── */}
            <div className="dash-row-mobile" style={{ borderBottom }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--sans)', fontWeight: 400, fontSize: '0.92rem', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayName}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#bbb8b4', marginTop: '2px' }}>
                    {formatDate(row.completed_at ?? row.created_at)}
                  </div>
                </div>
                {!isRunning && !isFailed && risk && <RiskBadge severity={risk} />}
                {isRunning && <span style={{ fontSize: '0.72rem', color: '#e67e22', flexShrink: 0 }}>Scanning…</span>}
                {isFailed && <span style={{ fontSize: '0.72rem', color: '#c0392b', flexShrink: 0 }}>Failed</span>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  {!isRunning && (
                    <span style={{ fontSize: '0.82rem', color: (row.total_count ?? 0) > 0 ? '#c0392b' : '#5a9e6f', fontFamily: 'var(--serif)' }}>
                      {row.total_count ?? 0} {(row.total_count ?? 0) === 1 ? 'issue' : 'issues'}
                    </span>
                  )}
                  <span style={{ fontSize: '0.78rem', color: isRunning ? '#e67e22' : isFailed ? '#c0392b' : statusColor, fontWeight: 300 }}>
                    {isRunning ? 'Scanning…' : isFailed ? 'Failed' : statusLabel}
                  </span>
                </div>
                <Link href={`/report/${row.id}`} style={{ fontSize: '0.85rem', color: 'var(--ink)', textDecoration: 'none', fontWeight: 400 }}>
                  View report →
                </Link>
              </div>
            </div>
          </motion.div>
        )
      })}
    </>
  )
}
