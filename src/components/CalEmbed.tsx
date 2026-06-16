'use client'

import CalEmbedRaw from '@calcom/embed-react'

/**
 * CalEmbed — Cal.com official embed-react wrapper.
 * Prefill via config object (persists through internal navigation, unlike URL params).
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
  // Build config — Cal.com embed-react preserves prefill through internal navigation
  const config: Record<string, string | string[] | Record<string, string>> = {
    layout,
    theme,
  }

  // Only add prefill if we have real data (no email-prefix fallback)
  if (email || name) {
    config.prefill = {
      ...(name ? { name } : {}),
      ...(email ? { email } : {}),
    }
  }

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
