'use client'

import { useEffect, useState, Suspense, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PaymentLogos } from '@/components/PaymentLogos'
import { useAuth } from '@/lib/auth-context'

interface Booking {
  id: string
  cal_booking_uid: string
  event_type: string
  slot_start: string
  amount_cents: number
  status: string
  expires_at: string
}

function CountdownTimer({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) {
  const [remaining, setRemaining] = useState('')
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) {
        setRemaining('0:00')
        setExpired(true)
        onExpire()
        return
      }
      const min = Math.floor(diff / 60000)
      const sec = Math.floor((diff % 60000) / 1000)
      setRemaining(`${min}:${sec.toString().padStart(2, '0')}`)
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [expiresAt, onExpire])

  if (expired) return null

  return (
    <div className="timer">
      <span className="t-lbl">Voldoe je aanbetaling binnen</span>
      <span className="t-clock">{remaining}</span>
      <span className="t-sub">anders vervalt je afspraak</span>
    </div>
  )
}

function BetalenContent() {
  const searchParams = useSearchParams()
  const uid = searchParams.get('uid') || searchParams.get('cal.bookingUid') || searchParams.get('bookingUid')
  const { user, session, loading: authLoading } = useAuth()
  const router = useRouter()

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [isExpired, setIsExpired] = useState(false)

  // Auth guard — must be logged in to pay
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/boeking/betalen${uid ? '?uid=' + encodeURIComponent(uid) : ''}`)
    }
  }, [authLoading, user, router, uid])

  // Check if booking is already expired on load
  useEffect(() => {
    if (booking) {
      const diff = new Date(booking.expires_at).getTime() - Date.now()
      if (diff <= 0 || booking.status !== 'pending') {
        setIsExpired(true)
      }
    }
  }, [booking])

  const fetchBooking = useCallback(async (bookingUid: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/boeking/checkout?uid=${bookingUid}`)
      const data = await res.json()
      if (data.booking) {
        setBooking(data.booking)
        // Stamp user_id onto this booking now that we know it exists
        if (session?.access_token) {
          fetch('/api/boeking/link-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ uid: bookingUid }),
          }).catch(() => {}) // non-blocking, best-effort
        }
        return true
      }
      if (data.error === 'Booking not found') {
        const fallbackRes = await fetch('/api/boeking/fetch-from-cal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: bookingUid }),
        })
        const fallbackData = await fallbackRes.json()
        if (fallbackData.booking) {
          setBooking(fallbackData.booking)
          // Stamp user_id onto this booking
          if (session?.access_token) {
            fetch('/api/boeking/link-user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ uid: bookingUid }),
            }).catch(() => {}) // non-blocking, best-effort
          }
          return true
        }
      }
      return false
    } catch {
      return false
    }
  }, [session])

  useEffect(() => {
    if (!uid) {
      setError('Geen boeking gevonden. Controleer je link.')
      setLoading(false)
      return
    }

    let attempts = 0
    const MAX_ATTEMPTS = 8
    let cancelled = false

    const poll = async () => {
      if (cancelled) return
      attempts++
      const success = await fetchBooking(uid)
      if (success) {
        if (!cancelled) setLoading(false)
        return
      }
      if (attempts < MAX_ATTEMPTS) {
        setTimeout(poll, 1500)
      } else {
        if (!cancelled) {
          setError('Je boeking kon niet worden gevonden. Controleer je link of neem contact op.')
          setLoading(false)
        }
      }
    }

    poll()
    return () => { cancelled = true }
  }, [uid, fetchBooking])

  const handlePay = async () => {
    if (!uid || !agreed) return
    setPaying(true)

    try {
      const res = await fetch('/api/boeking/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, agreed: true }),
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
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  }

  // Loading state
  if (loading) {
    return (
      <>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <div style={{ background: '#f6f1e7', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-block', width: 32, height: 32, border: '2px solid rgba(176,141,79,0.3)', borderTopColor: '#b08d4f', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 16 }} />
            <div style={{ color: '#6a6256', fontFamily: 'Jost, sans-serif' }}>Je boeking wordt geladen...</div>
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </>
    )
  }

  // Error state
  if (error || !booking) {
    return (
      <>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <div style={{ background: '#f6f1e7', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 440, width: '100%', background: '#fffdf8', border: '1px solid rgba(26,23,18,0.1)', borderRadius: 22, padding: 32, textAlign: 'center', fontFamily: 'Jost, sans-serif' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>😔</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 500, color: '#1a1712', marginBottom: 8 }}>Oeps</h1>
            <p style={{ color: '#6a6256', fontSize: 15 }}>{error}</p>
            <a href="https://www.luxique.nl/behandelingen" style={{ display: 'inline-block', marginTop: 24, padding: '10px 24px', background: '#b08d4f', color: '#fff', fontWeight: 600, borderRadius: 999, textDecoration: 'none', fontFamily: 'Jost, sans-serif', fontSize: 14 }}>Terug naar behandelingen</a>
          </div>
        </div>
      </>
    )
  }

  const deposit = booking.amount_cents
  const total = deposit * 2
  const depositStr = (deposit / 100).toFixed(0)
  const totalStr = (total / 100).toFixed(0)

  // Expired state
  if (isExpired) {
    return (
      <>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <style>{`body{background:radial-gradient(700px 460px at 50% -8%,rgba(176,141,79,.10),transparent 62%),#f6f1e7;color:#1a1712;font-family:'Jost',sans-serif;font-weight:300;line-height:1.6;min-height:100vh;margin:0;padding:0}*{margin:0;padding:0;box-sizing:border-box}.wrap{max-width:560px;margin:0 auto;padding:34px 20px 70px}.wordmark{font-weight:400;letter-spacing:.42em;font-size:16px;color:#1a1712}.nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:30px}.secure{font-size:11.5px;color:#9a9183;display:flex;align-items:center;gap:6px}.card{background:#fffdf8;border:1px solid rgba(26,23,18,.1);border-radius:22px;box-shadow:0 20px 50px rgba(26,23,18,.07);overflow:hidden}.expired-card{text-align:center;padding:40px 30px}.expired-card .clock-icon{width:56px;height:56px;margin:0 auto 20px;border-radius:50%;background:rgba(176,141,79,.12);display:flex;align-items:center;justify-content:center}.expired-card h2{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:28px;color:#1a1712;margin-bottom:10px}.expired-card p{color:#6a6256;font-size:15px;line-height:1.6;max-width:360px;margin:0 auto 24px}.expired-card .cta-new{display:inline-block;padding:14px 32px;background:linear-gradient(180deg,#b08d4f,#9a7838);color:#fff;font-weight:600;border-radius:14px;text-decoration:none;font-size:15px;font-family:'Jost',sans-serif;box-shadow:0 8px 24px rgba(176,141,79,.3)}.expired-card .mail-note{margin-top:16px;font-size:12.5px;color:#9a9183}.expired-card .mail-note a{color:#9a7838;text-decoration:none}.foothelp{text-align:center;margin-top:22px;font-size:12.5px;color:#9a9183}.foothelp a{color:#9a7838;text-decoration:none}`}</style>
        <div className="wrap">
          <div className="nav">
            <span className="wordmark">LUXIQUE</span>
            <span className="secure">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b08d4f" strokeWidth="1.6"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>
              Veilig betalen
            </span>
          </div>
          <div className="card">
            <div className="expired-card">
              <div className="clock-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b08d4f" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
              <h2>Je betaaltijd is verlopen</h2>
              <p>Helaas is je reservering vervallen omdat de aanbetaling niet binnen 10 minuten is ontvangen. Je tijdslot is vrijgegeven voor anderen.</p>
              <a href="https://www.luxique.nl/behandelingen#boek" className="cta-new">Kies een nieuw tijdslot</a>
              <div className="mail-note">Vragen? Mail <a href="mailto:info@luxique.nl">info@luxique.nl</a></div>
            </div>
          </div>
          <p className="foothelp">Vragen over je boeking? Mail <a href="mailto:info@luxique.nl">info@luxique.nl</a></p>
        </div>
      </>
    )
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        :root {
          --bg:#f6f1e7; --bg-2:#efe8d9; --ink:#1a1712; --ink-dim:#6a6256;
          --ink-faint:#9a9183; --card:#fffdf8; --line:rgba(26,23,18,.10);
          --gold:#b08d4f; --gold-deep:#9a7838; --gold-soft:rgba(176,141,79,.12);
          --gold-edge:rgba(176,141,79,.32); --green:#5b8c66;
        }
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background: radial-gradient(700px 460px at 50% -8%, rgba(176,141,79,.10), transparent 62%), var(--bg); color:var(--ink); font-family:'Jost',sans-serif; font-weight:300; line-height:1.6; -webkit-font-smoothing:antialiased; min-height:100vh; }
        .wrap { max-width:560px; margin:0 auto; padding:34px 20px 70px; }
        .nav { display:flex; align-items:center; justify-content:space-between; margin-bottom:30px; }
        .wordmark { font-weight:400; letter-spacing:.42em; font-size:16px; color:var(--ink); }
        .secure { font-size:11.5px; color:var(--ink-faint); display:flex; align-items:center; gap:6px; }
        .head { text-align:center; margin-bottom:26px; }
        .eyebrow { font-size:11px; letter-spacing:.32em; text-transform:uppercase; color:var(--gold); margin-bottom:12px; }
        .head h1 { font-family:'Cormorant Garamond',serif; font-weight:500; font-size:clamp(34px,6vw,46px); line-height:1.04; }
        .head h1 em { font-style:italic; color:var(--gold); }
        .head .sub { margin-top:10px; color:var(--ink-dim); font-size:15.5px; }
        .card { background:var(--card); border:1px solid var(--line); border-radius:22px; box-shadow:0 20px 50px rgba(26,23,18,.07); overflow:hidden; }
        .summary { padding:24px 26px 8px; }
        .row { display:flex; justify-content:space-between; align-items:baseline; padding:11px 0; border-bottom:1px solid var(--line); font-size:15px; }
        .row:last-child { border-bottom:none; }
        .row .k { color:var(--ink-dim); }
        .row .v { color:var(--ink); font-weight:500; text-align:right; }
        .breakdown { margin:6px 26px 24px; border:1px solid var(--gold-edge); border-radius:18px; overflow:hidden; box-shadow:0 0 0 4px var(--gold-soft); position:relative; }
        .bd-total { display:flex; justify-content:space-between; align-items:center; padding:15px 20px; background:var(--gold-soft); }
        .bd-total .lbl { font-size:13px; letter-spacing:.04em; color:var(--ink-dim); text-transform:uppercase; }
        .bd-total .amt { font-family:'Cormorant Garamond',serif; font-size:26px; color:var(--ink); }
        .bd-split { display:flex; }
        .bd-half { flex:1; padding:16px 20px; text-align:center; }
        .bd-half + .bd-half { border-left:1px dashed var(--gold-edge); }
        .bd-half.pay { background:rgba(22,179,100,.08); }
        .bd-half .now { font-size:11px; letter-spacing:.14em; text-transform:uppercase; margin-bottom:6px; }
        .bd-half.pay .now { color:#0e9f54; font-weight:600; }
        .bd-half.later .now { color:var(--ink-faint); }
        .bd-half .big { font-family:'Cormorant Garamond',serif; font-size:30px; line-height:1; color:var(--ink); }
        .bd-half.pay .big { color:#0e9f54; font-size:38px; }
        .bd-half .when { font-size:12px; color:var(--ink-dim); margin-top:7px; }
        .timer { text-align:center; margin:0 26px 18px; display:flex; flex-direction:column; align-items:center; gap:7px; }
        .timer .t-lbl { font-size:12px; letter-spacing:.06em; text-transform:uppercase; color:var(--ink-faint); }
        .timer .t-clock { font-family:'Jost',sans-serif; font-size:42px; line-height:1; color:var(--gold-deep); font-variant-numeric:tabular-nums; font-weight:500; }
        .timer .t-sub { font-size:12px; color:var(--ink-faint); }
        .agree { display:flex; gap:11px; align-items:flex-start; margin:0 26px 18px; cursor:pointer; background:var(--bg-2); border:1px solid var(--line); border-radius:14px; padding:14px 16px; transition:border-color .2s,background .2s; }
        .agree.checked { border-color:var(--gold-edge); background:var(--gold-soft); }
        .agree input { position:absolute; opacity:0; width:0; height:0; }
        .agree .box { flex:0 0 auto; width:22px; height:22px; border:1.5px solid var(--gold-edge); border-radius:7px; background:#fff; display:flex; align-items:center; justify-content:center; transition:.2s; margin-top:1px; }
        .agree.checked .box { background:var(--gold-deep); border-color:var(--gold-deep); }
        .agree-txt { font-size:13px; color:var(--ink-dim); line-height:1.5; }
        .agree-txt b { color:var(--ink); }
        .agree-txt a { color:var(--gold-deep); text-decoration:underline; text-underline-offset:2px; }
        .cta-wrap { padding:0 26px 26px; }
        .cta { display:flex; align-items:center; justify-content:center; gap:10px; width:100%; background:linear-gradient(180deg,#16b364,#0e9f54); color:#fff; border:none; cursor:pointer; font-family:'Jost',sans-serif; font-weight:600; font-size:16.5px; padding:18px; border-radius:14px; letter-spacing:.02em; box-shadow:0 10px 26px rgba(14,159,84,.32), inset 0 1px 0 rgba(255,255,255,.25); transition:transform .15s,box-shadow .2s,filter .15s; }
        .cta:hover:not(:disabled) { filter:brightness(1.04); transform:translateY(-1px); }
        .cta:disabled { opacity:.45; cursor:not-allowed; }
        .pays { display:flex; align-items:center; justify-content:center; gap:8px; margin-top:18px; flex-wrap:wrap; }
        .pays .lbl { font-size:11.5px; color:var(--ink-faint); width:100%; text-align:center; margin-bottom:4px; letter-spacing:.04em; }
        .paylogo { display:inline-flex; height:32px; width:48px; border-radius:7px; overflow:hidden; box-shadow:0 1px 3px rgba(26,23,18,.10); }
        .paylogo svg { display:block; height:100%; width:100%; }
        .foothelp { text-align:center; margin-top:22px; font-size:12.5px; color:var(--ink-faint); }
        .foothelp a { color:var(--gold-deep); text-decoration:none; }
        @media(max-width:420px){ .bd-split{flex-direction:column} .bd-half+.bd-half{border-left:none;border-top:1px dashed var(--gold-edge)} }
        .expired-card { text-align:center; padding:40px 30px; }
        .expired-card .clock-icon { width:56px; height:56px; margin:0 auto 20px; border-radius:50%; background:rgba(176,141,79,.12); display:flex; align-items:center; justify-content:center; }
        .expired-card h2 { font-family:'Cormorant Garamond',serif; font-weight:500; font-size:28px; color:var(--ink); margin-bottom:10px; }
        .expired-card p { color:var(--ink-dim); font-size:15px; line-height:1.6; max-width:360px; margin:0 auto 24px; }
        .expired-card .cta-new { display:inline-block; padding:14px 32px; background:linear-gradient(180deg,var(--gold),var(--gold-deep)); color:#fff; font-weight:600; border-radius:14px; text-decoration:none; font-size:15px; font-family:'Jost',sans-serif; box-shadow:0 8px 24px rgba(176,141,79,.3); transition:transform .15s; }
        .expired-card .cta-new:hover { transform:translateY(-1px); }
        .expired-card .mail-note { margin-top:16px; font-size:12.5px; color:var(--ink-faint); }
        .expired-card .mail-note a { color:var(--gold-deep); text-decoration:none; }
      `}</style>

      <div className="wrap">
        <div className="nav">
          <span className="wordmark">LUXIQUE</span>
          <span className="secure">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b08d4f" strokeWidth="1.6"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>
            Veilig betalen
          </span>
        </div>

        <div className="head">
          <div className="eyebrow">— Nog één stap —</div>
          <h1>Bevestig je <em>afspraak</em></h1>
          <p className="sub">Bevestig je afspraak met een aanbetaling van 50%.</p>
        </div>

        <div className="card">
          <div className="summary">
            <div className="row"><span className="k">Behandeling</span><span className="v">{booking.event_type}</span></div>
            <div className="row"><span className="k">Datum</span><span className="v">{formatDate(booking.slot_start)}</span></div>
            <div className="row"><span className="k">Tijd</span><span className="v">{formatTime(booking.slot_start)}</span></div>
            <div className="row"><span className="k">Locatie</span><span className="v">Venlosingel 166, Arnhem</span></div>
          </div>

          <div className="breakdown">
            <div className="bd-total">
              <span className="lbl">Totaalprijs behandeling</span>
              <span className="amt">€{totalStr}</span>
            </div>
            <div className="bd-split">
              <div className="bd-half pay">
                <div className="now">Nu aanbetalen</div>
                <div className="big">€{depositStr}</div>
                <div className="when">50% — om je plek vast te zetten</div>
              </div>
              <div className="bd-half later">
                <div className="now">Later in de studio</div>
                <div className="big">€{depositStr}</div>
                <div className="when">50% — direct na je behandeling</div>
              </div>
            </div>
          </div>

          <CountdownTimer expiresAt={booking.expires_at} onExpire={() => setIsExpired(true)} />

          <label className={`agree ${agreed ? 'checked' : ''}`}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span className="box">
              {agreed && <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-7"/></svg>}
            </span>
            <span className="agree-txt">
              Ik begrijp dat ik nu <b>€{depositStr}</b> aanbetaal om mijn afspraak te bevestigen en de resterende <b>€{depositStr}</b> in de studio voldoe. Ik kan tot 24 uur van tevoren kosteloos annuleren en ga akkoord met de{' '}
              <a href="/voorwaarden" target="_blank">algemene voorwaarden</a> en het{' '}
              <a href="/annuleringsbeleid" target="_blank">annuleringsbeleid</a>.
            </span>
          </label>

          <div className="cta-wrap">
            <button className="cta" onClick={handlePay} disabled={!agreed || paying}>
              {paying ? 'Betaling starten...' : `Betaal €${depositStr} aanbetaling`}
              {!paying && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>}
            </button>

            <div className="pays">
              <span className="lbl">Veilig betalen via Stripe</span>
              <PaymentLogos />
            </div>
          </div>
        </div>

        <p className="foothelp">Vragen over je boeking? Mail <a href="mailto:info@luxique.nl">info@luxique.nl</a></p>
      </div>
    </>
  )
}

export default function BetalenPage() {
  return (
    <Suspense fallback={<div style={{ background: '#f6f1e7', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#6a6256', fontFamily: 'Jost, sans-serif' }}>Boeking laden...</div></div>}>
      <BetalenContent />
    </Suspense>
  )
}
