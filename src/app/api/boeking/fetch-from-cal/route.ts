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
  const depositAmount = Math.round(eventConfig.priceCents / 2)

  // Create pending booking (idempotent — if webhook races us, the unique constraint catches it)
  const { data, error } = await supabase
    .from('pending_bookings')
    .insert({
      cal_booking_uid: uid,
      event_type: eventConfig.name,
      slot_start: slotStart,
      amount_cents: depositAmount,
      status: 'pending',
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
