/**
 * TEST-ROUTE — STAP 2
 * Geen UI, geen Stripe — alleen logica-test.
 *
 * GET /api/traject/test-blok?start=2026-07-03&dagen=3
 * GET /api/traject/test-blok?start=2026-07-06&dagen=4&cursus_naam=Wispy
 *
 * Returns:
 *   {
 *     startdatum, duurWerkdagen, blok[], beschikbaar, bezetteDagen[]
 *   }
 *
 * Bevat ook een basistest-array die via
 *   GET /api/traject/test-blok?selftest=1
 *   de functie berekenWerkdagenBlok test tegen bekende gevallen.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  berekenWerkdagenBlok,
  isBlokBeschikbaar,
  checkTrajectBeschikbaarheid,
} from '@/lib/traject'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// ZELFTEST — vaste gevallen die bekend antwoord moeten geven
// ---------------------------------------------------------------------------

const ZELFTEST_GEVallen: Array<{
  label: string
  start: string
  dagen: number
  verwacht: string[]
}> = [
  {
    label: 'vrijdag + 3 → [vr, ma, di]',
    start: '2026-07-03',   // = vrijdag
    dagen: 3,
    verwacht: ['2026-07-03', '2026-07-06', '2026-07-07'],
  },
  {
    label: 'maandag + 4 → [ma, di, wo, do]',
    start: '2026-07-06',   // = maandag
    dagen: 4,
    verwacht: ['2026-07-06', '2026-07-07', '2026-07-08', '2026-07-09'],
  },
  {
    label: 'woensdag + 0 → [wo]',
    start: '2026-07-08',   // = woensdag
    dagen: 0,
    verwacht: ['2026-07-08'],
  },
  {
    label: 'zaterdag + 2 → schuift naar ma+di',
    start: '2026-07-04',   // = zaterdag → maandag 07-06
    dagen: 2,
    verwacht: ['2026-07-06', '2026-07-07'],
  },
]

function draaiZelftest() {
  const resultaten = ZELFTEST_GEVallen.map((g) => {
    const gekregen = berekenWerkdagenBlok(g.start, g.dagen)
    const pass = JSON.stringify(gekregen) === JSON.stringify(g.verwacht)
    return { ...g, gekregen, pass }
  })
  const allenGeslaagd = resultaten.every((r) => r.pass)
  return { resultaten, allenGeslaagd }
}

// ---------------------------------------------------------------------------
// ROUTE
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams

  // Modus 1: selftest
  if (sp.get('selftest') === '1') {
    return NextResponse.json(draaiZelftest(), { status: 200 })
  }

  // Modus 2: losse blok-berekening (geen DB)
  const startRaw = sp.get('start')
  const dagenRaw = sp.get('dagen')

  if (!startRaw || !dagenRaw) {
    return NextResponse.json(
      {
        error:
          'Geef ?start=YYYY-MM-DD&dagen=N op, of ?selftest=1 voor de ingebouwde test.',
        voorbeelden: [
          '/api/traject/test-blok?start=2026-07-03&dagen=3',
          '/api/traject/test-blok?start=2026-07-06&dagen=4',
          '/api/traject/test-blok?selftest=1',
        ],
      },
      { status: 400 },
    )
  }

  const dagen = parseInt(dagenRaw, 10)
  if (Number.isNaN(dagen) || dagen < 0) {
    return NextResponse.json(
      { error: `dagen moet een niet-negatief getal zijn, kreeg: ${dagenRaw}` },
      { status: 400 },
    )
  }

  try {
    // Modus 3: blok + beschikbaarheid (combi, raakt DB aan)
    const check = sp.get('check') === '1'

    if (check) {
      const result = await checkTrajectBeschikbaarheid(startRaw, dagen)
      return NextResponse.json(result, { status: 200 })
    }

    // Alleen blok-berekening, geen DB
    const blok = berekenWerkdagenBlok(startRaw, dagen)
    return NextResponse.json(
      {
        startdatum: blok[0] ?? startRaw,
        duurWerkdagen: dagen,
        blok,
      },
      { status: 200 },
    )
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
