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
 * PATCH /api/traject/cursussen/[id]
 *
 * Update een traject cursus. Momenteel alleen duur_uren_per_dag.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { duur_uren_per_dag } = body

    const updatePayload: Record<string, unknown> = {}

    if (duur_uren_per_dag !== undefined) {
      const uren = Number(duur_uren_per_dag)
      if (!Number.isFinite(uren) || uren < 0 || uren > 24) {
        return NextResponse.json(
          { error: 'duur_uren_per_dag moet een getal 0-24 zijn' },
          { status: 400, headers: NO_STORE_HEADERS },
        )
      }
      updatePayload.duur_uren_per_dag = uren
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: 'Geen velden om te updaten' },
        { status: 400, headers: NO_STORE_HEADERS },
      )
    }

    const { data, error } = await supabaseAdmin
      .from('traject_cursussen')
      .update(updatePayload)
      .eq('id', params.id)
      .select('*')
      .single()

    if (error) throw new Error(`DB-fout: ${error.message}`)

    return NextResponse.json(data, { status: 200, headers: NO_STORE_HEADERS })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500, headers: NO_STORE_HEADERS })
  }
}
