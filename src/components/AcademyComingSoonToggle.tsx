'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'

export default function AcademyComingSoonToggle() {
  const { session } = useAuth()
  const [enabled, setEnabled] = useState(false)
  const [saving, setSaving] = useState(false)
  const [available, setAvailable] = useState(true)

  useEffect(() => {
    fetch('/api/site-settings/academy', { cache: 'no-store' }).then(r => r.json()).then(data => {
      setEnabled(data.academyComingSoon === true)
      setAvailable(data.settingsAvailable !== false)
    })
  }, [])

  const update = async () => {
    if (!session?.access_token || saving || !available) return
    const next = !enabled
    setSaving(true)
    const response = await fetch('/api/site-settings/academy', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ academyComingSoon: next }),
    })
    if (response.ok) setEnabled(next)
    setSaving(false)
  }

  return (
    <div className="border-t border-[#f0ede8] px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-[#403a33]">Academy coming soon</p>
          <p className="mt-0.5 text-[10px] leading-4 text-[#999]">{available ? (enabled ? 'Publiek afgeschermd' : 'Publiek zichtbaar') : 'Voer eerst de SQL uit'}</p>
        </div>
        <button type="button" role="switch" aria-checked={enabled} aria-label="Academy coming soon" onClick={update} disabled={saving || !available}
          className={`relative h-[28px] w-[48px] shrink-0 rounded-full border-0 transition-colors ${enabled ? 'bg-[#34C759]' : 'bg-[#d8d8dc]'} disabled:cursor-not-allowed disabled:opacity-50`}>
          <span className={`absolute top-[2px] h-[24px] w-[24px] rounded-full bg-white shadow-[0_2px_5px_rgba(0,0,0,.28)] transition-transform ${enabled ? 'translate-x-[20px]' : 'translate-x-[2px]'}`} />
        </button>
      </div>
    </div>
  )
}
