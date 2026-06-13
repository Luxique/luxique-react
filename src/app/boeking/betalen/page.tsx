'use client'

import { useEffect, useState, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'

interface Booking {
  id: string
  cal_booking_uid: string
  event_type: string
  slot_start: string
  amount_cents: number
  status: string
  expires_at: string
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState('10:00')

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) {
        setRemaining('0:00')
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
    <div className="timer">
      <span className="t-lbl">Voldoe je aanbetaling binnen</span>
      <span className="t-clock">{remaining}</span>
      <span className="t-sub">anders vervalt je afspraak</span>
    </div>
  )
}

// Payment logo SVGs (exact from mockup)
const PAYMENT_LOGOS = {
  ideal: <svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><defs><linearGradient id="a" x1="87.55" x2="82.31" y1="15.45" y2="21.86" gradientTransform="translate(0 24)" gradientUnits="userSpaceOnUse"><stop offset=".02" stopColor="#1d1c1c" stopOpacity="0"/><stop offset=".68" stopColor="#1d1c1c"/></linearGradient></defs><rect width="120" height="80" fill="#fff48d" rx="4" ry="4"/><path fill="#fff" d="M8.05 24.13v31.73c0 1.52 1.25 2.76 2.78 2.76h19.05c14.4 0 20.65-8.02 20.65-18.67s-6.24-18.59-20.65-18.59H10.83c-1.53 0-2.78 1.24-2.78 2.76Z"/><path fill="#c06" d="M20.8 29.16v23.45h10.25c9.31 0 13.35-5.23 13.35-12.64s-4.04-12.58-13.35-12.58h-8.48c-.98 0-1.78.8-1.78 1.77Z"/><path fill="#232323" fillRule="evenodd" d="M13.31 56.1h16.57c11.64 0 18.07-5.73 18.07-16.13 0-5.99-2.35-16.06-18.07-16.06H13.31c-1.47 0-2.66 1.19-2.66 2.65v26.89c0 1.46 1.19 2.65 2.66 2.65m-1.78-29.54c0-.98.79-1.77 1.78-1.77h16.57c6.41 0 17.18 1.98 17.18 15.18 0 9.83-6.1 15.25-17.18 15.25H13.31c-.98 0-1.78-.79-1.78-1.77z"/><path fill="#fff" fillRule="evenodd" d="M25.85 36.56a3 3 0 0 0-.99-.17s-2.35-.01-2.35-.01v5.66h2.38c.42 0 .79-.08 1.1-.22.31-.15.57-.35.77-.6s.35-.56.46-.91q.15-.525.15-1.14c0-.47-.07-.88-.19-1.23-.13-.34-.31-.63-.53-.87-.23-.22-.49-.4-.8-.52Zm-.56 4.37c-.18.06-.34.08-.52.08s-1.07.01-1.07.01v-3.57h.87c.3 0 .54.04.75.13s.37.22.49.38.22.36.27.59c.05.22.08.49.08.77 0 .32-.04.57-.12.8-.08.22-.19.39-.31.53s-.27.24-.44.29Z"/><path fill="#fff" d="M32.27 36.4v1.05h-2.91v1.21h2.67v.96h-2.67V41h2.97v1.05h-4.18v-5.66h4.11Z"/><path fill="#fff" fillRule="evenodd" d="m38.49 42.06-2.06-5.66h-1.26l-2.08 5.66h1.22l.44-1.26h2.06l.42 1.26zm-2.69-4.27.69 2.08h-1.42l.72-2.08Z"/><path fill="#fff" d="M40.45 36.4v4.62h2.69v1.05h-3.89v-5.66h1.21Z"/><path fill="#232323" d="M16.04 42.15c1.47 0 2.66-1.19 2.66-2.66s-1.19-2.66-2.66-2.66-2.66 1.19-2.66 2.66 1.19 2.66 2.66 2.66m1.58 10.65c-2.06 0-3.71-1.78-3.71-3.97v-3.1c0-1.09.83-1.99 1.86-1.99s1.86.88 1.86 1.99v7.06h-.01Z"/><path fill="#1d1c1c" d="M99.85 40.13c0-3.11 2.21-5.95 6.04-5.95s6.06 2.84 6.06 5.95-2.21 5.95-6.06 5.95-6.04-2.84-6.04-5.95m8.74 0c0-1.5-.99-2.88-2.69-2.88s-2.69 1.39-2.69 2.88 1.01 2.89 2.69 2.89 2.69-1.39 2.69-2.89M97.5 42.34c1.27-.73 2.04-2.11 2.04-3.64 0-2.27-1.64-4.21-4.19-4.21H90v11.29h3.32V42.9h.62l1.9 2.88h3.9l-2.23-3.43Zm-2.82-2.05h-1.37V37.1h1.39c.89 0 1.47.73 1.47 1.6s-.59 1.6-1.48 1.6Zm-19.82-5.82-1.99 6.73-1.94-6.73h-2.64l-1.96 6.73-1.97-6.73h-3.5l4.01 11.27h2.88l1.86-6.13 1.84 6.13h2.89l4.01-11.27h-3.5Zm8.52 8.52c-1.24 0-2.11-.75-2.48-1.74h8.42c.07-.37.1-.75.1-1.14 0-3.1-2.21-5.94-6.04-5.94v3.06c1.25 0 2.11.75 2.48 1.74h-8.41c-.07.37-.1.75-.1 1.14 0 3.11 2.21 5.94 6.03 5.94z"/></svg>,
  klarna: <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="80" rx="4" fill="#FFA8CD"/><path d="M92.5714 46.1922C90.7118 46.1922 89.2625 44.6544 89.2625 42.7872C89.2625 40.9199 90.7118 39.3822 92.5714 39.3822C94.4309 39.3822 95.8803 40.9199 95.8803 42.7872C95.8803 44.6544 94.4309 46.1922 92.5714 46.1922ZM91.6412 49.7894C93.2276 49.7894 95.2514 49.1853 96.373 46.8237L96.482 46.8787C95.99 48.1692 95.99 48.9382 95.99 49.1304V49.4324H99.9824V36.1419H95.99V36.444C95.99 36.6362 95.99 37.4051 96.482 38.6957L96.373 38.7506C95.2514 36.3891 93.2276 35.7849 91.6412 35.7849C87.8404 35.7849 85.1604 38.8055 85.1604 42.7872C85.1604 46.7688 87.8404 49.7894 91.6412 49.7894ZM78.2138 35.7849C76.4088 35.7849 74.9867 36.4165 73.8381 38.7506L73.7288 38.6957C74.221 37.4051 74.221 36.6362 74.221 36.444V36.1419H70.2282V49.4324H74.3304V42.4302C74.3304 40.5904 75.397 39.4371 77.1199 39.4371C78.8428 39.4371 79.6906 40.4256 79.6906 42.4027V49.4324H83.7928V40.9748C83.7928 37.9543 81.4405 35.7849 78.2138 35.7849ZM64.2938 38.7506L64.1843 38.6957C64.6766 37.4051 64.6766 36.6362 64.6766 36.444V36.1419H60.6839V49.4324H64.786L64.8133 43.0343C64.8133 41.1671 65.7979 40.0412 67.4114 40.0412C67.849 40.0412 68.2045 40.0961 68.6147 40.206V36.1419C66.8097 35.7575 65.1962 36.444 64.2938 38.7506ZM51.2489 46.1922C49.3892 46.1922 47.9397 44.6544 47.9397 42.7872C47.9397 40.9199 49.3892 39.3822 51.2489 39.3822C53.1085 39.3822 54.5579 40.9199 54.5579 42.7872C54.5579 44.6544 53.1085 46.1922 51.2489 46.1922ZM50.319 49.7894C51.9052 49.7894 53.9289 49.1853 55.0502 46.8237L55.1595 46.8787C54.6673 48.1692 54.6673 48.9382 54.6673 49.1304V49.4324H58.6601V36.1419H54.6673V36.444C54.6673 36.6362 54.6673 37.4051 55.1595 38.6957L55.0502 38.7506C53.9289 36.3891 51.9052 35.7849 50.319 35.7849C46.5176 35.7849 43.8376 38.8055 43.8376 42.7872C43.8376 46.7688 46.5176 49.7894 50.319 49.7894ZM38.1219 49.4324H42.2241V30.2106H38.1219V49.4324ZM35.1136 30.2106H30.9294C30.9294 33.6431 28.8236 36.7186 25.6239 38.9153L24.3659 39.7941V30.2106H20.0176V49.4324H24.3659V39.9039L31.5584 49.4324H36.8639L29.9449 40.3158C33.0898 38.0367 35.141 34.4943 35.1136 30.2106Z" fill="#0B051D"/></svg>,
  paypal: <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="80" rx="4" fill="white"/><g transform="translate(37.6,12.4) scale(0.29)"><g transform="translate(898.192 276.071)"><path d="M-837.663-237.968a5.49 5.49 0 0 0-5.423 4.633l-9.013 57.15-8.281 52.514-.005.044.01-.044 8.281-52.514c.421-2.669 2.719-4.633 5.42-4.633h26.404c26.573 0 49.127-19.387 53.246-45.658.314-1.996.482-3.973.52-5.924v-.003h-.003c-6.753-3.543-14.683-5.565-23.372-5.565z" fill="#001c64"/><path d="M-766.506-232.402c-.037 1.951-.207 3.93-.52 5.926-4.119 26.271-26.673 45.658-53.246 45.658h-26.404c-2.701 0-4.999 1.964-5.42 4.633l-8.281 52.514-5.197 32.947a4.46 4.46 0 0 0 4.405 5.153h28.66a5.49 5.49 0 0 0 5.423-4.633l7.55-47.881c.423-2.669 2.722-4.636 5.423-4.636h16.876c26.573 0 49.124-19.386 53.243-45.655 2.924-18.649-6.46-35.614-22.511-44.026z" fill="#0070e0"/><path d="M-870.225-276.071a5.49 5.49 0 0 0-5.423 4.636l-22.489 142.608a4.46 4.46 0 0 0 4.405 5.156h33.351l8.281-52.514 9.013-57.15a5.49 5.49 0 0 1 5.423-4.633h47.782c8.691 0 16.621 2.025 23.375 5.563.46-23.917-19.275-43.666-46.412-43.666z" fill="#003087"/></g></g></svg>,
  mastercard: <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="80" rx="4" fill="white"/><path fillRule="evenodd" clipRule="evenodd" d="M49.6521 52.095H70.3479V14.9044H49.6521V52.095Z" fill="#FF5F00"/><path fillRule="evenodd" clipRule="evenodd" d="M98.2675 33.5003C98.2675 46.563 87.6791 57.152 74.6171 57.152C69.0996 57.152 64.0229 55.2624 60 52.0956C65.5011 47.7646 69.0339 41.0448 69.0339 33.5003C69.0339 25.9552 65.5011 19.2354 60 14.9044C64.0229 11.7376 69.0996 9.84802 74.6171 9.84802C87.6791 9.84802 98.2675 20.437 98.2675 33.5003Z" fill="#F79E1B"/><path fillRule="evenodd" clipRule="evenodd" d="M50.966 33.5003C50.966 25.9552 54.4988 19.2354 59.9999 14.9044C55.977 11.7376 50.9003 9.84802 45.3828 9.84802C32.3208 9.84802 21.7324 20.437 21.7324 33.5003C21.7324 46.563 32.3208 57.152 45.3828 57.152C50.9003 57.152 55.977 55.2624 59.9999 52.0956C54.4988 47.7646 50.966 41.0448 50.966 33.5003Z" fill="#EB001B"/></svg>,
  maestro: <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="80" rx="4" fill="white"/><path fillRule="evenodd" clipRule="evenodd" d="M49.6521 52.3399H70.3479V15.1492H49.6521V52.3399Z" fill="#7375CF"/><path fillRule="evenodd" clipRule="evenodd" d="M50.966 33.7452C50.966 26.2001 54.4988 19.4802 59.9999 15.1492C55.977 11.9825 50.9003 10.0929 45.3828 10.0929C32.3208 10.0929 21.7324 20.6819 21.7324 33.7452C21.7324 46.8078 32.3208 57.3969 45.3828 57.3969C50.9003 57.3969 55.977 55.5073 59.9999 52.3405C54.4988 48.0095 50.966 41.2896 50.966 33.7452Z" fill="#EB001B"/><path fillRule="evenodd" clipRule="evenodd" d="M98.2675 33.7452C98.2675 46.8078 87.6791 57.3969 74.6171 57.3969C69.0996 57.3969 64.0229 55.5073 60 52.3405C65.5011 48.0095 69.0339 41.2896 69.0339 33.7452C69.0339 26.2001 65.5011 19.4802 60 15.1492C64.0229 11.9825 69.0996 10.0929 74.6171 10.0929C87.6791 10.0929 98.2675 20.6819 98.2675 33.7452Z" fill="#00A2E5"/></svg>,
  bancontact: <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="80" rx="4" fill="white"/><path d="M15.5 67.7753V54.7492H19.4669C22.3503 54.7492 24.2052 55.8471 24.2052 58.1174C24.2052 59.4014 23.6175 60.2946 22.7911 60.8156C23.9848 61.3738 24.6827 62.4532 24.6827 63.9233C24.6827 66.5472 22.7911 67.7753 19.8526 67.7753H15.5Z" fill="#1E3764"/><path d="M33.1782 48.2362C46.5891 48.2362 53.2945 39.1772 60 30.1181H15.5V48.2362H33.1782Z" fill="#005AB9"/><path d="M86.8218 12C73.4109 12 66.7054 21.059 60 30.1181H104.5V12H86.8218Z" fill="#FFD800"/></svg>,
}

