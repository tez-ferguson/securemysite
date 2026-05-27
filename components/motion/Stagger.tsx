'use client'

import { motion } from 'framer-motion'

interface StaggerProps {
  children: React.ReactNode
  gap?: number
  delayStart?: number
  className?: string
  style?: React.CSSProperties
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

export function Stagger({ children, gap = 0.07, delayStart = 0, className, style }: StaggerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: gap, delayChildren: delayStart } },
      }}
      className={className}
      style={style}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT_EXPO } },
              }}
            >
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  )
}
