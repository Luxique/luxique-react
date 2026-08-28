'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

type ViewMode = 'month' | 'week'
type TreatmentKey = 'new_lash_set' | 'fill_lash_set'
type CalendarItem = {
  id: string
  kind: 'booking' | 'override' | 'traject-day'
  date: string
  startTime: string
  endTime?: string
  title: string
  treatmentKey?: TreatmentKey
  status?: string
  customer?: string
  customerEmail?: string
  customerPhone?: string
  courseName?: string
  paidCount?: number
  maxParticipants?: number
}
type CalBooking = {
  id: number
  uid: string
  status: string
  startTime: string
  endTime: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  eventTypeId: number
  eventTypeTitle: string
}
type TrajectClass = {
  id: string
  blok_dagen: string[]
  cursus_naam: string
  titel: string
  starttijd: string
  eindtijd: string
  betaald_aantal: number
  max_deelnemers: number
  status: string
}
type TreatmentAvailability = {
  key: TreatmentKey
  name: string
  durationMinutes: number
  overrides: Array<{ date: string; startTime: string; endTime: string }>
}

const TREATMENT_LABELS: Record<TreatmentKey, { name: string; duration: number }> = {
  new_lash_set: { name: 'New Lash Set', duration: 180 },
  fill_lash_set: { name: 'Fill Lash Set', duration: 120 },
}

const TRAJECT_BLOK_DAG_EVENT_TYPE_ID = 6195439

function pad(value: number) { return String(value).padStart(2, '0') }
function dateKey(date: Date) { return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` }
function addDays(date: Date, amount: number) { const next = new Date(date); next.setDate(next.getDate() + amount); return next }
function startOfWeek(date: Date) { const next = new Date(date); next.setHours(0, 0, 0, 0); next.setDate(next.getDate() - ((next.getDay() + 6) % 7)); return next }
function startOfMonthGrid(date: Date) { return startOfWeek(new Date(date.getFullYear(), date.getMonth(), 1)) }
function localDateFromIso(value: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value))
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value || ''
  return `${get('year')}-${get('month')}-${get('day')}`
}
function localTimeFromIso(value: string) {
  return new Intl.DateTimeFormat('nl-NL', { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value))
}
function monthTitle(date: Date) { return new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' }).format(date) }
function longDate(key: string) { return new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${key}T12:00:00`)) }
function defaultEndTime(startTime: string, treatmentKey: TreatmentKey) {
  const [hours, minutes] = startTime.split(':').map(Number)
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return ''
  const end = hours * 60 + minutes + TREATMENT_LABELS[treatmentKey].duration
  return `${pad(Math.floor(end / 60))}:${pad(end % 60)}`
}

function trajectConflictMessage(traject: TrajectClass) {
  return `Op deze dag loopt een traject (${traject.cursus_naam}). Er kunnen geen behandelingen worden ingepland.`
}

