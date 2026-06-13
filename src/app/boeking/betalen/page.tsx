'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface BookingData {
  booking: {
    id: string
    cal_booking_uid: string
    event_type: string
    slot_start: string
    amount_cents: number
    status: string
    expires_at: string
  }
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) {
        setRemaining('Verlopen')
        return
      }
      const min = Math.floor(diff / 60000)
      const sec = Math.floor((diff % 60000) / 1000)
      setRemaining(`${min}:${sec.toString().padStart(2, '0')}`)
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  return (
    <p className="text-white/40 text-sm">
      ⏱ Je hebt nog <span className="text-white/70 font-mono">{remaining}</span> om te betalen
    </p>
  )
}

function BetalenContent() {
  const searchParams = useSearchParams()
  const uid = searchParams.get('uid') || searchParams.get('cal.bookingUid') || searchParams.get('bookingUid')

  const [booking, setBooking] = useState<BookingData['booking'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    if (!uid) {
      setError('Geen boeking gevonden. Controleer je link.')
      setLoading(false)
      return
    }

    fetch(`/api/boeking/checkout?uid=${uid}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error === 'Booking has expired'
            ? 'Je boeking is verlopen (30 minuten). Boek opnieuw een afspraak.'
            : data.error === 'Booking not found'
            ? 'Boeking niet gevonden. Controleer je link.'
            : data.error)
        } else {
          setBooking(data.booking)
        }
      })
      .catch(() => setError('Er ging iets mis. Probeer opnieuw.'))
      .finally(() => setLoading(false))
  }, [uid])

  const handlePay = async () => {
    if (!uid) return
    setPaying(true)

    try {
      const res = await fetch('/api/boeking/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      })
      const data = await res.json()

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        setError(data.error || 'Betaling kon niet worden gestart.')
        setPaying(false)
      }
    } catch {
      setError('Er ging iets mis met de betaling.')
      setPaying(false)
    }
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white/60 animate-pulse">Boeking laden...</div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#141414] border border-white/10 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">😔</div>
          <h1 className="text-xl font-semibold text-white mb-2">Oeps</h1>
          <p className="text-white/60">{error}</p>
          <a
            href="https://www.luxique.nl/behandelingen"
            className="inline-block mt-6 px-6 py-2.5 bg-[#C4A265] text-black font-semibold rounded-full hover:bg-[#d4b275] transition"
          >
            Terug naar behandelingen
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-white mb-2">Aanbetaling</h1>
          <p className="text-white/50 text-sm">Bevestig je afspraak bij LUXIQUE</p>
        </div>

        <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 mb-6">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-white/50 text-sm">Behandeling</span>
              <span className="text-white font-medium">{booking.event_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50 text-sm">Datum</span>
              <span className="text-white font-medium">{formatDate(booking.slot_start)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50 text-sm">Tijd</span>
              <span className="text-white font-medium">{formatTime(booking.slot_start)}</span>
            </div>

            <div className="border-t border-white/10 pt-4 mt-4">
              <div className="flex justify-between">
                <span className="text-white/50 text-sm">Aanbetaling (50%)</span>
                <span className="text-[#C4A265] font-bold text-lg">
                  €{(booking.amount_cents / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-white/30 text-xs">Restbedrag in de studio</span>
                <span className="text-white/30 text-xs">
                  €{(booking.amount_cents / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mb-6">
          <CountdownTimer expiresAt={booking.expires_at} />
        </div>

        <button
          onClick={handlePay}
          disabled={paying}
          className="w-full py-3.5 bg-[#C4A265] text-black font-bold rounded-full text-lg hover:bg-[#d4b275] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {paying ? 'Betaling starten...' : `Betaal €${(booking.amount_cents / 100).toFixed(0)} aanbetaling`}
        </button>

        <p className="text-center text-white/30 text-xs mt-4">
          iDEAL · Bancontact · Creditcard · Veilig via Stripe
        </p>
      </div>
    </div>
  )
}

export default function BetalenPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="text-white/60 animate-pulse">Boeking laden...</div></div>}>
      <BetalenContent />
    </Suspense>
  )
}
