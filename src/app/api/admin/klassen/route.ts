/**
 * POST /api/admin/klassen
 *
 * Admin-only — maak een nieuwe klas aan.
 * Berekt blok_dagen o.b.v. cursus.duur_werkdagen via berekenWerkdagenBlok.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'
import { berekenWerkdagenBlok, checkKlassenOverlap } from '@/lib/traject'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
}

export async function POST(req: NextRequest) {
  // Auth check
  const auth = await requireAdmin(req)
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status, headers: NO_STORE_HEADERS },
    )
  }

  try {
    const body = await req.json()
    const {
      cursus_id,
      startdatum,   // YYYY-MM-DD
      starttijd,    // HH:MM
      max_deelnemers = 3,
      weergave_titel = null,
      weergave_beschrijving = null,
    } = body

    // Validatie
    if (!cursus_id || !startdatum || !starttijd) {
      return NextResponse.json(
        { error: 'cursus_id, startdatum en starttijd zijn verplicht' },
        { status: 400, headers: NO_STORE_HEADERS },
      )
    }

    // Valideer startdatum format
    const parsedDate = new Date(startdatum + 'T00:00:00')
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: 'Ongeldige startdatum (gebruik YYYY-MM-DD)' },
        { status: 400, headers: NO_STORE_HEADERS },
      )
    }

    // Valideer starttijd format (HH:MM)
    if (!/^\d{2}:\d{2}$/.test(starttijd)) {
      return NextResponse.json(
        { error: 'Ongeldige starttijd (gebruik HH:MM)' },
        { status: 400, headers: NO_STORE_HEADERS },
      )
    }

    // Valideer max_deelnemers
    const max = Number(max_deelnemers)
    if (!Number.isInteger(max) || max < 1 || max > 20) {
      return NextResponse.json(
        { error: 'max_deelnemers moet een geheel getal tussen 1 en 20 zijn' },
        { status: 400, headers: NO_STORE_HEADERS },
      )
    }

    // Haal cursus op voor duur_werkdagen
    const { data: cursus, error: cursusError } = await supabaseAdmin
      .from('traject_cursussen')
      .select('id, naam, duur_werkdagen')
      .eq('id', cursus_id)
      .single()

    if (cursusError || !cursus) {
      return NextResponse.json(
        { error: 'Cursus niet gevonden' },
        { status: 404, headers: NO_STORE_HEADERS },
      )
    }

    // Bereken blok_dagen
    const blok_dagen = berekenWerkdagenBlok(startdatum, cursus.duur_werkdagen)

    // ── OVERLAP-CHECK ──
    // Weiger als één van de dagen al in een andere open/vol-klas zit.
    const overlap = await checkKlassenOverlap(blok_dagen)
    if (!overlap.ok) {
      const conflict = overlap.conflicts[0]
      const cursusNaam = conflict?.cursus_naam ?? 'onbekende cursus'
      const dagenStr = conflict?.overlappende_dagen.join(', ') ?? ''
      const msg = `Deze dagen overlappen met een bestaande klas (${cursusNaam}, ${dagenStr}). Kies een andere startdatum.`
      return NextResponse.json(
        { error: msg, conflicts: overlap.conflicts },
        { status: 409, headers: NO_STORE_HEADERS },
      )
    }

    // Insert klas
    const { data: klas, error: insertError } = await supabaseAdmin
      .from('traject_klassen')
      .insert({
        cursus_id,
        startdatum,
        starttijd,
        blok_dagen,
        max_deelnemers: max,
        status: 'open',
        cal_sync_status: 'pending',
        weergave_titel,
        weergave_beschrijving,
      })
      .select('id, cursus_id, startdatum, starttijd, blok_dagen, max_deelnemers, status, cal_sync_status, weergave_titel, weergave_beschrijving, aangemaakt_op')
      .single()

    if (insertError) {
      console.error('POST /api/admin/klassen insert error:', insertError)
      return NextResponse.json(
        { error: 'Aanmaken klas mislukt', details: insertError.message },
        { status: 500, headers: NO_STORE_HEADERS },
      )
    }

    return NextResponse.json(
      { klas },
      { status: 201, headers: NO_STORE_HEADERS },
    )
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('POST /api/admin/klassen error:', msg)
    return NextResponse.json(
      { error: msg },
      { status: 500, headers: NO_STORE_HEADERS },
    )
  }
}
