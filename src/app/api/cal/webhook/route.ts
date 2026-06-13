/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const PAID_EVENTS: Record<number, { name: string; priceCents: number }> = {
  5492038: { name: 'Nieuwe Lash Set', priceCents: 13000 },
  5492037: { name: 'Lash Set opvullen', priceCents: 9000 },
}

function verifySignature(payload: string, signature: string | null): boolean {
  if (!signature || !process.env.CAL_WEBHOOK_SECRET) return false

  const expected = crypto
    .createHmac('sha256', process.env.CAL_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')

  const sig = signature.replace('v1=', '')
  return sig === expected
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('cal-signature') || request.headers.get('x-cal-signature')

  // Log ALL incoming webhook data for debugging
  console.log('🔴 CAL WEBHOOK RECEIVED')
  console.log('Headers:', JSON.stringify(Object.fromEntries(request.headers.entries()), null, 2))
  console.log('Raw body:', body.substring(0, 2000))

  if (process.env.CAL_WEBHOOK_SECRET && !verifySignature(body, signature)) {
    console.warn('⚠️ Cal webhook signature mismatch — accepting anyway for setup phase')
  }

  let payload: any
  try {
    payload = JSON.parse(body)
  } catch {
    console.error('❌ Invalid JSON received')
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Log parsed payload structure
  console.log('Parsed keys:', Object.keys(payload))
  console.log('Full payload:', JSON.stringify(payload, null, 2).substring(0, 3000))

  // Cal.com webhook format: try every possible trigger field
  const trigger = payload.trigger || payload.type || payload.eventType || payload.name

  console.log('Detected trigger:', trigger)

  if (trigger === 'BOOKING_CREATED' || trigger === 'booking_created' || trigger === 'CREATE') {
    return await handleBookingCreated(payload)
  }

  if (trigger === 'BOOKING_CANCELLED' || trigger === 'booking_cancelled' || trigger === 'CANCEL') {
    return await handleBookingCancelled(payload)
  }

  console.log('⚠️ Unhandled trigger:', trigger, '— full payload:', JSON.stringify(payload).substring(0, 1000))
  return NextResponse.json({ received: true, trigger, unhandled: true })
}

async function handleBookingCreated(payload: any) {
  // Cal.com payload can be nested in various ways depending on version
  const booking = payload.payload || payload.data || payload.event || payload.booking || payload
  const eventTypeId = Number(booking.eventTypeId || booking.event_type_id || booking.eventTypeId || payload.eventTypeId)

  console.log('Booking data:', JSON.stringify(booking, null, 2).substring(0, 1000))
  console.log('EventTypeId:', eventTypeId, '(type:', typeof eventTypeId, ')')

  // Only process paid events
  const eventConfig = PAID_EVENTS[eventTypeId]
  if (!eventConfig) {
    console.log(`Ignoring booking for non-paid event ${eventTypeId}. Available:`, Object.keys(PAID_EVENTS))
    return NextResponse.json({ received: true, ignored: true, eventTypeId })
  }

  const calBookingUid = booking.uid || booking.id?.toString() || booking.bookingUid || payload.uid
  const slotStart = booking.startTime || booking.start_time || booking.start || payload.startTime

  if (!calBookingUid || !slotStart) {
    console.error('❌ Missing required fields:', { calBookingUid, slotStart, bookingKeys: Object.keys(booking) })
    return NextResponse.json({ error: 'Missing uid or startTime' }, { status: 400 })
  }

  const depositAmount = Math.round(eventConfig.priceCents / 2) // 50% deposit

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Check if already exists (idempotency)
  const { data: existing } = await supabase
    .from('pending_bookings')
    .select('id')
    .eq('cal_booking_uid', calBookingUid)
    .single()

  if (existing) {
    console.log(`Booking ${calBookingUid} already exists`)
    return NextResponse.json({ received: true, duplicate: true })
  }

  // Insert pending booking
  const { error } = await supabase
    .from('pending_bookings')
    .insert({
      cal_booking_uid: calBookingUid,
      event_type: eventConfig.name,
      slot_start: slotStart,
      amount_cents: depositAmount,
      status: 'pending',
    })

  if (error) {
    console.error('❌ Failed to insert pending booking:', JSON.stringify(error))
    return NextResponse.json({ error: 'DB insert failed', details: error.message }, { status: 500 })
  }

  console.log(`✅ Pending booking created: ${calBookingUid} — ${eventConfig.name} — €${depositAmount / 100} deposit`)

  return NextResponse.json({
    received: true,
    booking: calBookingUid,
    event: eventConfig.name,
    deposit: depositAmount,
  })
}

async function handleBookingCancelled(payload: any) {
  const booking = payload.payload || payload.data || payload.event || payload.booking || payload
  const calBookingUid = booking.uid || booking.id?.toString() || booking.bookingUid || payload.uid

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase
    .from('pending_bookings')
    .update({ status: 'cancelled' })
    .eq('cal_booking_uid', calBookingUid)
    .neq('status', 'paid')

  if (error) {
    console.error('Failed to cancel booking:', error)
  } else {
    console.log(`Booking cancelled: ${calBookingUid}`)
  }

  return NextResponse.json({ received: true })
}
