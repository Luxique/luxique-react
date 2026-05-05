'use client'

import { useEffect } from 'react'

const sectionColors: Record<string, string> = {
  hero: '#0C0A07',
  verschil: '#FAF8F4',
  oogvormen: '#FFFFFF',
  missie: '#FAF8F4',
  behandelingen: '#FAF8F4',
  'meet-chiva': '#FAF8F4',
  reels: '#FFFFFF',
  academy: '#0C0A07',
  reviews: '#FAF8F4',
  faq: '#FAF8F4',
}

export default function ThemeColorManager() {
  useEffect(() => {
    const setThemeColor = (color: string) => {
      let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = 'theme-color'
        document.head.appendChild(meta)
      }
      meta.content = color
    }

    const observers: IntersectionObserver[] = []

    Object.entries(sectionColors).forEach(([id, color]) => {
      const el = document.getElementById(id)
      if (!el) return

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setThemeColor(color)
          })
        },
        { threshold: 0.4, rootMargin: '-20% 0px -20% 0px' }
      )

      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [])

  return null
}
