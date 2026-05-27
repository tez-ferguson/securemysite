'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase.client'
import type { User } from '@supabase/supabase-js'

const EASE = [0.16, 1, 0.3, 1] as const

const CHECK_VARIANT = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number) => ({
    pathLength: 1, opacity: 1,
    transition: { duration: 0.35, delay: i * 0.05, ease: EASE },
  }),
}

function AnimatedCheck({ delay = 0 }: { delay?: number }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5a9e6f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px', flexShrink: 0 }}>
      <motion.polyline points="20 6 9 17 4 12" variants={CHECK_VARIANT} custom={delay} />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb8b4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px', flexShrink: 0 }}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

interface FeatureItemProps { text: string; included?: boolean; dimmed?: boolean; idx?: number }

function FeatureItem({ text, included = true, dimmed = false, idx = 0 }: FeatureItemProps) {
  return (
    <motion.li
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', alignItems: 'center', fontFamily: 'var(--sans)', fontWeight: 300, fontSize: '0.88rem', color: dimmed ? '#bbb8b4' : '#444240', marginBottom: '10px', listStyle: 'none', textDecoration: dimmed ? 'line-through' : 'none' }}
    >
      {included ? <AnimatedCheck delay={idx} /> : <XIcon />}
      {text}
    </motion.li>
  )
}

const CARDS = [
  {
    title: 'Free',
    price: null,
    sub: 'Always free',
    badge: null,
    featured: false,
    features: [
      { text: 'Run unlimited scans',        included: true  },
      { text: 'See vulnerability counts',   included: true  },
      { text: 'See severity breakdown',     included: true  },
      { text: 'Full finding details',       included: false, dimmed: true },
      { text: 'File paths and line numbers',included: false, dimmed: true },
      { text: 'AI fix prompts',             included: false, dimmed: true },
    ],
    cta: 'Scan your app →',
    ctaHref: '/',
  },
  {
    title: '$29',
    price: 29,
    sub: 'per scan',
    badge: null,
    featured: false,
    features: [
      { text: 'Everything in Free +', included: true },
      { text: 'Full vulnerability details', included: true },
      { text: 'File paths and line numbers', included: true },
      { text: 'AI-generated fix prompts', included: true },
      { text: 'Formatted for Lovable, Cursor, Bolt', included: true },
    ],
    cta: 'Unlock a report',
    ctaHref: '/',
  },
  {
    title: '$149',
    price: 149,
    sub: 'per scan',
    badge: 'Most popular',
    featured: true,
    features: [
      { text: 'Everything in Unlock +', included: true },
      { text: 'We fix it for you', included: true },
      { text: 'PR opened within 24 hours', included: true },
      { text: 'Fix summary included', included: true },
    ],
    cta: 'Fix my app',
    ctaHref: '/',
  },
]

export default function PricingPage() {
  const [user, setUser] = useState<User | null>(null)
  useEffect(() => {
    const supabase = createBrowserClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', fontFamily: 'var(--sans)' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--white)', padding: '0 clamp(16px, 4vw, 40px)', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', color: 'var(--ink)', textDecoration: 'none' }}>VibeSec</Link>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {user ? (
            <Link href="/dashboard" style={{ color: 'var(--ink2)', fontSize: '0.85rem', textDecoration: 'none' }}>Dashboard</Link>
          ) : (
            <Link href="/sign-in" style={{ color: 'var(--ink2)', fontSize: '0.85rem', textDecoration: 'none' }}>Sign in</Link>
          )}
          <Link href="/" style={{ backgroundColor: 'var(--ink)', color: '#fff', padding: '7px 16px', fontSize: '0.85rem', textDecoration: 'none' }}>
            Get started
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: 'clamp(40px, 8vw, 72px) clamp(16px, 4vw, 24px) 80px' }}>
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          style={{ textAlign: 'center', marginBottom: 'clamp(36px, 6vw, 60px)' }}
        >
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(2rem, 5vw, 2.8rem)', color: 'var(--ink)', margin: '0 0 14px 0', lineHeight: '1.1' }}>
            Simple, per-scan pricing
          </h1>
          <p style={{ fontWeight: 300, fontSize: '0.95rem', color: 'var(--ink3)', margin: 0, lineHeight: '1.6' }}>
            No subscriptions. Pay only for the scans you need.
          </p>
        </motion.div>

        {/* Cards — single column on mobile */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', border: '1px solid var(--border)' }}>
          {CARDS.map((card, cardIdx) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: cardIdx * 0.1, ease: EASE }}
              style={{
                backgroundColor: 'var(--white)',
                padding: 'clamp(24px, 5vw, 40px)',
                borderRight: cardIdx < CARDS.length - 1 ? '1px solid var(--border)' : 'none',
                borderBottom: '1px solid var(--border)',
                border: card.featured ? '2px solid var(--ink)' : undefined,
                margin: card.featured ? '-1px' : undefined,
                position: 'relative' as const,
                zIndex: card.featured ? 1 : 0,
              }}
            >
              {card.badge && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: cardIdx * 0.1 + 0.2, ease: EASE }}
                  style={{ display: 'inline-block', backgroundColor: 'var(--ink)', color: '#fff', fontFamily: 'var(--sans)', fontSize: '0.65rem', fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 10px', marginBottom: '12px' }}
                >
                  {card.badge}
                </motion.div>
              )}

              <div style={{ marginBottom: '8px' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '2rem', color: 'var(--ink)', margin: '0 0 4px 0' }}>
                  {card.title}
                </h2>
                <p style={{ fontWeight: 300, fontSize: '0.82rem', color: 'var(--ink3)', margin: 0 }}>{card.sub}</p>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', margin: '28px 0' }} />

              <motion.ul
                initial="hidden"
                animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: cardIdx * 0.1 + 0.25 } } }}
                style={{ padding: 0, margin: '0 0 32px 0' }}
              >
                {card.features.map((f, fi) => (
                  <FeatureItem key={f.text} text={f.text} included={f.included} dimmed={'dimmed' in f ? f.dimmed : false} idx={fi} />
                ))}
              </motion.ul>

              <div style={{ position: 'relative', overflow: 'hidden', background: card.featured ? 'var(--ink)' : 'var(--white)' }}>
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.28, ease: EASE }}
                  style={{ position: 'absolute', inset: 0, background: card.featured ? '#2a2928' : 'var(--ink)', transformOrigin: 'left', zIndex: 0 }}
                />
                <Link
                  href={card.ctaHref}
                  style={{ position: 'relative', zIndex: 1, display: 'block', width: '100%', boxSizing: 'border-box', backgroundColor: 'transparent', color: card.featured ? '#fff' : 'var(--ink)', border: card.featured ? 'none' : '1px solid var(--ink)', padding: '13px 20px', fontFamily: 'var(--sans)', fontWeight: 400, fontSize: '0.9rem', textAlign: 'center', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => { if (!card.featured) (e.currentTarget as HTMLElement).style.color = '#fff' }}
                  onMouseLeave={(e) => { if (!card.featured) (e.currentTarget as HTMLElement).style.color = 'var(--ink)' }}
                >
                  {card.cta}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontWeight: 300, fontSize: '0.82rem', color: 'var(--ink3)', marginTop: '32px' }}>
          Questions?{' '}
          <a href="mailto:hello@vibesec.app" style={{ color: 'var(--ink2)', textDecoration: 'underline' }}>hello@vibesec.app</a>
        </p>
      </div>
    </div>
  )
}
