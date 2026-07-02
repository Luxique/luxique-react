'use client'

import { useEffect, useState, useCallback } from 'react'

/**
 * TrajectInstellingenPaneel
 *
 * Admin-paneel voor:
 *  - Boekings-timing (voorsprong + horizon)
 *  - Werktijden (ochtendblok + middagblok)
 *
 * Leest via GET /api/traject/settings
 * Schrijft via PUT /api/traject/settings
 */

interface TrajectSettings {
  id: string
  traject_voorsprong_weken: number
  boekbare_horizon_weken: number
  werktijd_ochtend_start: string
  werktijd_ochtend_eind: string
  werktijd_middag_start: string
  werktijd_middag_eind: string
  pauze_lengte_minuten: number
  pauze_inclusief: boolean
  bijgewerkt_op: string | null
}

interface TrajectCursus {
  id: string
  naam: string
  duur_werkdagen: number
  duur_uren_per_dag: number | null
  prijs_cents: number
  actief: boolean
}

const DEFAULTS = {
  traject_voorsprong_weken: '2',
  boekbare_horizon_weken: '8',
  werktijd_ochtend_start: '09:00',
  werktijd_ochtend_eind: '12:00',
  werktijd_middag_start: '13:00',
  werktijd_middag_eind: '19:00',
}

