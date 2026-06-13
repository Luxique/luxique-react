import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const uid = searchParams.get('uid')

  if (!uid) {
    return NextResponse.json({ error: 'Missing uid parameter' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: booking, error } = await supabase
    .from('pending_bookings')
    .select('*')
    .eq('cal_booking_uid', uid)
    .single()

  if (error || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  // Check if booking is still pending
  if (booking.status !== 'pending') {
    return NextResponse.json({ error: 'Booking is no longer pending', status: booking.status })
  }

  // Check if expired
  if (new Date(booking.expires_at) < new Date()) {
    await supabase
      .from('pending_bookings')
      .update({ status: 'expired' })
      .eq('id', booking.id)

    return NextResponse.json({ error: 'Booking has expired', status: 'expired' })
  }

  return NextResponse.json({ booking })
}

export async function POST(request: NextRequest) {
  // Create Stripe checkout session for the booking
  const body = await request.json()
  const { uid } = body

  if (!uid) {
    return NextResponse.json({ error: 'Missing uid' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: booking, error } = await supabase
    .from('pending_bookings')
    .select('*')
    .eq('cal_booking_uid', uid)
    .single()

  if (error || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  if (booking.status !== 'pending') {
    return NextResponse.json({ error: 'Booking is no longer pending' }, { status: 400 })
  }

  if (new Date(booking.expires_at) < new Date()) {
    await supabase
      .from('pending_bookings')
      .update({ status: 'expired' })
      .eq('id', booking.id)
    return NextResponse.json({ error: 'Booking has expired' }, { status: 400 })
  }

  // Create Stripe checkout session
  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['ideal', 'card', 'bancontact', 'klarna'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          unit_amount: booking.amount_cents,
          product_data: {
            name: `Aanbetaling: ${booking.event_type}`,
            description: `50% aanbetaling — rest betaal je in de studio`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.luxique.nl'}/boeking/bevestigd?uid=${uid}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.luxique.nl'}/boeking/betalen?uid=${uid}`,
    metadata: {
      cal_booking_uid: uid,
      booking_id: booking.id,
      type: 'deposit',
    },
  })

  // Store stripe session id
  await supabase
    .from('pending_bookings')
    .update({ stripe_session_id: session.id })
    .eq('id', booking.id)

  return NextResponse.json({ checkoutUrl: session.url })
}
