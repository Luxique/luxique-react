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

    const sections = document.querySelectorAll<HTMLElement>('[data-theme-color]')

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

    // Fallback: scroll-based color for smooth transitions
    const handleScroll = () => {
      const scrollY = window.scrollY
      const vh = window.innerHeight

      // Find which section is most visible
      let bestSection: HTMLElement | null = null
      let bestOverlap = 0

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect()
        const overlap = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0))
        if (overlap > bestOverlap) {
          bestOverlap = overlap
          bestSection = section
        }
      })

      if (bestSection) {
        const color = bestSection.getAttribute('data-theme-color')
        if (color) setColor(color)
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
