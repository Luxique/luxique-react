'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface BookingInfo {
  event_type: string
  slot_start: string
  amount_cents: number
  status: string
}

function BevestigdContent() {
  const searchParams = useSearchParams()
  const uid = searchParams.get('uid') || searchParams.get('bookingUid')
  const [booking, setBooking] = useState<BookingInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setLoading(false)
      return
    }
    fetch(`/api/boeking/checkout?uid=${uid}`)
      .then(res => res.json())
      .then(data => {
        if (data.booking) setBooking(data.booking)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [uid])

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })

  if (loading) {
    return <div style={{ background: '#f6f1e7', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#6a6256', fontFamily: 'Jost, sans-serif' }}>Laden...</div></div>
  }

  const deposit = booking ? (booking.amount_cents / 100).toFixed(0) : '0'
  const remainder = deposit // 50/50

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        :root { --bg:#f6f1e7; --ink:#1a1712; --ink-dim:#6a6256; --ink-faint:#9a9183; --card:#fffdf8; --line:rgba(26,23,18,.10); --gold:#b08d4f; --gold-deep:#9a7838; --gold-soft:rgba(176,141,79,.12); --gold-edge:rgba(176,141,79,.32); --green:#5b8c66; }
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:radial-gradient(700px 460px at 50% -8%,rgba(176,141,79,.10),transparent 62%),var(--bg); color:var(--ink); font-family:'Jost',sans-serif; font-weight:300; line-height:1.6; min-height:100vh; }
        .wrap { max-width:560px; margin:0 auto; padding:34px 20px 70px; }
        .nav { display:flex; align-items:center; justify-content:space-between; margin-bottom:30px; }
        .wordmark { font-weight:400; letter-spacing:.42em; font-size:16px; color:var(--ink); }
        .check-circle { width:64px; height:64px; margin:0 auto 24px; border-radius:50%; background:rgba(91,140,102,.12); display:flex; align-items:center; justify-content:center; }
        .head { text-align:center; margin-bottom:30px; }
        .head h1 { font-family:'Cormorant Garamond',serif; font-weight:500; font-size:clamp(30px,5vw,42px); line-height:1.1; margin-bottom:10px; }
        .head h1 em { font-style:italic; color:var(--gold); }
        .head .sub { color:var(--ink-dim); font-size:15.5px; }
        .card { background:var(--card); border:1px solid var(--line); border-radius:22px; box-shadow:0 20px 50px rgba(26,23,18,.07); overflow:hidden; }
        .details { padding:26px 28px; }
        .row { display:flex; justify-content:space-between; align-items:baseline; padding:12px 0; border-bottom:1px solid var(--line); font-size:15px; }
        .row:last-child { border-bottom:none; }
        .row .k { color:var(--ink-dim); }
        .row .v { color:var(--ink); font-weight:500; text-align:right; }
        .payment-info { margin:0 28px 24px; background:rgba(91,140,102,.06); border:1px solid rgba(91,140,102,.2); border-radius:14px; padding:16px 18px; }
        .payment-info p { font-size:14.5px; color:var(--ink-dim); margin:0; }
        .payment-info strong { color:var(--ink); }
        .map-link { display:block; margin:0 28px 28px; border-radius:14px; overflow:hidden; text-decoration:none; }
        .map-link img { width:100%; display:block; }
        .cta { display:block; text-align:center; padding:16px; background:linear-gradient(180deg,var(--gold),var(--gold-deep)); color:#fff; font-weight:600; border-radius:14px; text-decoration:none; font-size:15px; font-family:'Jost',sans-serif; margin:0 28px 28px; box-shadow:0 8px 24px rgba(176,141,79,.25); }
        .prep { margin:0 28px 28px; }
        .prep h3 { font-family:'Cormorant Garamond',serif; font-size:20px; font-weight:500; color:var(--gold); margin-bottom:10px; }
        .prep p { font-size:14.5px; color:var(--ink-dim); line-height:1.7; }
        .foothelp { text-align:center; margin-top:24px; font-size:13px; color:var(--ink-faint); }
        .foothelp a { color:var(--gold-deep); text-decoration:none; }
      `}</style>
      <div className="wrap">
        <div className="nav">
          <span className="wordmark">LUXIQUE</span>
        </div>
        <div className="head">
          <div className="check-circle">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5b8c66" strokeWidth="2"><path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h1>Je afspraak is <em>bevestigd</em> ✨</h1>
          <p className="sub">We kijken ernaar uit om je te verwelkomen.</p>
        </div>
        {booking && (
          <div className="card">
            <div className="details">
              <div className="row"><span className="k">Behandeling</span><span className="v">{booking.event_type}</span></div>
              <div className="row"><span className="k">Datum</span><span className="v">{formatDate(booking.slot_start)}</span></div>
              <div className="row"><span className="k">Tijd</span><span className="v">{formatTime(booking.slot_start)} uur</span></div>
              <div className="row"><span className="k">Locatie</span><span className="v">Venlosingel 166, Arnhem</span></div>
            </div>
            <div className="payment-info">
              <p>Aanbetaling van <strong>€{deposit}</strong> ontvangen ✅<br/>Resterend in de studio: <strong>€{remainder}</strong> — direct na je behandeling.</p>
            </div>
            <a className="map-link" href="https://maps.google.com/?q=Venlosingel+166,+6845+JD+Arnhem" target="_blank" rel="noopener">
              <img src="https://maps.googleapis.com/maps/api/staticmap?center=Venlosingel+166,Arnhem&zoom=15&size=500x200&markers=red:Venlosingel+166,Arnhem&key=AIzaSyBFb6wY4H8M2qNl7K5L1qY8m2p3r4s5t6" alt="Kaart - Venlosingel 166, Arnhem" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </a>
            <a className="cta" href="/dashboard">Mijn boekingen</a>
            <div className="prep">
              <h3>Kleine voorbereiding</h3>
              <p>Kom met schone wimpers — zonder mascara of olie-producten rond de ogen. Zo kunnen we direct aan de slag.</p>
            </div>
          </div>
        )}
        <p className="foothelp">Vragen? Mail <a href="mailto:info@luxique.nl">info@luxique.nl</a></p>
      </div>
    </>
  )
}

export default function BevestigdPage() {
  return (
    <Suspense fallback={<div style={{ background:'#f6f1e7', minHeight:'100vh' }} />}>
      <BevestigdContent />
    </Suspense>
  )
}
