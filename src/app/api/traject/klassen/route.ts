/**
 * GET /api/traject/klassen
 *
 * Publiek endpoint — haalt open klassen op voor de inschrijfpagina.
 * Per klas: cursus-info, datums, resterende plekken.
 *
 * Cache: no-store (altijd actuele beschikbaarheid)
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
}

export async function GET() {
  try {
    const vandaag = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

    // Haal alle klassen in de toekomst (open of vol) + cursus info
    // Use select * so new columns (eindtijd, prijs_override_cents) are picked up automatically
    const { data: klassen, error: klassenError } = await supabaseAdmin
      .from('traject_klassen')
      .select(`
        *,
        traject_cursussen (
          naam,
          prijs_cents,
          duur_werkdagen
        )
      `)
      .gte('startdatum', vandaag)
      .in('status', ['open', 'vol'])
      .order('startdatum', { ascending: true })

    if (klassenError) {
      console.error('klassen GET error:', klassenError)
      return NextResponse.json(
        { error: 'DB-fout bij ophalen klassen' },
        { status: 500, headers: NO_STORE_HEADERS },
      )
    }

    if (!klassen || klassen.length === 0) {
      return NextResponse.json(
        { klassen: [] },
        { status: 200, headers: NO_STORE_HEADERS },
      )
    }

    // Tel betaalde boekingen per klas_id in één query
    const klasIds = klassen.map((k: { id: string }) => k.id)
    const { data: boekingen, error: boekingenError } = await supabaseAdmin
      .from('traject_boekingen')
      .select('klas_id')
      .eq('aanbetaling_status', 'betaald')
      .in('klas_id', klasIds)

    if (boekingenError) {
      console.error('boekingen count error:', boekingenError)
      return NextResponse.json(
        { error: 'DB-fout bij tellen boekingen' },
        { status: 500, headers: NO_STORE_HEADERS },
      )
    }

    // Build count map
    const countMap = new Map<string, number>()
    for (const b of boekingen ?? []) {
      const kid = b.klas_id as string
      countMap.set(kid, (countMap.get(kid) ?? 0) + 1)
    }

    // Compose response
    const result = klassen.map((k: any) => {
      const betaald = countMap.get(k.id) ?? 0
      const plekken_over = Math.max(0, k.max_deelnemers - betaald)
      // Use prijs_override_cents if set on the klas, otherwise fall back to cursus prijs
      const overridePrijs = k.prijs_override_cents ?? null
      const cursusPrijs = k.traject_cursussen?.prijs_cents ?? null
      return {
        id: k.id,
        cursus_id: k.cursus_id,
        cursus_naam: k.traject_cursussen?.naam ?? null,
        prijs_cents: overridePrijs ?? cursusPrijs,
        prijs_override_cents: overridePrijs,
        duur_werkdagen: k.traject_cursussen?.duur_werkdagen ?? null,
        startdatum: k.startdatum,
        starttijd: k.starttijd,
        eindtijd: k.eindtijd ?? null,
        blok_dagen: k.blok_dagen,
        max_deelnemers: k.max_deelnemers,
        plekken_over,
        vol: plekken_over === 0,
        status: plekken_over === 0 ? 'vol' : k.status,
        weergave_titel: k.weergave_titel,
        weergave_beschrijving: k.weergave_beschrijving,
      }
    })

    return NextResponse.json(
      { klassen: result },
      { status: 200, headers: NO_STORE_HEADERS },
    )
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('GET /api/traject/klassen error:', msg)
    return NextResponse.json(
      { error: msg },
      { status: 500, headers: NO_STORE_HEADERS },
    )
  }
}
