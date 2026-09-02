/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const PAID_EVENTS: Record<number, { name: string; priceCents: number }> = {
  5492038: { name: 'Nieuwe Lash Set', priceCents: 15000 },
  5492037: { name: 'Lash Set opvullen', priceCents: 11000 },
}

export async function POST(request: NextRequest) {
  const { uid } = await request.json()

  if (!uid) {
    return NextResponse.json({ error: 'Missing uid' }, { status: 400 })
  }

  // === DIAGNOSTIC: Log env var status ===
  console.log('🔧 FETCH-FROM-CAL DIAGNOSTIC:')
  console.log(`  - CAL_API_KEY length: ${process.env.CAL_API_KEY?.length || 0}`)
  console.log(`  - CAL_API_KEY defined: ${!!process.env.CAL_API_KEY}`)
  console.log(`  - UID: ${uid}`)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fast path when the webhook already created the row. maybeSingle keeps a
  // genuine missing row distinct from an unexpected database error.
  const { data: existing, error: lookupError } = await supabase
    .from('pending_bookings')
    .select('*')
    .eq('cal_booking_uid', uid)
    .maybeSingle()

  if (lookupError) {
    console.error('❌ Fallback booking lookup failed:', JSON.stringify(lookupError))
    return NextResponse.json({
      error: 'Could not load booking',
      code: 'BOOKING_LOOKUP_FAILED',
    }, { status: 500 })
  }

  if (existing) {
    return NextResponse.json({ booking: existing })
  }

  // Fetch booking from Cal.com API
  const calRes = await fetch(`https://api.cal.com/v2/bookings/${uid}`, {
    headers: {
      Authorization: `Bearer ${process.env.CAL_API_KEY}`,
      'cal-api-version': '2024-09-10',
    },
  })

  console.log(`🔧 Cal.com API response status: ${calRes.status}`)

  if (!calRes.ok) {
    console.error('🔧 Cal.com API error:', await calRes.text())
    return NextResponse.json({ error: 'Booking not found in Cal' }, { status: 404 })
  }

  const calData = await calRes.json()
  const booking = calData.data || calData
  
  console.log('🔧 Cal.com API booking keys:', Object.keys(booking))

  const eventTypeId = Number(booking.eventTypeId || booking.event_type_id)
  const eventConfig = PAID_EVENTS[eventTypeId]

  if (!eventConfig) {
    return NextResponse.json({ error: 'Not a paid event' }, { status: 400 })
  }

  const slotStart = booking.startTime || booking.start_time
  
  // Extract customer info from Cal booking
  const attendees = booking.attendees || []
  const attendee = attendees[0] || {}
  const responses = booking.responses || {}
  const customerEmail = attendee.email || responses.email?.value || null
  const customerName = attendee.name || responses.name?.value || null
  
  // TEMP TEST: override with TEST_DEPOSIT_CENTS env var if set
  const TEST_DEPOSIT_RAW = process.env.TEST_DEPOSIT_CENTS
  const TEST_DEPOSIT = TEST_DEPOSIT_RAW ? parseInt(TEST_DEPOSIT_RAW) : null
  // HARDCODED FALLBACK FOR TESTING — remove after test
  const depositAmount = TEST_DEPOSIT ?? 100 // TODO: revert to Math.round(eventConfig.priceCents / 2)
  console.log(`Fetch-from-cal deposit calc: TEST_DEPOSIT_CENTS=${TEST_DEPOSIT_RAW}, parsed=${TEST_DEPOSIT}, final=${depositAmount}`)

  // Set expires_at to 10 minutes from now
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  // Create idempotently. The webhook can race this request, so the database
  // unique index decides the winner without either request overwriting data.
  const { data, error } = await supabase
    .from('pending_bookings')
    .upsert({
      cal_booking_uid: uid,
      event_type: eventConfig.name,
      slot_start: slotStart,
      amount_cents: depositAmount,
      status: 'pending',
      expires_at: expiresAt,
      customer_name: customerName,
      customer_email: customerEmail,
    }, {
      onConflict: 'cal_booking_uid',
      ignoreDuplicates: true,
    })
    .select()

  if (error) {
    console.error('❌ Fallback booking upsert failed:', JSON.stringify(error))
    return NextResponse.json({ error: 'Could not create booking' }, { status: 500 })
  }

  if (!data?.length) {
    const { data: concurrentBooking, error: concurrentLookupError } = await supabase
      .from('pending_bookings')
      .select('*')
      .eq('cal_booking_uid', uid)
      .maybeSingle()

    if (concurrentLookupError) {
      console.error('❌ Concurrent booking lookup failed:', JSON.stringify(concurrentLookupError))
      return NextResponse.json({
        error: 'Could not load booking',
        code: 'BOOKING_LOOKUP_FAILED',
      }, { status: 500 })
    }

    if (!concurrentBooking) {
      console.error('❌ Conflict-safe upsert returned no row and no existing booking:', uid)
      return NextResponse.json({ error: 'Could not create booking' }, { status: 500 })
    }

    return NextResponse.json({ booking: concurrentBooking })
  }

  console.log(`✅ Fallback: created pending booking ${uid} via Cal API`)
  return NextResponse.json({ booking: data[0] })
}
