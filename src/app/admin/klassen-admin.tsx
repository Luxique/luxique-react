'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { berekenWerkdagenBlok } from '@/lib/traject'

/**
 * KlassenAdmin — Chiva's klassenbeheer
 *
 * Koppelt aan bestaande API's:
 *   GET    /api/traject/klassen      — publieke lijst (alleen open/vol, toekomst)
 *   GET    /api/traject/cursussen    — vaste cursusdefinities
 *   POST   /api/admin/klassen        — nieuwe klas
 *   PATCH  /api/admin/klassen/[id]   — wijzig klas
 *   DELETE /api/admin/klassen/[id]   — verwijder klas
 *
 * Voor admin-overzicht halen we ALLE klassen op (ook geannuleerd/verleden)
 * via de publieke endpoint gefilterd — maar die filtert op toekomst+open/vol.
 * We moeten dus een aparte admin-lijst fetchen. Omdat er geen admin-GET is,
 * gebruiken we de publieke GET en tonen alleen toekomstige klassen.
 * (Max verlagen/verwijderen gaat via PATCH/DELETE op /api/admin/klassen/[id].)
 */

// ── Types ──
type Cursus = {
  id: string
  naam: string
  duur_werkdagen: number
  prijs_cents: number
}

type Klas = {
  id: string
  cursus_id: string
  cursus_naam: string | null
  prijs_cents: number | null
  prijs_override_cents?: number | null
  duur_werkdagen: number | null
  startdatum: string
  starttijd: string
  eindtijd?: string | null
  blok_dagen: string[]
  max_deelnemers: number
  plekken_over: number
  vol: boolean
  status: string
  weergave_titel: string | null
  weergave_beschrijving: string | null
}

type Tab = 'overzicht' | 'nieuw' | 'persoonlijk'

// ── helpers ──
const fmtDate = (iso: string): string => {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
}

const fmtDateRange = (blok: string[]): string => {
  if (!blok || blok.length === 0) return '—'
  if (blok.length === 1) return fmtDate(blok[0])
  return `${fmtDate(blok[0])} t/m ${fmtDate(blok[blok.length - 1])}`
}

