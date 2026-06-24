'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTransition } from 'react'

const LANGUAGES = [
  { code: 'nl', flag: '🇳🇱', name: 'Nederlands' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
  { code: 'it', flag: '🇮🇹', name: 'Italiano' },
] as const

// Cache for prefetched message files — survives across components/renders
const messageCache = new Map<string, Promise<unknown>>()

async function prefetchMessages(locale: string) {
  if (messageCache.has(locale)) return messageCache.get(locale)
  const promise = import(`../../messages/${locale}.json`).then(m => m.default)
  messageCache.set(locale, promise)
  return promise
}

export default function LanguageSwitcher({ compact = false, flipUp = false }: { compact?: boolean; flipUp?: boolean }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  // Extract current locale from path
  const segments = pathname.split('/')
  const currentLocale = segments[1] && LANGUAGES.some(l => l.code === segments[1]) ? segments[1] : 'nl'
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

  // Prefetch all locale message files when dropdown opens or on hover
  const prefetchAll = useCallback(() => {
    LANGUAGES.forEach(lang => {
      if (lang.code !== currentLocale) {
        prefetchMessages(lang.code)
      }
    })
  }, [currentLocale])

  const switchTo = (locale: string) => {
    setOpen(false)
    if (locale === currentLocale) return

    // Replace the locale segment in the path
    const newSegments = [...segments]
    if (newSegments[1] && LANGUAGES.some(l => l.code === newSegments[1])) {
      newSegments[1] = locale
    } else {
      newSegments.splice(1, 0, locale)
    }
    const newPath = newSegments.join('/') || `/${locale}`

    // Use transition — React keeps old content visible until new is ready
    startTransition(() => {
      router.push(newPath)
    })
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => open ? setOpen(false) : (setOpen(true), prefetchAll())}
        onMouseEnter={prefetchAll}
        aria-label={`Taal selecteren, huidig: ${current.name}`}
        aria-expanded={open}
        className={`h-[52px] max-md:h-[48px] rounded-full bg-[rgba(250,248,244,0.72)] backdrop-blur-[26px] saturate-[115%] border border-[rgba(255,255,255,0.7)] flex items-center justify-center cursor-pointer shrink-0 transition hover:border-[rgba(196,162,101,0.3)] ${isPending ? 'opacity-70' : ''}`}
        style={compact ? { width: '48px' } : { padding: '0 16px', gap: '6px' }}
        title={current.name}
      >
        <span className="text-[18px] leading-none" aria-hidden="true">{current.flag}</span>
        {!compact && (
          <span className="text-[12px] font-medium text-[#3d382f] hidden md:inline">{current.code.toUpperCase()}</span>
        )}
        <svg aria-hidden="true" className={`w-[10px] h-[10px] text-[#6b6357] transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 4.5L6 7.5L9 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className={`absolute right-0 ${flipUp ? 'bottom-[60px]' : 'top-[60px]'} w-[180px] bg-[rgba(250,248,244,0.95)] backdrop-blur-[26px] rounded-2xl border border-[rgba(255,255,255,0.7)] overflow-hidden py-1 z-50 shadow-[${flipUp ? '0_-20px_50px_-15px_rgba(0,0,0,0.15)' : '0_20px_50px_-15px_rgba(0,0,0,0.15)'}]`}>
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
