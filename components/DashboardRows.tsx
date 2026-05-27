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
  report_unlocked: { label: 'Report unlocked', color: '#5a9e6f' },
  fix_in_progress: { label: 'Fix in progress', color: '#e67e22' },
  fix_complete:    { label: 'Fix complete',     color: '#5a9e6f' },
}

const EASE = [0.16, 1, 0.3, 1] as const

export default function DashboardRows({ rows }: { rows: ScanRow[] }) {
  return (
    <>
      {rows.map((row, i) => {
        const risk = riskLevel(row)
        const status = scanStatus(row)
        const displayName = row.repo_name ?? row.repo_url ?? row.site_url ?? 'Unnamed scan'
        const isRunning = row.status === 'queued' || row.status === 'running'
        const isFailed = row.status === 'failed'
        const { label: statusLabel, color: statusColor } = STATUS_MAP[status]

        return (
          <motion.div
            key={row.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.04, ease: EASE }}
            style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 90px 130px 100px', padding: '16px 24px', borderBottom: i < rows.length - 1 ? '1px solid #e2deda' : 'none', alignItems: 'center', gap: '16px' }}
          >
            {/* Repo */}
            <div>
              <div style={{ fontFamily: 'var(--sans)', fontWeight: 400, fontSize: '0.9rem', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </div>
              {row.site_url && (
                <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#bbb8b4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.site_url}
                </div>
              )}
            </div>

            {/* Scanned */}
            <span style={{ fontSize: '0.83rem', color: 'var(--ink3)', fontWeight: 300 }}>
              {formatDate(row.completed_at ?? row.created_at)}
            </span>

            {/* Count */}
            <span style={{ fontSize: '0.88rem', color: isRunning ? '#bbb8b4' : (row.total_count ?? 0) > 0 ? '#c0392b' : '#5a9e6f', fontWeight: 300 }}>
              {isRunning ? '—' : (row.total_count ?? 0)}
            </span>

            {/* Risk */}
            <div>
              {isRunning && <span style={{ fontSize: '0.78rem', color: '#bbb8b4' }}>Scanning…</span>}
              {isFailed && <span style={{ fontSize: '0.78rem', color: '#c0392b' }}>Failed</span>}
              {!isRunning && !isFailed && risk && <RiskBadge severity={risk} />}
              {!isRunning && !isFailed && !risk && <span style={{ fontSize: '0.78rem', color: '#5a9e6f' }}>Clean</span>}
            </div>

            {/* Status */}
            <div>
              {isRunning
                ? <span style={{ fontSize: '0.85rem', color: '#e67e22', fontWeight: 300 }}>Scanning…</span>
                : isFailed
                ? <span style={{ fontSize: '0.85rem', color: '#c0392b', fontWeight: 300 }}>Failed</span>
                : <span style={{ fontSize: '0.85rem', color: statusColor, fontWeight: 300 }}>{statusLabel}</span>
              }
            </div>

            {/* Action */}
            <div>
              <Link href={`/report/${row.id}`} style={{ fontSize: '0.85rem', color: 'var(--ink)', textDecoration: 'none', fontWeight: 400, transition: 'opacity 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.6')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                View report →
              </Link>
            </div>
          </motion.div>
        )
      })}
    </>
  )
}