export default function AdminAgenda({ sessionToken }: { sessionToken: string }) {
  const [cursor, setCursor] = useState(() => new Date())
  const [view, setView] = useState<ViewMode>('month')
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()))
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [bookings, setBookings] = useState<CalBooking[]>([])
  const [availability, setAvailability] = useState<TreatmentAvailability[]>([])
  const [trajectClasses, setTrajectClasses] = useState<TrajectClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [treatmentKey, setTreatmentKey] = useState<TreatmentKey>('new_lash_set')
  const [slotTime, setSlotTime] = useState('09:00')
  const [slotEndTime, setSlotEndTime] = useState('12:00')
  const [endTimeEdited, setEndTimeEdited] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadAgenda = useCallback(async () => {
    if (!sessionToken) return
    setLoading(true)
    setError(null)
    try {
      const cacheBust = Date.now()
      const [bookingsResponse, availabilityResponse, trajectResponse] = await Promise.all([
        fetch(`/api/cal/bookings?t=${cacheBust}`, { cache: 'no-store' }),
        fetch(`/api/admin/cal-availability?t=${cacheBust}`, {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${sessionToken}` },
        }),
        fetch(`/api/admin/agenda-traject-dagen?t=${cacheBust}`, {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${sessionToken}` },
        }),
      ])
      const [bookingsPayload, availabilityPayload, trajectPayload] = await Promise.all([
        bookingsResponse.json(), availabilityResponse.json(), trajectResponse.json(),
      ])
      if (!bookingsResponse.ok) throw new Error(bookingsPayload.error || 'Afspraken laden mislukt.')
      if (!availabilityResponse.ok) throw new Error(availabilityPayload.error || 'Beschikbaarheid laden mislukt.')
      if (!trajectResponse.ok) throw new Error(trajectPayload.error || 'Traject-dagen laden mislukt.')
      setBookings((bookingsPayload.bookings || []).filter((booking: CalBooking) =>
        booking.eventTypeId !== TRAJECT_BLOK_DAG_EVENT_TYPE_ID
        && booking.status?.toLowerCase() !== 'cancelled'
      ))
      setAvailability(availabilityPayload.treatments || [])
      setTrajectClasses(trajectPayload.trajectDagen || [])
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Agenda laden mislukt.')
    } finally {
      setLoading(false)
    }
  }, [sessionToken])

  useEffect(() => { loadAgenda() }, [loadAgenda])

  const items = useMemo<CalendarItem[]>(() => [
    ...bookings.map(booking => ({
      id: `booking-${booking.uid || booking.id}`,
      kind: 'booking' as const,
      date: localDateFromIso(booking.startTime),
      startTime: localTimeFromIso(booking.startTime),
      endTime: localTimeFromIso(booking.endTime),
      title: booking.eventTypeTitle,
      status: booking.status,
      customer: booking.customerName || booking.customerEmail,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
    })),
    ...availability.flatMap(treatment => treatment.overrides.map(override => ({
      id: `override-${treatment.key}-${override.date}-${override.startTime}`,
      kind: 'override' as const,
      date: override.date,
      startTime: override.startTime,
      endTime: override.endTime,
      title: treatment.name,
      treatmentKey: treatment.key,
    }))),
    ...trajectClasses.flatMap(traject => traject.blok_dagen.map(day => ({
      id: `traject-${traject.id}-${day}`,
      kind: 'traject-day' as const,
      date: day,
      startTime: traject.starttijd,
      endTime: traject.eindtijd,
      title: traject.titel || traject.cursus_naam,
      courseName: traject.cursus_naam,
      status: traject.status,
      paidCount: traject.betaald_aantal,
      maxParticipants: traject.max_deelnemers,
    }))),
  ], [availability, bookings, trajectClasses])

  const visibleDays = useMemo(() => {
    const start = view === 'week' ? startOfWeek(cursor) : startOfMonthGrid(cursor)
    return Array.from({ length: view === 'week' ? 7 : 42 }, (_, index) => addDays(start, index))
  }, [cursor, view])
  const selectedItems = items.filter(item => item.date === selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime))
  const selectedItem = selectedItemId ? items.find(item => item.id === selectedItemId) || null : null
  const trajectForDate = (date: string) => trajectClasses.find(traject => traject.blok_dagen.includes(date))
  const selectedTraject = trajectForDate(selectedDate)
  const addDisabled = loading || Boolean(selectedTraject)
  const addDisabledExplanation = selectedTraject
    ? `Op deze dag loopt een traject (${selectedTraject.cursus_naam}) — geen behandelingen mogelijk.`
    : null

  const navigate = (direction: number) => {
    const next = new Date(cursor)
    if (view === 'month') next.setMonth(next.getMonth() + direction)
    else next.setDate(next.getDate() + direction * 7)
    setCursor(next)
  }

  const selectDate = (date: string) => {
    setSelectedDate(date)
    setSelectedItemId(null)
  }

  const selectItem = (item: CalendarItem) => {
    if (item.kind === 'override') return
    setSelectedDate(item.date)
    setSelectedItemId(item.id)
  }

  const openAdd = (date = selectedDate) => {
    setSelectedDate(date)
    const traject = trajectForDate(date)
    if (traject) {
      setModalOpen(false)
      setSuccess(null)
      setError(trajectConflictMessage(traject))
      return
    }
    setSlotTime('09:00')
    setSlotEndTime(defaultEndTime('09:00', treatmentKey))
    setEndTimeEdited(false)
    setError(null)
    setSuccess(null)
    setModalOpen(true)
  }

  const changeTreatment = (nextTreatmentKey: TreatmentKey) => {
    setTreatmentKey(nextTreatmentKey)
    if (!endTimeEdited) setSlotEndTime(defaultEndTime(slotTime, nextTreatmentKey))
  }

  const changeStartTime = (nextStartTime: string) => {
    setSlotTime(nextStartTime)
    if (!endTimeEdited) setSlotEndTime(defaultEndTime(nextStartTime, treatmentKey))
  }

  const saveOverride = async () => {
    if (saving) return
    const traject = trajectForDate(selectedDate)
    if (traject) {
      setSuccess(null)
      setError(trajectConflictMessage(traject))
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch('/api/admin/cal-availability', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ treatmentKey, date: selectedDate, startTime: slotTime, endTime: slotEndTime }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Tijdslot opslaan mislukt.')
      setModalOpen(false)
      setSuccess(`${TREATMENT_LABELS[treatmentKey].name} is boekbaar gemaakt op ${selectedDate} van ${slotTime} tot ${slotEndTime}.`)
      await loadAgenda()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Tijdslot opslaan mislukt.')
    } finally {
      setSaving(false)
    }
  }

  const removeOverride = async (item: CalendarItem) => {
    if (!item.treatmentKey || deleting) return
    if (!window.confirm(`Boekbaar moment ${item.title} om ${item.startTime} verwijderen? Bestaande afspraken blijven staan.`)) return
    setDeleting(item.id)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch('/api/admin/cal-availability', {
        method: 'DELETE',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ treatmentKey: item.treatmentKey, date: item.date, startTime: item.startTime, endTime: item.endTime }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Tijdslot verwijderen mislukt.')
      setSuccess('Het boekbare moment is verwijderd. Bestaande afspraken zijn niet gewijzigd.')
      await loadAgenda()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Tijdslot verwijderen mislukt.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-[12px] font-semibold tracking-[0.1em] uppercase text-[#888]">Agenda & beschikbaarheid</h3>
          <p className="text-[11px] text-[#aaa] mt-1">Afspraken en boekbare momenten rechtstreeks uit Cal.com.</p>
        </div>
        <div className="flex items-start gap-2 flex-wrap">
          <div className="flex rounded-full border border-[#e5e5e5] bg-white p-1">
            {(['month', 'week'] as ViewMode[]).map(mode => (
              <button key={mode} onClick={() => setView(mode)} className={`px-3 py-1.5 rounded-full text-[11px] ${view === mode ? 'bg-[#0C0A07] text-white' : 'text-[#777]'}`}>{mode === 'month' ? 'Maand' : 'Week'}</button>
            ))}
          </div>
          <button onClick={loadAgenda} className="px-3 py-2 rounded-full border border-[#e5e5e5] bg-white text-[11px] text-[#666]">Vernieuwen</button>
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={() => openAdd()}
              disabled={addDisabled}
              aria-describedby={addDisabledExplanation ? 'agenda-add-disabled-explanation' : undefined}
              title={addDisabledExplanation || undefined}
              className="px-4 py-2 rounded-full bg-[#0C0A07] text-white text-[11px] font-semibold disabled:bg-[#e3e1dd] disabled:text-[#999] disabled:cursor-not-allowed"
            >
              + Tijdslot
            </button>
            {addDisabledExplanation && <p id="agenda-add-disabled-explanation" className="max-w-[290px] text-right text-[10px] leading-relaxed text-[#8a6d3b]">{addDisabledExplanation}</p>}
          </div>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-[12px] text-red-700">⚠️ {error}</div>}
      {success && <div role="status" className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-[12px] text-green-700">✓ {success}</div>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start">
      <div className="min-w-0 bg-white rounded-2xl border border-[#eee] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 flex items-center justify-between border-b border-[#eee]">
          <button onClick={() => navigate(-1)} aria-label="Vorige periode" className="w-9 h-9 rounded-full border border-[#eee] text-[#777]">←</button>
          <div className="text-center">
            <h4 className="font-['Cormorant_Garamond'] text-[23px] capitalize">{monthTitle(cursor)}</h4>
            <button onClick={() => { const today = new Date(); setCursor(today); selectDate(dateKey(today)) }} className="text-[10px] text-[#9a7838]">Naar vandaag</button>
          </div>
          <button onClick={() => navigate(1)} aria-label="Volgende periode" className="w-9 h-9 rounded-full border border-[#eee] text-[#777]">→</button>
        </div>
        <div className="grid grid-cols-7 border-b border-[#eee] bg-[#faf9f7]">
          {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => <div key={day} className="py-2 text-center text-[9px] font-semibold tracking-wider uppercase text-[#999]">{day}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {visibleDays.map(day => {
            const key = dateKey(day)
            const dayItems = items.filter(item => item.date === key)
            const muted = view === 'month' && day.getMonth() !== cursor.getMonth()
            const selected = key === selectedDate
            return (
              <button key={key} type="button" onClick={() => selectDate(key)} onDoubleClick={() => openAdd(key)} className={`min-h-[82px] sm:min-h-[116px] p-1.5 sm:p-2 text-left border-r border-b border-[#f0f0f0] transition ${selected ? 'bg-[#C4A265]/8 ring-1 ring-inset ring-[#C4A265]' : 'hover:bg-[#fafafa]'}`}>
                <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-[11px] ${key === dateKey(new Date()) ? 'bg-[#0C0A07] text-white' : muted ? 'text-[#ccc]' : 'text-[#555]'}`}>{day.getDate()}</span>
                <div className="mt-1 space-y-1 overflow-hidden">
                  {dayItems.slice(0, view === 'week' ? 5 : 3).map(item => <div key={item.id} onClick={event => { if (item.kind !== 'override') { event.stopPropagation(); selectItem(item) } }} className={`rounded px-1.5 py-1 text-[8px] sm:text-[9px] leading-tight truncate ${item.kind !== 'override' ? 'cursor-pointer hover:brightness-95' : ''} ${item.kind === 'booking' ? 'bg-green-50 text-green-700 border border-green-100' : item.kind === 'traject-day' ? 'bg-violet-50 text-violet-700 border border-violet-200' : 'bg-[#C4A265]/15 text-[#80642e] border border-[#C4A265]/20'}`}><b>{item.startTime}</b> <span className="hidden sm:inline">{item.title}{item.kind === 'traject-day' ? ` · ${item.paidCount}/${item.maxParticipants}` : ''}</span></div>)}
                  {dayItems.length > (view === 'week' ? 5 : 3) && <div className="text-[8px] text-[#999] px-1">+{dayItems.length - (view === 'week' ? 5 : 3)} meer</div>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden lg:sticky lg:top-[130px]">
        <div className="px-5 py-4 border-b border-[#eee] flex items-start justify-between gap-3">
          <div><h4 className="font-['Cormorant_Garamond'] text-[22px] capitalize">{longDate(selectedDate)}</h4><p className="text-[10px] text-[#aaa]">{selectedItems.length} item{selectedItems.length === 1 ? '' : 's'}</p></div>
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={() => openAdd(selectedDate)}
              disabled={addDisabled}
              aria-describedby={addDisabledExplanation ? 'day-detail-add-disabled-explanation' : undefined}
              title={addDisabledExplanation || undefined}
              className="rounded-full px-3 py-1.5 text-[11px] font-semibold text-[#9a7838] disabled:bg-[#f0efec] disabled:text-[#aaa] disabled:cursor-not-allowed"
            >
              + Boekbaar moment
            </button>
            {addDisabledExplanation && <p id="day-detail-add-disabled-explanation" className="max-w-[320px] text-right text-[10px] leading-relaxed text-[#8a6d3b]">{addDisabledExplanation}</p>}
          </div>
        </div>
        {selectedItem && <div className="border-b border-[#eee] bg-[#faf9f7] px-5 py-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#9a7838]">{selectedItem.kind === 'booking' ? 'Afspraakdetails' : 'Traject-details'}</p>
              <h5 className="mt-1 font-['Cormorant_Garamond'] text-[23px] leading-tight">{selectedItem.kind === 'booking' ? selectedItem.customer || 'Onbekende klant' : selectedItem.courseName || selectedItem.title}</h5>
            </div>
            <button type="button" onClick={() => setSelectedItemId(null)} aria-label="Details sluiten" className="rounded-full border border-[#e5e2dc] bg-white px-2.5 py-1 text-[11px] text-[#777]">✕</button>
          </div>
          <dl className="grid gap-3 text-[11px]">
            <div><dt className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#999]">{selectedItem.kind === 'booking' ? 'Behandeling' : 'Cursus'}</dt><dd className="mt-0.5 text-[13px] text-[#333]">{selectedItem.kind === 'booking' ? selectedItem.title : selectedItem.courseName || selectedItem.title}</dd></div>
            <div><dt className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#999]">Tijd</dt><dd className="mt-0.5 text-[13px] text-[#333]">{selectedItem.startTime}–{selectedItem.endTime}</dd></div>
            {selectedItem.kind === 'booking' && (selectedItem.customerEmail || selectedItem.customerPhone) && <div><dt className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#999]">Contact</dt><dd className="mt-1 flex flex-col gap-1">{selectedItem.customerEmail && <a href={`mailto:${selectedItem.customerEmail}`} className="break-all text-[#80642e] hover:underline">{selectedItem.customerEmail}</a>}{selectedItem.customerPhone && <a href={`tel:${selectedItem.customerPhone}`} className="text-[#80642e] hover:underline">{selectedItem.customerPhone}</a>}</dd></div>}
            {selectedItem.kind === 'traject-day' && <div><dt className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#999]">Deelnemers</dt><dd className="mt-0.5 text-[13px] text-[#333]">{selectedItem.paidCount}/{selectedItem.maxParticipants} betaald</dd></div>}
          </dl>
        </div>}
        {loading ? <div className="p-8 text-center text-[13px] text-[#888]">Agenda laden…</div> : selectedItems.length === 0 ? <div className="p-8 text-center text-[13px] text-[#888]">Deze dag is leeg.</div> : (
          <div className="divide-y divide-[#f3f3f3]">{selectedItems.map(item => (
            <div key={item.id} onClick={() => selectItem(item)} className={`px-5 py-4 flex items-center gap-4 ${item.kind !== 'override' ? 'cursor-pointer transition hover:bg-[#faf9f7]' : ''} ${selectedItemId === item.id ? 'bg-[#C4A265]/10' : ''}`}>
              <div className="w-[64px] shrink-0"><p className="text-[17px] font-semibold">{item.startTime}</p><p className="text-[10px] text-[#aaa]">tot {item.endTime}</p></div>
              <div className="flex-1 min-w-0"><p className="text-[13px] font-medium truncate">{item.title}</p><p className="text-[10px] text-[#888] mt-0.5">{item.kind === 'booking' ? `${item.customer || 'Klant'} · ${item.status || 'Geboekt'}` : item.kind === 'traject-day' ? `${item.paidCount}/${item.maxParticipants} deelnemers · ${item.status}` : 'Boekbaar via Cal.com'}</p></div>
              <span className={`text-[9px] px-2.5 py-1 rounded-full border font-semibold ${item.kind === 'booking' ? 'border-green-200 bg-green-50 text-green-700' : item.kind === 'traject-day' ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-[#C4A265]/30 bg-[#C4A265]/10 text-[#80642e]'}`}>{item.kind === 'booking' ? 'Afspraak' : item.kind === 'traject-day' ? 'Traject-dag' : 'Boekbaar'}</span>
              {item.kind === 'override' && <button onClick={() => removeOverride(item)} disabled={deleting === item.id} className="text-[11px] text-[#aaa] hover:text-red-600 disabled:opacity-40" aria-label="Tijdslot verwijderen">{deleting === item.id ? '…' : '✕'}</button>}
            </div>
          ))}</div>
        )}
      </div>
      </div>

      {modalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/35 p-4 py-6 backdrop-blur-sm" onClick={() => !saving && setModalOpen(false)}>
        <div className="max-h-[calc(100dvh-3rem)] w-full max-w-[440px] overflow-y-auto rounded-2xl border border-[#eee] bg-white p-6 shadow-2xl sm:p-8" onClick={event => event.stopPropagation()}>
          <div className="flex items-start justify-between mb-6"><div><h4 className="font-['Cormorant_Garamond'] text-[25px]">Boekbaar moment toevoegen</h4><p className="text-[11px] text-[#999] mt-1 capitalize">{longDate(selectedDate)}</p></div><button onClick={() => setModalOpen(false)} className="text-[#999]">✕</button></div>
          {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">⚠️ {error}</div>}
          <div className="space-y-4">
            <div><label className="block text-[10px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5">Behandeling</label><select value={treatmentKey} onChange={event => changeTreatment(event.target.value as TreatmentKey)} className="w-full px-4 py-3 rounded-xl border border-[#ddd] bg-white text-[13px] focus:outline-none focus:border-[#C4A265]"><option value="new_lash_set">New Lash Set · 180 min</option><option value="fill_lash_set">Fill Lash Set · 120 min</option></select></div>
            <div><label className="block text-[10px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5">Datum</label><input type="date" value={selectedDate} min={dateKey(new Date())} onChange={event => { const nextDate = event.target.value; setSelectedDate(nextDate); const traject = trajectForDate(nextDate); setError(traject ? trajectConflictMessage(traject) : null) }} className="w-full px-4 py-3 rounded-xl border border-[#ddd] text-[13px] focus:outline-none focus:border-[#C4A265]" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[10px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5">Starttijd</label><input type="time" min="09:00" max="18:59" step="1800" value={slotTime} onChange={event => changeStartTime(event.target.value)} className="w-full px-4 py-3 rounded-xl border border-[#ddd] text-[13px] focus:outline-none focus:border-[#C4A265]" /></div>
              <div><label className="block text-[10px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5">Eindtijd</label><input type="time" min="09:01" max="19:00" step="1800" value={slotEndTime} onChange={event => { setSlotEndTime(event.target.value); setEndTimeEdited(true) }} className="w-full px-4 py-3 rounded-xl border border-[#ddd] text-[13px] focus:outline-none focus:border-[#C4A265]" /></div>
            </div>
            <p className="text-[10px] text-[#999] -mt-2">Werkdag 09:00–19:00 · de eindtijd volgt automatisch tot je die zelf aanpast.</p>
          </div>
          <div className="flex gap-3 mt-7"><button onClick={() => setModalOpen(false)} disabled={saving} className="flex-1 py-3 rounded-full border border-[#eee] text-[13px] text-[#888]">Annuleren</button><button onClick={saveOverride} disabled={saving || Boolean(trajectForDate(selectedDate))} className="flex-1 py-3 rounded-full bg-[#0C0A07] text-white font-semibold text-[13px] disabled:opacity-50">{saving ? 'Opslaan…' : 'Boekbaar maken'}</button></div>
        </div>
      </div>}
    </div>
  )
}
