'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface EmailCaptureModalProps {
  siteUrl: string
  onClose: () => void
  onSubmit: (email: string) => void
  loading?: boolean
}

const SPRING = { type: 'spring' as const, mass: 0.6, damping: 24, stiffness: 260 }
const EASE = [0.16, 1, 0.3, 1] as const

export default function EmailCaptureModal({
  siteUrl,
  onClose,
  onSubmit,
  loading = false,
}: EmailCaptureModalProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError(true)
      return
    }
    setError(false)
    onSubmit(trimmed)
  }

  const displayHost = siteUrl.replace(/^https?:\/\//i, '')

  return (
    <AnimatePresence>
      <motion.div
        key="email-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(17,16,16,0.45)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <motion.div
          key="email-panel"
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.98 }}
          transition={SPRING}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#fff',
            width: '100%',
            maxWidth: '440px',
            padding: 'clamp(28px, 5vw, 40px)',
            border: '1px solid #e2deda',
          }}
        >
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.35, ease: EASE }}
            style={{
              fontSize: '0.68rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#888580',
              marginBottom: '12px',
            }}
          >
            Scanning {displayHost}
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: EASE }}
            style={{
              fontFamily: 'var(--serif)',
              fontSize: '1.5rem',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
              marginBottom: '10px',
              lineHeight: 1.2,
            }}
          >
            Where should we send your report?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            style={{
              fontSize: '0.88rem',
              color: 'var(--ink3)',
              fontWeight: 300,
              lineHeight: 1.55,
              marginBottom: '28px',
            }}
          >
            In case we lose you, we&apos;ll email you the link so you can come back any time.
          </motion.p>

          <form onSubmit={handleSubmit}>
            <motion.label
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.35 }}
              style={{ display: 'block', marginBottom: '16px' }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  color: 'var(--ink4)',
                  marginBottom: '8px',
                  letterSpacing: '0.04em',
                }}
              >
                Email address
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(false)
                }}
                placeholder="you@company.com"
                autoFocus
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: `1px solid ${error ? '#c0392b' : '#e2deda'}`,
                  fontFamily: 'var(--sans)',
                  fontSize: '0.95rem',
                  fontWeight: 300,
                  outline: 'none',
                  background: '#faf9f7',
                }}
              />
            </motion.label>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.35 }}
              style={{ position: 'relative', overflow: 'hidden' }}
            >
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
                type="submit"
                disabled={loading}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  width: '100%',
                  padding: '14px 20px',
                  background: '#111010',
                  color: '#fff',
                  border: 'none',
                  fontFamily: 'var(--sans)',
                  fontSize: '0.95rem',
                  fontWeight: 400,
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Starting scan…' : 'Start free scan →'}
              </button>
            </motion.div>
          </form>

          <motion.button
            type="button"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            disabled={loading}
            style={{
              marginTop: '16px',
              background: 'none',
              border: 'none',
              fontFamily: 'var(--sans)',
              fontSize: '0.8rem',
              color: 'var(--ink4)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Cancel
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
