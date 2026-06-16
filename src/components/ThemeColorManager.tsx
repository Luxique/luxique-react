'use client'

import { useEffect } from 'react'

export default function ThemeColorManager() {
  useEffect(() => {
    const getOrCreate = (name: string): HTMLMetaElement => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.name = name
        document.head.appendChild(el)
      }
      return el
    }

    const themeMeta = getOrCreate('theme-color')
    const csMeta = getOrCreate('color-scheme')

    let currentColor = ''

    const setColor = (color: string, dark: boolean) => {
      if (color === currentColor) return
      currentColor = color
      themeMeta.content = color
      csMeta.content = dark ? 'dark' : 'light'
      // Also set CSS variable for safe-area filler
      document.documentElement.style.setProperty('--page-bg', color)
    }

    const sections = document.querySelectorAll('[data-theme-color]')
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const color = entry.target.getAttribute('data-theme-color') || ''
            const dark = entry.target.getAttribute('data-theme-dark') === 'true'
            setColor(color, dark)
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
        const c = (bestEl as Element).getAttribute('data-theme-color') || ''
        const d = (bestEl as Element).getAttribute('data-theme-dark') === 'true'
        setColor(c, d)
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
