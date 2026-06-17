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

  if (trigger === 'BOOKING_RESCHEDULED' || trigger === 'booking_rescheduled' || trigger === 'RESCHEDULE' || trigger === 'BOOKING_RESCHEDULE') {
    return await handleBookingRescheduled(payload, supabase)
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

  // Extract customer info from Cal payload
  const attendees = booking.attendees || []
  const attendee = attendees[0] || {}
  const responses = booking.responses || {}
  const customerEmail = attendee.email || responses.email?.value || null
  const customerName = attendee.name || responses.name?.value || null

  if (!calBookingUid || !slotStart) {
    console.error('❌ Missing fields:', { calBookingUid, slotStart })
    return NextResponse.json({ error: 'Missing uid or startTime' }, { status: 400 })
  }

  // TEMP TEST: override with TEST_DEPOSIT_CENTS env var if set
  const TEST_DEPOSIT_RAW = process.env.TEST_DEPOSIT_CENTS
  const TEST_DEPOSIT = TEST_DEPOSIT_RAW ? parseInt(TEST_DEPOSIT_RAW) : null
  // HARDCODED FALLBACK FOR TESTING — remove after test
  const depositAmount = TEST_DEPOSIT ?? 100 // TODO: revert to Math.round(eventConfig.priceCents / 2)
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
      customer_name: customerName,
      customer_email: customerEmail,
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

/**
 * Handle BOOKING_RESCHEDULED — update slot_start (+ UID if changed) in pending_bookings.
 * Cal.com reschedule webhook payload structure:
 *   payload.uid — the booking UID (may stay same or change depending on Cal version)
 *   payload.payload.startTime — new start time
 *   payload.payload.oldUid / rescheduledFromUid — reference to old booking (if UID changed)
 */
async function handleBookingRescheduled(payload: any, supabase: any) {
  const booking = payload.payload || payload.data || payload.event || payload.booking || payload

  // Cal.com may send the new UID under various field names
  const newUid = booking.uid || booking.id?.toString() || booking.bookingUid || payload.uid
  // Some Cal.com versions include the old UID for reference
  const oldUid = booking.rescheduleUid || booking.oldUid || booking.rescheduledFromUid || booking.rescheduledFrom || payload.oldUid || null

  const newStartTime = booking.startTime || booking.start_time || booking.start || payload.startTime

  if (!newStartTime) {
    console.error('❌ Reschedule: missing startTime', { newUid, oldUid, newStartTime })
    return NextResponse.json({ error: 'Missing startTime for reschedule' }, { status: 400 })
  }

  // Try to find the booking by new UID first, then by old UID
  let targetUid = newUid
  let { data: bookingRow, error: fetchError } = await supabase
    .from('pending_bookings')
    .select('id, cal_booking_uid, status, slot_start')
    .eq('cal_booking_uid', newUid)
    .single()

  if (fetchError || !bookingRow) {
    // Try old UID
    if (oldUid) {
      const res = await supabase
        .from('pending_bookings')
        .select('id, cal_booking_uid, status, slot_start')
        .eq('cal_booking_uid', oldUid)
        .single()
      bookingRow = res.data
      fetchError = res.error
      targetUid = oldUid
    }

    // If still not found, try matching on customer email as fallback
    if ((!bookingRow || fetchError) && booking.attendees?.[0]?.email) {
      const email = booking.attendees[0].email
      const res = await supabase
        .from('pending_bookings')
        .select('id, cal_booking_uid, status, slot_start')
        .eq('customer_email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (res.data) {
        bookingRow = res.data
        targetUid = res.data.cal_booking_uid
      }
    }
  }

  if (!bookingRow) {
    console.warn(`⚠️ Reschedule: no matching booking found (newUid=${newUid}, oldUid=${oldUid})`)
    return NextResponse.json({ received: true, rescheduled: false, reason: 'booking not found' })
  }

  // Build update object — update slot_start + cal_booking_uid if it changed
  const update: Record<string, any> = {
    slot_start: newStartTime,
    updated_at: new Date().toISOString(),
  }

  // If UID changed, update it too
  if (newUid !== targetUid) {
    update.cal_booking_uid = newUid
  }

  const { error: updateError } = await supabase
    .from('pending_bookings')
    .update(update)
    .eq('id', bookingRow.id)

  if (updateError) {
    console.error('❌ Reschedule: DB update failed:', updateError)
    return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
  }

  const oldTime = bookingRow.slot_start
  console.log(`✅ Rescheduled: ${bookingRow.cal_booking_uid} → ${newStartTime} (was ${oldTime})`)
  return NextResponse.json({
    received: true,
    rescheduled: true,
    bookingId: bookingRow.id,
    oldStart: oldTime,
    newStart: newStartTime,
    uidChanged: newUid !== targetUid,
  })
}
