/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isValidLocalDate, TREATMENTS } from '@/lib/cal-admin-availability'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const CAL_TIME_ZONE = 'Europe/Amsterdam'
const CAL_BOOKING_API_VERSION = '2024-08-13'
const CAL_SLOTS_API_VERSION = '2024-09-04'

function noStore(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store, no-cache, must-revalidate, max-age=0' },
  })
}

function eventTypeIdFromBooking(booking: any): number {
  return Number(booking?.eventTypeId || booking?.event_type_id || booking?.eventType?.id || 0)
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return noStore({ error: 'Unauthorized' }, 401)

  const bookingId = request.nextUrl.searchParams.get('bookingId')
  const date = request.nextUrl.searchParams.get('date')
  if (!bookingId || !isValidLocalDate(date)) {
    return noStore({ error: 'bookingId and a valid date are required' }, 400)
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const token = authHeader.slice('Bearer '.length)
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  if (userError || !user) return noStore({ error: 'Invalid token' }, 401)

  const { data: booking, error: bookingError } = await supabase
    .from('pending_bookings')
    .select('id, cal_booking_uid, user_id, status')
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking) return noStore({ error: 'Booking not found' }, 404)
  if (booking.user_id !== user.id) return noStore({ error: 'Forbidden' }, 403)
  if (booking.status !== 'paid') return noStore({ error: 'Only paid bookings can be rescheduled' }, 400)
  if (!booking.cal_booking_uid) return noStore({ error: 'Booking is not linked to Cal.com' }, 409)

  const calApiKey = process.env.CAL_API_KEY
  if (!calApiKey) return noStore({ error: 'Cal.com is not configured' }, 500)

  const bookingResponse = await fetch(`https://api.cal.com/v2/bookings/${booking.cal_booking_uid}`, {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${calApiKey}`,
      'cal-api-version': CAL_BOOKING_API_VERSION,
    },
  })
  const bookingPayload = await bookingResponse.json().catch(() => null)
  if (!bookingResponse.ok || !bookingPayload?.data) {
    return noStore({ error: bookingPayload?.error?.message || 'Cal.com booking could not be loaded' }, 502)
  }

  const eventTypeId = eventTypeIdFromBooking(bookingPayload.data)
  const treatment = Object.values(TREATMENTS).find(item => item.eventTypeId === eventTypeId)
  if (!treatment) return noStore({ error: 'Unknown treatment type for this booking' }, 409)

  const slotsUrl = new URL('https://api.cal.com/v2/slots')
  slotsUrl.searchParams.set('eventTypeId', String(treatment.eventTypeId))
  slotsUrl.searchParams.set('start', date)
  const end = new Date(`${date}T00:00:00Z`)
  end.setUTCDate(end.getUTCDate() + 1)
  slotsUrl.searchParams.set('end', end.toISOString().slice(0, 10))
  slotsUrl.searchParams.set('timeZone', CAL_TIME_ZONE)
  slotsUrl.searchParams.set('bookingUidToReschedule', booking.cal_booking_uid)

  const slotsResponse = await fetch(slotsUrl, {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${calApiKey}`,
      'cal-api-version': CAL_SLOTS_API_VERSION,
    },
  })
  const slotsPayload = await slotsResponse.json().catch(() => null)
  if (!slotsResponse.ok || !slotsPayload?.data) {
    return noStore({ error: slotsPayload?.error?.message || 'Cal.com availability could not be loaded' }, 502)
  }

  const starts = Array.isArray(slotsPayload.data[date]) ? slotsPayload.data[date] : []
  const slots = starts.map((start: string) => ({
    start,
    time: new Intl.DateTimeFormat('nl-NL', {
      timeZone: CAL_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(start)),
  }))

  return noStore({ treatmentKey: treatment.key, eventTypeId, date, slots })
}
