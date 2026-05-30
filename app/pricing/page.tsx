'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase.client'
import type { User } from '@supabase/supabase-js'
import { PricingSection } from '@/components/ui/pricing'
import type { PricingPlan } from '@/components/ui/pricing'
import { BRAND_NAME } from '@/lib/brand'

const EASE = [0.16, 1, 0.3, 1] as const

const PLANS: PricingPlan[] = [
  {
    name: 'Free',
    info: 'Start scanning today.',
    price: '$0',
    note: 'always free',
    features: [
      { text: 'Unlimited scans' },
      { text: 'Severity breakdown', tooltip: 'See counts of critical, high, medium, and low findings after every scan.' },
      { text: 'Total vulnerability count' },
      { text: 'Full finding details', tooltip: 'Upgrade to unlock file paths, line numbers, and descriptions.' },
      { text: 'AI fix prompts', tooltip: 'Upgrade to get Claude-generated prompts you can paste directly into Lovable or Cursor.' },
    ],
    btn: { text: 'Scan your app free', href: '/' },
  },
  {
    name: 'Unlock Report',
    info: 'See exactly what\'s broken.',
    price: '$29',
    note: 'per scan',
    highlighted: true,
    features: [
      { text: 'Everything in Free' },
      { text: 'Full finding details', tooltip: 'Every vulnerability with the file path, line number, and a plain-English description.' },
      { text: 'File paths & line numbers' },
      { text: 'AI fix prompts', tooltip: 'Claude-generated prompts formatted for Lovable, Cursor, and Bolt. Copy and paste directly.' },
      { text: 'Formatted for Lovable, Bolt, Cursor' },
    ],
    btn: { text: 'Unlock your report', href: '/' },
  },
  {
    name: 'Agent Fix',
    info: 'We fix it for you.',
    price: '$149',
    note: 'per scan',
    features: [
      { text: 'Everything in Unlock Report' },
      { text: 'Automated fixes applied', tooltip: 'Our agent opens a pull request with all fixes applied — you review and merge.' },
      { text: 'PR opened within 24 hours' },
      { text: 'Fix summary included', tooltip: 'Every change is documented so you understand what was fixed and why.' },
      { text: 'One-click review & merge' },
    ],
    btn: { text: 'Fix my app', href: '/' },
  },
]

export default function PricingPage() {
  const [user, setUser] = useState<User | null>(null)
  useEffect(() => {
    const supabase = createBrowserClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0e0c0b', fontFamily: 'var(--sans)', color: '#f7f5f2' }}>

      {/* Nav */}
      <nav className="vs-pricing-nav" style={{ borderBottom: '1px solid rgba(247,245,242,0.08)', padding: '0 clamp(12px, 4vw, 40px)', minHeight: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <Link href="/" className="vs-pricing-nav-brand" style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(0.72rem, 2.8vw, 1.1rem)', color: '#f7f5f2', textDecoration: 'none', whiteSpace: 'nowrap' }}>{BRAND_NAME}</Link>
        <div className="vs-pricing-nav-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
          {user ? (
            <Link href="/dashboard" style={{ color: 'rgba(247,245,242,0.55)', fontSize: '0.8rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>Dashboard</Link>
          ) : (
            <Link href="/sign-in" style={{ color: 'rgba(247,245,242,0.55)', fontSize: '0.8rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>Sign in</Link>
          )}
          <Link href="/" style={{ border: '1px solid rgba(247,245,242,0.2)', color: '#f7f5f2', padding: '8px 12px', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-block', whiteSpace: 'nowrap' }}>
            Scan free
          </Link>
        </div>
      </nav>

      {/* Page body */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) clamp(16px, 4vw, 24px) 80px' }}>

        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <PricingSection
            plans={PLANS}
            heading="Simple, per-scan pricing"
            description="No subscriptions. No seats. Pay once per scan — free to start, unlock only when you need details."
          />
        </motion.div>

        {/* Bottom note */}
        <p style={{ textAlign: 'center', marginTop: '36px', fontSize: '0.78rem', color: 'rgba(247,245,242,0.3)', fontWeight: 300 }}>
          Questions?{' '}
          <a href="mailto:hello@vibesec.app" style={{ color: 'rgba(247,245,242,0.55)', textDecoration: 'underline' }}>
            hello@vibesec.app
          </a>
        </p>

        {/* Trust bar */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap', marginTop: '48px', paddingTop: '40px', borderTop: '1px solid rgba(247,245,242,0.07)' }}>
          {[
            'Secure payment via Stripe',
            'Code deleted after every scan',
            'Read-only GitHub access',
          ].map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: 'rgba(247,245,242,0.3)' }}>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#5a9e6f', flexShrink: 0, display: 'inline-block' }} />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
