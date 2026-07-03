/**
 * GET /api/traject/my-trajecten
 *
 * Haalt alle traject-boekingen op van de ingelogde klant.
 * Zelfde auth-patroon als /api/boeking/my-bookings.
 *
 * Auth: JWT → user.id → WHERE user_id = user.id
 * Cache: no-store (verse boeking verschijnt direct)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get user from JWT
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  if (userError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: NO_STORE_HEADERS })
  }

  // Fetch trajecten for this user — ONLY via user_id
  const { data: trajecten, error } = await supabase
    .from('traject_boekingen')
    .select(`
      id,
      cursus_naam,
      startdatum,
      starttijd,
      blok_dagen,
      aanbetaling_status,
      restbedrag_status,
      aanbetaling_cents,
      restbedrag_cents,
      cal_sync_status
    `)
    .eq('user_id', user.id)
    .order('startdatum', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'DB error' }, { status: 500, headers: NO_STORE_HEADERS })
  }

  return NextResponse.json(
    { trajecten: trajecten || [] },
    { status: 200, headers: NO_STORE_HEADERS },
  )
}
