'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'

export default function AdminRefundBadge() {
  const { role, session } = useAuth()
  const [count, setCount] = useState(0)
  const load = useCallback(() => {
    if (role !== 'admin' || !session?.access_token) return
    fetch('/api/admin/refunds', { cache: 'no-store', headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(response => response.ok ? response.json() : null).then(payload => setCount(payload?.openCount || 0)).catch(() => {})
  }, [role, session?.access_token])
  useEffect(() => { load(); window.addEventListener('luxique-refunds-updated', load); return () => window.removeEventListener('luxique-refunds-updated', load) }, [load])
  return count > 0 ? <span title={`${count} openstaande terugbetaling${count === 1 ? '' : 'en'}`} className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#c53c3c] px-1 text-[11px] font-bold text-white">!</span> : null
}

