'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface BoekingDetails {
  cursus_naam: string
  startdatum: string
  starttijd: string
  blok_dagen: string[]
  klant_naam: string
  aanbetaling_cents: number
  restbedrag_cents: number
}

export default function TrajectBevestigdPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0C0A07] flex items-center justify-center"><div className="text-[#C4A265] text-xl">Laden...</div></div>}>
      <TrajectBevestigdContent />
    </Suspense>
  )
}

function TrajectBevestigdContent() {
  const params = useSearchParams()
  const sessionId = params.get('session_id')
  const [boeking, setBoeking] = useState<BoekingDetails | null>(null)
  const [laden, setLaden] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setError('Geen session ID gevonden')
      setLaden(false)
      return
    }

    async function load() {
      try {
        const res = await fetch(`/api/traject/bevestiging?session_id=${sessionId}`, { cache: 'no-store' })
        if (!res.ok) {
          const d = await res.json()
          throw new Error(d.error || `HTTP ${res.status}`)
        }
        const data = await res.json()
        setBoeking(data)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        setError(msg)
      } finally {
        setLaden(false)
      }
    }

    load()
  }, [sessionId])

  if (laden) {
    return (
      <div className="min-h-screen bg-[#0C0A07] flex items-center justify-center">
        <div className="text-[#C4A265] text-xl">Bevestiging laden...</div>
      </div>
    )
  }

  if (error || !boeking) {
    return (
      <div className="min-h-screen bg-[#0C0A07] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️</div>
          <p className="text-[#FBF8F2]/80 mb-2">{error || 'Boeking niet gevonden'}</p>
          <p className="text-[#FBF8F2]/50 text-sm">
            Neem contact op als je toch betaald hebt.
          </p>
        </div>
      </div>
    )
  }

  const fmtDate = (d: string) => {
    const date = new Date(d + 'T00:00:00')
    return date.toLocaleDateString('nl-NL', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  const fmtPrice = (cents: number) => `€${(cents / 100).toFixed(2).replace('.', ',')}`

  return (
    <div className="min-h-screen bg-[#0C0A07] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="font-['Cormorant_Garamond'] text-4xl text-[#C4A265] mb-3">
            Betaling ontvangen
          </h1>
          <p className="text-[#FBF8F2]/80 text-lg">
            Je traject is bevestigd, {boeking.klant_naam.split(' ')[0]}!
          </p>
        </div>

        {/* Details */}
        <div className="bg-[#1a1614] border border-[#C4A265]/20 p-8 rounded-lg space-y-5">
          <h2 className="font-['Cormorant_Garamond'] text-2xl text-[#C4A265] mb-4">
            Boekingsdetails
          </h2>

          <div className="flex justify-between items-center pb-4 border-b border-[#C4A265]/20">
            <span className="text-[#FBF8F2]/60">Traject</span>
            <span className="text-[#FBF8F2] font-semibold">{boeking.cursus_naam}</span>
          </div>

          <div className="flex justify-between items-center pb-4 border-b border-[#C4A265]/20">
            <span className="text-[#FBF8F2]/60">Startdatum</span>
            <span className="text-[#FBF8F2] font-semibold">{fmtDate(boeking.startdatum)}</span>
          </div>

          {boeking.blok_dagen.length > 1 && (
            <div className="flex justify-between items-start pb-4 border-b border-[#C4A265]/20">
              <span className="text-[#FBF8F2]/60">Alle trajectdagen</span>
              <span className="text-[#FBF8F2] text-sm text-right max-w-[60%]">
                {boeking.blok_dagen.map((d, i) => (
                  <span key={d}>
                    {i > 0 && ', '}
                    {fmtDate(d)}
                  </span>
                ))}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center pb-4 border-b border-[#C4A265]/20">
            <span className="text-[#FBF8F2]/60">Starttijd per dag</span>
            <span className="text-[#FBF8F2] font-semibold">{boeking.starttijd}</span>
          </div>

          <div className="flex justify-between items-center pb-4 border-b border-[#C4A265]/20">
            <span className="text-[#FBF8F2]/60">Aanbetaling (betaald)</span>
            <span className="text-green-400 font-semibold">{fmtPrice(boeking.aanbetaling_cents)}</span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-[#C4A265] font-semibold">Restbedrag (bij Chiva op de startdag)</span>
            <span className="text-[#C4A265] font-bold">{fmtPrice(boeking.restbedrag_cents)}</span>
          </div>
        </div>

        <div className="mt-8 bg-[#C4A265]/5 border border-[#C4A265]/20 rounded-lg p-6 text-center">
          <p className="text-[#FBF8F2]/70 text-sm">
            📧 Bevestigingsmail is verzonden naar je inbox.
            <br />
            Het restbedrag betaal je contact of met pin bij Chiva op de startdag.
          </p>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-block bg-[#C4A265] hover:bg-[#C4A265]/90 text-[#0C0A07] font-bold py-3 px-8 rounded-lg transition-colors"
          >
            Terug naar home
          </a>
        </div>
      </div>
    </div>
  )
}