const fmtPrice = (cents: number | null): string => {
  if (cents == null) return '—'
  return `€${(cents / 100).toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const isWeekend = (iso: string): boolean => {
  const d = new Date(iso + 'T00:00:00')
  return d.getDay() === 0 || d.getDay() === 6
}

// ── Icon set ──
function IconCalendar() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg> }
function IconPlus() { return <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg> }
function IconTrash() { return <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg> }

export default function KlassenAdmin() {
  const { session } = useAuth()
  const [tab, setTab] = useState<Tab>('overzicht')
  const [klassen, setKlassen] = useState<Klas[]>([])
  const [cursussen, setCursussen] = useState<Cursus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  }), [session])

  const fetchKlassen = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [klasRes, cursRes] = await Promise.all([
        fetch('/api/traject/klassen', { cache: 'no-store' }),
        fetch('/api/traject/cursussen', { cache: 'no-store' }),
      ])
      if (!klasRes.ok) throw new Error(`Klassen ophalen mislukt (HTTP ${klasRes.status})`)
      if (!cursRes.ok) throw new Error(`Cursussen ophalen mislukt (HTTP ${cursRes.status})`)
      const klasData = await klasRes.json()
      const cursData = await cursRes.json()
      setKlassen(klasData.klassen || [])
      setCursussen(cursData.cursussen || [])
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchKlassen() }, [fetchKlassen])

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {([
          { key: 'overzicht', label: 'Overzicht' },
          { key: 'nieuw', label: 'Nieuwe klas' },
          { key: 'persoonlijk', label: 'Persoonlijk traject' },
        ] as { key: Tab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 rounded-full text-[12px] font-medium transition border ${
              tab === t.key
                ? 'bg-[#0C0A07] text-white border-[#0C0A07]'
                : 'bg-white text-[#666] border-[#eee] hover:border-[#C4A265]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-[13px]">
          ⚠️ {error}
        </div>
      )}

      {tab === 'overzicht' && (
        <Overzicht
          klassen={klassen}
          cursussen={cursussen}
          loading={loading}
          authHeaders={authHeaders}
          onChanged={fetchKlassen}
        />
      )}

      {tab === 'nieuw' && (
        <NieuweKlasForm
          cursussen={cursussen}
          authHeaders={authHeaders}
          onCreated={() => { fetchKlassen(); setTab('overzicht') }}
        />
      )}

      {tab === 'persoonlijk' && (
        <PersoonlijkTrajectForm
          cursussen={cursussen}
          authHeaders={authHeaders}
          onCreated={() => { fetchKlassen(); setTab('overzicht') }}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// OVERZICHT
// ═══════════════════════════════════════════════════════════════════

function Overzicht({
  klassen,
  loading,
  authHeaders,
  onChanged,
}: {
  klassen: Klas[]
  cursussen: Cursus[]
  loading: boolean
  authHeaders: Record<string, string>
  onChanged: () => void
}) {
  const [patching, setPatching] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Klas | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const handleMaxChange = async (klas: Klas, newMax: number) => {
    setPatching(klas.id)
    setFeedback(null)
    try {
      const res = await fetch(`/api/admin/klassen/${klas.id}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ max_deelnemers: newMax }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      setFeedback(`✓ Max voor "${klas.cursus_naam}" bijgewerkt naar ${newMax}`)
      onChanged()
    } catch (e: unknown) {
      setFeedback(`⚠️ ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setPatching(null)
    }
  }

  const handleDelete = async (klas: Klas) => {
    setPatching(klas.id)
    setFeedback(null)
    try {
      const res = await fetch(`/api/admin/klassen/${klas.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      setFeedback(`✓ Klas verwijderd. cal.com-blokkades opgeruimd.`)
      setConfirmDelete(null)
      onChanged()
    } catch (e: unknown) {
      setFeedback(`⚠️ ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setPatching(null)
    }
  }

  if (loading) {
    return <div className="bg-white rounded-2xl border border-[#eee] p-8 text-center text-[13px] text-[#888]">Klassen laden...</div>
  }

  if (klassen.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#eee] p-8 text-center">
        <p className="text-[14px] text-[#888] mb-2">Nog geen klassen gepland.</p>
        <p className="text-[12px] text-[#aaa]">Maak een nieuwe klas aan via de tab hierboven.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {feedback && (
        <div className={`rounded-xl px-5 py-3 text-[13px] border ${
          feedback.startsWith('✓')
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {klassen.map(klas => {
          const betaald = klas.max_deelnemers - klas.plekken_over
          const isCustom = Boolean(klas.weergave_titel)
          const bezettingPct = klas.max_deelnemers > 0
            ? Math.min(100, (betaald / klas.max_deelnemers) * 100)
            : 0
          return (
            <div key={klas.id} className="bg-white rounded-2xl border border-[#eee] p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {isCustom && (
                      <span className="text-[9px] font-semibold tracking-[0.1em] uppercase bg-[#C4A265] text-white px-2 py-0.5 rounded-full">
                        Persoonlijk traject
                      </span>
                    )}
                    <span className={`text-[9px] font-semibold tracking-[0.1em] uppercase px-2 py-0.5 rounded-full ${
                      klas.status === 'open'
                        ? 'bg-green-50 text-green-600'
                        : klas.status === 'vol'
                        ? 'bg-orange-50 text-orange-600'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {klas.status}
                    </span>
                  </div>
                  <h3 className="font-['Cormorant_Garamond'] text-[20px] text-[#1a1a1a] leading-tight">
                    {isCustom ? klas.weergave_titel : klas.cursus_naam}
                  </h3>
                  {isCustom && klas.cursus_naam && (
                    <p className="text-[11px] text-[#aaa] mt-0.5">Basis: {klas.cursus_naam}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888]">{klas.starttijd}{klas.eindtijd ? ` – ${klas.eindtijd}` : ' – 16:00'}</p>
                  <p className="text-[11px] text-[#aaa]">{fmtPrice(klas.prijs_override_cents ?? klas.prijs_cents)}</p>
                </div>
              </div>

              {/* Datum/blok */}
              <div className="flex items-center gap-2 text-[13px] text-[#666] mb-3">
                <IconCalendar />
                <span>{fmtDateRange(klas.blok_dagen)}</span>
                <span className="text-[#ccc]">·</span>
                <span>{klas.blok_dagen.length} dag{klas.blok_dagen.length !== 1 ? 'en' : ''}</span>
              </div>

              {isCustom && klas.weergave_beschrijving && (
                <p className="text-[12px] text-[#888] italic mb-3 line-clamp-2">{klas.weergave_beschrijving}</p>
              )}

              {/* Bezetting */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-[#888]">
                    Bezetting: <b className="text-[#1a1a1a]">{betaald}</b> / {klas.max_deelnemers} betaald
                  </span>
                  <span className="text-[#C4A265] font-medium">
                    {klas.plekken_over} plek{klas.plekken_over !== 1 ? 'en' : ''} vrij
                  </span>
                </div>
                <div className="h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      bezettingPct >= 100 ? 'bg-[#C4A265]' : 'bg-[#0C0A07]'
                    }`}
                    style={{ width: `${bezettingPct}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-[#f5f5f5]">
                {/* Max verlagen */}
                <label className="text-[11px] text-[#888]">Max:</label>
                <select
                  value={klas.max_deelnemers}
                  onChange={e => handleMaxChange(klas, parseInt(e.target.value, 10))}
                  disabled={patching === klas.id}
                  className="px-3 py-1.5 rounded-lg border border-[#ddd] text-[12px] focus:outline-none focus:border-[#C4A265] disabled:opacity-50"
                >
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                    <option
                      key={n}
                      value={n}
                      disabled={n < betaald}
                    >
                      {n}{n < betaald ? ' (onder betaald)' : ''}
                    </option>
                  ))}
                </select>

                {/* Verwijder */}
                <button
                  onClick={() => setConfirmDelete(klas)}
                  disabled={patching === klas.id}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#eee] text-[12px] text-[#888] hover:border-red-300 hover:text-red-600 transition disabled:opacity-50"
                >
                  <IconTrash />
                  Verwijderen
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Delete confirm dialog */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-white rounded-2xl p-8 w-[440px] shadow-2xl border border-[#eee]"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-['Cormorant_Garamond'] text-[24px] mb-3">Klas verwijderen?</h3>
            <p className="text-[13px] text-[#666] mb-2">
              Je staat op het punt de klas <b>{confirmDelete.weergave_titel || confirmDelete.cursus_naam}</b> ({fmtDateRange(confirmDelete.blok_dagen)}) te verwijderen.
            </p>
            {(confirmDelete.max_deelnemers - confirmDelete.plekken_over) > 0 ? (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[12px] text-red-700 mb-4">
                ⚠️ Er staan {confirmDelete.max_deelnemers - confirmDelete.plekken_over} betaalde inschrijvingen op deze klas.
                Verwijderen is hierdoor <b>geblokkeerd</b> (API geeft HTTP 403).
                Gebruik in plaats daarvan "annuleer" (status wijzigen).
              </div>
            ) : (
              <p className="text-[12px] text-[#888] mb-4">
                Geen betaalde inschrijvingen. cal.com-blokkades worden automatisch opgeruimd.
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-full border border-[#eee] text-[13px] text-[#888]"
              >
                Annuleren
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={(confirmDelete.max_deelnemers - confirmDelete.plekken_over) > 0 || patching === confirmDelete.id}
                className="flex-1 py-3 rounded-full bg-red-600 text-white font-semibold text-[13px] hover:bg-red-700 transition disabled:opacity-50"
              >
                {patching === confirmDelete.id ? 'Verwijderen...' : 'Verwijderen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// NIEUWE KLAS FORM
// ═══════════════════════════════════════════════════════════════════

function NieuweKlasForm({
  cursussen,
  authHeaders,
  onCreated,
  isPersoonlijk = false,
}: {
  cursussen: Cursus[]
  authHeaders: Record<string, string>
  onCreated: () => void
  isPersoonlijk?: boolean
}) {
  const [cursusId, setCursusId] = useState('')
  const [startdatum, setStartdatum] = useState('')
  const [starttijd, setStarttijd] = useState('08:30')
  const [eindtijd, setEindtijd] = useState('16:00')
  const [maxDeelnemers, setMaxDeelnemers] = useState(3)
  const [prijsOverride, setPrijsOverride] = useState('') // empty = use cursus price
  const [weergaveTitel, setWeergaveTitel] = useState('')
  const [weergaveBeschrijving, setWeergaveBeschrijving] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const geselecteerdeCursus = cursussen.find(c => c.id === cursusId) || null
  const weekendStart = startdatum ? isWeekend(startdatum) : false

  const previewBlok = useMemo(() => {
    if (!startdatum || !geselecteerdeCursus) return []
    try {
      return berekenWerkdagenBlok(startdatum, geselecteerdeCursus.duur_werkdagen)
    } catch {
      return []
    }
  }, [startdatum, geselecteerdeCursus])

  const canSave = cursusId && startdatum && starttijd && (!isPersoonlijk || weergaveTitel.trim())

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        cursus_id: cursusId,
        startdatum,
        starttijd,
        eindtijd,
        max_deelnemers: maxDeelnemers,
      }
      // Add prijs_override_cents only if filled in (empty = use cursus price)
      if (prijsOverride.trim()) {
        const euros = parseFloat(prijsOverride.replace(',', '.')) || 0
        body.prijs_override_cents = Math.round(euros * 100)
      }
      if (isPersoonlijk) {
        body.weergave_titel = weergaveTitel.trim()
        body.weergave_beschrijving = weergaveBeschrijving.trim() || null
      }
      const res = await fetch('/api/admin/klassen', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      // Reset
      setCursusId('')
      setStartdatum('')
      setStarttijd('08:30')
      setEindtijd('16:00')
      setMaxDeelnemers(3)
      setPrijsOverride('')
      setWeergaveTitel('')
      setWeergaveBeschrijving('')
      onCreated()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#eee] p-6 max-w-[640px]">
      <h3 className="font-['Cormorant_Garamond'] text-[22px] text-[#1a1a1a] mb-1">
        {isPersoonlijk ? 'Persoonlijk traject aanmaken' : 'Nieuwe klas aanmaken'}
      </h3>
      <p className="text-[12px] text-[#888] mb-6">
        {isPersoonlijk
          ? 'Een op-maat traject met eigen titel en beschrijving. Verschijnt in een aparte sectie onderaan de trajecten-pagina.'
          : 'Plan een nieuwe klas voor een bestaande cursus. Verschijnt op de trajecten-pagina zodra de status "open" is.'}
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-[12px] mb-4">
          ⚠️ {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Cursus */}
        <div>
          <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">Cursus</label>
          <select
            value={cursusId}
            onChange={e => setCursusId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265]"
          >
            <option value="">Selecteer cursus...</option>
            {cursussen.map(c => (
              <option key={c.id} value={c.id}>
                {c.naam} ({c.duur_werkdagen} dag{c.duur_werkdagen !== 1 ? 'en' : ''})
              </option>
            ))}
          </select>
        </div>

        {/* Datum + tijd + max */}
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">Startdatum</label>
            <input
              type="date"
              value={startdatum}
              onChange={e => setStartdatum(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265]"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">Starttijd</label>
            <input
              type="time"
              value={starttijd}
              onChange={e => setStarttijd(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265]"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">Eindtijd</label>
            <input
              type="time"
              value={eindtijd}
              onChange={e => setEindtijd(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265]"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">
              {isPersoonlijk ? 'Plekten' : 'Max'}
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMaxDeelnemers(m => Math.max(1, m - 1))}
                className="w-9 h-9 rounded-lg border border-[#ddd] text-[16px] text-[#666] hover:border-[#C4A265]"
              >−</button>
              <input
                type="number"
                min={1}
                max={20}
                value={maxDeelnemers}
                onChange={e => setMaxDeelnemers(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className="w-full text-center px-2 py-2.5 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265]"
              />
              <button
                type="button"
                onClick={() => setMaxDeelnemers(m => Math.min(20, m + 1))}
                className="w-9 h-9 rounded-lg border border-[#ddd] text-[16px] text-[#666] hover:border-[#C4A265]"
              >+</button>
            </div>
          </div>
        </div>

        {/* Prijs override (optional) */}
        <div>
          <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">
            Prijs per klas (optioneel) — leeg = cursusprijs
          </label>
          <input
            type="text"
            value={prijsOverride}
            onChange={e => setPrijsOverride(e.target.value)}
            placeholder={geselecteerdeCursus ? `Standaard: €${(geselecteerdeCursus.prijs_cents / 100).toFixed(2).replace('.', ',')}` : 'bijv. 1450,00'}
            className="w-full px-4 py-3 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265]"
          />
          <p className="text-[10px] text-[#aaa] mt-1">Vul alleen een prijs in als deze klas een afwijkende prijs moet hebben.</p>
        </div>

        {/* Weekend waarschuwing */}
        {weekendStart && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 text-[12px] text-orange-700">
            ⚠️ Geselecteerde startdatum is in het weekend. De API schuift automatisch op naar maandag.
          </div>
        )}

        {/* LIVE PREVIEW blok-dagen */}
        {previewBlok.length > 0 && (
          <div className="bg-[#fafaf8] border border-[#eee] rounded-xl px-4 py-3">
            <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-2">Blok-dagen (preview)</p>
            <div className="flex flex-wrap gap-2">
              {previewBlok.map((d, i) => (
                <span key={d} className="text-[12px] bg-white border border-[#eee] rounded-lg px-2.5 py-1 text-[#666]">
                  <b className="text-[#C4A265]">D{i + 1}</b> · {fmtDate(d)}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-[#aaa] mt-2">
              {previewBlok.length} werkdag{previewBlok.length !== 1 ? 'en' : ''} · berekend met berekenWerkdagenBlok
            </p>
          </div>
        )}

        {/* Persoonlijk traject extra velden */}
        {isPersoonlijk && (
          <div className="space-y-4 pt-2 border-t border-[#f0f0f0]">
            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">
                Weergave-titel <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={weergaveTitel}
                onChange={e => setWeergaveTitel(e.target.value)}
                placeholder="bijv. 1-op-1 Signature Dag"
                className="w-full px-4 py-3 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265]"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">Beschrijving</label>
              <textarea
                value={weergaveBeschrijving}
                onChange={e => setWeergaveBeschrijving(e.target.value)}
                placeholder="Korte beschrijving van dit traject op maat..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265] resize-none"
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSubmit}
            disabled={!canSave || saving}
            className="flex-1 py-3 rounded-full bg-[#0C0A07] text-white font-semibold text-[13px] hover:bg-[#333] transition disabled:opacity-50"
          >
            {saving ? 'Aanmaken...' : isPersoonlijk ? 'Persoonlijk traject aanmaken' : 'Klas aanmaken'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Persoonlijk traject form (reuses NieuweKlasForm with isPersoonlijk) ──
function PersoonlijkTrajectForm({
  cursussen,
  authHeaders,
  onCreated,
}: {
  cursussen: Cursus[]
  authHeaders: Record<string, string>
  onCreated: () => void
}) {
  return (
    <NieuweKlasForm
      cursussen={cursussen}
      authHeaders={authHeaders}
      onCreated={onCreated}
      isPersoonlijk
    />
  )
}
