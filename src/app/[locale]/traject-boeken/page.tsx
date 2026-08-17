'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase-client'
import { formatPrice, formatDuur } from '@/lib/traject'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

// —— Types ——
interface TrajectCursus {
  id: string
  naam: string
  duur_werkdagen: number
  duur_uren_per_dag: number | null
  prijs_cents: number
  prijs_ex_btw: number
  actief: boolean
}

interface KlasInfo {
  id: string
  cursus_id: string
  cursus_naam: string | null
  prijs_cents: number | null
  duur_werkdagen: number | null
  startdatum: string
  starttijd: string
  eindtijd?: string | null
  blok_dagen: string[]
  max_deelnemers: number
  plekken_over: number
  vol: boolean
  status: 'open' | 'vol'
  weergave_titel: string | null
  weergave_beschrijving: string | null
}

// —— Date formatting helper ——
function formatDateDisplay(klas: KlasInfo): string {
  const days = klas.blok_dagen?.length ? klas.blok_dagen : [klas.startdatum]
  if (days.length === 1) {
    const d = new Date(days[0] + 'T00:00:00')
    return format(d, 'EEEE d MMMM yyyy', { locale: nl })
  }
  const first = new Date(days[0] + 'T00:00:00')
  const last = new Date(days[days.length - 1] + 'T00:00:00')
  if (first.getMonth() === last.getMonth()) {
    return `${format(first, 'EEEE d', { locale: nl })} t/m ${format(last, 'EEEE d MMMM yyyy', { locale: nl })}`
  }
  return `${format(first, 'd MMMM', { locale: nl })} t/m ${format(last, 'd MMMM yyyy', { locale: nl })}`
}

function fmtTime(t?: string | null): string {
  if (!t) return ''
  // Strip seconds: "08:30:00" → "08:30", "16:00" → "16:00"
  const parts = t.split(':')
  return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : t
}

