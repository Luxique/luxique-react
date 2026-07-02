import { NextResponse } from 'next/server'
import {
  berekenWerkdagenBlok,
  isBlokBeschikbaar,
  getTrajectCursusById,
  getTrajectInstellingen,
} from '@/lib/traject'

interface AvailableDate {
  date: string
  available: boolean
  block?: string[]  // Full block dates for long trajecten
}

/**
 * API endpoint: /api/traject/beschikbare-datums?cursusId=...
 *
 * Geeft alle mogelijke startdatums binnen de horizon terug in één call.
 *
 * Voor lange trajecten (duur_werkdagen >= 1): Checkt of het VOLLEDIGE blok vrij is.
 * Voor workshop (duur_werkdagen = 0): Checkt of de dag überhaupt vrij is (nu: geen traject-boeking).
 *
 * Voorsprong window wordt toegepast op de horizon:
 * - Trajecten moeten verder vooruit boekbaar zijn dan behandelingen
 * - Horizon = vandaag + boekbare_horizon_weken + traject_voorsprong_weken
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cursusId = searchParams.get('cursusId')

    if (!cursusId) {
      return NextResponse.json(
        { error: 'cursusId parameter is verplicht' },
        { status: 400 }
      )
    }

    // Haal cursus en instellingen op
    const [cursus, instellingen] = await Promise.all([
      getTrajectCursusById(cursusId),
      getTrajectInstellingen(),
    ])

    if (!cursus) {
      return NextResponse.json(
        { error: 'Cursus niet gevonden' },
        { status: 404 }
      )
    }

    // Berekene horizon met voorsprong
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Horizon = vandaag + boekbare_horizon_weken + traject_voorsprong_weken
    const horizonWeeks = instellingen.boekbare_horizon_weken + instellingen.traject_voorsprong_weken
    const horizonDate = new Date(today)
    horizonDate.setDate(horizonDate.getDate() + (horizonWeeks * 7))

    // Genereer alle werkdagen in de horizon
    const availableDates: AvailableDate[] = []
    const cursor = new Date(today)

    // Skip weekend als startdatum
    while (cursor.getDay() === 0 || cursor.getDay() === 6) {
      cursor.setDate(cursor.getDate() + 1)
    }

    // Loop door alle werkdagen in de horizon
    while (cursor < horizonDate) {
      const dayOfWeek = cursor.getDay()

      // Weekend nooit als startdatum (maar kan in blok zitten)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const isoDate = cursor.toISOString().split('T')[0]

        // Niet in het verleden
        if (cursor >= today) {
          if (cursus.duur_werkdagen === 0) {
            // Workshop (1 uur) — check of de dag überhaupt vrij is
            const blok = berekenWerkdagenBlok(isoDate, 0)
            const check = await isBlokBeschikbaar(blok)

            availableDates.push({
              date: isoDate,
              available: check.beschikbaar,
            })
          } else {
            // Lange traject — check of het VOLLEDIGE blok vrij is
            const blok = berekenWerkdagenBlok(isoDate, cursus.duur_werkdagen)
            const check = await isBlokBeschikbaar(blok)

            availableDates.push({
              date: isoDate,
              available: check.beschikbaar,
              block: check.beschikbaar ? blok : undefined,
            })
          }
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
        start: today.toISOString().split('T')[0],
        einde: horizonDate.toISOString().split('T')[0],
        boekbare_horizon_weken: instellingen.boekbare_horizon_weken,
        traject_voorsprong_weken: instellingen.traject_voorsprong_weken,
        totaal_horizon_weken: horizonWeeks,
      },
      availableDates,
    })

  } catch (error) {
    console.error('Fout in beschikbare-datums:', error)
    return NextResponse.json(
      { error: 'Interne fout' },
      { status: 500 }
    )
  }
}