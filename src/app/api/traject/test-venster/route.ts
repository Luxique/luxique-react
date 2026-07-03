/**
 * TEST-ROUTE — STAP 5a
 * Annulerings-venster logica testen zonder echte boeking.
 *
 * GET /api/traject/test-venster?startdatum=2026-07-13
 * GET /api/traject/test-venster?startdatum=2026-07-13&nu=2026-07-10
 *
 * Returns:
 *   {
 *     startdatum, nu, venster, mag_omboeken, mag_annuleren,
 *     terugbetaling, uren_tot_start, dagen_tot_start, beschrijving,
 *     instellingen: { annuleer_gratis_grens_dagen, annuleer_materiaal_grens_uren, materiaalkosten_cents }
 *   }
 *
 * Selftest:
 *   GET /api/traject/test-venster?selftest=1
 */

import { NextRequest, NextResponse } from 'next/server'
import { bepaalAnnuleringsVenster } from '@/lib/traject'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
}

// ---------------------------------------------------------------------------
// INSTELLINGEN OPHALEN
// ---------------------------------------------------------------------------

async function getInstellingen() {
  const { data, error } = await supabaseAdmin
    .from('traject_instellingen')
    .select('annuleer_gratis_grens_dagen, annuleer_materiaal_grens_uren, materiaalkosten_cents')
    .order('aangemaakt_op', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`DB-fout: ${error.message}`)

  // Defaults als de rij nog niet de nieuwe velden heeft (vóór CJ's SQL migration)
  return {
    annuleer_gratis_grens_dagen: data?.annuleer_gratis_grens_dagen ?? 7,
    annuleer_materiaal_grens_uren: data?.annuleer_materiaal_grens_uren ?? 72,
    materiaalkosten_cents: data?.materiaalkosten_cents ?? 15000,
  }
}

// ---------------------------------------------------------------------------
// ZELFTEST — vaste gevallen met bekend antwoord
// ---------------------------------------------------------------------------

const DEFAULT_INSTELLINGEN = {
  annuleer_gratis_grens_dagen: 7,
  annuleer_materiaal_grens_uren: 72,
}

const ZELFTEST_GEVallen: Array<{
  label: string
  startdatum: string
  nu: string
  verwacht_venster: 1 | 2 | 3
}> = [
  {
    label: '10 dagen voor start → venster 1 (volledig)',
    startdatum: '2026-07-20',
    nu: '2026-07-10T12:00:00+02:00',
    verwacht_venster: 1,
  },
  {
    label: '4 dagen voor start → venster 2 (minus materiaal)',
    startdatum: '2026-07-20',
    nu: '2026-07-16T12:00:00+02:00',
    verwacht_venster: 2,
  },
  {
    label: '1 dag voor start → venster 3 (geen)',
    startdatum: '2026-07-20',
    nu: '2026-07-19T12:00:00+02:00',
    verwacht_venster: 3,
  },
  {
    label: 'na start → venster 3 (geen)',
    startdatum: '2026-07-10',
    nu: '2026-07-15T12:00:00+02:00',
    verwacht_venster: 3,
  },
]

function draaiZelftest() {
  const resultaten = ZELFTEST_GEVallen.map((g: typeof ZELFTEST_GEVallen[number]) => {
    const result = bepaalAnnuleringsVenster(
      g.startdatum,
      new Date(g.nu),
      DEFAULT_INSTELLINGEN,
    )
    const pass = result.venster === g.verwacht_venster
    return { ...g, gekregen_venster: result.venster, pass }
  })
  const allenGeslaagd = resultaten.every((r: typeof resultaten[number]) => r.pass)
  return { resultaten, allenGeslaagd }
}

// ---------------------------------------------------------------------------
// ROUTE
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams

  // Modus 1: selftest
  if (sp.get('selftest') === '1') {
    return NextResponse.json(draaiZelftest(), {
      status: 200,
      headers: NO_STORE_HEADERS,
    })
  }

  const startdatum = sp.get('startdatum')
  if (!startdatum || !/^\d{4}-\d{2}-\d{2}$/.test(startdatum)) {
    return NextResponse.json(
      {
        error: 'Geef ?startdatum=YYYY-MM-DD op, of ?selftest=1',
        voorbeelden: [
          '/api/traject/test-venster?startdatum=2026-07-13',
          '/api/traject/test-venster?startdatum=2026-07-13&nu=2026-07-10',
          '/api/traject/test-venster?selftest=1',
        ],
      },
      { status: 400, headers: NO_STORE_HEADERS },
    )
  }

  try {
    const instellingen = await getInstellingen()

    // Optionele ?nu= override voor testen
    const nuParam = sp.get('nu')
    const nu = nuParam ? new Date(nuParam) : new Date()

    if (Number.isNaN(nu.getTime())) {
      return NextResponse.json(
        { error: `Ongeldige ?nu= parameter: ${nuParam}` },
        { status: 400, headers: NO_STORE_HEADERS },
      )
    }

    const result = bepaalAnnuleringsVenster(startdatum, nu, instellingen)

    return NextResponse.json(
      {
        startdatum,
        nu: nu.toISOString(),
        ...result,
        instellingen,
      },
      { status: 200, headers: NO_STORE_HEADERS },
    )
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { error: msg },
      { status: 500, headers: NO_STORE_HEADERS },
    )
  }
}
