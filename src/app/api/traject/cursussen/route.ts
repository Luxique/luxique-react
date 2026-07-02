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

/**
 * API endpoint: /api/traject/cursussen
 *
 * Haal alle actieve traject cursussen op.
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('traject_cursussen')
      .select('*')
      .eq('actief', true)
      .order('id')

    if (error) {
      throw new Error(`Fout bij ophalen traject cursussen: ${error.message}`)
    }

    return NextResponse.json(
      { cursussen: data || [] },
      { status: 200, headers: NO_STORE_HEADERS },
    )
  } catch (error) {
    console.error('Fout in cursussen API:', error)
    return NextResponse.json(
      { error: 'Interne fout' },
      { status: 500, headers: NO_STORE_HEADERS },
    )
  }
}
