'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface GitHubModalProps {
  siteUrl: string
  onClose: () => void
  onConfirm: () => void
  onDemo: () => void
}

const GITHUB_ICON_PATH =
  'M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z'

const PERMISSIONS = [
  {
    tick: true,
    color: '#5a9e6f',
    label: 'Read access to code',
    desc: 'Read-only access to your repository source files for scanning',
  },
  {
    tick: true,
    color: '#5a9e6f',
    label: 'Read access to metadata',
    desc: 'Repository name, visibility, and dependency manifests',
  },
  {
    tick: false,
    color: '#bbb8b4',
    label: 'No write access',
    desc: 'We will never push commits, open PRs, or modify your code',
  },
  {
    tick: false,
    color: '#bbb8b4',
    label: 'No access to other repos',
    desc: 'Only the single repository you select — nothing else',
  },
]

const SPRING = { type: 'spring' as const, mass: 0.6, damping: 24, stiffness: 260 }
const EASE_EXPO = [0.16, 1, 0.3, 1] as const

const CHECK_VARIANT = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1, transition: { duration: 0.4, ease: EASE_EXPO } },
}

const PERM_STAGGER = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.3 } },
}

const PERM_ITEM = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE_EXPO } },
}

export default function GitHubModal({ siteUrl, onClose, onConfirm, onDemo }: GitHubModalProps) {
  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        key="gh-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(17,16,16,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      >
        {/* Panel */}
        <motion.div
          key="gh-panel"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={SPRING}
          onClick={(e) => e.stopPropagation()}
          style={{ background: '#fff', width: '100%', maxWidth: '480px', border: '1px solid #e2deda', position: 'relative' }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: '1.1rem', color: '#bbb8b4', cursor: 'pointer', padding: '4px 8px', lineHeight: 1, fontFamily: 'var(--sans)', transition: 'color 0.15s' }}
            onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.color = '#888580')}
            onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.color = '#bbb8b4')}
          >
            ×
          </button>

          {/* Top */}
          <div style={{ padding: '36px 40px 28px', borderBottom: '1px solid #e2deda' }}>
            <p style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#bbb8b4', marginBottom: '14px' }}>
              Step 2 of 2
            </p>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.9rem', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: '12px' }}>
              Connect your GitHub repository
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--ink3)', lineHeight: 1.65, fontWeight: 300 }}>
              We need <strong style={{ color: 'var(--ink)', fontWeight: 400 }}>read-only access</strong> to
              your repository to scan for vulnerabilities. We never store your code — it&apos;s
              scanned in an isolated container and deleted immediately after.
            </p>
          </div>

          {/* Target */}
          <div style={{ margin: '0 40px', padding: '14px 0', borderBottom: '1px solid #e2deda', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem' }}>
            <span style={{ color: '#bbb8b4', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>Target:</span>
            <span style={{ color: 'var(--ink)', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {siteUrl || 'yourapp.vercel.app'}
            </span>
          </div>

          {/* Permissions */}
          <div style={{ padding: '20px 40px 0' }}>
            <p style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#bbb8b4', marginBottom: '14px' }}>
              Permissions requested
            </p>
            <motion.div variants={PERM_STAGGER} initial="hidden" animate="visible">
              {PERMISSIONS.map((perm, i) => (
                <motion.div
                  key={i}
                  variants={PERM_ITEM}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderBottom: i < PERMISSIONS.length - 1 ? '1px solid #e2deda' : 'none' }}
                >
                  <span style={{ width: '16px', flexShrink: 0, marginTop: '2px' }}>
                    {perm.tick ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={perm.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <motion.polyline points="20 6 9 17 4 12" variants={CHECK_VARIANT} />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={perm.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#888580', lineHeight: 1.5, fontWeight: 300 }}>
                    {perm.desc}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Footer */}
          <div style={{ padding: '24px 40px 32px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Ink-fill CTA */}
            <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--ink)', cursor: 'pointer' }}>
              <motion.div
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.28, ease: EASE_EXPO }}
                style={{ position: 'absolute', inset: 0, background: '#2a2928', transformOrigin: 'left', zIndex: 0 }}
              />
              <button
                onClick={onConfirm}
                style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', padding: '14px 24px', background: 'transparent', color: '#fff', border: 'none', fontFamily: 'var(--sans)', fontSize: '0.82rem', fontWeight: 400, cursor: 'pointer', letterSpacing: '0.01em' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d={GITHUB_ICON_PATH} />
                </svg>
                Connect GitHub and start scan
              </button>
            </div>

            <button
              onClick={onDemo}
              style={{ fontSize: '0.75rem', color: '#bbb8b4', textAlign: 'center', background: 'none', border: 'none', fontFamily: 'var(--sans)', cursor: 'pointer', transition: 'color 0.15s', padding: '4px' }}
              onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.color = '#888580')}
              onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.color = '#bbb8b4')}
            >
              Show me a demo report instead
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
