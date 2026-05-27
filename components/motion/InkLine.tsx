'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface InkLineProps {
  color?: string
  delay?: number
  style?: React.CSSProperties
}

export function InkLine({ color = '#e2deda', delay = 0, style }: InkLineProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })

  return (
    <div ref={ref} style={{ overflow: 'hidden', height: '1px', ...style }}>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
        style={{
          height: '100%',
          background: color,
          transformOrigin: 'left',
        }}
      />
    </div>
  )
}
