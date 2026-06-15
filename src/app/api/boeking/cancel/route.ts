/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  if (userError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const body = await request.json()
  const { bookingId, within24h } = body

  if (!bookingId) {
    return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 })
  }

  // Get the booking — verify it belongs to this user
  const { data: booking, error: fetchError } = await supabase
    .from('pending_bookings')
    .select('*')
    .eq('id', bookingId)
    .single()

  if (fetchError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  // Verify ownership
  if (booking.customer_email !== user.email) {
    return NextResponse.json({ error: 'Not your booking' }, { status: 403 })
  }

  // Can only cancel paid or pending bookings
  if (booking.status === 'cancelled' || booking.status === 'expired') {
    return NextResponse.json({ error: 'Already cancelled or expired' }, { status: 400 })
  }

  // Cancel in Cal.com
  let calCancelled = false
  try {
    const calRes = await fetch(`https://api.cal.com/v2/bookings/${booking.cal_booking_uid}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: 'Cancelled by customer via dashboard',
        allRemainingBookings: true,
      }),
    })
    calCancelled = calRes.ok
    if (!calRes.ok) {
      console.error('Cancel: Cal API error:', await calRes.text())
    }
  } catch (err) {
    console.error('Cancel: Cal API failed:', err)
  }

  // Update booking status
  await supabase
    .from('pending_bookings')
    .update({ 
      status: 'cancelled',
      cancelled_within_24h: within24h,
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', bookingId)

  // Send Chiva + customer notification emails
  try {
    const { sendCancellationNotification, sendCustomerCancellationEmail } = await import('@/lib/email')
    await sendCancellationNotification({
      ...booking,
      cancelled_within_24h: within24h,
    })
    if (booking.customer_email) {
      await sendCustomerCancellationEmail({
        ...booking,
        cancelled_within_24h: within24h,
      })
    }
  } catch (mailErr) {
    console.error('Cancel: mail failed (non-fatal):', mailErr)
  }

  return NextResponse.json({
    success: true,
    calCancelled,
    within24h,
  })
}
