import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { bookingId, newStart } = await request.json()

    if (!bookingId || !newStart) {
      return NextResponse.json({ error: 'bookingId and newStart are required' }, { status: 400 })
    }

    // Server-side 24h check (absolute timestamps — no toLocaleString)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user from JWT (same pattern as my-bookings)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get the booking — must belong to this user
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

    // 24h check — server-side, UTC absolute
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

    // Call Cal.com reschedule API
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
      console.error('[reschedule] Cal.com API error:', calData)
      return NextResponse.json({
        error: calData?.error?.message || 'Failed to reschedule via Cal.com'
      }, { status: calRes.status })
    }

    const newUid = calData?.data?.uid
    const oldUid = booking.cal_booking_uid

    // Update pending_bookings with new slot_start and new Cal UID
    // Note: previous booking UID is stored in Cal.com's rescheduledFromUid field
    await supabase
      .from('pending_bookings')
      .update({
        slot_start: newStart,
        cal_booking_uid: newUid,
      })
      .eq('id', bookingId)

    return NextResponse.json({
      success: true,
      newUid,
      newStart,
    })
  } catch (err) {
    console.error('[reschedule] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
