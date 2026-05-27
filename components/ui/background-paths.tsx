'use client'

import { motion } from 'framer-motion'

// Warm near-black — tinted toward VibeSec's crimson, not cold neutral-950
const DARK_BG = '#0e0c0b'

interface Path {
  id: number
  d: string
  opacity: number
  width: number
}

function FloatingPaths({ position }: { position: number }) {
  const paths: Path[] = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    // Keep opacity very low — texture, not decoration
    opacity: 0.03 + i * 0.018,
    width: 0.4 + i * 0.025,
  }))

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <svg
        className="w-full h-full"
        viewBox="0 0 696 316"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="#f7f5f2"
            strokeWidth={path.width}
            strokeOpacity={path.opacity}
            initial={{ pathLength: 0.2, opacity: 0 }}
            animate={{
              pathLength: 1,
              opacity: [path.opacity * 0.5, path.opacity, path.opacity * 0.5],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 22 + path.id * 0.6,
              repeat: Infinity,
              ease: 'linear',
              delay: path.id * 0.15,
            }}
          />
        ))}
      </svg>
    </div>
  )
}

interface HeroAnimatedTitleProps {
  line1: string
  line2: string
  /** line2 is italic and rendered in the crimson accent */
  line2Accent?: boolean
}

export function HeroAnimatedTitle({ line1, line2, line2Accent = true }: HeroAnimatedTitleProps) {
  const SPRING = { type: 'spring' as const, stiffness: 180, damping: 28 }

  function AnimatedWord({ word, baseDelay, accent }: { word: string; baseDelay: number; accent?: boolean }) {
    return (
      <span className="inline-block mr-[0.25em] last:mr-0">
        {word.split('').map((letter, i) => (
          <motion.span
            key={i}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...SPRING, delay: baseDelay + i * 0.028 }}
            style={{
              display: 'inline-block',
              // NO gradient text — solid colour only (impeccable absolute ban)
              color: accent ? '#c0392b' : '#f7f5f2',
            }}
          >
            {letter === ' ' ? '\u00A0' : letter}
          </motion.span>
        ))}
      </span>
    )
  }

  const words1 = line1.split(' ')
  const words2 = line2.split(' ')
  const delay1End = words1.reduce((acc, w, wi) => acc + w.length * 0.028 + 0.08, 0)

  return (
    <div>
      <div className="overflow-hidden leading-none">
        {words1.map((word, wi) => (
          <AnimatedWord
            key={`l1-${wi}`}
            word={word}
            baseDelay={wi * 0.07}
            accent={false}
          />
        ))}
      </div>
      <div className="overflow-hidden leading-none mt-1">
        {words2.map((word, wi) => (
          <AnimatedWord
            key={`l2-${wi}`}
            word={word}
            baseDelay={delay1End + 0.15 + wi * 0.07}
            accent={line2Accent}
          />
        ))}
      </div>
    </div>
  )
}

interface BackgroundPathsHeroProps {
  children: React.ReactNode
  className?: string
}

/** Dark hero shell with two-layer animated path texture. */
export function BackgroundPathsHero({ children, className }: BackgroundPathsHeroProps) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        background: DARK_BG,
        overflow: 'hidden',
      }}
    >
      {/* Two opposing path layers — keep opacity extremely low */}
      <FloatingPaths position={1} />
      <FloatingPaths position={-1} />

      {/* Subtle vignette so paths don't fight the text at edges */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, rgba(14,12,11,0.72) 100%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 10 }}>{children}</div>
    </div>
  )
}
