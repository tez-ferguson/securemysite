'use client'

import { motion } from 'framer-motion'
import type { SeverityLevel } from '../types'

interface LockedFindingProps {
  severity: SeverityLevel
  file: string
  index: number
  delay?: number
}

function severityBadgeStyle(severity: SeverityLevel): React.CSSProperties {
  switch (severity) {
    case 'critical': return { color: '#c0392b', border: '1px solid #c0392b', backgroundColor: '#fff5f5' }
    case 'high':     return { color: '#c05c1a', border: '1px solid #e67e22', backgroundColor: '#fff8f2' }
    case 'medium':   return { color: '#856404', border: '1px solid #d4ac0d', backgroundColor: '#fffbee' }
    case 'low':      return { color: '#2d6a4f', border: '1px solid #5a9e6f', backgroundColor: '#f0faf4' }
  }
}

const LockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle' }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const EASE = [0.16, 1, 0.3, 1] as const

const FILLER = [
  'This vulnerability exposes sensitive data to unauthorized users and allows elevated privileges within the application.',
  'A security misconfiguration was detected that allows unintended access to protected resources and private data.',
]

const CODE_FILLER = [
  "const apiKey = 'sk_live_xxxxxxxxxxxxxxxxxxxxxxxx'",
  'export async function handler(req) { return db.query(req.body.filter) }',
]

export default function LockedFinding({ severity, file, index, delay = 0 }: LockedFindingProps) {
  const badgeStyle: React.CSSProperties = {
    ...severityBadgeStyle(severity),
    display: 'inline-block',
    fontSize: '0.65rem',
    fontVariant: 'small-caps',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '2px 8px',
    lineHeight: '1.6',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: EASE }}
      className="locked-shimmer"
      style={{ backgroundColor: '#f7f5f2', border: '1px solid #e2deda', padding: '20px 24px', marginBottom: '8px', position: 'relative', overflow: 'hidden' }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={badgeStyle}>{severity}</span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#888580' }}>{file}</span>
        </div>
        <span style={{ fontFamily: 'var(--sans)', fontSize: '0.75rem', color: '#bbb8b4', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <LockIcon /> <span style={{ opacity: 0.5 }}>View details</span>
        </span>
      </div>

      {/* Blurred content */}
      <div style={{ filter: 'blur(4px)', userSelect: 'none', pointerEvents: 'none' }}>
        <p style={{ fontFamily: 'var(--sans)', fontWeight: 300, fontSize: '0.9rem', color: '#444240', lineHeight: '1.6', margin: '0 0 10px 0' }}>
          {FILLER[index % 2]}
        </p>
        <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#888580', backgroundColor: '#1a1a1a', padding: '10px 14px' }}>
          <span style={{ color: '#e8e6e3' }}>{CODE_FILLER[index % 2]}</span>
        </div>
      </div>
    </motion.div>
  )
}
