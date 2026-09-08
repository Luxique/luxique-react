/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store, max-age=0' },
  })
}

export async function POST(request: NextRequest) {
  // ── AUTH: exact same pattern as my-bookings ──
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, 401)
  }

  // Get user from JWT
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !user) {
    return json({ error: 'Invalid token' }, 401)
  }

  // ── PARSE BODY ──
  const { bookingId, newStart } = await request.json()
  if (!bookingId || !newStart) {
    return json({ error: 'bookingId and newStart are required' }, 400)
  }
  const requestedStart = new Date(newStart)
  if (!Number.isFinite(requestedStart.getTime())) return json({ error: 'newStart must be a valid date' }, 400)

  // ── GET BOOKING — must belong to this user ──
  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('pending_bookings')
    .select('id, cal_booking_uid, slot_start, status, user_id, amount_cents')
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking) {
    return json({ error: 'Booking not found' }, 404)
  }

  // Authorization: session user must own this booking
  if (booking.user_id !== user.id) {
    return json({ error: 'Forbidden' }, 403)
  }

  // Must be paid and upcoming
  if (booking.status !== 'paid') {
    return json({ error: 'Only paid bookings can be rescheduled' }, 400)
  }

  // ── 24h CHECK ──
  const now = Date.now()
  const slotTime = new Date(booking.slot_start).getTime()
  const newStartTime = requestedStart.getTime()
  const hoursUntilCurrent = (slotTime - now) / (1000 * 60 * 60)

  if (hoursUntilCurrent < 24) {
    return json({
      error: 'Rescheduling is only possible until 24 hours before your appointment'
    }, 400)
  }

  if (newStartTime < now) {
    return json({ error: 'Cannot reschedule to a past date' }, 400)
  }

  // ── CALL CAL.COM ──
  const calRes = await fetch(
    `https://api.cal.com/v2/bookings/${booking.cal_booking_uid}/reschedule`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CAL_API_KEY}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2026-02-25',
      },
      body: JSON.stringify({ start: newStart }),
    }
  )

  const calData = await calRes.json()

  if (!calRes.ok) {
    return json({
      error: calData?.error?.message || 'Failed to reschedule via Cal.com'
    }, calRes.status)
  }

  const calBooking = calData?.data?.booking || calData?.data
  const newUid = calBooking?.uid
  const confirmedStart = calBooking?.startTime || requestedStart.toISOString()
  if (!newUid || !Number.isFinite(new Date(confirmedStart).getTime())) {
    console.error('[reschedule] Cal.com returned an incomplete booking:', calData)
    return json({ error: 'Cal.com returned an incomplete reschedule confirmation' }, 502)
  }

  // ── UPDATE DB ──
  const { data: updatedBooking, error: updateError } = await supabaseAdmin
    .from('pending_bookings')
    .update({
      slot_start: confirmedStart,
      cal_booking_uid: newUid,
    })
    .eq('id', bookingId)
    .eq('user_id', user.id)
    .select('id, slot_start, cal_booking_uid')
    .single()

  if (updateError || !updatedBooking) {
    console.error('[reschedule] DB update failed:', updateError)
    return json({
      error: 'De afspraak is bij Cal.com verplaatst, maar de dashboardgegevens konden niet direct worden bijgewerkt. Neem contact op met LUXIQUE.',
      syncPending: true,
    }, 502)
  }

  return json({
    success: true,
    newUid,
    newStart: updatedBooking.slot_start,
  })
}