function BetalenContent() {
  const searchParams = useSearchParams()
  const uid = searchParams.get('uid') || searchParams.get('cal.bookingUid') || searchParams.get('bookingUid')

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const fetchBooking = useCallback(async (bookingUid: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/boeking/checkout?uid=${bookingUid}`)
      const data = await res.json()
      if (data.booking) {
        setBooking(data.booking)
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
          return true
        }
      }
      return false
    } catch {
      return false
    }
  }, [])

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
        .timer .t-clock { font-family:'Cormorant Garamond',serif; font-size:46px; line-height:1; color:var(--gold-deep); font-variant-numeric:tabular-nums; font-weight:500; }
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

          <CountdownTimer expiresAt={booking.expires_at} />

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
              <span className="paylogo" title="iDEAL / Wero">{PAYMENT_LOGOS.ideal}</span>
              <span className="paylogo" title="Klarna">{PAYMENT_LOGOS.klarna}</span>
              <span className="paylogo" title="PayPal">{PAYMENT_LOGOS.paypal}</span>
              <span className="paylogo" title="Mastercard">{PAYMENT_LOGOS.mastercard}</span>
              <span className="paylogo" title="Maestro">{PAYMENT_LOGOS.maestro}</span>
              <span className="paylogo" title="Bancontact">{PAYMENT_LOGOS.bancontact}</span>
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
