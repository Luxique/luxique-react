'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth-context'

type Refund = {
  id: string; customerName: string; treatmentName: string; amountCents: number;
  appointmentStart: string; cancelledAt: string | null; refundedAt: string | null; refundedByName: string | null
}

const money = (cents: number) => (cents / 100).toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' })
const appointment = (value: string) => new Intl.DateTimeFormat('nl-NL', {
  timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
}).format(new Date(value))
const timestamp = (value: string) => new Intl.DateTimeFormat('nl-NL', {
  timeZone: 'Europe/Amsterdam', dateStyle: 'medium', timeStyle: 'short',
}).format(new Date(value))

export default function AdminRefundTracker() {
  const { session } = useAuth()
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!session?.access_token) return
    const response = await fetch('/api/admin/refunds', { cache: 'no-store', headers: { Authorization: `Bearer ${session.access_token}` } })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(payload.error || 'Terugbetalingen laden mislukt.')
    setRefunds(payload.refunds || [])
  }, [session?.access_token])

  useEffect(() => { load().catch(error => setError(error.message)) }, [load])
  const open = useMemo(() => refunds.filter(item => !item.refundedAt), [refunds])
  const handled = useMemo(() => refunds.filter(item => item.refundedAt), [refunds])
  if (!refunds.length && !error) return null

  const toggle = async (item: Refund, refunded: boolean) => {
    if (!session?.access_token) return
    setBusyId(item.id); setError('')
    const response = await fetch('/api/admin/refunds', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ bookingId: item.id, refunded }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) setError(payload.error || 'Opslaan mislukt.')
    else {
      setRefunds(current => current.map(candidate => candidate.id === item.id ? {
        ...candidate, refundedAt: payload.refundedAt || null,
        refundedByName: refunded ? 'jij' : null,
      } : candidate))
      window.dispatchEvent(new CustomEvent('luxique-refunds-updated'))
    }
    setBusyId(null)
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#d7a750] bg-[#fffaf0] shadow-[0_8px_30px_rgba(130,91,24,.10)]" data-testid="admin-refund-tracker">
      {open.length > 0 && <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9a6a18]">Actie nodig</p><h2 className="font-['Cormorant_Garamond'] text-[27px] text-[#241b0d]">Terugbetalingen openstaand</h2></div>
          <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-[#b7791f] px-2 text-[13px] font-bold text-white">{open.length}</span>
        </div>
        <div className="space-y-2">{open.map(item => <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-[#ecd8b5] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-[14px] font-semibold text-[#1a1a1a]">{item.customerName} · {money(item.amountCents)}</p><p className="mt-0.5 text-[12px] text-[#6f6555]">Afspraak {appointment(item.appointmentStart)} · {item.treatmentName}</p>{item.cancelledAt && <p className="mt-0.5 text-[11px] text-[#9b9285]">Geannuleerd {timestamp(item.cancelledAt)}</p>}</div>
          <button type="button" disabled={busyId === item.id} onClick={() => toggle(item, true)} className="rounded-xl bg-[#0C0A07] px-4 py-2.5 text-[12px] font-semibold text-white disabled:opacity-50">✓ Terugbetaald</button>
        </div>)}</div>
      </div>}
      {handled.length > 0 && <details className={`${open.length ? 'border-t border-[#ecd8b5]' : ''} bg-white/70 px-5 py-4`} open={open.length === 0}>
        <summary className="cursor-pointer text-[12px] font-semibold uppercase tracking-[0.1em] text-[#777]">Afgehandeld ({handled.length})</summary>
        <div className="mt-3 space-y-2">{handled.map(item => <div key={item.id} className="flex flex-col gap-2 rounded-xl border border-[#eee] bg-white p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[13px] font-medium">{item.customerName} · {money(item.amountCents)}</p><p className="text-[11px] text-[#777]">Terugbetaald op {timestamp(item.refundedAt!)}{item.refundedByName ? ` door ${item.refundedByName}` : ''}</p></div><button type="button" disabled={busyId === item.id} onClick={() => toggle(item, false)} className="text-left text-[11px] font-semibold text-[#8a6d3b] disabled:opacity-50">Terugzetten naar openstaand</button></div>)}</div>
      </details>}
      {error && <p className="border-t border-red-100 bg-red-50 px-5 py-3 text-[12px] text-red-700">{error}</p>}
    </section>
  )
}

