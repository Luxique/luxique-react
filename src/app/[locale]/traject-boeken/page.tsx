'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase-client'
import { formatPrice, formatDuur } from '@/lib/traject'

interface TrajectCursus {
  id: string
  naam: string
  duur_werkdagen: number
  duur_uren_per_dag: number | null
  prijs_cents: number
  prijs_ex_btw: number
  actief: boolean
}

interface TrajectInstellingen {
  werktijd_ochtend_start: string
  werktijd_ochtend_eind: string
  werktijd_middag_start: string
  werktijd_middag_eind: string
  pauze_lengte_minuten: number
  pauze_inclusief: boolean
}

// —— Tijd helpers ——
const parseMin = (t: string): number => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const fmtTijd = (min: number): string => {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isToday, isPast } from 'date-fns'
import { nl } from 'date-fns/locale'

function TrajectBoekenInner() {
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()

  const [cursussen, setCursussen] = useState<TrajectCursus[]>([])
  const [selectedCursus, setSelectedCursus] = useState<TrajectCursus | null>(null)
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [allCalendarDates, setAllCalendarDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [blockDates, setBlockDates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingDates, setLoadingDates] = useState(false)
  const [horizonInfo, setHorizonInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [instellingen, setInstellingen] = useState<TrajectInstellingen | null>(null)
  const [selectedStartTijd, setSelectedStartTijd] = useState<string | null>(null)
  const [klantNaam, setKlantNaam] = useState('')
  const [klantEmail, setKlantEmail] = useState('')
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

  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Laad cursussen bij mount + herstel booking-state uit sessionStorage na login
  useEffect(() => {
    // Herstel booking-gegevens na redirect van login
    try {
      const saved = sessionStorage.getItem('traject_booking_draft')
      if (saved) {
        const draft = JSON.parse(saved)
        if (draft.cursusId && draft.startdatum && draft.starttijd) {
          // We kunnen de cursus pas setten nadat de lijst geladen is
          // Sla op voor verwerking na load
          ;(window as any).__trajectRestore = draft
        }
      }
    } catch {}

    async function loadCursussen() {
      try {
        const response = await fetch('/api/traject/cursussen')
        if (!response.ok) throw new Error('Kan cursussen niet laden')
        const data = await response.json()
        setCursussen(data.cursussen)

        // Herstel selectie na login redirect (sessionStorage heeft prioriteit)
        const draft = (window as any).__trajectRestore
        if (draft) {
          const cursus = data.cursussen.find((c: TrajectCursus) => c.id === draft.cursusId)
          if (cursus) {
            setSelectedCursus(cursus)
            setSelectedDate(draft.startdatum)
            setSelectedStartTijd(draft.starttijd)
            if (draft.klantNaam) setKlantNaam(draft.klantNaam)
            if (draft.klantEmail) setKlantEmail(draft.klantEmail)
          }
          delete (window as any).__trajectRestore
          // Niet wissen uit sessionStorage — pas na succesvolle checkout
        } else {
          // Geen sessionStorage herstel — check URL ?cursus=<id> voor pre-selectie
          const urlCursusId = searchParams.get('cursus')
          if (urlCursusId) {
            const cursus = data.cursussen.find((c: TrajectCursus) => c.id === urlCursusId)
            if (cursus) {
              setSelectedCursus(cursus)
            }
          }
        }
      } catch (err) {
        setError('Kan cursussen niet laden')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadCursussen()
  }, [searchParams])

  // Pre-fill klantgegevens als de gebruiker is ingelogd
  useEffect(() => {
    if (user) {
      // Haal naam uit user metadata of profiles
      const firstName = user.user_metadata?.first_name || ''
      const lastName = user.user_metadata?.last_name || ''
      const fullName = user.user_metadata?.full_name || ''
      const name = fullName || [firstName, lastName].filter(Boolean).join(' ').trim()
      if (name) setKlantNaam(name)
      if (user.email) setKlantEmail(user.email)
    }
  }, [user])

  // Laad instellingen bij mount (werktijden + pauze)
  useEffect(() => {
    async function loadInstellingen() {
      try {
        const res = await fetch('/api/traject/settings', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        setInstellingen({
          werktijd_ochtend_start: data.werktijd_ochtend_start,
          werktijd_ochtend_eind: data.werktijd_ochtend_eind,
          werktijd_middag_start: data.werktijd_middag_start,
          werktijd_middag_eind: data.werktijd_middag_eind,
          pauze_lengte_minuten: data.pauze_lengte_minuten ?? 60,
          pauze_inclusief: data.pauze_inclusief ?? false,
        })
      } catch {
        // stillijnd — default wordt gebruikt
      }
    }
    loadInstellingen()
  }, [])

  // Laad beschikbare datums wanneer cursus gekozen wordt
  useEffect(() => {
    if (!selectedCursus) return

    async function loadAvailableDates() {
      setLoadingDates(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/traject/beschikbare-datums?cursusId=${selectedCursus!.id}`
        )

        if (!response.ok) {
          throw new Error('Kan beschikbare datums niet laden')
        }

        const data = await response.json()
        setAllCalendarDates(data.availableDates.map((d: any) => d.date))
        setAvailableDates(data.availableDates.filter((d: any) => d.available).map((d: any) => d.date))
        setHorizonInfo(data.horizon)
      } catch (err) {
        setError('Kan beschikbare datums niet laden')
        console.error(err)
      } finally {
        setLoadingDates(false)
      }
    }

    loadAvailableDates()
  }, [selectedCursus])

  // Bereken blok datums wanneer datum gekozen wordt
  useEffect(() => {
    if (!selectedDate || !selectedCursus) {
      setBlockDates([])
      return
    }

    // Simuleer blok berekening (in productie zou dit via API komen)
    if (selectedCursus.duur_werkdagen === 0) {
      setBlockDates([selectedDate])
    } else {
      // Bereken werkdagen blok
      const block: string[] = []
      const cursor = new Date(selectedDate + 'T00:00:00')
      let remaining = selectedCursus.duur_werkdagen

      while (remaining > 0) {
        if (!isWeekend(cursor)) {
          block.push(toLocalIso(cursor))
          remaining--
        }
        cursor.setDate(cursor.getDate() + 1)
      }

      setBlockDates(block)
    }
  }, [selectedDate, selectedCursus])

  const formatBlockDates = () => {
    if (blockDates.length === 0) return ''

    const formatted = blockDates.map((d) => {
      const date = new Date(d)
      const day = format(date, 'EEE', { locale: nl })
      const num = format(date, 'd MMM', { locale: nl })
      return `${day} ${num}`
    })

    return formatted.join(', ')
  }

  const prijsIncl = Math.round((selectedCursus?.prijs_cents || 0) * 1.21)
  const aanbetaling = Math.round(prijsIncl / 2)

  // Local ISO date — NO toISOString() (voorkomt UTC timezone shift)
  const toLocalIso = (date: Date): string => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const getCalendarDays = (): (Date | null)[] => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start, end })

    // Bereken offset: op welke weekdag-kolom valt de 1e van de maand?
    // getDay(): 0=zo, 1=ma, ..., 6=za
    // Grid header: Ma Di Wo Do Vr Za Zo (maandag=0)
    const firstDayOfWeek = start.getDay() // 0=zo, 1=ma, ...
    const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

    // Vul op met nullen voor de lege cellen
    const padding: (Date | null)[] = Array(offset).fill(null)
    return [...padding, ...days]
  }

  const isDateAvailable = (date: Date) => {
    const isoDate = toLocalIso(date)
    return availableDates.includes(isoDate)
  }

  const isDateInHorizon = (date: Date) => {
    if (!horizonInfo) return false
    const start = new Date(horizonInfo.start + 'T00:00:00')
    const end = new Date(horizonInfo.einde + 'T00:00:00')
    const checkDate = new Date(toLocalIso(date) + 'T00:00:00')
    return checkDate >= start && checkDate <= end
  }

  const isDateReturnedByAPI = (date: Date) => {
    const isoDate = toLocalIso(date)
    return allCalendarDates.includes(isoDate)
  }

  const handleDateClick = (date: Date) => {
    if (!isDateAvailable(date)) return

    const isoDate = toLocalIso(date)
    setSelectedDate(isoDate)
    setSelectedStartTijd(null)
  }

  const startCheckout = async () => {
    if (!selectedCursus || !selectedDate || !selectedStartTijd) return
    if (klantNaam.trim().length < 2) {
      setCheckoutFout('Vul je naam in')
      return
    }
    if (!klantEmail.includes('@') || klantEmail.length < 5) {
      setCheckoutFout('Vul een geldig e-mailadres in')
      return
    }

    // Require login — bewaar booking-state voordat we redirecten
    if (!user) {
      sessionStorage.setItem('traject_booking_draft', JSON.stringify({
        cursusId: selectedCursus.id,
        startdatum: selectedDate,
        starttijd: selectedStartTijd,
        klantNaam: klantNaam.trim(),
        klantEmail: klantEmail.trim(),
      }))
      setAuthMode('login')
      return
    }

    setCheckoutLaden(true)
    setCheckoutFout(null)

    try {
      // Haal JWT op voor authenticated checkout
      const { data: sessionData } = await supabase.auth.getSession()
      const authToken = sessionData.session?.access_token

      const res = await fetch('/api/traject/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          cursus_id: selectedCursus.id,
          cursus_naam: selectedCursus.naam,
          startdatum: selectedDate,
          starttijd: selectedStartTijd,
          klant_naam: klantNaam.trim(),
          klant_email: klantEmail.trim(),
          prijs_cents: selectedCursus.prijs_cents,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      // Wis draft na succesvolle checkout redirect
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
      // Succes — auth-context zal user updaten, authMode wordt gereset
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
      // Stuur branded confirmatie-email (zelfde patroon als /register page)
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

  const isWorkshop = selectedCursus?.duur_werkdagen === 0
  const needsModel = selectedCursus ? selectedCursus.duur_werkdagen > 1 : false

  // —— STARTTIJD-OPTIES BEREKENING ——
  // AFHANKELIJK van cursus-type (lange trajecten vs 1-uur workshop)
  // STAP 4 zal deze lijst filteren op bezette tijden (bestaande boekingen).
  const starttijdOpties: { start: string; eind: string }[] = []

  if (instellingen && selectedCursus && selectedDate) {
    const ochtendStart = parseMin(instellingen.werktijd_ochtend_start)
    const ochtendEind = parseMin(instellingen.werktijd_ochtend_eind)
    const middagStart = parseMin(instellingen.werktijd_middag_start)
    const middagEind = parseMin(instellingen.werktijd_middag_eind)
    const pauzeMin = instellingen.pauze_lengte_minuten
    const pauzeIncl = instellingen.pauze_inclusief

    if (isWorkshop) {
      // REGEL B: 1-uur workshop — elk half uur BINNEN werktijden, pauze-uur overslaan
      const workshopDuur = selectedCursus.duur_uren_per_dag || 1
      const workshopMin = workshopDuur * 60

      // Ochtendblok: van ochtendStart tot ochtendEind
      for (let t = ochtendStart; t + workshopMin <= ochtendEind; t += 30) {
        starttijdOpties.push({ start: fmtTijd(t), eind: fmtTijd(t + workshopMin) })
      }
      // Middagblok: van middagStart tot middagEind (pauze-uur automatisch overgeslagen)
      for (let t = middagStart; t + workshopMin <= middagEind; t += 30) {
        starttijdOpties.push({ start: fmtTijd(t), eind: fmtTijd(t + workshopMin) })
      }
    } else {
      // REGEL A: Lang traject — venster moet binnen volledige werkdag passen
      // Werkdag = ochtendStart tot middagEind (inclusive pauze die al in de middag zit)
      const werkdagEind = middagEind
      const dagDuurUren = selectedCursus.duur_uren_per_dag || 8
      const dagDuurMin = dagDuurUren * 60
      // Pauze komt bovenop als niet inclusief
      const vensterMin = dagDuurMin + (pauzeIncl ? 0 : pauzeMin)

      // Starttijden op het halve uur, beginnend vanaf ochtendStart
      for (let t = ochtendStart; t + vensterMin <= werkdagEind; t += 30) {
        starttijdOpties.push({ start: fmtTijd(t), eind: fmtTijd(t + vensterMin) })
      }
    }
  }

  // Gekozen optie
  const gekozenOptie = starttijdOpties.find(o => o.start === selectedStartTijd) || null

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0C0A07] flex items-center justify-center">
        <div className="text-[#C4A265] text-xl">Laden...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0C0A07] flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0C0A07] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl text-[#C4A265] mb-4">
            Boek jouw traject
          </h1>
          <p className="text-[#FBF8F2]/80 text-lg">
            Kies een traject en selecteer je startdatum
          </p>
        </div>

        {!selectedCursus ? (
          /* Stap 1: Cursus kiezen */
          <div className="space-y-6">
            <h2 className="font-['Cormorant_Garamond'] text-3xl text-[#FBF8F2] mb-8">
              Kies jouw traject
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {cursussen.map((cursus) => (
                <div
                  key={cursus.id}
                  onClick={() => setSelectedCursus(cursus)}
                  className="bg-[#1a1614] border border-[#C4A265]/20 p-8 rounded-lg cursor-pointer hover:border-[#C4A265] transition-colors"
                >
                  <h3 className="font-['Cormorant_Garamond'] text-2xl text-[#C4A265] mb-3">
                    {cursus.naam}
                  </h3>
                  <div className="space-y-2 text-[#FBF8F2]/90">
                    <p className="text-lg">
                      <span className="text-[#C4A265]">Duur:</span> {formatDuur(cursus.duur_werkdagen)}
                    </p>
                    <p className="text-lg">
                      <span className="text-[#C4A265]">Prijs:</span> {formatPrice(cursus.prijs_cents)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Stap 2: Kalender & datum kiezen */
          <div className="space-y-8">
            {/* Terug naar cursussen */}
            <button
              onClick={() => {
                setSelectedCursus(null)
                setSelectedDate(null)
                setBlockDates([])
                setAvailableDates([])
              }}
              className="text-[#C4A265] hover:text-[#FBF8F2] transition-colors"
            >
              ← Terug naar trajecten
            </button>

            {/* Geselecteerde cursus info */}
            <div className="bg-[#1a1614] border border-[#C4A265]/20 p-8 rounded-lg">
              <h2 className="font-['Cormorant_Garamond'] text-3xl text-[#C4A265] mb-4">
                {selectedCursus.naam}
              </h2>
              <div className="grid md:grid-cols-2 gap-4 text-[#FBF8F2]/90">
                <p className="text-lg">
                  <span className="text-[#C4A265]">Duur:</span> {formatDuur(selectedCursus.duur_werkdagen)}
                </p>
                <p className="text-lg">
                  <span className="text-[#C4A265]">Prijs:</span> {formatPrice(selectedCursus.prijs_cents)}
                </p>
              </div>
            </div>

            {/* Kalender */}
            <div className="bg-[#1a1614] border border-[#C4A265]/20 p-8 rounded-lg">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  className="text-[#C4A265] hover:text-[#FBF8F2] transition-colors px-4 py-2"
                  disabled={loadingDates}
                >
                  ←
                </button>
                <h3 className="font-['Cormorant_Garamond'] text-2xl text-[#FBF8F2]">
                  {format(currentMonth, 'MMMM yyyy', { locale: nl })}
                </h3>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  className="text-[#C4A265] hover:text-[#FBF8F2] transition-colors px-4 py-2"
                  disabled={loadingDates}
                >
                  →
                </button>
              </div>

              {loadingDates ? (
                <div className="text-center py-12">
                  <div className="text-[#C4A265] text-lg">Beschikbare datums laden...</div>
                </div>
              ) : (
                <>
                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day) => (
                      <div key={day} className="text-center text-[#C4A265] font-semibold">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {getCalendarDays().map((date, index) => {
                      if (!date) {
                        return <div key={`empty-${index}`} className="aspect-square" />
                      }

                      const isoDate = toLocalIso(date)
                      const isAvailable = isDateAvailable(date)
                      const isSelected = selectedDate === isoDate
                      const isWeekendDay = isWeekend(date)
                      const isPastDate = isPast(date) && !isToday(date)
                      const inHorizon = isDateInHorizon(date)
                      const isReturnedByAPI = isDateReturnedByAPI(date)
                      const isInBlock = blockDates.includes(isoDate) && !isSelected

                      let className =
                        'aspect-square flex items-center justify-center rounded-lg transition-colors relative '

                      if (isSelected) {
                        className += 'bg-[#C4A265] text-[#0C0A07] font-bold cursor-pointer ring-2 ring-[#C4A265] ring-offset-2 ring-offset-[#1a1614]'
                      } else if (isInBlock) {
                        className += 'bg-[#C4A265]/40 text-[#FBF8F2] cursor-pointer border border-[#C4A265]/50'
                      } else if (isWeekendDay) {
                        className += 'text-[#C4A265]/30 cursor-not-allowed'
                      } else if (!inHorizon || isPastDate) {
                        className += 'text-[#C4A265]/20 cursor-not-allowed'
                      } else if (!isReturnedByAPI) {
                        className += 'text-[#C4A265]/20 cursor-not-allowed'
                      } else if (isAvailable) {
                        className += 'bg-[#C4A265]/20 text-[#FBF8F2] cursor-pointer hover:bg-[#C4A265]/40'
                      } else {
                        className += 'text-[#C4A265]/40 cursor-not-allowed line-through'
                      }

                      return (
                        <button
                          key={isoDate}
                          onClick={() => handleDateClick(date)}
                          disabled={!isAvailable || isWeekendDay || !inHorizon || isPastDate}
                          className={className}
                        >
                          {format(date, 'd')}
                          {isSelected && (
                            <span className="absolute -top-2 -right-1 text-[9px] bg-[#C4A265] text-[#0C0A07] px-1 rounded font-bold">START</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            {/* STARTTIJD-KEUZE — na datumkeuze */}
            {selectedDate && instellingen && (
              <div className="bg-[#1a1614] border border-[#C4A265]/20 p-8 rounded-lg">
                <h3 className="font-['Cormorant_Garamond'] text-2xl text-[#C4A265] mb-2">
                  Kies je starttijd
                </h3>
                <p className="text-[#FBF8F2]/60 text-sm mb-6">
                  {isWorkshop
                    ? `Workshop van ${selectedCursus.duur_uren_per_dag || 1} uur.`
                    : `Trajectdag van ${selectedCursus.duur_uren_per_dag || 8} uur. De gekozen starttijd geldt voor alle trajectdagen.`}
                </p>

                {starttijdOpties.length === 0 ? (
                  <p className="text-[#FBF8F2]/50 text-sm">Geen geschikte starttijden beschikbaar.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {starttijdOpties.map(opt => (
                      <button
                        key={opt.start}
                        onClick={() => setSelectedStartTijd(opt.start)}
                        className={`px-4 py-3 rounded-lg text-sm font-medium transition ${
                          selectedStartTijd === opt.start
                            ? 'bg-[#C4A265] text-[#0C0A07] font-bold'
                            : 'bg-[#C4A265]/10 text-[#FBF8F2] hover:bg-[#C4A265]/30 border border-[#C4A265]/20'
                        }`}
                      >
                        <div>{opt.start}</div>
                        <div className="text-[10px] opacity-60">tot {opt.eind}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Samenvatting */}
            {selectedDate && (
              <div className="bg-[#1a1614] border-2 border-[#C4A265] p-8 rounded-lg">
                <h3 className="font-['Cormorant_Garamond'] text-3xl text-[#C4A265] mb-6">
                  Samenvatting
                </h3>

                <div className="space-y-4 text-[#FBF8F2]/90">
                  <div className="flex justify-between items-center pb-4 border-b border-[#C4A265]/20">
                    <span className="text-lg">Traject</span>
                    <span className="text-lg font-semibold">{selectedCursus.naam}</span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b border-[#C4A265]/20">
                    <span className="text-lg">Startdatum</span>
                    <span className="text-lg font-semibold">
                      {format(new Date(selectedDate), 'EEEE d MMMM yyyy', { locale: nl })}
                    </span>
                  </div>

                  {isWorkshop ? (
                    <div className="flex justify-between items-center pb-4 border-b border-[#C4A265]/20">
                      <span className="text-lg">Datum</span>
                      <span className="text-lg font-semibold">
                        {format(new Date(selectedDate), 'EEEE d MMMM yyyy', { locale: nl })}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start pb-4 border-b border-[#C4A265]/20">
                      <span className="text-lg">Trajectdagen</span>
                      <span className="text-lg font-semibold text-right max-w-[50%]">
                        {formatBlockDates()}
                      </span>
                    </div>
                  )}

                  {gekozenOptie && (
                    <div className="flex justify-between items-center pb-4 border-b border-[#C4A265]/20">
                      <span className="text-lg">Tijd per dag</span>
                      <span className="text-lg font-semibold">
                        {gekozenOptie.start} – {gekozenOptie.eind}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pb-4 border-b border-[#C4A265]/20">
                    <span className="text-lg">Totaal</span>
                    <span className="text-lg font-semibold">
                      {formatPrice(prijsIncl)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <span className="text-xl font-semibold text-[#C4A265]">Aanbetaling</span>
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

                {/* Klantgegevens + checkout */}
                {selectedStartTijd && (
                  <div className="mt-6 pt-6 border-t border-[#C4A265]/20 space-y-4">
                    <h4 className="font-['Cormorant_Garamond'] text-xl text-[#C4A265]">
                      Jouw gegevens
                    </h4>

                    {/* === AUTH GATE === */}
                    {user ? (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 text-sm text-green-400">
                        ✅ Ingelogd als <strong>{user.email}</strong>
                      </div>
                    ) : authMode === 'login' ? (
                      /* === INLINE LOGIN === */
                      <div className="bg-[#0C0A07] border border-[#C4A265]/30 rounded-lg p-6 space-y-4">
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
                      /* === INLINE REGISTER === */
                      <div className="bg-[#0C0A07] border border-[#C4A265]/30 rounded-lg p-6 space-y-4">
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

                    {/* Form alleen tonen als gebruiker ingelogd is OF auth gate nog niet getriggerd is */}
                    {(user || authMode === 'none') && (
                      <>
                        <div className="grid md:grid-cols-2 gap-4">
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
                          <p className="text-red-400 text-sm">⚠️ {checkoutFout}</p>
                        )}

                        <button
                          className={`w-full font-bold py-4 px-6 rounded-lg transition-colors ${
                            checkoutLaden
                              ? 'bg-[#C4A265]/50 text-[#0C0A07] cursor-wait'
                              : 'bg-[#C4A265] hover:bg-[#C4A265]/90 text-[#0C0A07]'
                          }`}
                          disabled={checkoutLaden || authLoading}
                          onClick={startCheckout}
                        >
                          {checkoutLaden
                            ? 'Doorverwijzen naar betaling...'
                            : user
                            ? `Betaal aanbetaling (${formatPrice(aanbetaling)})`
                            : `Inloggen om door te gaan →`}
                        </button>

                        <p className="text-[#FBF8F2]/40 text-xs text-center">
                          {user
                            ? 'Je betaalt nu 50% aanbetaling via Stripe. Het restbedrag betaal je bij Chiva op de startdag.'
                            : 'Je hebt een account nodig om dit traject te boeken. Je gegevens worden bewaard.'}
                        </p>
                      </>
                    )}
                  </div>
                )}

                {!selectedStartTijd && (
                  <div className="mt-8">
                    <button
                      className="w-full bg-[#C4A265]/20 text-[#C4A265]/50 cursor-not-allowed font-bold py-4 px-6 rounded-lg"
                      disabled
                    >
                      Kies eerst een starttijd
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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
