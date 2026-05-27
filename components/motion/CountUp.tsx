'use client'

import { useEffect, useRef } from 'react'
import { useInView, useMotionValue, useTransform, animate } from 'framer-motion'

interface CountUpProps {
  to: number
  from?: number
  duration?: number
  decimals?: number
  suffix?: string
  style?: React.CSSProperties
  className?: string
}

export function CountUp({
  to,
  from = 0,
  duration = 1.2,
  decimals = 0,
  suffix = '',
  style,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionVal = useMotionValue(from)
  const rounded = useTransform(motionVal, (v) => `${v.toFixed(decimals)}${suffix}`)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    const controls = animate(motionVal, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    })
    return controls.stop
  }, [inView, motionVal, to, duration])

  useEffect(() => {
    const unsubscribe = rounded.on('change', (v) => {
      if (ref.current) ref.current.textContent = v
    })
    return unsubscribe
  }, [rounded])

  return (
    <span ref={ref} style={style} className={className}>
      {from}
      {suffix}
    </span>
  )
}
