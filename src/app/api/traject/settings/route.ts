/**
 * API /api/traject/settings
 *
 * GET  — lees de globale traject-instellingen (publiek leesbaar)
 * PUT  — update de instellingen (service role only)
 *
 * Singleton pattern: er is altijd exact één rij.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const SELECT_FIELDS =
  'id, traject_voorsprong_weken, boekbare_horizon_weken, werktijd_ochtend_start, werktijd_ochtend_eind, werktijd_middag_start, werktijd_middag_eind, pauze_lengte_minuten, pauze_inclusief, bijgewerkt_op'

// ---------------------------------------------------------------------------
// TIME VALIDATION
// ---------------------------------------------------------------------------

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

function parseMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function validateTijden(
  ochtendStart: string,
  ochtendEind: string,
  middagStart: string,
  middagEind: string,
): string | null {
  for (const [label, val] of [
    ['Ochtend start', ochtendStart],
    ['Ochtend eind', ochtendEind],
    ['Middag start', middagStart],
    ['Middag eind', middagEind],
  ] as const) {
    if (!TIME_RE.test(val)) {
      return `${label} moet HH:MM zijn (bv. 09:00), kreeg: "${val}"`
    }
  }
  const os = parseMin(ochtendStart)
  const oe = parseMin(ochtendEind)
  const ms = parseMin(middagStart)
  const me = parseMin(middagEind)

  if (os >= oe) return 'Ochtend start moet vóór ochtend eind zijn.'
  if (oe > ms) return 'Ochtend eind ligt na middag start — er is geen pauze.'
  if (ms >= me) return 'Middag start moet vóór middag eind zijn.'
  return null
}

// ---------------------------------------------------------------------------

async function getSettings() {
  const { data, error } = await supabaseAdmin
    .from('traject_instellingen')
    .select(SELECT_FIELDS)
    .order('aangemaakt_op', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`DB-fout: ${error.message}`)
  return data
}

// ---------------------------------------------------------------------------

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
}

// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const settings = await getSettings()
    if (!settings) {
      return NextResponse.json(
        { error: 'Geen instellingen gevonden. Run de SQL-seed.' },
        { status: 404, headers: NO_STORE_HEADERS },
      )
    }
    return NextResponse.json(settings, {
      status: 200,
      headers: NO_STORE_HEADERS,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500, headers: NO_STORE_HEADERS })
  }
}

// ---------------------------------------------------------------------------

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      traject_voorsprong_weken,
      boekbare_horizon_weken,
      werktijd_ochtend_start,
      werktijd_ochtend_eind,
      werktijd_middag_start,
      werktijd_middag_eind,
      pauze_lengte_minuten,
      pauze_inclusief,
    } = body

    // Validate integers
    const vsp = Number(traject_voorsprong_weken)
    const hor = Number(boekbare_horizon_weken)

    if (!Number.isInteger(vsp) || vsp < 0 || vsp > 52) {
      return NextResponse.json(
        { error: `traject_voorsprong_weken moet een geheel getal 0-52 zijn` },
        { status: 400, headers: NO_STORE_HEADERS },
      )
    }
    if (!Number.isInteger(hor) || hor < 1 || hor > 104) {
      return NextResponse.json(
        { error: `boekbare_horizon_weken moet een geheel getal 1-104 zijn` },
        { status: 400, headers: NO_STORE_HEADERS },
      )
    }

    // Validate time fields only if they're all provided
    const hasAllTimes =
      typeof werktijd_ochtend_start === 'string' &&
      typeof werktijd_ochtend_eind === 'string' &&
      typeof werktijd_middag_start === 'string' &&
      typeof werktijd_middag_eind === 'string'

    let updatePayload: Record<string, unknown> = {
      traject_voorsprong_weken: vsp,
      boekbare_horizon_weken: hor,
      bijgewerkt_op: new Date().toISOString(),
    }

    // Pauze lengte (optioneel, alleen als meegegeven)
    if (pauze_lengte_minuten !== undefined) {
      const plm = Number(pauze_lengte_minuten)
      if (!Number.isInteger(plm) || plm < 0 || plm > 300) {
        return NextResponse.json(
          { error: 'pauze_lengte_minuten moet een geheel getal 0-300 zijn' },
          { status: 400, headers: NO_STORE_HEADERS },
        )
      }
      updatePayload.pauze_lengte_minuten = plm
    }

    // Pauze inclusief toggle (optioneel)
    if (pauze_inclusief !== undefined) {
      updatePayload.pauze_inclusief = Boolean(pauze_inclusief)
    }

    if (hasAllTimes) {
      const timeErr = validateTijden(
        werktijd_ochtend_start,
        werktijd_ochtend_eind,
        werktijd_middag_start,
        werktijd_middag_eind,
      )
      if (timeErr) {
        return NextResponse.json(
          { error: timeErr },
          { status: 400, headers: NO_STORE_HEADERS },
        )
      }
      updatePayload = {
        ...updatePayload,
        werktijd_ochtend_start,
        werktijd_ochtend_eind,
        werktijd_middag_start,
        werktijd_middag_eind,
      }
    }

    const current = await getSettings()
    if (!current) {
      return NextResponse.json(
        { error: 'Geen instellingen-rij gevonden. Run de SQL-seed.' },
        { status: 404, headers: NO_STORE_HEADERS },
      )
    }

    const { data, error } = await supabaseAdmin
      .from('traject_instellingen')
      .update(updatePayload)
      .eq('id', current.id)
      .select(SELECT_FIELDS)
      .single()

    if (error) throw new Error(`DB-fout bij opslaan: ${error.message}`)

    return NextResponse.json(data, { status: 200, headers: NO_STORE_HEADERS })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500, headers: NO_STORE_HEADERS })
  }
}
