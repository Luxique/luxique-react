import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { MANUAL_TREATMENTS, type ManualTreatmentKey } from '@/lib/manual-bookings'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
}

const BOOKING_FIELDS = 'id, event_type, slot_start, status, customer_name, customer_email, amount_cents'
const VISIBLE_STATUSES = ['paid', 'cancelled', 'cancellation_pending']

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

  const [linkedResult, legacyResult, manualResult] = await Promise.all([
    supabaseAdmin
      .from('pending_bookings')
      .select(BOOKING_FIELDS)
      .eq('user_id', userId)
      .in('status', VISIBLE_STATUSES)
      .order('slot_start', { ascending: false }),
    email
      ? supabaseAdmin
          .from('pending_bookings')
          .select(BOOKING_FIELDS)
          .is('user_id', null)
          .ilike('customer_email', email)
          .in('status', VISIBLE_STATUSES)
          .order('slot_start', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    supabaseAdmin
      .from('manual_bookings')
      .select('id,treatment_key,slot_start,status,salon_deposit_cents,refunded_at')
      .eq('user_id', userId)
      .in('status', ['confirmed', 'cancelled', 'cancellation_pending'])
      .order('slot_start', { ascending: false }),
  ])

  const error = linkedResult.error || legacyResult.error || manualResult.error
  if (error) {
    console.error('[admin-customer-appointments] Afspraken ophalen mislukt:', error)
    return NextResponse.json(
      { error: 'Afspraken laden mislukt.' },
      { status: 500, headers: NO_STORE_HEADERS },
    )
  }

  const onlineBookings = [...(linkedResult.data || []), ...(legacyResult.data || [])].map(booking => ({
    ...booking,
    source: 'online',
    refunded_at: null,
  }))
  const manualBookings = (manualResult.data || []).map(booking => ({
    id: booking.id,
    event_type: MANUAL_TREATMENTS[booking.treatment_key as ManualTreatmentKey]?.name || 'Behandeling',
    slot_start: booking.slot_start,
    status: booking.status,
    customer_name: null,
    customer_email: null,
    amount_cents: booking.salon_deposit_cents,
    source: 'manual',
    refunded_at: booking.refunded_at,
  }))
  const byId = new Map([...onlineBookings, ...manualBookings].map(booking => [`${booking.source}-${booking.id}`, booking]))
  const bookings = Array.from(byId.values()).sort(
    (a, b) => new Date(b.slot_start).getTime() - new Date(a.slot_start).getTime(),
  )

  return NextResponse.json({ bookings }, { headers: NO_STORE_HEADERS })
}
