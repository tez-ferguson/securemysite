'use client'

import React from 'react'
import Link from 'next/link'
import { motion, type Transition } from 'framer-motion'
import { CheckCircle2, Star, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// ─── Data types ────────────────────────────────────────────
export interface PricingFeature {
  text: string
  tooltip?: string
}

export interface PricingPlan {
  name: string
  info: string
  price: string
  note: string
  features: PricingFeature[]
  btn: {
    text: string
    href: string
  }
  highlighted?: boolean
}

// ─── BorderTrail — animated neon glow ──────────────────────
type BorderTrailProps = {
  className?: string
  size?: number
  transition?: Transition
  delay?: number
  style?: React.CSSProperties
}

export function BorderTrail({
  className,
  size = 80,
  transition,
  delay,
  style,
}: BorderTrailProps) {
  const BASE: Transition = {
    repeat: Infinity,
    duration: 4,
    ease: 'linear',
  }

  return (
    <div className="pointer-events-none absolute inset-0 [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]">
      <motion.div
        className={cn('absolute aspect-square', className)}
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round 0px)`,
          ...style,
        }}
        animate={{ offsetDistance: ['0%', '100%'] }}
        transition={{ ...(transition ?? BASE), delay }}
      />
    </div>
  )
}

// ─── Single card ───────────────────────────────────────────
export function PricingCard({ plan }: { plan: PricingPlan }) {
  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          'relative flex w-full flex-col',
          // Sharp border — no rounded corners (VibeSec principle)
          'border',
          plan.highlighted
            ? 'border-[rgba(247,245,242,0.2)] bg-[rgba(247,245,242,0.04)]'
            : 'border-[rgba(247,245,242,0.08)] bg-[rgba(247,245,242,0.02)]',
        )}
      >
        {/* Animated glow border — crimson to match VibeSec brand */}
        {plan.highlighted && (
          <>
            <BorderTrail
              size={80}
              style={{
                background: 'linear-gradient(90deg, transparent, #c0392b, transparent)',
                boxShadow:
                  '0 0 40px 20px rgba(192,57,43,0.4), 0 0 80px 40px rgba(192,57,43,0.15)',
              }}
            />
            {/* Second trail offset so they don't overlap */}
            <BorderTrail
              size={60}
              delay={2}
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(192,57,43,0.5), transparent)',
              }}
            />
          </>
        )}

        {/* Header */}
        <div
          className={cn(
            'border-b p-5',
            plan.highlighted
              ? 'border-[rgba(247,245,242,0.12)]'
              : 'border-[rgba(247,245,242,0.06)]',
          )}
        >
          {/* Popular badge */}
          {plan.highlighted && (
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1 border border-[rgba(192,57,43,0.5)] bg-[rgba(192,57,43,0.12)] px-2 py-0.5">
              <Star className="h-3 w-3 fill-[#c0392b] text-[#c0392b]" />
              <span className="text-[10px] font-medium tracking-wider uppercase text-[#c0392b]">Popular</span>
            </div>
          )}

          <p className="text-[0.68rem] font-medium tracking-[0.12em] uppercase text-[rgba(247,245,242,0.4)]">
            {plan.name}
          </p>
          <p className="mt-1 text-[0.8rem] font-light text-[rgba(247,245,242,0.5)]">{plan.info}</p>

          <div className="mt-4 flex items-end gap-2">
            <span
              className="text-4xl font-light tracking-tight text-[#f7f5f2]"
              style={{ fontFamily: 'var(--serif)' }}
            >
              {plan.price}
            </span>
            {plan.note && (
              <span className="mb-1 text-[0.72rem] text-[rgba(247,245,242,0.35)]">{plan.note}</span>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="flex-1 space-y-3 px-5 py-5">
          {plan.features.map((f, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[rgba(247,245,242,0.4)]" />
              {f.tooltip ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="cursor-default border-b border-dashed border-[rgba(247,245,242,0.2)] text-[0.8rem] font-light leading-snug text-[rgba(247,245,242,0.65)] transition-colors hover:text-[rgba(247,245,242,0.9)]">
                      {f.text}
                      <HelpCircle className="ml-1 inline h-3 w-3 text-[rgba(247,245,242,0.25)]" />
                    </p>
                  </TooltipTrigger>
                  <TooltipContent side="top">{f.tooltip}</TooltipContent>
                </Tooltip>
              ) : (
                <p className="text-[0.8rem] font-light leading-snug text-[rgba(247,245,242,0.65)]">
                  {f.text}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className={cn(
            'mt-auto border-t p-4',
            plan.highlighted
              ? 'border-[rgba(247,245,242,0.12)]'
              : 'border-[rgba(247,245,242,0.06)]',
          )}
        >
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <motion.div
              initial={{ scaleX: 0 }}
              whileHover={{ scaleX: 1 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute',
                inset: 0,
                background: plan.highlighted ? 'rgba(192,57,43,0.25)' : 'rgba(247,245,242,0.08)',
                transformOrigin: 'left',
                zIndex: 0,
              }}
            />
            <Link
              href={plan.btn.href}
              style={{ position: 'relative', zIndex: 1 }}
              className={cn(
                'block w-full py-3 text-center text-[0.82rem] font-medium tracking-wide transition-colors',
                plan.highlighted
                  ? 'border border-[rgba(192,57,43,0.6)] text-[#f7f5f2] hover:text-white'
                  : 'border border-[rgba(247,245,242,0.15)] text-[rgba(247,245,242,0.65)] hover:text-[#f7f5f2]',
              )}
            >
              {plan.btn.text}
            </Link>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

// ─── Section wrapper ───────────────────────────────────────
export function PricingSection({
  plans,
  heading,
  description,
  className,
}: {
  plans: PricingPlan[]
  heading: string
  description?: string
  className?: string
}) {
  return (
    <div className={cn('flex w-full flex-col items-center', className)}>
      <div className="mx-auto mb-12 max-w-xl space-y-3 text-center">
        <h2
          className="text-3xl font-light tracking-tight text-[#f7f5f2] md:text-4xl"
          style={{ fontFamily: 'var(--serif)', letterSpacing: '-0.025em' }}
        >
          {heading}
        </h2>
        {description && (
          <p className="text-[0.88rem] font-light text-[rgba(247,245,242,0.45)]">
            {description}
          </p>
        )}
      </div>

      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-0 border border-[rgba(247,245,242,0.08)] md:grid-cols-3">
        {plans.map((plan, i) => (
          <div
            key={plan.name}
            className={i < plans.length - 1 ? 'md:border-r md:border-[rgba(247,245,242,0.08)]' : ''}
          >
            <PricingCard plan={plan} />
          </div>
        ))}
      </div>
    </div>
  )
}
