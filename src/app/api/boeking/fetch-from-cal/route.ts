/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const PAID_EVENTS: Record<number, { name: string; priceCents: number }> = {
  5492038: { name: 'Nieuwe Lash Set', priceCents: 13000 },
  5492037: { name: 'Lash Set opvullen', priceCents: 9000 },
}

export async function POST(request: NextRequest) {
  const { uid } = await request.json()

  if (!uid) {
    return NextResponse.json({ error: 'Missing uid' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Idempotency: check if webhook already created it
  const { data: existing } = await supabase
    .from('pending_bookings')
    .select('*')
    .eq('cal_booking_uid', uid)
    .single()

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

  if (!calRes.ok) {
    return NextResponse.json({ error: 'Booking not found in Cal' }, { status: 404 })
  }

  const calData = await calRes.json()
  const booking = calData.data || calData

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

  // Create pending booking (idempotent — if webhook races us, the unique constraint catches it)
  const { data, error } = await supabase
    .from('pending_bookings')
    .insert({
      cal_booking_uid: uid,
      event_type: eventConfig.name,
      slot_start: slotStart,
      amount_cents: depositAmount,
      status: 'pending',
      expires_at: expiresAt,
      customer_name: customerName,
      customer_email: customerEmail,
    })
    .select()
    .single()

  if (error) {
    // Maybe webhook created it between our check and insert — try fetching again
    const { data: retry } = await supabase
      .from('pending_bookings')
      .select('*')
      .eq('cal_booking_uid', uid)
      .single()

    if (retry) {
      return NextResponse.json({ booking: retry })
    }

    return NextResponse.json({ error: 'Could not create booking' }, { status: 500 })
  }

  console.log(`✅ Fallback: created pending booking ${uid} via Cal API`)
  return NextResponse.json({ booking: data })
}
