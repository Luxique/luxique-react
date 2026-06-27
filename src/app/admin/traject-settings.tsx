'use client'

import { useEffect, useState, useCallback } from 'react'

/**
 * TrajectInstellingenPaneel
 *
 * Admin-paneel voor de twee globale boekings-timing instellingen:
 *  - traject_voorsprong_weken  (hoeveel weken eerder trajecten openen dan behandelingen)
 *  - boekbare_horizon_weken    (hoe ver vooruit klanten kunnen boeken)
 *
 * Leest via GET /api/traject/settings
 * Schrijft via PUT /api/traject/settings
 */

interface TrajectSettings {
  id: string
  traject_voorsprong_weken: number
  boekbare_horizon_weken: number
  bijgewerkt_op: string | null
}

export default function TrajectInstellingenPaneel() {
  const [settings, setSettings] = useState<TrajectSettings | null>(null)
  const [voorsprong, setVoorsprong] = useState('')
  const [horizon, setHorizon] = useState('')
  const [laden, setLaden] = useState(true)
  const [opslaan, setOpslaan] = useState(false)
  const [bericht, setBericht] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const laad = useCallback(async () => {
    setLaden(true)
    try {
      const res = await fetch('/api/traject/settings')
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      const data: TrajectSettings = await res.json()
      setSettings(data)
      setVoorsprong(String(data.traject_voorsprong_weken))
      setHorizon(String(data.boekbare_horizon_weken))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setBericht({ type: 'error', text: `Laden mislukt: ${msg}` })
    } finally {
      setLaden(false)
    }
  }, [])

  useEffect(() => { laad() }, [laad])

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
      setBericht({ type: 'success', text: 'Opgeslagen ✓' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setBericht({ type: 'error', text: `Opslaan mislukt: ${msg}` })
    } finally {
      setOpslaan(false)
      // Auto-hide bericht after 3s
      setTimeout(() => setBericht(null), 3000)
    }
  }

  const gewijzigd =
    settings !== null &&
    (voorsprong !== String(settings.traject_voorsprong_weken) ||
      horizon !== String(settings.boekbare_horizon_weken))

  if (laden) {
    return (
      <div className="bg-white rounded-2xl border border-[#eee] p-8 text-center">
        <p className="text-[13px] text-[#888]">Instellingen laden...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[12px] font-semibold tracking-[0.1em] uppercase text-[#888]">
            Traject-instellingen
          </h3>
          <p className="text-[11px] text-[#aaa] mt-0.5">
            Boekings-timing voor meerdaagse cursussen
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

      {/* Instellingen卡片 */}
      <div className="bg-white rounded-2xl border border-[#eee] p-6 space-y-6">
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
            Te kort = weinig flexibiliteit; te lang = risico op no-shows of
            gewijzigde planning.
          </p>
        </div>

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
              onClick={() => {
                setVoorsprong(String(settings!.traject_voorsprong_weken))
                setHorizon(String(settings!.boekbare_horizon_weken))
                setBericht(null)
              }}
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

      {/* Uitleg */}
      <div className="bg-[#C4A265]/5 border border-[#C4A265]/20 rounded-2xl p-5">
        <h4 className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#C4A265] mb-3">
          💡 Hoe dit werkt
        </h4>
        <ul className="space-y-2 text-[12px] text-[#666] leading-relaxed">
          <li>
            <strong>Voorsprong</strong> bepaalt wanneer trajecten opengaan ten
            opzichte van behandelingen. Bij een voorsprong van 2 weken opent een
            traject-dag 2 weken eerder in de kalender dan een behandeling-dag.
          </li>
          <li>
            <strong>Horizon</strong> is hoe ver vooruit een klant kan boeken.
            Bij 8 weken kan een klant vandaag een traject boeken dat tot 8 weken
            in de toekomst start.
          </li>
          <li>
            Deze waarden worden gelezen door de boek-flow (stap 3b). Geen code
            nodig om ze te wijzigen — gewoon aanpassen en opslaan.
          </li>
        </ul>
      </div>
    </div>
  )
}
