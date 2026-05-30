'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MagneticButton } from './motion/MagneticButton'

interface PassivePaywallPanelProps {
  token: string
  totalCount: number
  criticalCount: number
}

const EASE = [0.16, 1, 0.3, 1] as const

export default function PassivePaywallPanel({
  token,
  totalCount,
  criticalCount,
}: PassivePaywallPanelProps) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/passive-scan/${token}/checkout`, { method: 'POST' })
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

  return (
    <MagneticButton strength={3} style={{ display: 'block' }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
        style={{
          backgroundColor: '#fff',
          border: '1px solid #e2deda',
          padding: '32px 28px',
          position: 'sticky',
          top: '96px',
        }}
      >
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <h2
          style={{
            fontFamily: 'var(--serif)',
            fontWeight: 400,
            fontSize: '1.35rem',
            color: 'var(--ink)',
            lineHeight: '1.3',
            margin: '0 0 10px 0',
          }}
        >
          {totalCount} {totalCount === 1 ? 'issue' : 'issues'} found on your site
        </h2>

        {criticalCount > 0 ? (
          <p
            style={{
              fontFamily: 'var(--sans)',
              fontWeight: 400,
              fontSize: '0.85rem',
              color: '#c0392b',
              margin: '0 0 24px 0',
            }}
          >
            Including {criticalCount} critical {criticalCount === 1 ? 'issue' : 'issues'}
          </p>
        ) : (
          <div style={{ marginBottom: '24px' }} />
        )}

        <div style={{ position: 'relative', overflow: 'hidden', background: '#111010' }}>
          <motion.div
            initial={{ scaleX: 0 }}
            whileHover={!loading ? { scaleX: 1 } : {}}
            transition={{ duration: 0.28, ease: EASE }}
            style={{
              position: 'absolute',
              inset: 0,
              background: '#2a2928',
              transformOrigin: 'left',
              zIndex: 0,
            }}
          />
          <button
            onClick={handleCheckout}
            disabled={loading}
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'block',
              width: '100%',
              background: 'transparent',
              color: '#fff',
              border: 'none',
              padding: '14px 20px',
              fontFamily: 'var(--sans)',
              fontWeight: 400,
              fontSize: '0.95rem',
              cursor: loading ? 'wait' : 'pointer',
              textAlign: 'center',
            }}
          >
            {loading ? (
              <span
                style={{
                  display: 'inline-block',
                  width: 14,
                  height: 14,
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                  verticalAlign: 'middle',
                  marginRight: 8,
                }}
              />
            ) : null}
            Unlock Report — $29
          </button>
        </div>
        <p
          style={{
            fontFamily: 'var(--sans)',
            fontWeight: 300,
            fontSize: '0.78rem',
            color: 'var(--ink3)',
            margin: '12px 0 0 0',
            textAlign: 'center',
          }}
        >
          Full details + AI fix prompts for hosting & headers
        </p>

        <p
          style={{
            fontFamily: 'var(--sans)',
            fontWeight: 300,
            fontSize: '0.72rem',
            color: 'var(--ink4)',
            margin: '20px 0 0 0',
            textAlign: 'center',
            lineHeight: '1.5',
          }}
        >
          Secure payment via Stripe. Instant access after payment.
        </p>
      </motion.div>
    </MagneticButton>
  )
}
