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

// ---------------------------------------------------------------------------

async function getSettings() {
  const { data, error } = await supabaseAdmin
    .from('traject_instellingen')
    .select('id, traject_voorsprong_weken, boekbare_horizon_weken, bijgewerkt_op')
    .order('aangemaakt_op', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`DB-fout: ${error.message}`)
  return data
}

// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const settings = await getSettings()
    if (!settings) {
      return NextResponse.json(
        { error: 'Geen instellingen gevonden. Run de SQL-seed.' },
        { status: 404 },
      )
    }
    return NextResponse.json(settings, { status: 200 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { traject_voorsprong_weken, boekbare_horizon_weken } = body

    // Validate
    const vsp = Number(traject_voorsprong_weken)
    const hor = Number(boekbare_horizon_weken)

    if (!Number.isInteger(vsp) || vsp < 0 || vsp > 52) {
      return NextResponse.json(
        { error: `traject_voorsprong_weken moet een geheel getal 0-52 zijn` },
        { status: 400 },
      )
    }
    if (!Number.isInteger(hor) || hor < 1 || hor > 104) {
      return NextResponse.json(
        { error: `boekbare_horizon_weken moet een geheel getal 1-104 zijn` },
        { status: 400 },
      )
    }

    const current = await getSettings()
    if (!current) {
      return NextResponse.json(
        { error: 'Geen instellingen-rij gevonden. Run de SQL-seed.' },
        { status: 404 },
      )
    }

    const { data, error } = await supabaseAdmin
      .from('traject_instellingen')
      .update({
        traject_voorsprong_weken: vsp,
        boekbare_horizon_weken: hor,
        bijgewerkt_op: new Date().toISOString(),
      })
      .eq('id', current.id)
      .select('id, traject_voorsprong_weken, boekbare_horizon_weken, bijgewerkt_op')
      .single()

    if (error) throw new Error(`DB-fout bij opslaan: ${error.message}`)

    return NextResponse.json(data, { status: 200 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
