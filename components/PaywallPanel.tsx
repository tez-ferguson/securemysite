'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MagneticButton } from './motion/MagneticButton'

interface PaywallPanelProps {
  scanId: string
  totalCount: number
  criticalCount: number
  highCount: number
}

const EASE = [0.16, 1, 0.3, 1] as const

function InkFillButton({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: '#111010', cursor: disabled ? 'not-allowed' : 'pointer' }}>
      <motion.div
        initial={{ scaleX: 0 }}
        whileHover={!disabled ? { scaleX: 1 } : {}}
        transition={{ duration: 0.28, ease: EASE }}
        style={{ position: 'absolute', inset: 0, background: '#2a2928', transformOrigin: 'left', zIndex: 0 }}
      />
      <button
        onClick={onClick}
        disabled={disabled}
        style={{ position: 'relative', zIndex: 1, display: 'block', width: '100%', background: 'transparent', color: '#fff', border: 'none', padding: '14px 20px', fontFamily: 'var(--sans)', fontWeight: 400, fontSize: '0.95rem', cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'center' }}
      >
        {children}
      </button>
    </div>
  )
}

function OutlineInkFillButton({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: '#fff', border: '1px solid #111010', cursor: disabled ? 'not-allowed' : 'pointer' }}>
      <motion.div
        initial={{ scaleX: 0 }}
        whileHover={!disabled ? { scaleX: 1 } : {}}
        transition={{ duration: 0.28, ease: EASE }}
        style={{ position: 'absolute', inset: 0, background: '#111010', transformOrigin: 'left', zIndex: 0 }}
      />
      <button
        onClick={onClick}
        disabled={disabled}
        style={{ position: 'relative', zIndex: 1, display: 'block', width: '100%', background: 'transparent', color: 'inherit', border: 'none', padding: '14px 20px', fontFamily: 'var(--sans)', fontWeight: 400, fontSize: '0.95rem', cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'center', mixBlendMode: 'difference' as const }}
      >
        {children}
      </button>
    </div>
  )
}

export default function PaywallPanel({ scanId, totalCount, criticalCount }: PaywallPanelProps) {
  const [reportLoading, setReportLoading] = useState(false)
  const [agentLoading, setAgentLoading] = useState(false)

  const handleCheckout = async (type: 'report' | 'agent_fix', setLoading: (v: boolean) => void) => {
    setLoading(true)
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId, type }),
      })
      const data = await res.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        setLoading(false)
      }
    } catch {
      setLoading(false)
    }
  }

  const busy = reportLoading || agentLoading

  return (
    <MagneticButton strength={3} style={{ display: 'block' }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
        style={{ backgroundColor: '#fff', border: '1px solid #e2deda', padding: '32px 28px', position: 'sticky', top: '96px' }}
      >
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '1.35rem', color: 'var(--ink)', lineHeight: '1.3', margin: '0 0 10px 0' }}>
          You have {totalCount} {totalCount === 1 ? 'vulnerability' : 'vulnerabilities'} in your codebase
        </h2>

        {criticalCount > 0 && (
          <p style={{ fontFamily: 'var(--sans)', fontWeight: 400, fontSize: '0.85rem', color: '#c0392b', margin: '0 0 24px 0' }}>
            Including {criticalCount} critical {criticalCount === 1 ? 'issue' : 'issues'}
          </p>
        )}
        {criticalCount === 0 && <div style={{ marginBottom: '24px' }} />}

        {/* $29 */}
        <InkFillButton onClick={() => handleCheckout('report', setReportLoading)} disabled={busy}>
          {reportLoading
            ? <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', verticalAlign: 'middle', marginRight: 8 }} />
            : null}
          Unlock Report — $29
        </InkFillButton>
        <p style={{ fontFamily: 'var(--sans)', fontWeight: 300, fontSize: '0.78rem', color: 'var(--ink3)', margin: '0 0 16px 0', textAlign: 'center' }}>
          Full details + AI fix prompts
        </p>

        <div style={{ borderTop: '1px solid #e2deda', marginBottom: '16px' }} />

        {/* $149 */}
        <div style={{ color: agentLoading ? '#888580' : '#111010' }}>
          <OutlineInkFillButton onClick={() => handleCheckout('agent_fix', setAgentLoading)} disabled={busy}>
            {agentLoading
              ? <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(17,16,16,0.2)', borderTopColor: '#111010', borderRadius: '50%', animation: 'spin 0.7s linear infinite', verticalAlign: 'middle', marginRight: 8 }} />
              : null}
            Agent Fix — $149
          </OutlineInkFillButton>
        </div>
        <p style={{ fontFamily: 'var(--sans)', fontWeight: 300, fontSize: '0.78rem', color: 'var(--ink3)', margin: '0 0 24px 0', textAlign: 'center' }}>
          We fix it and open a PR
        </p>

        <p style={{ fontFamily: 'var(--sans)', fontWeight: 300, fontSize: '0.72rem', color: 'var(--ink4)', margin: 0, textAlign: 'center', lineHeight: '1.5' }}>
          Secure payment via Stripe. Instant access after payment.
        </p>
      </motion.div>
    </MagneticButton>
  )
}
