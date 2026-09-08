import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
}

const BOOKING_FIELDS = 'id, event_type, slot_start, status, customer_name, customer_email, amount_cents'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error || 'Geen toegang.' },
      { status: auth.status || 401, headers: NO_STORE_HEADERS },
    )
  }

  const userId = request.nextUrl.searchParams.get('userId')?.trim()
  const email = request.nextUrl.searchParams.get('email')?.trim()
  if (!userId) {
    return NextResponse.json({ error: 'userId ontbreekt.' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const [linkedResult, legacyResult] = await Promise.all([
    supabaseAdmin
      .from('pending_bookings')
      .select(BOOKING_FIELDS)
      .eq('user_id', userId)
      .eq('status', 'paid')
      .order('slot_start', { ascending: false }),
    email
      ? supabaseAdmin
          .from('pending_bookings')
          .select(BOOKING_FIELDS)
          .is('user_id', null)
          .ilike('customer_email', email)
          .eq('status', 'paid')
          .order('slot_start', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ])

  const error = linkedResult.error || legacyResult.error
  if (error) {
    console.error('[admin-customer-appointments] Afspraken ophalen mislukt:', error)
    return NextResponse.json(
      { error: 'Afspraken laden mislukt.' },
      { status: 500, headers: NO_STORE_HEADERS },
    )
  }

  const byId = new Map(
    [...(linkedResult.data || []), ...(legacyResult.data || [])].map(booking => [booking.id, booking]),
  )
  const bookings = Array.from(byId.values()).sort(
    (a, b) => new Date(b.slot_start).getTime() - new Date(a.slot_start).getTime(),
  )

  return NextResponse.json({ bookings }, { headers: NO_STORE_HEADERS })
}
