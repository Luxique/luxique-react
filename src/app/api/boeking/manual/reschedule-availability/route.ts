import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getManualAvailability, isWithin24Hours } from '@/lib/manual-bookings'
import { isValidLocalDate } from '@/lib/cal-admin-availability'

export const dynamic = 'force-dynamic'

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)
  const bookingId = request.nextUrl.searchParams.get('bookingId')
  const date = request.nextUrl.searchParams.get('date')
  if (!bookingId || !isValidLocalDate(date)) return json({ error: 'bookingId and a valid date are required' }, 400)

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: { user }, error: userError } = await supabase.auth.getUser(auth.slice(7))
  if (userError || !user) return json({ error: 'Invalid token' }, 401)
  const { data: booking } = await supabase.from('manual_bookings')
    .select('id, user_id, cal_booking_uid, event_type_id, slot_start, status')
    .eq('id', bookingId).maybeSingle()
  if (!booking) return json({ error: 'Booking not found' }, 404)
  if (booking.user_id !== user.id) return json({ error: 'Forbidden' }, 403)
  if (booking.status !== 'confirmed') return json({ error: 'Deze afspraak kan niet worden verplaatst.' }, 400)
  if (isWithin24Hours(booking.slot_start)) return json({ error: 'Verplaatsen kan tot 24 uur voor je afspraak.' }, 400)

  try {
    const slots = await getManualAvailability({
      eventTypeId: Number(booking.event_type_id), date, bookingUidToIgnore: booking.cal_booking_uid,
    })
    return json({ date, slots })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Beschikbaarheid laden mislukt.' }, 502)
  }
}
