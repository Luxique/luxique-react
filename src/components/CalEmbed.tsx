'use client'

import CalEmbedRaw from '@calcom/embed-react'

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
}: {
  calLink: string
  name?: string
  email?: string
  theme?: string
  layout?: string
}) {
  const config: Record<string, string | string[] | Record<string, string>> = {
    layout,
    theme,
  }

  // Flat keys → become ?name=...&email=... on the iframe URL
  // Only add if we have real values — empty means Cal shows empty fields, NOT host info
  if (name) config.name = name
  if (email) config.email = email

  return (
    <div className="w-full h-full">
      <CalEmbedRaw
        calLink={calLink}
        style={{ width: '100%', height: '100%', border: 0, borderRadius: '12px' }}
        config={config}
      />
    </div>
  )
}
