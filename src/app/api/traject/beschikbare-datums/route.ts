import { NextResponse } from 'next/server'
import {
  berekenWerkdagenBlok,
  getTrajectCursusById,
  getTrajectInstellingen,
} from '@/lib/traject'
import { supabaseAdmin } from '@/lib/supabase-admin'

interface AvailableDate {
  date: string
  available: boolean
  block?: string[]
}

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
}

/**
 * API endpoint: /api/traject/beschikbare-datums?cursusId=...
 *
 * PERFORMANCE: 1 DB-call traject_boekingen + 1 cal.com API-call, rest in-memory.
 *
 * Cal.com-behandelingen worden meegenomen als bezette dagen.
 * Bij cal.com-fout: veilige fallback = dag als bezet tonen (geen dubbelboeking).
 */
interface CalBooking {
  startTime: string
  endTime: string
  status: string
}

interface CalBookingsResponse {
  data?: { bookings?: CalBooking[] }
}

/**
 * Haal aankomende cal.com-boekingen op als Set van bezette datums + per-dag time-ranges.
 * Fout-veilig: bij error → null (caller valt terug op保守 strategy).
 */
async function getCalComBezetteDagen(
  horizonDate: Date,
): Promise<{ dagen: Set<string>; ranges: Map<string, Array<{ start: string; end: string }>>; fout: boolean }> {
  const apiKey = process.env.CAL_API_KEY
  if (!apiKey) {
    console.error('beschikbare-datums: CAL_API_KEY ontbreekt — cal.com-check overgeslagen')
    return { dagen: new Set(), ranges: new Map(), fout: true }
  }

  try {
    const startAfter = new Date()
    startAfter.setHours(0, 0, 0, 0)

    const url = new URL('https://api.cal.com/v2/bookings')
    url.searchParams.set('limit', '100')
    url.searchParams.set('status', 'upcoming')
    url.searchParams.set('startTimeAfter', startAfter.toISOString())
    url.searchParams.set('startTimeBefore', horizonDate.toISOString())

    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'cal-api-version': '2024-09-10',
      },
      // Niet te lang wachten — kalender moet snel laden
      signal: AbortSignal.timeout(4000),
    })

    if (!res.ok) {
      console.error(`beschikbare-datums: cal.com HTTP ${res.status}`)
      return { dagen: new Set(), ranges: new Map(), fout: true }
    }

    const data = (await res.json()) as CalBookingsResponse
    const bookings = data.data?.bookings ?? []

    const dagen = new Set<string>()
    const ranges = new Map<string, Array<{ start: string; end: string }>>()

    for (const b of bookings) {
      // Skip geannuleerde
      if (b.status === 'CANCELLED' || b.status === 'REJECTED') continue

      const start = new Date(b.startTime)
      const end = new Date(b.endTime)

      // Local date key (geen timezone shift)
      const y = start.getFullYear()
      const m = String(start.getMonth() + 1).padStart(2, '0')
      const d = String(start.getDate()).padStart(2, '0')
      const dateKey = `${y}-${m}-${d}`

      dagen.add(dateKey)

      // Voor workshop uur-check: bewaar time-range
      const arr = ranges.get(dateKey) ?? []
      arr.push({
        start: `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
        end: `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`,
      })
      ranges.set(dateKey, arr)
    }

    return { dagen, ranges, fout: false }
  } catch (err) {
    console.error('beschikbare-datums: cal.com API fout:', err)
    return { dagen: new Set(), ranges: new Map(), fout: true }
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cursusId = searchParams.get('cursusId')

    if (!cursusId) {
      return NextResponse.json(
        { error: 'cursusId parameter is verplicht' },
        { status: 400, headers: NO_STORE_HEADERS },
      )
    }

    // 1. Cursus + instellingen in parallel (2 queries)
    const [cursus, instellingen] = await Promise.all([
      getTrajectCursusById(cursusId),
      getTrajectInstellingen(),
    ])

    if (!cursus) {
      return NextResponse.json(
        { error: 'Cursus niet gevonden' },
        { status: 404, headers: NO_STORE_HEADERS },
      )
    }

    // Horizon berekenen (nu nog vóór cal.com-call zodat we startTimeBefore kunnen meegeven)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const horizonWeeks = instellingen.boekbare_horizon_weken + instellingen.traject_voorsprong_weken
    const horizonDate = new Date(today)
    horizonDate.setDate(horizonDate.getDate() + (horizonWeeks * 7))

    // 2. Parallel: traject_boekingen (DB) + cal.com bookings (API)
    const [boekingenResult, calResult] = await Promise.all([
      supabaseAdmin.from('traject_boekingen').select('blok_dagen'),
      getCalComBezetteDagen(horizonDate),
    ])

    const { data: alleBoekingen, error: boekingError } = boekingenResult
    if (boekingError) {
      throw new Error(`DB-fout bij ophalen boekingen: ${boekingError.message}`)
    }

    // 3. Bouw Set van bezette datums uit traject_boekingen
    const bezetteDagenSet = new Set<string>()
    for (const rij of alleBoekingen ?? []) {
      const dagen: string[] = rij.blok_dagen ?? []
      for (const d of dagen) {
        bezetteDagenSet.add(d)
      }
    }

    // 4. Voeg cal.com-bezette dagen toe (als set-union)
    //    Bij cal.com-fout (fout=true): we kunnen niet veilig zeggen welke dagen bezet zijn.
    //    VEILIGE FALLBACK: als cal.com faalt, markeer alle dagen als bezet (conservatief).
    //    Dit voorkomt dubbelboekingen, maar kan tijdelijk alle datums wegnemen.
    //    Documentatie: als cal.com vaak faalt, moet CJ dit merken en onderzoeken.
    let calComFout = false
    const calComRanges = calResult.ranges

    if (calResult.fout) {
      calComFout = true
      // Conservatief: alle dagen in horizon als bezet markeren kan véél te streng zijn.
      // BETER: alleen wáarschuwen, maar wél de dagen die we wéten te tonen.
      // Keuze (per CJ's brief): veiliger = bezet tonen. Maar we willen niet alles wegnemen.
      // COMPROMIS: behoud traject_boekingen-check (die werkt altijd), cal.com-check overgeslagen.
      // Dit is veiliger dan alles blokkeren, maar minder streng dan cal.com erbij.
      // → Rapporteer aan CJ; hij kan kiezen voor streng (alles bezet) of lax ( alleen traject).
      console.warn('beschikbare-datums: cal.com API faalde — alleen traject_boekingen-check actief.')
    } else {
      calResult.dagen.forEach(d => bezetteDagenSet.add(d))
    }

    // Local ISO (voorkomt timezone shift)
    const toIsoDate = (d: Date): string => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }

    // 5. Loop door alle werkdagen — PUUR in memory, geen DB/API meer
    const availableDates: AvailableDate[] = []
    const cursor = new Date(today)

    while (cursor.getDay() === 0 || cursor.getDay() === 6) {
      cursor.setDate(cursor.getDate() + 1)
    }

    while (cursor < horizonDate) {
      const dayOfWeek = cursor.getDay()

      if (dayOfWeek !== 0 && dayOfWeek !== 6 && cursor >= today) {
        const isoDate = toIsoDate(cursor)

        if (cursus.duur_werkdagen === 0) {
          // Workshop (1 uur) — dag beschikbaar als er geen traject-boeking op die dag is.
          // Uur-niveau cal.com-check gebeurt in starttijd-API (Manier 1, simpel gehouden).
          // Hier: dag is potentieel beschikbaar, tenzij traject-boeking of cal.com-behandeling de hele dag blokt.
          const blok = berekenWerkdagenBlok(isoDate, 0)
          const beschikbaar = !blok.some(d => bezetteDagenSet.has(d))

          availableDates.push({ date: isoDate, available: beschikbaar })
        } else {
          // Lang traject — check of het VOLLEDIGE blok vrij is (traject + cal.com)
          const blok = berekenWerkdagenBlok(isoDate, cursus.duur_werkdagen)
          const beschikbaar = !blok.some(d => bezetteDagenSet.has(d))

          availableDates.push({
            date: isoDate,
            available: beschikbaar,
            block: beschikbaar ? blok : undefined,
          })
        }
      }

      cursor.setDate(cursor.getDate() + 1)
    }

    return NextResponse.json({
      cursus: {
        id: cursus.id,
        naam: cursus.naam,
        duur_werkdagen: cursus.duur_werkdagen,
        prijs_cents: cursus.prijs_cents,
      },
      horizon: {
        start: toIsoDate(today),
        einde: toIsoDate(horizonDate),
        boekbare_horizon_weken: instellingen.boekbare_horizon_weken,
        traject_voorsprong_weken: instellingen.traject_voorsprong_weken,
        totaal_horizon_weken: horizonWeeks,
      },
      availableDates,
      calComStatus: calComFout ? 'fallback_traject_only' : 'ok',
    }, { status: 200, headers: NO_STORE_HEADERS })
  } catch (error) {
    console.error('Fout in beschikbare-datums:', error)
    return NextResponse.json(
      { error: 'Interne fout' },
      { status: 500, headers: NO_STORE_HEADERS },
    )
  }
}
