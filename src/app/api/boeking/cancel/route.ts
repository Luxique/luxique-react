/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cancelCalBookingVerified } from '@/lib/cal-cancellation'

export const dynamic = 'force-dynamic'

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
  const { bookingId } = body

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

  // Verify ownership — via user_id (never email)
  if (booking.user_id !== user.id) {
    return NextResponse.json({ error: 'Not your booking' }, { status: 403 })
  }

  // Can only cancel paid or pending bookings
  if (booking.status === 'cancelled' || booking.status === 'expired') {
    return NextResponse.json({ error: 'Already cancelled or expired' }, { status: 400 })
  }

  const within24h = new Date(booking.slot_start).getTime() - Date.now() < 24 * 60 * 60 * 1000
  const refundEligible = booking.status === 'paid' && !within24h && booking.amount_cents > 0
  const requestedAt = new Date().toISOString()
  try {
    await cancelCalBookingVerified(booking.cal_booking_uid, 'Cancelled by customer via dashboard')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Onbekende Cal.com-fout'
    console.error('Cancel: Cal API failed:', { bookingId, uid: booking.cal_booking_uid, error: message })
    const { error: pendingError } = await supabase.from('pending_bookings').update({
      status: 'cancellation_pending', cancellation_error: message, cancellation_requested_at: requestedAt, cancellation_refund_eligible: refundEligible,
    }).eq('id', bookingId).eq('user_id', user.id)
    if (pendingError) console.error('Cancel: pending status update failed:', pendingError)
    return NextResponse.json({
      success: false, pending: true,
      error: 'Annulering in behandeling. Cal.com accepteerde de annulering nog niet; we proberen dit automatisch opnieuw.',
      detail: message,
    }, { status: 202 })
  }

  // Update booking status
  const { error: updateError } = await supabase
    .from('pending_bookings')
    .update({ 
      status: 'cancelled',
      cancelled_within_24h: within24h,
      cancelled_at: new Date().toISOString(),
      cancellation_error: null,
      cancellation_requested_at: requestedAt,
      cancellation_refund_eligible: refundEligible,
    })
    .eq('id', bookingId).eq('user_id', user.id)
  if (updateError) {
    console.error('Cancel: Cal succeeded but database update failed:', updateError)
    return NextResponse.json({ success: false, partial: true, error: 'Cal.com is geannuleerd, maar de dashboardstatus kon niet worden bijgewerkt.' }, { status: 500 })
  }

  // Send Chiva + customer notification emails
  let emailSent = true
  const emailWarnings: string[] = []
  try {
    const { sendCancellationNotification, sendCustomerCancellationEmail } = await import('@/lib/email')
    const mailResults = await Promise.allSettled([
      sendCancellationNotification({ ...booking, cancelled_within_24h: within24h, cancellation_refund_eligible: refundEligible }),
      sendCustomerCancellationEmail({ ...booking, cancelled_within_24h: within24h }),
    ])
    emailWarnings.push(...mailResults.filter(result => result.status === 'rejected').map(result => result.reason instanceof Error ? result.reason.message : 'Onbekende mailfout'))
    emailSent = emailWarnings.length === 0
  } catch (mailErr) {
    emailSent = false
    emailWarnings.push(mailErr instanceof Error ? mailErr.message : 'Onbekende mailfout')
    console.error('Cancel: mail failed (non-fatal):', mailErr)
  }

  return NextResponse.json({
    success: true,
    calCancelled: true,
    within24h,
    emailSent,
    warnings: emailWarnings,
  })
}
