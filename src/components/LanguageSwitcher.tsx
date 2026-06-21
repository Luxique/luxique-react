'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const LANGUAGES = [
  { code: 'nl', flag: '🇳🇱', name: 'Nederlands' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
  { code: 'it', flag: '🇮🇹', name: 'Italiano' },
] as const

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  // Extract current locale from path
  const segments = pathname.split('/')
  const currentLocale = segments[1] && ['nl', 'en', 'es', 'fr', 'de'].includes(segments[1]) ? segments[1] : 'nl'
  const current = LANGUAGES.find(l => l.code === currentLocale) || LANGUAGES[0]

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const switchTo = (locale: string) => {
    setOpen(false)
    if (locale === currentLocale) return

    // Replace the locale segment in the path
    const newSegments = [...segments]
    if (newSegments[1] && ['nl', 'en', 'es', 'fr', 'de'].includes(newSegments[1])) {
      newSegments[1] = locale
    } else {
      newSegments.splice(1, 0, locale)
    }
    const newPath = newSegments.join('/') || `/${locale}`
    router.push(newPath)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="h-[52px] max-md:h-[48px] rounded-full bg-[rgba(250,248,244,0.72)] backdrop-blur-[26px] saturate-[115%] border border-[rgba(255,255,255,0.7)] flex items-center justify-center cursor-pointer shrink-0 transition hover:border-[rgba(196,162,101,0.3)]"
        style={compact ? { width: '48px' } : { padding: '0 16px', gap: '6px' }}
        title={current.name}
      >
        <span className="text-[18px] leading-none">{current.flag}</span>
        {!compact && (
          <span className="text-[12px] font-medium text-[#3d382f] hidden md:inline">{current.code.toUpperCase()}</span>
        )}
        <svg className={`w-[10px] h-[10px] text-[#6b6357] transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 4.5L6 7.5L9 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-[60px] w-[180px] bg-[rgba(250,248,244,0.95)] backdrop-blur-[26px] rounded-2xl border border-[rgba(255,255,255,0.7)] overflow-hidden py-1 z-50 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)]">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => switchTo(lang.code)}
              className={`flex items-center gap-3 px-4 py-2.5 w-full text-left transition hover:bg-[rgba(196,162,101,0.08)] ${
                lang.code === currentLocale ? 'bg-[rgba(196,162,101,0.06)]' : ''
              }`}
            >
              <span className="text-[18px] leading-none">{lang.flag}</span>
              <span className={`text-[13px] ${lang.code === currentLocale ? 'text-[#C4A265] font-medium' : 'text-[#3d382f]'}`}>
                {lang.name}
              </span>
              {lang.code === currentLocale && (
                <svg className="w-[14px] h-[14px] text-[#C4A265] ml-auto" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8L6.5 11.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
