'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Reveal — wraps children in a scroll-triggered reveal animation.
 * Uses IntersectionObserver, fires once, respects prefers-reduced-motion.
 *
 * Usage: <Reveal><YourContent /></Reveal>
 * Or with delay: <Reveal delay={200}>...</Reveal>
 */
export default function Reveal({
  children,
  delay = 0,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode
  delay?: number
  className?: string
  as?: any
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      el.style.opacity = '1'
      el.style.transform = 'none'
      return
    }

    el.style.opacity = '0'
    el.style.transform = 'translateY(24px)'
    el.style.transition = `opacity .75s cubic-bezier(.16,1,.3,1) ${delay}ms, transform .75s cubic-bezier(.16,1,.3,1) ${delay}ms`

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.style.opacity = '1'
            el.style.transform = 'translateY(0)'
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.2 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [delay])

  return (
    <Tag ref={ref} className={className} style={{ willChange: 'opacity, transform' }}>
      {children}
    </Tag>
  )
}
