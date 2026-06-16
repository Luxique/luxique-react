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

  // Return booking data regardless of status (needed for bevestigd page)
  // Only block checkout for non-pending in the POST handler
  return NextResponse.json({ booking })
}

export async function POST(request: NextRequest) {
  // Create Stripe checkout session for the booking
  const body = await request.json()
  const { uid, agreed } = body

  if (!uid) {
    return NextResponse.json({ error: 'Missing uid' }, { status: 400 })
  }

  if (!agreed) {
    return NextResponse.json({ error: 'Customer must agree to terms' }, { status: 400 })
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

  // Idempotency: reuse existing Stripe session if still valid (not expired, not paid)
  if (booking.stripe_session_id) {
    try {
      const existing = await stripe.checkout.sessions.retrieve(booking.stripe_session_id)
      // If session is still open (not paid, not expired), redirect to it
      if (existing.url && existing.status === 'open' && existing.expires_at && new Date(existing.expires_at * 1000) > new Date()) {
        return NextResponse.json({ checkoutUrl: existing.url, reused: true })
      }
    } catch {
      // Session not found or error — create new one
    }
  }

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
  }, {
    // Stripe idempotency key: same booking = same session, prevents duplicate charges
    idempotencyKey: `deposit-${uid}-${booking.id}`,
  })

  // Store stripe session id + agreed_at timestamp
  await supabase
    .from('pending_bookings')
    .update({ stripe_session_id: session.id, agreed_at: new Date().toISOString() })
    .eq('id', booking.id)

  return NextResponse.json({ checkoutUrl: session.url })
}
