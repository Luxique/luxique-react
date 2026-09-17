'use client'

import { useEffect, useState } from 'react'
import CalEmbedRaw from '@calcom/embed-react'

const CALENDAR_TIME_ZONE = 'Europe/Amsterdam'

/**
 * CalEmbed — Cal.com official embed-react wrapper.
 *
 * HOW PREFILL WORKS:
 * The embed-react package converts all config keys into URL query params
 * on the iframe src. Cal.com's booking page reads `?name=` and `?email=`
 * from those params. So we pass them as FLAT top-level keys on the config
 * object — NOT nested under a `prefill` key (which gets stringified to
 * "[object Object]" and silently ignored).
 *
 * If name/email are empty/missing → no query params added → Cal.com shows
 * EMPTY fields (not the host account).
 */
export default function CalEmbed({
  calLink,
  name,
  email,
  theme = 'light',
  layout = 'month_view',
  locale = 'nl',
}: {
  calLink: string
  name?: string
  email?: string
  theme?: string
  layout?: string
  locale?: string
}) {
  const [embedKey, setEmbedKey] = useState(0)
  const [showBackButton, setShowBackButton] = useState(false)

  useEffect(() => {
    setShowBackButton(false)
    const timer = window.setTimeout(() => setShowBackButton(true), 3_000)
    return () => window.clearTimeout(timer)
  }, [embedKey])

  const config: Record<string, string | string[] | Record<string, string>> = {
    layout,
    theme,
    locale,
    timeZone: CALENDAR_TIME_ZONE,
  }

  // Flat keys → become ?name=...&email=... on the iframe URL
  // Only add if we have real values — empty means Cal shows empty fields, NOT host info
  if (name) config.name = name
  if (email) config.email = email

  return (
    <div className="cal-embed-shell relative w-full min-h-[680px] md:min-h-[600px]">
      <button
        type="button"
        className={`cal-embed-back ${showBackButton ? 'cal-embed-back--visible' : ''}`}
        aria-label="Terug naar de keuze van behandelingen"
        onClick={() => {
          const scrollY = window.scrollY
          setEmbedKey(current => current + 1)
          requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: 'auto' }))
        }}
      >
        <span aria-hidden="true">←</span> Andere behandeling
      </button>
      <CalEmbedRaw
        key={embedKey}
        calLink={calLink}
        style={{ width: '100%', minHeight: '680px', height: '100%', border: 0, borderRadius: '12px' }}
        config={config}
      />
      <style jsx>{`
        .cal-embed-back {
          position: absolute;
          z-index: 20;
          top: 12px;
          right: 12px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid rgba(176, 141, 79, .34);
          border-radius: 999px;
          padding: 9px 14px;
          background: rgba(251, 248, 242, .72);
          box-shadow: 0 6px 18px rgba(28, 24, 20, .08);
          color: #554a3d;
          font: 600 12px/1.2 Jost, sans-serif;
          cursor: pointer;
          opacity: 0;
          transform: translateY(-5px);
          pointer-events: none;
          transition: opacity .45s ease, transform .45s ease, background-color .2s ease, border-color .2s ease, box-shadow .2s ease;
          backdrop-filter: blur(8px);
        }
        .cal-embed-back--visible {
          opacity: .64;
          transform: translateY(0);
          pointer-events: auto;
        }
        .cal-embed-back:hover,
        .cal-embed-back:focus-visible {
          opacity: .96;
          background: rgba(251, 248, 242, .96);
          border-color: rgba(176, 141, 79, .72);
          box-shadow: 0 8px 24px rgba(28, 24, 20, .13);
        }
        @media (min-width: 768px) {
          .cal-embed-shell { min-height: 600px; }
          .cal-embed-shell :global(iframe) { min-height: 600px !important; }
        }
        @media (max-width: 767px) {
          .cal-embed-shell :global(iframe) { min-height: 680px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cal-embed-back { transition: none; }
        }
      `}</style>
    </div>
  )
}
