'use client'

import { useEffect } from 'react'

export default function ThemeColorManager() {
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
    if (!meta) return

    let currentColor = meta.content

    const setColor = (color: string) => {
      if (color === currentColor) return
      currentColor = color
      meta.setAttribute('content', color)
    }

    const sections = document.querySelectorAll('[data-theme-color]')
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const color = entry.target.getAttribute('data-theme-color')
            if (color) setColor(color)
          }
        })
      },
      { threshold: 0.3, rootMargin: '-10% 0px -10% 0px' }
    )

    sections.forEach((section) => observer.observe(section))

    const handleScroll = () => {
      const vh = window.innerHeight
      let bestEl: Element | null = null
      let bestOverlap = 0

      sections.forEach((el) => {
        const rect = el.getBoundingClientRect()
        const overlap = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0))
        if (overlap > bestOverlap) {
          bestOverlap = overlap
          bestEl = el
        }
      })

      if (bestEl) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const c = (bestEl as Element).getAttribute('data-theme-color')
        if (c) setColor(c)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return null
}
