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

  // Cal.com sends signature as "v1=<hex>" or plain hex
  const sig = signature.replace('v1=', '')
  return sig === expected
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('cal-signature') || request.headers.get('x-cal-signature')

  // Verify signature (log warning but don't block in dev)
  if (process.env.CAL_WEBHOOK_SECRET && !verifySignature(body, signature)) {
    console.warn('⚠️ Cal webhook signature mismatch — accepting anyway for initial setup')
    // TODO: enforce in production
  }

  let payload: any
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const trigger = payload.trigger || payload.type

  if (trigger === 'BOOKING_CREATED') {
    return await handleBookingCreated(payload)
  }

  if (trigger === 'BOOKING_CANCELLED') {
    return await handleBookingCancelled(payload)
  }

  // Ignore other triggers
  return NextResponse.json({ received: true, trigger })
}

async function handleBookingCreated(payload: any) {
  const booking = payload.payload || payload.data || payload
  const eventTypeId = booking.eventTypeId || booking.event_type_id

  // Only process paid events
  const eventConfig = PAID_EVENTS[eventTypeId]
  if (!eventConfig) {
    console.log(`Ignoring booking for non-paid event ${eventTypeId}`)
    return NextResponse.json({ received: true, ignored: true })
  }

  const calBookingUid = booking.uid || booking.id?.toString()
  const slotStart = booking.startTime || booking.start_time
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
    console.error('Failed to insert pending booking:', error)
    return NextResponse.json({ error: 'DB insert failed' }, { status: 500 })
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
  const booking = payload.payload || payload.data || payload
  const calBookingUid = booking.uid || booking.id?.toString()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Mark as cancelled
  const { error } = await supabase
    .from('pending_bookings')
    .update({ status: 'cancelled' })
    .eq('cal_booking_uid', calBookingUid)
    .neq('status', 'paid') // Don't cancel already paid bookings

  if (error) {
    console.error('Failed to cancel booking:', error)
  } else {
    console.log(` Booking cancelled: ${calBookingUid}`)
  }

  return NextResponse.json({ received: true })
}
