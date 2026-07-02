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
 * PERFORMANCE: haalt traject_boekingen ÉÉN keer op (was: per kandidaat-datum).
 */
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

    // 2. ALLE traject_boekingen in ÉÉN query — bouw een Set van bezette datums
    const { data: alleBoekingen, error: boekingError } = await supabaseAdmin
      .from('traject_boekingen')
      .select('blok_dagen')

    if (boekingError) {
      throw new Error(`DB-fout bij ophalen boekingen: ${boekingError.message}`)
    }

    // Bouw een Set van alle bezette datums (union over alle boekingen)
    const bezetteDagenSet = new Set<string>()
    for (const rij of alleBoekingen ?? []) {
      const dagen: string[] = rij.blok_dagen ?? []
      for (const d of dagen) {
        bezetteDagenSet.add(d)
      }
    }

    // 3. Horizon berekenen
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const horizonWeeks = instellingen.boekbare_horizon_weken + instellingen.traject_voorsprong_weken
    const horizonDate = new Date(today)
    horizonDate.setDate(horizonDate.getDate() + (horizonWeeks * 7))

    // Local ISO (voorkomt timezone shift)
    const toIsoDate = (d: Date): string => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }

    // 4. Loop door alle werkdagen — PUUR in memory, geen DB meer
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
          // Workshop — check of de dag vrij is
          const blok = berekenWerkdagenBlok(isoDate, 0)
          const beschikbaar = !blok.some(d => bezetteDagenSet.has(d))

          availableDates.push({ date: isoDate, available: beschikbaar })
        } else {
          // Lang traject — check of het VOLLEDIGE blok vrij is
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
    }, { status: 200, headers: NO_STORE_HEADERS })
  } catch (error) {
    console.error('Fout in beschikbare-datums:', error)
    return NextResponse.json(
      { error: 'Interne fout' },
      { status: 500, headers: NO_STORE_HEADERS },
    )
  }
}