function TrajectBoekenInner() {
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()

  const klasId = searchParams.get('klas')

  const [cursussen, setCursussen] = useState<TrajectCursus[]>([])
  const [klas, setKlas] = useState<KlasInfo | null>(null)
  const [klasLoading, setKlasLoading] = useState(true)
  const [klasError, setKlasError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [klantNaam, setKlantNaam] = useState('')
  const [klantEmail, setKlantEmail] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [checkoutFout, setCheckoutFout] = useState<string | null>(null)
  const [checkoutLaden, setCheckoutLaden] = useState(false)
  const [authMode, setAuthMode] = useState<'none' | 'login' | 'register'>('none')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [regFirstName, setRegFirstName] = useState('')
  const [regLastName, setRegLastName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [regError, setRegError] = useState('')
  const [regLoading, setRegLoading] = useState(false)
  const [regSuccess, setRegSuccess] = useState(false)

  // Load cursussen (for pricing fallback)
  useEffect(() => {
    async function loadCursussen() {
      try {
        const response = await fetch('/api/traject/cursussen')
        if (!response.ok) throw new Error('Kan cursussen niet laden')
        const data = await response.json()
        setCursussen(data.cursussen)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadCursussen()
  }, [])

  // Load klas from ?klas= param
  useEffect(() => {
    if (!klasId) {
      setKlasLoading(false)
      return
    }

    async function loadKlas() {
      try {
        const res = await fetch('/api/traject/klassen')
        if (!res.ok) throw new Error('Kan klassen niet laden')
        const data = await res.json()
        const found = (data.klassen || []).find((k: KlasInfo) => k.id === klasId)
        if (!found) {
          setKlasError('Deze klas is niet meer beschikbaar.')
        } else {
          setKlas(found)
        }
      } catch {
        setKlasError('Kan klas-gegevens niet laden.')
      } finally {
        setKlasLoading(false)
      }
    }
    loadKlas()
  }, [klasId])

  // Pre-fill klantgegevens from user metadata
  useEffect(() => {
    if (user) {
      // Restore from sessionStorage draft if present
      try {
        const saved = sessionStorage.getItem('traject_booking_draft')
        if (saved) {
          const draft = JSON.parse(saved)
          if (draft.klantNaam) setKlantNaam(draft.klantNaam)
          if (draft.klantEmail) setKlantEmail(draft.klantEmail)
          return
        }
      } catch {}

      const firstName = user.user_metadata?.first_name || ''
      const lastName = user.user_metadata?.last_name || ''
      const fullName = user.user_metadata?.full_name || ''
      const name = fullName || [firstName, lastName].filter(Boolean).join(' ').trim()
      if (name) setKlantNaam(name)
      if (user.email) setKlantEmail(user.email)
    }
  }, [user])

  // Derived pricing
  const selectedCursus = klas ? cursussen.find(c => c.id === klas.cursus_id) : null
  const prijsExcl = klas?.prijs_cents ?? selectedCursus?.prijs_cents ?? 0
  const prijsIncl = Math.round(prijsExcl * 1.21)
  const aanbetaling = Math.round(prijsIncl * 0.2) // 20% — niet-restitueerbaar

  const isWorkshop = (klas?.duur_werkdagen === 0) || (selectedCursus?.duur_werkdagen === 0)
  const needsModel = klas ? (klas.duur_werkdagen ?? selectedCursus?.duur_werkdagen ?? 0) > 1 : false

  const startCheckout = async () => {
    if (!klas) return
    if (klantNaam.trim().length < 2) {
      setCheckoutFout('Vul je naam in')
      return
    }
    if (!klantEmail.includes('@') || klantEmail.length < 5) {
      setCheckoutFout('Vul een geldig e-mailadres in')
      return
    }
    if (!termsAccepted) {
      setCheckoutFout('Je moet akkoord gaan met de voorwaarden om door te gaan')
      return
    }

    // Require login — bewaar booking-state voordat we redirecten
    if (!user) {
      sessionStorage.setItem('traject_booking_draft', JSON.stringify({
        klasId: klas.id,
        klantNaam: klantNaam.trim(),
        klantEmail: klantEmail.trim(),
      }))
      setAuthMode('login')
      return
    }

    setCheckoutLaden(true)
    setCheckoutFout(null)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const authToken = sessionData.session?.access_token

      const res = await fetch('/api/traject/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          klas_id: klas.id,
          cursus_id: klas.cursus_id,
          cursus_naam: klas.cursus_naam || klas.weergave_titel || selectedCursus?.naam || 'Onbekend traject',
          startdatum: klas.startdatum,
          starttijd: klas.starttijd,
          klant_naam: klantNaam.trim(),
          klant_email: klantEmail.trim(),
          prijs_cents: prijsExcl,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      sessionStorage.removeItem('traject_booking_draft')

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setCheckoutFout(msg)
    } finally {
      setCheckoutLaden(false)
    }
  }

  // === AUTH HANDLERS ===

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    })

    if (error) {
      setLoginError(
        error.message === 'Invalid login credentials'
          ? 'Ongeldig e-mailadres of wachtwoord'
          : error.message === 'Email not confirmed'
          ? 'Je e-mailadres is nog niet geverifieerd. Controleer je inbox.'
          : error.message
      )
      setLoginLoading(false)
    } else {
      setAuthMode('none')
      setLoginEmail('')
      setLoginPassword('')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegLoading(true)
    setRegError('')

    if (regPassword !== regConfirmPassword) {
      setRegError('Wachtwoorden komen niet overeen')
      setRegLoading(false)
      return
    }

    if (regPassword.length < 8) {
      setRegError('Wachtwoord moet minimaal 8 tekens bevatten')
      setRegLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        data: { first_name: regFirstName, last_name: regLastName, full_name: `${regFirstName} ${regLastName}` },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      setRegError(
        error.message.includes('already registered')
          ? 'Dit e-mailadres is al geregistreerd'
          : error.message
      )
      setRegLoading(false)
    } else {
      try {
        await fetch('/api/auth/send-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: regEmail, password: regPassword }),
        })
      } catch (e) {
        console.error('Failed to send branded confirmation email:', e)
      }
      setRegLoading(false)
      setRegSuccess(true)
    }
  }

  // === RENDER ===

  if (loading || klasLoading) {
    return (
      <div className="min-h-screen bg-[#0C0A07] flex items-center justify-center">
        <div className="text-[#C4A265] text-xl">Laden...</div>
      </div>
    )
  }

  // No ?klas= param — redirect to trajecten page
  if (!klasId) {
    return (
      <div className="min-h-screen bg-[#0C0A07] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="font-['Cormorant_Garamond'] text-4xl text-[#C4A265] mb-4">
            Traject boeken
          </h1>
          <p className="text-[#FBF8F2]/70 mb-6">
            Ga terug naar de trajecten pagina om een traject te kiezen.
          </p>
          <a
            href="/nl/persoonlijk-traject"
            className="inline-block px-8 py-3 rounded-full bg-[#C4A265] text-[#0C0A07] font-bold hover:bg-[#C4A265]/90 transition"
          >
            Bekijk trajecten
          </a>
        </div>
      </div>
    )
  }

  if (klasError || !klas) {
    return (
      <div className="min-h-screen bg-[#0C0A07] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="font-['Cormorant_Garamond'] text-4xl text-[#C4A265] mb-4">
            Traject boeken
          </h1>
          <p className="text-red-400 mb-6">{klasError || 'Klas niet gevonden.'}</p>
          <a
            href="/nl/persoonlijk-traject"
            className="inline-block px-8 py-3 rounded-full bg-[#C4A265] text-[#0C0A07] font-bold hover:bg-[#C4A265]/90 transition"
          >
            Bekijk trajecten
          </a>
        </div>
      </div>
    )
  }

  const klasVol = klas.plekken_over === 0 || klas.vol

  return (
    <div className="min-h-screen bg-[#0C0A07] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl text-[#C4A265] mb-4">
            Boek jouw traject
          </h1>
          <p className="text-[#FBF8F2]/80 text-lg">
            Bevestig jouw inschrijving
          </p>
        </div>

        <div className="space-y-8">
          {/* Terug naar trajecten */}
          <a
            href="/nl/persoonlijk-traject"
            className="inline-block text-[#C4A265] hover:text-[#FBF8F2] transition-colors"
          >
            ← Terug naar trajecten
          </a>

          {/* STAP 1: Klas bevestiging */}
          <div className="bg-[#1a1614] border border-[#C4A265]/20 p-8 rounded-lg">
            <h2 className="font-['Cormorant_Garamond'] text-3xl text-[#C4A265] mb-6">
              {klas.weergave_titel || klas.cursus_naam || selectedCursus?.naam || 'Traject'}
            </h2>
            <div className="space-y-4 text-[#FBF8F2]/90">
              <div className="flex justify-between items-center pb-4 border-b border-[#C4A265]/20">
                <span className="text-lg text-[#C4A265]">Datum</span>
                <span className="text-lg font-semibold capitalize text-right">
                  {formatDateDisplay(klas)}
                </span>
              </div>

              <div className="flex justify-between items-center pb-4 border-b border-[#C4A265]/20">
                <span className="text-lg text-[#C4A265]">Tijden</span>
                <span className="text-lg font-semibold">{fmtTime(klas.starttijd)}{klas.eindtijd ? ` – ${fmtTime(klas.eindtijd)}` : ' – 16:00'}</span>
              </div>

              {klas.duur_werkdagen != null && (
                <div className="flex justify-between items-center pb-4 border-b border-[#C4A265]/20">
                  <span className="text-lg text-[#C4A265]">Duur</span>
                  <span className="text-lg font-semibold">{formatDuur(klas.duur_werkdagen)}</span>
                </div>
              )}

              <div className="flex justify-between items-start pb-4 border-b border-[#C4A265]/20">
                <span className="text-lg text-[#C4A265] shrink-0">Beschikbaarheid</span>
                <span className={`text-lg font-semibold text-right ${klasVol ? 'text-red-400' : 'text-green-400'}`}>
                  {klasVol
                    ? 'Vol — alleen inschrijving wachtlijst'
                    : `Nog ${klas.plekken_over} ${klas.plekken_over === 1 ? 'plek' : 'plekken'} beschikbaar`}
                </span>
              </div>

              <div className="flex justify-between items-center pb-4 border-b border-[#C4A265]/20">
                <span className="text-lg text-[#C4A265]">Totaal (incl. BTW)</span>
                <span className="text-lg font-semibold">{formatPrice(prijsIncl)}</span>
              </div>

              <div className="flex justify-between items-center pt-4">
                <span className="text-xl font-semibold text-[#C4A265]">Aanbetaling (20%)</span>
                <span className="text-xl font-bold text-[#C4A265]">
                  {formatPrice(aanbetaling)}
                </span>
              </div>
            </div>

            {/* Model disclaimer */}
            {needsModel && (
              <div className="mt-6 flex gap-3 items-start bg-[rgba(155,91,71,0.10)] border border-[rgba(155,91,71,0.30)] rounded-lg p-4">
                <svg className="shrink-0 mt-0.5 text-[#C4A265]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>
                <div>
                  <div className="text-[11px] tracking-[0.14em] uppercase font-semibold text-[#C4A265] mb-1">Let op — model vereist</div>
                  <p className="text-[13px] text-[#FBF8F2]/80 leading-[1.55] mb-0">Je regelt zelf een model voor de praktijkdagen. Zonder model is er die dag geen praktijkoefening mogelijk en kan het certificaat niet behaald worden. Het niet meebrengen van een model komt volledig voor jouw rekening en risico.</p>
                </div>
              </div>
            )}
          </div>

          {/* STAP 2: Jouw gegevens + checkout */}
          {!klasVol ? (
            <div className="bg-[#1a1614] border-2 border-[#C4A265] p-8 rounded-lg">
              <h3 className="font-['Cormorant_Garamond'] text-3xl text-[#C4A265] mb-6">
                Jouw gegevens
              </h3>

              {/* === AUTH GATE === */}
              {user ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 text-sm text-green-400 mb-6">
                  ✅ Ingelogd als <strong>{user.email}</strong>
                </div>
              ) : authMode === 'login' ? (
                <div className="bg-[#0C0A07] border border-[#C4A265]/30 rounded-lg p-6 space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-['Cormorant_Garamond'] text-xl text-[#C4A265]">Inloggen om door te gaan</h4>
                    <button onClick={() => setAuthMode('none')} className="text-[#FBF8F2]/50 hover:text-[#FBF8F2] text-sm">✕</button>
                  </div>
                  <p className="text-[#FBF8F2]/60 text-sm">Je hebt een account nodig om dit traject te boeken. Je boekingsgegevens zijn veilig bewaard.</p>
                  {loginError && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">{loginError}</div>}
                  <form onSubmit={handleLogin} className="space-y-3">
                    <div>
                      <label className="text-sm text-[#FBF8F2]/70 mb-1.5 block">E-mailadres</label>
                      <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required className="w-full px-4 py-3 rounded-lg bg-[#1a1614] border border-[#C4A265]/30 text-[#FBF8F2] placeholder-[#FBF8F2]/30 focus:outline-none focus:border-[#C4A265]" placeholder="jou@email.nl" />
                    </div>
                    <div>
                      <label className="text-sm text-[#FBF8F2]/70 mb-1.5 block">Wachtwoord</label>
                      <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required className="w-full px-4 py-3 rounded-lg bg-[#1a1614] border border-[#C4A265]/30 text-[#FBF8F2] placeholder-[#FBF8F2]/30 focus:outline-none focus:border-[#C4A265]" placeholder="••••••••" />
                    </div>
                    <button type="submit" disabled={loginLoading} className="w-full py-3 rounded-lg bg-[#C4A265] hover:bg-[#C4A265]/90 text-[#0C0A07] font-bold transition disabled:opacity-50">{loginLoading ? 'Bezig...' : 'Inloggen'}</button>
                  </form>
                  <div className="flex items-center justify-between text-sm">
                    <button onClick={() => { setAuthMode('register'); setLoginError('') }} className="text-[#C4A265] hover:text-[#FBF8F2] transition">Nog geen account? Registreer</button>
                    <a href="/nl/forgot-password" className="text-[#FBF8F2]/40 hover:text-[#FBF8F2]">Vergeten?</a>
                  </div>
                </div>
              ) : authMode === 'register' ? (
                <div className="bg-[#0C0A07] border border-[#C4A265]/30 rounded-lg p-6 space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-['Cormorant_Garamond'] text-xl text-[#C4A265]">Account aanmaken</h4>
                    <button onClick={() => setAuthMode('none')} className="text-[#FBF8F2]/50 hover:text-[#FBF8F2] text-sm">✕</button>
                  </div>
                  {regSuccess ? (
                    <div className="text-center py-4">
                      <div className="w-14 h-14 rounded-full bg-[#C4A265]/20 flex items-center justify-center mx-auto mb-4"><span className="text-2xl">✓</span></div>
                      <p className="text-[#FBF8F2] mb-2">Controleer je e-mail</p>
                      <p className="text-[#FBF8F2]/60 text-sm">We hebben een verificatielink gestuurd naar <strong>{regEmail}</strong>. Klik op de link om je account te activeren, dan kun je inloggen.</p>
                      <button onClick={() => { setAuthMode('login'); setRegSuccess(false) }} className="mt-4 px-6 py-2 rounded-full bg-[#C4A265] text-[#0C0A07] font-semibold text-sm hover:bg-[#C4A265]/90 transition">Naar inloggen</button>
                    </div>
                  ) : (
                    <>
                      {regError && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">{regError}</div>}
                      <form onSubmit={handleRegister} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm text-[#FBF8F2]/70 mb-1.5 block">Voornaam</label>
                            <input type="text" value={regFirstName} onChange={e => setRegFirstName(e.target.value)} required className="w-full px-4 py-3 rounded-lg bg-[#1a1614] border border-[#C4A265]/30 text-[#FBF8F2] placeholder-[#FBF8F2]/30 focus:outline-none focus:border-[#C4A265]" />
                          </div>
                          <div>
                            <label className="text-sm text-[#FBF8F2]/70 mb-1.5 block">Achternaam</label>
                            <input type="text" value={regLastName} onChange={e => setRegLastName(e.target.value)} required className="w-full px-4 py-3 rounded-lg bg-[#1a1614] border border-[#C4A265]/30 text-[#FBF8F2] placeholder-[#FBF8F2]/30 focus:outline-none focus:border-[#C4A265]" />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm text-[#FBF8F2]/70 mb-1.5 block">E-mailadres</label>
                          <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required className="w-full px-4 py-3 rounded-lg bg-[#1a1614] border border-[#C4A265]/30 text-[#FBF8F2] placeholder-[#FBF8F2]/30 focus:outline-none focus:border-[#C4A265]" placeholder="jou@email.nl" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm text-[#FBF8F2]/70 mb-1.5 block">Wachtwoord</label>
                            <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} required className="w-full px-4 py-3 rounded-lg bg-[#1a1614] border border-[#C4A265]/30 text-[#FBF8F2] placeholder-[#FBF8F2]/30 focus:outline-none focus:border-[#C4A265]" placeholder="min. 8 tekens" />
                          </div>
                          <div>
                            <label className="text-sm text-[#FBF8F2]/70 mb-1.5 block">Herhaal</label>
                            <input type="password" value={regConfirmPassword} onChange={e => setRegConfirmPassword(e.target.value)} required className="w-full px-4 py-3 rounded-lg bg-[#1a1614] border border-[#C4A265]/30 text-[#FBF8F2] placeholder-[#FBF8F2]/30 focus:outline-none focus:border-[#C4A265]" />
                          </div>
                        </div>
                        <button type="submit" disabled={regLoading} className="w-full py-3 rounded-lg bg-[#C4A265] hover:bg-[#C4A265]/90 text-[#0C0A07] font-bold transition disabled:opacity-50">{regLoading ? 'Bezig...' : 'Account aanmaken'}</button>
                      </form>
                      <button onClick={() => { setAuthMode('login'); setRegError('') }} className="text-[#C4A265] hover:text-[#FBF8F2] transition text-sm block w-full text-center">Al een account? Inloggen</button>
                    </>
                  )}
                </div>
              ) : null}

              {/* Form: toon als ingelogd OF auth gate nog niet getriggerd */}
              {(user || authMode === 'none') && (
                <>
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="text-sm text-[#FBF8F2]/70 mb-1.5 block">Naam</label>
                      <input
                        type="text"
                        value={klantNaam}
                        onChange={e => setKlantNaam(e.target.value)}
                        placeholder="Voor- en achternaam"
                        className="w-full px-4 py-3 rounded-lg bg-[#0C0A07] border border-[#C4A265]/30 text-[#FBF8F2] placeholder-[#FBF8F2]/30 focus:outline-none focus:border-[#C4A265]"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-[#FBF8F2]/70 mb-1.5 block">E-mailadres</label>
                      <input
                        type="email"
                        value={klantEmail}
                        onChange={e => setKlantEmail(e.target.value)}
                        placeholder="jou@email.nl"
                        className="w-full px-4 py-3 rounded-lg bg-[#0C0A07] border border-[#C4A265]/30 text-[#FBF8F2] placeholder-[#FBF8F2]/30 focus:outline-none focus:border-[#C4A265]"
                      />
                    </div>
                  </div>

                  {checkoutFout && (
                    <p className="text-red-400 text-sm mb-4">⚠️ {checkoutFout}</p>
                  )}

                  <div className="mb-5 rounded-lg border border-[rgba(196,162,101,0.35)] bg-[rgba(196,162,101,0.08)] px-4 py-3">
                    <p className="text-[13px] leading-relaxed text-[#FBF8F2]/85">
                      <strong className="text-[#C4A265]">Let op:</strong> de aanbetaling (20% van het totaalbedrag incl. btw) is <strong>niet restitueerbaar</strong> — onder geen enkele omstandigheid, ook niet bij annuleren of verplaatsen.
                    </p>
                  </div>

                  <label className="flex items-start gap-3 mb-5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={e => setTermsAccepted(e.target.checked)}
                      className="mt-1 w-4 h-4 accent-[#C4A265] cursor-pointer shrink-0"
                    />
                    <span className="text-sm text-[#FBF8F2]/70 leading-relaxed">
                      Ik ga akkoord met de{' '}
                      <a href="/voorwaarden#annulering" target="_blank" className="text-[#C4A265] underline hover:text-[#C4A265]/80">
                        algemene voorwaarden en het annuleringsbeleid
                      </a>{' '}
                      en begrijp dat de aanbetaling (20%) <strong>onder geen enkele omstandigheid restitueerbaar</strong> is.
                    </span>
                  </label>

                  <button
                    className={`w-full font-bold py-4 px-6 rounded-lg transition-colors ${
                      checkoutLaden
                        ? 'bg-[#C4A265]/50 text-[#0C0A07] cursor-wait'
                        : 'bg-[#C4A265] hover:bg-[#C4A265]/90 text-[#0C0A07]'
                    }`}
                    disabled={checkoutLaden || authLoading || (user ? !termsAccepted : false)}
                    onClick={startCheckout}
                  >
                    {checkoutLaden
                      ? 'Doorverwijzen naar betaling...'
                      : user
                      ? `Betaal aanbetaling (${formatPrice(aanbetaling)})`
                      : `Inloggen om door te gaan →`}
                  </button>

                  <p className="text-[#FBF8F2]/40 text-xs text-center mt-4">
                    {user
                      ? 'Je betaalt nu 20% aanbetaling via Stripe (niet-restitueerbaar). Het restbedrag betaal je bij Chiva op de startdag.'
                      : 'Je hebt een account nodig om dit traject te boeken. Je gegevens worden bewaard.'}
                  </p>
                </>
              )}
            </div>
          ) : (
            /* Klas is vol — wachtlijst */
            <div className="bg-[#1a1614] border border-red-500/30 p-8 rounded-lg text-center">
              <h3 className="font-['Cormorant_Garamond'] text-3xl text-red-400 mb-4">
                Deze klas is vol
              </h3>
              <p className="text-[#FBF8F2]/70 mb-6">
                Helaas, deze klas is volledig geboekt. Neem contact op met Chiva om op de wachtlijst te worden geplaatst.
              </p>
              <a
                href="mailto:info@luxique.nl?subject=Wachtlijst%20traject"
                className="inline-block px-8 py-3 rounded-full bg-[#C4A265] text-[#0C0A07] font-bold hover:bg-[#C4A265]/90 transition"
              >
                Contact opnemen
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TrajectBoekenContent() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0C0A07] flex items-center justify-center"><div className="text-[#C4A265] text-xl">Laden...</div></div>}>
      <TrajectBoekenInner />
    </Suspense>
  )
}
