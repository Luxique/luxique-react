import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
}

/**
 * GET /api/traject/bevestiging?session_id=...
 *
 * Haalt de boeking op basis van Stripe session ID voor de bevestigingspagina.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id ontbreekt' },
        { status: 400, headers: NO_STORE_HEADERS },
      )
    }

    const { data, error } = await supabaseAdmin
      .from('traject_boekingen')
      .select('cursus_naam, startdatum, starttijd, blok_dagen, klant_naam, aanbetaling_cents, restbedrag_cents')
      .eq('stripe_session_id', sessionId)
      .maybeSingle()

    if (error) {
      return NextResponse.json(
        { error: 'DB-fout' },
        { status: 500, headers: NO_STORE_HEADERS },
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Boeking niet gevonden' },
        { status: 404, headers: NO_STORE_HEADERS },
      )
    }

    return NextResponse.json(data, { status: 200, headers: NO_STORE_HEADERS })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { error: msg },
      { status: 500, headers: NO_STORE_HEADERS },
    )
  }
}
