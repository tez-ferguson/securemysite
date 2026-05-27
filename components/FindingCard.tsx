'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Finding, SeverityLevel } from '../types'

interface FindingCardProps {
  finding: Finding
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

const EASE = [0.16, 1, 0.3, 1] as const

export default function FindingCard({ finding, delay = 0 }: FindingCardProps) {
  const [copied, setCopied] = useState(false)
  const [copyHover, setCopyHover] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(finding.fix_prompt ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const badgeStyle: React.CSSProperties = {
    ...severityBadgeStyle(finding.severity),
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: EASE }}
      style={{ backgroundColor: '#fff', border: '1px solid #e2deda', padding: '24px', marginBottom: '12px' }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={badgeStyle}>{finding.severity}</span>
          <span style={{ fontFamily: 'var(--sans)', fontWeight: 400, fontSize: '0.95rem', color: 'var(--ink)' }}>
            {finding.type}
          </span>
        </div>
        <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--ink3)' }}>
          {finding.file}:{finding.line}
        </span>
      </div>

      {/* Description */}
      <p style={{ fontFamily: 'var(--sans)', fontWeight: 300, fontSize: '0.9rem', color: 'var(--ink2)', lineHeight: '1.6', margin: '0 0 16px 0' }}>
        {finding.description}
      </p>

      {/* Code snippet */}
      <div style={{ backgroundColor: '#1a1a1a', padding: '12px 16px', marginBottom: '16px', overflowX: 'auto' }}>
        <pre style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#e8e6e3', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {finding.snippet}
        </pre>
      </div>

      {/* Fix prompt */}
      <div style={{ backgroundColor: '#faf9f7', border: '1px solid #e2deda', padding: '16px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontFamily: 'var(--sans)', fontSize: '0.72rem', fontWeight: 400, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Fix prompt — paste into Lovable / Cursor
          </span>
          <motion.button
            onClick={handleCopy}
            onMouseEnter={() => setCopyHover(true)}
            onMouseLeave={() => setCopyHover(false)}
            animate={{ scale: copied ? [1, 1.06, 1] : 1 }}
            transition={{ duration: 0.25 }}
            style={{ fontFamily: 'var(--sans)', fontSize: '0.75rem', fontWeight: 400, color: copied ? '#5a9e6f' : copyHover ? 'var(--ink)' : 'var(--ink2)', backgroundColor: '#fff', border: '1px solid #e2deda', padding: '4px 10px', cursor: 'pointer', transition: 'color 0.15s', outline: 'none' }}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </motion.button>
        </div>
        <p style={{ fontFamily: 'var(--sans)', fontWeight: 300, fontSize: '0.85rem', color: 'var(--ink2)', lineHeight: '1.65', margin: 0, userSelect: 'text' }}>
          {finding.fix_prompt}
        </p>
      </div>
    </motion.div>
  )
}