export default function TrajectInstellingenPaneel() {
  const [settings, setSettings] = useState<TrajectSettings | null>(null)
  const [voorsprong, setVoorsprong] = useState(DEFAULTS.traject_voorsprong_weken)
  const [horizon, setHorizon] = useState(DEFAULTS.boekbare_horizon_weken)
  const [ochtendStart, setOchtendStart] = useState(DEFAULTS.werktijd_ochtend_start)
  const [ochtendEind, setOchtendEind] = useState(DEFAULTS.werktijd_ochtend_eind)
  const [middagStart, setMiddagStart] = useState(DEFAULTS.werktijd_middag_start)
  const [middagEind, setMiddagEind] = useState(DEFAULTS.werktijd_middag_eind)
  const [pauzeLengte, setPauzeLengte] = useState('60')
  const [pauzeInclusief, setPauzeInclusief] = useState(false)

  const [cursussen, setCursussen] = useState<TrajectCursus[]>([])
  const [cursusEdits, setCursusEdits] = useState<Record<string, string>>({})
  const [cursusOpslaan, setCursusOpslaan] = useState<string | null>(null)
  const [cursusBericht, setCursusBericht] = useState<Record<string, { type: 'success' | 'error'; text: string }>>({})

  const [laden, setLaden] = useState(true)
  const [opslaan, setOpslaan] = useState(false)
  const [bericht, setBericht] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const laad = useCallback(async () => {
    setLaden(true)
    try {
      const res = await fetch('/api/traject/settings', { cache: 'no-store' })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      const data: TrajectSettings = await res.json()
      setSettings(data)
      setVoorsprong(String(data.traject_voorsprong_weken))
      setHorizon(String(data.boekbare_horizon_weken))
      setOchtendStart(data.werktijd_ochtend_start || DEFAULTS.werktijd_ochtend_start)
      setOchtendEind(data.werktijd_ochtend_eind || DEFAULTS.werktijd_ochtend_eind)
      setMiddagStart(data.werktijd_middag_start || DEFAULTS.werktijd_middag_start)
      setMiddagEind(data.werktijd_middag_eind || DEFAULTS.werktijd_middag_eind)
      setPauzeLengte(String(data.pauze_lengte_minuten ?? 60))
      setPauzeInclusief(data.pauze_inclusief ?? false)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setBericht({ type: 'error', text: `Laden mislukt: ${msg}` })
    } finally {
      setLaden(false)
    }
  }, [])

  const laadCursussen = useCallback(async () => {
    try {
      const res = await fetch('/api/traject/cursussen', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setCursussen(data.cursussen || [])
    } catch {
      // stillijgend
    }
  }, [])

  useEffect(() => { laad() }, [laad])
  useEffect(() => { laadCursussen() }, [laadCursussen])

  const reset = () => {
    if (!settings) return
    setVoorsprong(String(settings.traject_voorsprong_weken))
    setHorizon(String(settings.boekbare_horizon_weken))
    setOchtendStart(settings.werktijd_ochtend_start || DEFAULTS.werktijd_ochtend_start)
    setOchtendEind(settings.werktijd_ochtend_eind || DEFAULTS.werktijd_ochtend_eind)
    setMiddagStart(settings.werktijd_middag_start || DEFAULTS.werktijd_middag_start)
    setMiddagEind(settings.werktijd_middag_eind || DEFAULTS.werktijd_middag_eind)
    setPauzeLengte(String(settings.pauze_lengte_minuten ?? 60))
    setPauzeInclusief(settings.pauze_inclusief ?? false)
    setBericht(null)
  }

  const opslaanSettings = async () => {
    setOpslaan(true)
    setBericht(null)
    try {
      const res = await fetch('/api/traject/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traject_voorsprong_weken: parseInt(voorsprong, 10),
          boekbare_horizon_weken: parseInt(horizon, 10),
          werktijd_ochtend_start: ochtendStart,
          werktijd_ochtend_eind: ochtendEind,
          werktijd_middag_start: middagStart,
          werktijd_middag_eind: middagEind,
          pauze_lengte_minuten: parseInt(pauzeLengte, 10),
          pauze_inclusief: pauzeInclusief,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      const data: TrajectSettings = await res.json()
      setSettings(data)
      setVoorsprong(String(data.traject_voorsprong_weken))
      setHorizon(String(data.boekbare_horizon_weken))
      setOchtendStart(data.werktijd_ochtend_start || DEFAULTS.werktijd_ochtend_start)
      setOchtendEind(data.werktijd_ochtend_eind || DEFAULTS.werktijd_ochtend_eind)
      setMiddagStart(data.werktijd_middag_start || DEFAULTS.werktijd_middag_start)
      setMiddagEind(data.werktijd_middag_eind || DEFAULTS.werktijd_middag_eind)
      setPauzeLengte(String(data.pauze_lengte_minuten ?? 60))
      setPauzeInclusief(data.pauze_inclusief ?? false)
      setBericht({ type: 'success', text: 'Opgeslagen ✓' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setBericht({ type: 'error', text: `Opslaan mislukt: ${msg}` })
    } finally {
      setOpslaan(false)
      setTimeout(() => setBericht(null), 4000)
    }
  }

  const opslaanCursus = async (id: string) => {
    setCursusOpslaan(id)
    setCursusBericht(prev => ({ ...prev, [id]: { type: 'success', text: '' } }))
    try {
      const val = cursusEdits[id]
      const res = await fetch(`/api/traject/cursussen/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duur_uren_per_dag: Number(val) }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      const updated = await res.json()
      setCursussen(prev => prev.map(c => c.id === id ? { ...c, duur_uren_per_dag: updated.duur_uren_per_dag } : c))
      setCursusEdits(prev => { const n = { ...prev }; delete n[id]; return n })
      setCursusBericht(prev => ({ ...prev, [id]: { type: 'success', text: 'Opgeslagen ✓' } }))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setCursusBericht(prev => ({ ...prev, [id]: { type: 'error', text: msg } }))
    } finally {
      setCursusOpslaan(null)
      setTimeout(() => {
        setCursusBericht(prev => { const n = { ...prev }; delete n[id]; return n })
      }, 4000)
    }
  }

  const gewijzigd =
    settings !== null &&
    (voorsprong !== String(settings.traject_voorsprong_weken) ||
      horizon !== String(settings.boekbare_horizon_weken) ||
      ochtendStart !== (settings.werktijd_ochtend_start || DEFAULTS.werktijd_ochtend_start) ||
      ochtendEind !== (settings.werktijd_ochtend_eind || DEFAULTS.werktijd_ochtend_eind) ||
      middagStart !== (settings.werktijd_middag_start || DEFAULTS.werktijd_middag_start) ||
      middagEind !== (settings.werktijd_middag_eind || DEFAULTS.werktijd_middag_eind) ||
      pauzeLengte !== String(settings.pauze_lengte_minuten ?? 60) ||
      pauzeInclusief !== (settings.pauze_inclusief ?? false))

  if (laden) {
    return (
      <div className="bg-white rounded-2xl border border-[#eee] p-8 text-center">
        <p className="text-[13px] text-[#888]">Instellingen laden...</p>
      </div>
    )
  }

  // Bereken pauze + totaal voor display
  const parseMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  const fmtUur = (min: number) => `${Math.floor(min / 60)}u${min % 60 ? `${min % 60}` : ''}`
  const ochtendMin = parseMin(ochtendEind) - parseMin(ochtendStart)
  const pauzeMin = parseMin(middagStart) - parseMin(ochtendEind)
  const middagMin = parseMin(middagEind) - parseMin(middagStart)
  const totaalMin = ochtendMin + middagMin
  const pauzeLabel = pauzeMin > 0 ? fmtUur(pauzeMin) : 'geen'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[12px] font-semibold tracking-[0.1em] uppercase text-[#888]">
            Traject-instellingen
          </h3>
          <p className="text-[11px] text-[#aaa] mt-0.5">
            Boekings-timing &amp; werktijden
          </p>
        </div>
        {settings?.bijgewerkt_op && (
          <span className="text-[10px] text-[#aaa]">
            Laatst bijgewerkt: {new Date(settings.bijgewerkt_op).toLocaleString('nl-NL', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </span>
        )}
      </div>

      {/* ═══ TIMING ═══ */}
      <div className="bg-white rounded-2xl border border-[#eee] p-6 space-y-6">
        <h4 className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#C4A265]">
          📅 Boekings-timing
        </h4>

        {/* Voorsprong */}
        <div>
          <div className="flex items-baseline gap-3 mb-2">
            <label className="text-[13px] font-medium text-[#1a1a1a]">
              Voorsprong trajecten (weken)
            </label>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C4A265]/10 text-[#C4A265] font-semibold">
              aanbevolen: 2
            </span>
          </div>
          <input
            type="number"
            min={0}
            max={52}
            value={voorsprong}
            onChange={e => setVoorsprong(e.target.value)}
            className="w-[120px] px-4 py-2.5 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265] transition"
          />
          <p className="text-[11px] text-[#888] mt-1.5 leading-relaxed">
            Hoeveel weken eerder trajecten te boeken zijn dan behandelingen.
            Trajecten hebben meerdere aaneengesloten dagen nodig, dus ze moeten
            eerder open staan. <strong>2</strong> = trajecten gaan 2 weken eerder open.
          </p>
        </div>

        {/* Horizon */}
        <div>
          <div className="flex items-baseline gap-3 mb-2">
            <label className="text-[13px] font-medium text-[#1a1a1a]">
              Hoe ver vooruit boeken (weken)
            </label>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C4A265]/10 text-[#C4A265] font-semibold">
              aanbevolen: 8
            </span>
          </div>
          <input
            type="number"
            min={1}
            max={104}
            value={horizon}
            onChange={e => setHorizon(e.target.value)}
            className="w-[120px] px-4 py-2.5 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265] transition"
          />
          <p className="text-[11px] text-[#888] mt-1.5 leading-relaxed">
            Hoe ver vooruit klanten een traject kunnen boeken.
            <strong> 8</strong> = klanten kunnen tot 8 weken vooruit boeken.
          </p>
        </div>
      </div>

      {/* ═══ WERKTIJDEN ═══ */}
      <div className="bg-white rounded-2xl border border-[#eee] p-6 space-y-6">
        <div className="flex items-baseline justify-between">
          <h4 className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#C4A265]">
            ⏰ Werktijden
          </h4>
          <span className="text-[10px] text-[#888]">
            Totaal: <strong>{fmtUur(totaalMin)}</strong> werktijd · Pauze: <strong>{pauzeLabel}</strong>
          </span>
        </div>

        {/* Ochtendblok */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[13px] font-medium text-[#1a1a1a] mb-2 block">
              Ochtend start
            </label>
            <input
              type="time"
              value={ochtendStart}
              onChange={e => setOchtendStart(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265] transition"
            />
          </div>
          <div>
            <label className="text-[13px] font-medium text-[#1a1a1a] mb-2 block">
              Ochtend eind
            </label>
            <input
              type="time"
              value={ochtendEind}
              onChange={e => setOchtendEind(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265] transition"
            />
          </div>
        </div>

        {/* Pauze indicator */}
        <div className="flex items-center justify-center gap-3 py-1">
          <div className="h-px flex-1 bg-[#eee]" />
          <span className="text-[10px] text-[#aaa] uppercase tracking-[0.1em]">
            ☕ Pauze: {pauzeLabel}
          </span>
          <div className="h-px flex-1 bg-[#eee]" />
        </div>

        {/* Middagblok */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[13px] font-medium text-[#1a1a1a] mb-2 block">
              Middag start
            </label>
            <input
              type="time"
              value={middagStart}
              onChange={e => setMiddagStart(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265] transition"
            />
          </div>
          <div>
            <label className="text-[13px] font-medium text-[#1a1a1a] mb-2 block">
              Middag eind
            </label>
            <input
              type="time"
              value={middagEind}
              onChange={e => setMiddagEind(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265] transition"
            />
          </div>
        </div>

        <p className="text-[11px] text-[#888] leading-relaxed">
          Chiva&apos;s werkdag in 2 blokken. De pauze is automatisch het gat tussen
          ochtend-eind en middag-start. Een lang traject vult de hele werkdag;
          de workshop past in een vrij uur.
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 border-t border-[#f5f5f5]">
          <button
            onClick={opslaanSettings}
            disabled={!gewijzigd || opslaan}
            className={`px-6 py-2.5 rounded-full text-[13px] font-semibold transition ${
              gewijzigd && !opslaan
                ? 'bg-[#0C0A07] text-white hover:bg-[#333]'
                : 'bg-[#f5f5f5] text-[#aaa] cursor-not-allowed'
            }`}
          >
            {opslaan ? 'Opslaan...' : 'Opslaan'}
          </button>

          {gewijzigd && !opslaan && (
            <button
              onClick={reset}
              className="text-[12px] text-[#888] hover:text-[#1a1a1a] transition"
            >
              Annuleren
            </button>
          )}

          {bericht && (
            <span
              className={`text-[12px] font-medium ${
                bericht.type === 'success' ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {bericht.text}
            </span>
          )}
        </div>
      </div>

      {/* ═══ PAUZE ═══ */}
      <div className="bg-white rounded-2xl border border-[#eee] p-6 space-y-6">
        <h4 className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#C4A265]">
          ☕ Pauze-instelling
        </h4>

        <div>
          <label className="text-[13px] font-medium text-[#1a1a1a] mb-2 block">
            Pauze lengte (minuten)
          </label>
          <input
            type="number"
            min={0}
            max={300}
            value={pauzeLengte}
            onChange={e => setPauzeLengte(e.target.value)}
            className="w-[120px] px-4 py-2.5 rounded-xl border border-[#ddd] text-[14px] focus:outline-none focus:border-[#C4A265] transition"
          />
          <p className="text-[11px] text-[#888] mt-1.5 leading-relaxed">
            Hoe lang de pauze binnen een cursusdag is.
          </p>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-[#f9f9f9]">
          <button
            type="button"
            onClick={() => setPauzeInclusief(!pauzeInclusief)}
            className={`relative w-11 h-6 rounded-full transition ${pauzeInclusief ? 'bg-[#C4A265]' : 'bg-[#ddd]'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition ${pauzeInclusief ? 'translate-x-5' : ''}`} />
          </button>
          <div className="flex-1">
            <p className="text-[13px] font-medium text-[#1a1a1a]">
              Pauze zit ín de cursusduur
            </p>
            <p className="text-[11px] text-[#888] mt-1 leading-relaxed">
              <strong>Aan:</strong> pauze zit ín de dagduur. Cursus 8u, start 09:00 → eind 17:00 (netto 7u les).
              <br />
              <strong>Uit:</strong> pauze komt erbovenop. Cursus 8u les, start 09:00 → 8u + 1u pauze = eind 18:00.
            </p>
          </div>
        </div>
      </div>

      {/* ═══ CURSUSSEN ═══ */}
      <div className="bg-white rounded-2xl border border-[#eee] p-6 space-y-4">
        <h4 className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#C4A265]">
          📚 Cursus-dagduur
        </h4>
        <p className="text-[11px] text-[#888] leading-relaxed">
          Hoeveel uur een cursusdag duurt per cursus.
        </p>

        {cursussen.length === 0 ? (
          <p className="text-[12px] text-[#aaa]">Geen cursussen gevonden.</p>
        ) : (
          <div className="space-y-3">
            {cursussen.map(c => {
              const editVal = cursusEdits[c.id] ?? String(c.duur_uren_per_dag ?? '')
              const changed = cursusEdits[c.id] !== undefined && cursusEdits[c.id] !== String(c.duur_uren_per_dag ?? '')
              const msg = cursusBericht[c.id]
              return (
                <div key={c.id} className="flex items-center gap-4 p-3 rounded-xl border border-[#eee]">
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-[#1a1a1a]">{c.naam}</p>
                    <p className="text-[10px] text-[#aaa]">
                      {c.duur_werkdagen === 0 ? 'Workshop (1 uur)' : `${c.duur_werkdagen} ${c.duur_werkdagen === 1 ? 'dag' : 'dagen'}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={24}
                      step={0.5}
                      value={editVal}
                      onChange={e => setCursusEdits(prev => ({ ...prev, [c.id]: e.target.value }))}
                      className="w-[80px] px-3 py-2 rounded-lg border border-[#ddd] text-[13px] focus:outline-none focus:border-[#C4A265]"
                    />
                    <span className="text-[11px] text-[#888]">uur/dag</span>
                  </div>
                  {changed && (
                    <button
                      onClick={() => opslaanCursus(c.id)}
                      disabled={cursusOpslaan === c.id}
                      className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-[#0C0A07] text-white hover:bg-[#333] disabled:opacity-50"
                    >
                      {cursusOpslaan === c.id ? '...' : 'Opslaan'}
                    </button>
                  )}
                  {msg && msg.text && (
                    <span className={`text-[10px] ${msg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{msg.text}</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Uitleg */}
      <div className="bg-[#C4A265]/5 border border-[#C4A265]/20 rounded-2xl p-5">
        <h4 className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#C4A265] mb-3">
          💡 Hoe dit werkt
        </h4>
        <ul className="space-y-2 text-[12px] text-[#666] leading-relaxed">
          <li>
            <strong>Voorsprong</strong> bepaalt wanneer trajecten opengaan ten
            opzichte van behandelingen. Bij 2 weken opent een traject-dag
            2 weken eerder in de kalender dan een behandeling-dag.
          </li>
          <li>
            <strong>Horizon</strong> is hoe ver vooruit een klant kan boeken.
            Bij 8 weken kan een klant vandaag een traject boeken dat tot 8 weken
            in de toekomst start.
          </li>
          <li>
            <strong>Werktijden</strong> bepalen wanneer een traject-dag begint
            en eindigt. De boek-flow gebruikt dit om te berekenen of een dag
            beschikbaar is.
          </li>
        </ul>
      </div>
    </div>
  )
}
