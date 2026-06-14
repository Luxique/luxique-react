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
  const headersObj = Object.fromEntries(request.headers.entries())

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // === STEP 1: Write raw webhook to debug table BEFORE anything else ===
  let parsedForDebug: any = null
  try {
    parsedForDebug = JSON.parse(body)
  } catch {
    // not JSON, store raw
  }

  const debugTrigger = parsedForDebug?.triggerEvent || parsedForDebug?.trigger || parsedForDebug?.type || parsedForDebug?.name || null
  const debugUid = parsedForDebug?.payload?.uid || parsedForDebug?.data?.uid || parsedForDebug?.uid || parsedForDebug?.payload?.id || null

  try {
    await supabase.from('webhook_debug').insert({
      raw_body: parsedForDebug || body,
      headers: headersObj,
      parsed_trigger: debugTrigger,
      parsed_uid: debugUid,
    })
    console.log('📝 Webhook debug row written')
  } catch (e) {
    console.error('❌ Failed to write debug row:', e)
  }

  // === STEP 2: Signature check (log-only during setup) ===
  if (process.env.CAL_WEBHOOK_SECRET && !verifySignature(body, signature)) {
    console.warn('⚠️ Signature mismatch — accepting for setup phase')
  }

  // === STEP 3: Parse and handle ===
  let payload: any
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const trigger = payload.triggerEvent || payload.trigger || payload.type || payload.eventType || payload.name

  if (trigger === 'BOOKING_CREATED' || trigger === 'booking_created' || trigger === 'CREATE') {
    return await handleBookingCreated(payload, supabase)
  }

  if (trigger === 'BOOKING_CANCELLED' || trigger === 'booking_cancelled' || trigger === 'CANCEL') {
    return await handleBookingCancelled(payload, supabase)
  }

  console.log('⚠️ Unhandled trigger:', trigger)
  return NextResponse.json({ received: true, trigger, unhandled: true })
}

async function handleBookingCreated(payload: any, supabase: any) {
  const booking = payload.payload || payload.data || payload.event || payload.booking || payload
  const eventTypeId = Number(booking.eventTypeId || booking.event_type_id || payload.eventTypeId)

  const eventConfig = PAID_EVENTS[eventTypeId]
  if (!eventConfig) {
    console.log(`Ignoring event ${eventTypeId}. Known:`, Object.keys(PAID_EVENTS))
    return NextResponse.json({ received: true, ignored: true, eventTypeId })
  }

  const calBookingUid = booking.uid || booking.id?.toString() || booking.bookingUid || payload.uid
  const slotStart = booking.startTime || booking.start_time || booking.start || payload.startTime

  if (!calBookingUid || !slotStart) {
    console.error('❌ Missing fields:', { calBookingUid, slotStart })
    return NextResponse.json({ error: 'Missing uid or startTime' }, { status: 400 })
  }

  // TEMP TEST: override with TEST_DEPOSIT_CENTS env var if set
  const TEST_DEPOSIT_RAW = process.env.TEST_DEPOSIT_CENTS
  const TEST_DEPOSIT = TEST_DEPOSIT_RAW ? parseInt(TEST_DEPOSIT_RAW) : null
  const depositAmount = TEST_DEPOSIT ?? Math.round(eventConfig.priceCents / 2)
  console.log(`Webhook deposit calc: TEST_DEPOSIT_CENTS=${TEST_DEPOSIT_RAW}, parsed=${TEST_DEPOSIT}, final=${depositAmount}`)

  const { data: existing } = await supabase
    .from('pending_bookings')
    .select('id')
    .eq('cal_booking_uid', calBookingUid)
    .single()

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  // Set expires_at to 10 minutes from now
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  const { error } = await supabase
    .from('pending_bookings')
    .insert({
      cal_booking_uid: calBookingUid,
      event_type: eventConfig.name,
      slot_start: slotStart,
      amount_cents: depositAmount,
      status: 'pending',
      expires_at: expiresAt,
    })

  if (error) {
    console.error('❌ DB insert failed:', JSON.stringify(error))
    return NextResponse.json({ error: 'DB insert failed', details: error.message }, { status: 500 })
  }

  console.log(`✅ Pending booking: ${calBookingUid} — ${eventConfig.name} — €${depositAmount / 100}`)
  return NextResponse.json({
    received: true,
    booking: calBookingUid,
    event: eventConfig.name,
    deposit: depositAmount,
  })
}

async function handleBookingCancelled(payload: any, supabase: any) {
  const booking = payload.payload || payload.data || payload.event || payload.booking || payload
  const calBookingUid = booking.uid || booking.id?.toString() || booking.bookingUid || payload.uid

  const { error } = await supabase
    .from('pending_bookings')
    .update({ status: 'cancelled' })
    .eq('cal_booking_uid', calBookingUid)
    .neq('status', 'paid')

  if (error) {
    console.error('Failed to cancel:', error)
  } else {
    console.log(`Booking cancelled: ${calBookingUid}`)
  }

  return NextResponse.json({ received: true })
}
