'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface PassivePaywallPanelProps {
  token: string
  totalCount: number
  criticalCount: number
  onConnectGithub: () => void
}

const EASE = [0.16, 1, 0.3, 1] as const

function InkFillButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void
  disabled: boolean
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: '#111010',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <motion.div
        initial={{ scaleX: 0 }}
        whileHover={!disabled ? { scaleX: 1 } : {}}
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
        type="button"
        onClick={onClick}
        disabled={disabled}
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
          cursor: disabled ? 'wait' : 'pointer',
          textAlign: 'center',
        }}
      >
        {children}
      </button>
    </div>
  )
}

function OutlineInkFillButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void
  disabled: boolean
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: '#fff',
        border: '1px solid #111010',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <motion.div
        initial={{ scaleX: 0 }}
        whileHover={!disabled ? { scaleX: 1 } : {}}
        transition={{ duration: 0.28, ease: EASE }}
        style={{
          position: 'absolute',
          inset: 0,
          background: '#111010',
          transformOrigin: 'left',
          zIndex: 0,
        }}
      />
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'block',
          width: '100%',
          background: 'transparent',
          color: 'inherit',
          border: 'none',
          padding: '14px 20px',
          fontFamily: 'var(--sans)',
          fontWeight: 400,
          fontSize: '0.95rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'center',
          mixBlendMode: 'difference' as const,
        }}
      >
        {children}
      </button>
    </div>
  )
}

export default function PassivePaywallPanel({
  token,
  totalCount,
  criticalCount,
  onConnectGithub,
}: PassivePaywallPanelProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/passive-scan/${token}/checkout`, { method: 'POST' })
      let data: { checkoutUrl?: string; error?: string } = {}
      try {
        data = await res.json()
      } catch {
        data = {}
      }

      if (res.ok && data.checkoutUrl) {
        window.location.assign(data.checkoutUrl)
        return
      }

      const message =
        data.error ??
        (res.status === 400
          ? 'Your scan is still finishing — wait a moment and try again.'
          : res.status === 503
            ? 'Payments are not configured on this server.'
            : 'Could not start checkout. Please try again.')
      setError(message)
    } catch {
      setError('Network error — check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      className="passive-paywall-col passive-paywall-sticky"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
      style={{
        backgroundColor: '#fff',
        border: '1px solid #e2deda',
        padding: 'clamp(24px, 5vw, 32px) clamp(20px, 4vw, 28px)',
        position: 'sticky',
        top: '96px',
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <p
        style={{
          fontSize: '0.68rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--ink4)',
          margin: '0 0 12px 0',
        }}
      >
        Step 1 — unlock this report
      </p>

      <h2
        style={{
          fontFamily: 'var(--serif)',
          fontWeight: 400,
          fontSize: 'clamp(1.2rem, 4vw, 1.35rem)',
          color: 'var(--ink)',
          lineHeight: 1.3,
          margin: '0 0 10px 0',
        }}
      >
        Pay $29 to unlock all {totalCount} {totalCount === 1 ? 'issue' : 'issues'}
      </h2>

      {criticalCount > 0 ? (
        <p
          style={{
            fontFamily: 'var(--sans)',
            fontWeight: 400,
            fontSize: '0.85rem',
            color: '#c0392b',
            margin: '0 0 16px 0',
          }}
        >
          Including {criticalCount} critical {criticalCount === 1 ? 'issue' : 'issues'}
        </p>
      ) : (
        <div style={{ marginBottom: '16px' }} />
      )}

      <p
        style={{
          fontFamily: 'var(--sans)',
          fontWeight: 300,
          fontSize: '0.88rem',
          color: 'var(--ink3)',
          lineHeight: 1.55,
          margin: '0 0 20px 0',
        }}
      >
        See every finding from this external scan — SSL, headers, DNS, hosting — with AI fix prompts
        you can paste into Lovable, Bolt, or Cursor.
      </p>

      <InkFillButton onClick={handleCheckout} disabled={loading}>
        {loading ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span
              style={{
                display: 'inline-block',
                width: 14,
                height: 14,
                border: '2px solid rgba(255,255,255,0.4)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }}
            />
            Opening checkout…
          </span>
        ) : (
          `Pay $29 — unlock all ${totalCount} issues`
        )}
      </InkFillButton>

      {error ? (
        <p
          role="alert"
          style={{
            fontFamily: 'var(--sans)',
            fontSize: '0.82rem',
            color: '#c0392b',
            margin: '12px 0 0 0',
            lineHeight: 1.45,
          }}
        >
          {error}
        </p>
      ) : (
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
          Secure payment via Stripe · instant access
        </p>
      )}

      <div
        style={{
          marginTop: '28px',
          paddingTop: '24px',
          borderTop: '1px solid #e2deda',
        }}
      >
        <p
          style={{
            fontSize: '0.68rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--ink4)',
            margin: '0 0 12px 0',
          }}
        >
          Step 2 — full codebase scan
        </p>
        <p
          style={{
            fontFamily: 'var(--sans)',
            fontWeight: 300,
            fontSize: '0.88rem',
            color: 'var(--ink3)',
            lineHeight: 1.55,
            margin: '0 0 16px 0',
          }}
        >
          Connect GitHub to scan your repository — exposed secrets, vulnerable dependencies, and
          code-level vulnerabilities across the whole codebase.
        </p>
        <OutlineInkFillButton onClick={onConnectGithub} disabled={loading}>
          Connect GitHub for code scan →
        </OutlineInkFillButton>
      </div>
    </motion.div>
  )
}
