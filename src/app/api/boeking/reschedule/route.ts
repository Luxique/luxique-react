/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // ── AUTH: exact same pattern as my-bookings ──
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get user from JWT
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  if (userError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  // ── PARSE BODY ──
  const { bookingId, newStart } = await request.json()
  if (!bookingId || !newStart) {
    return NextResponse.json({ error: 'bookingId and newStart are required' }, { status: 400 })
  }

  // ── GET BOOKING — must belong to this user ──
  const { data: booking, error: bookingError } = await supabase
    .from('pending_bookings')
    .select('id, cal_booking_uid, slot_start, status, user_id, amount_cents')
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  // Authorization: session user must own this booking
  if (booking.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Must be paid and upcoming
  if (booking.status !== 'paid') {
    return NextResponse.json({ error: 'Only paid bookings can be rescheduled' }, { status: 400 })
  }

  // ── 24h CHECK ──
  const now = Date.now()
  const slotTime = new Date(booking.slot_start).getTime()
  const newStartTime = new Date(newStart).getTime()
  const hoursUntilCurrent = (slotTime - now) / (1000 * 60 * 60)

  if (hoursUntilCurrent < 24) {
    return NextResponse.json({
      error: 'Rescheduling is only possible until 24 hours before your appointment'
    }, { status: 400 })
  }

  if (newStartTime < now) {
    return NextResponse.json({ error: 'Cannot reschedule to a past date' }, { status: 400 })
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
    return NextResponse.json({
      error: calData?.error?.message || 'Failed to reschedule via Cal.com'
    }, { status: calRes.status })
  }

  const newUid = calData?.data?.uid

  // ── UPDATE DB ──
  const { error: updateError } = await supabase
    .from('pending_bookings')
    .update({
      slot_start: newStart,
      cal_booking_uid: newUid,
    })
    .eq('id', bookingId)

  if (updateError) {
    console.error('[reschedule] DB update failed:', updateError)
  }

  return NextResponse.json({
    success: true,
    newUid,
    newStart,
  })
}
