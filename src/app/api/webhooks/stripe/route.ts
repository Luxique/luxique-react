/**
 * Stripe Webhook — checkout.session.completed
 *
 * SETUP INSTRUCTIONS (CJ):
 * 1. Go to Stripe Dashboard → Developers → Webhooks
 * 2. Click "Add endpoint"
 * 3. Endpoint URL: https://www.luxique.nl/api/webhooks/stripe
 *    (or your staging domain)
 * 4. Events to listen for: checkout.session.completed, checkout.session.async_payment_succeeded
 * 5. After creating, click the endpoint → "Signing secret" → Reveal
 * 6. Add to .env.local: STRIPE_WEBHOOK_SECRET=whsec_xxxxx
 * 7. Redeploy.
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing Stripe config' }, { status: 500 })
  }

  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: unknown) {
    console.error('Webhook verification failed:', String(err))
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const isPaymentEvent =
    event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.async_payment_succeeded'

  if (isPaymentEvent) {
    const session = event.data.object as {
      metadata?: { course_id?: string; user_id?: string; cal_booking_uid?: string; booking_id?: string; type?: string }
      client_reference_id?: string
      payment_intent?: string | { id: string }
      amount_total?: number
      currency?: string
      customer_details?: { name?: string | null; email?: string | null }
    }

    // === DEPOSIT PAYMENT (booking) ===
    if (session.metadata?.type === 'deposit' && session.metadata?.cal_booking_uid) {
      await handleDepositPayment(session)
      return NextResponse.json({ received: true })
    }

    // === TRAJECT DEPOSIT PAYMENT ===
    if (session.metadata?.type === 'traject_deposit') {
      await handleTrajectDeposit(session, stripe)
      return NextResponse.json({ received: true })
    }

    // === COURSE ENROLLMENT PAYMENT ===

    // Extract user_id from metadata or client_reference_id
    const user_id = session.metadata?.user_id || session.client_reference_id
    const course_id = session.metadata?.course_id

    if (!course_id || !user_id) {
      console.error('Webhook: missing user_id or course_id', { metadata: session.metadata, client_reference_id: session.client_reference_id })
      return NextResponse.json({ error: 'Missing user_id or course_id' }, { status: 400 })
    }

    // Extract payment_intent (can be string or object)
    const payment_intent_id = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id

    const amount_total = session.amount_total ?? 0
    const currency = session.currency?.toUpperCase() ?? 'EUR'

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const now = new Date().toISOString()

    // Idempotent: check if enrollment already exists for this user+course or payment_intent
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .or(`and(user_id.eq.${user_id},course_id.eq.${course_id}),stripe_payment_intent_id.eq.${payment_intent_id}`)
      .limit(1)

    if (existing && existing.length > 0) {
      console.log('Webhook: enrollment already exists, skipping', { user_id, course_id })
      return NextResponse.json({ received: true, status: 'duplicate' })
    }

    // Insert enrollment
    const { error } = await supabase.from('enrollments').insert({
      user_id,
      course_id,
      status: 'active',
      enrolled_at: now,
      access_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      payment_method: 'stripe',
      stripe_payment_intent_id: payment_intent_id || null,
      paid_amount_cents: amount_total,
      paid_at: now,
      payment_amount: amount_total / 100,
      payment_currency: currency,
      payment_intent: payment_intent_id || null,
    })

    if (error) {
      console.error('Webhook: enrollment insert failed', error)
      return NextResponse.json({ error: 'Enrollment failed' }, { status: 500 })
    }

    console.log('Webhook: enrollment created', { user_id, course_id, amount: amount_total })

    // Update profile name from Stripe checkout (if profile has no first_name yet)
    const customerName = session.customer_details?.name
    if (customerName && user_id) {
      const nameParts = customerName.trim().split(/\s+/)
      const first_name = nameParts[0] || null
      const last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null

      if (first_name) {
        // Only set name if not already set (don't overwrite user's chosen name)
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', user_id)
          .single()

        if (profile && !profile.first_name) {
          await supabase
            .from('profiles')
            .update({ first_name, last_name })
            .eq('id', user_id)
          console.log('Webhook: profile name updated from checkout', { user_id, first_name, last_name })
        }
      }
    }
  }

  // Klarna / async payment failed — log it
  if (event.type === 'checkout.session.async_payment_failed') {
    const session = event.data.object as {
      metadata?: { course_id?: string; user_id?: string; cal_booking_uid?: string; type?: string }
      client_reference_id?: string
    }

    // If this was a deposit payment, mark booking as failed
    if (session.metadata?.type === 'deposit' && session.metadata?.cal_booking_uid) {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      await supabase
        .from('pending_bookings')
        .update({ status: 'cancelled' })
        .eq('cal_booking_uid', session.metadata.cal_booking_uid)
        .eq('status', 'pending')
      console.warn('Deposit payment FAILED, booking cancelled:', session.metadata.cal_booking_uid)
    } else {
      const user_id = session.metadata?.user_id || session.client_reference_id
      const course_id = session.metadata?.course_id
      console.warn('Webhook: async payment FAILED', { user_id, course_id, event_type: event.type })
    }
  }

  return NextResponse.json({ received: true })
}

async function handleDepositPayment(session: { metadata?: { cal_booking_uid?: string }; [key: string]: unknown }) {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const calBookingUid = session.metadata?.cal_booking_uid

  // Check booking still exists and is pending
  const { data: booking } = await supabase
    .from('pending_bookings')
    .select('*')
    .eq('cal_booking_uid', calBookingUid)
    .single()

  if (!booking) {
    console.error('Deposit paid but booking not found:', calBookingUid)
    await autoRefund(session, 'Booking not found')
    return
  }

  if (booking.status === 'cancelled' || booking.status === 'expired') {
    console.error('CRITICAL: Deposit paid but booking already', booking.status, ':', calBookingUid)
    // Payment arrived after timeout cancellation — auto-refund as last resort
    await autoRefund(session, `Booking was ${booking.status}`)
    return
  }

  // IDEMPOTENCY: if booking is already paid, this is a duplicate webhook delivery — do NOTHING
  if (booking.status === 'paid') {
    console.log('Deposit webhook: booking already paid, skipping (idempotent):', calBookingUid)
    return
  }

  // Mark as paid — DB unique constraint (pending_bookings_one_paid_per_booking) is the final guard
  const { error } = await supabase
    .from('pending_bookings')
    .update({ status: 'paid' })
    .eq('id', booking.id)
    .eq('status', 'pending') // only update if still pending (optimistic concurrency)

  if (error) {
    // If this is a unique constraint violation, the booking was already marked paid by a concurrent request
    if (error.code === '23505') {
      console.log('Deposit webhook: unique constraint hit — already paid by concurrent request (idempotent):', calBookingUid)
      return
    }
    console.error('Failed to mark booking as paid:', error)
    return
  }

  console.log('✅ Deposit paid, booking confirmed:', calBookingUid)

  // Send confirmation + Chiva notification (non-blocking, error-safe)
  try {
    const { sendConfirmationEmail, sendNewBookingNotification } = await import('@/lib/email')
    
    // Use customer info stored in pending_bookings (display only)
    // user_id is the source of truth for email routing
    const customerEmail = booking.customer_email || null
    const customerName = booking.customer_name || null
    const enriched = {
      ...booking,
      customer_name: customerName,
      customer_email: customerEmail,
      user_id: booking.user_id,
    }
    
    console.log(`Mail: user_id=${booking.user_id}, customer_email=${customerEmail}, customer_name=${customerName}`)
    
    // Send confirmation — getAccountEmail will look up via user_id
    await sendConfirmationEmail(booking.id, enriched)
    await sendNewBookingNotification(enriched)
  } catch (err) {
    console.error('Mail: failed to send confirmation notifications (non-fatal):', err)
  }
}

/**
 * TRAJECT DEPOSIT — handle 50% aanbetaling voor traject-boekingen.
 *
 * Anti-dubbelboeking: na betaling opnieuw checken of blok nog vrij is.
 * Race-condition: als iemand tussentijds hetzelfde blok boekte → niet opslaan,
 * auto-refund, log het.
 */
async function handleTrajectDeposit(session: any, stripe: any) {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const md = session.metadata || {}
  const cursus_id = md.cursus_id
  const cursus_naam = md.cursus_naam
  const startdatum = md.startdatum
  const starttijd = md.starttijd
  const klant_naam = md.klant_naam
  const klant_email = md.klant_email
  const aanbetaling_cents = Number(md.aanbetaling_cents || 0)
  const restbedrag_cents = Number(md.restbedrag_cents || 0)

  let blok_dagen: string[] = []
  try {
    blok_dagen = JSON.parse(md.blok_dagen || '[]')
  } catch {
    blok_dagen = []
  }

  const payment_intent_id = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id

  const stripe_session_id = session.id

  console.log('Traject deposit webhook:', {
    cursus_id, startdatum, starttijd, klant_email, stripe_session_id,
  })

  // IDEMPOTENCY: al verwerkt?
  const { data: existing } = await supabase
    .from('traject_boekingen')
    .select('id')
    .eq('stripe_session_id', stripe_session_id)
    .limit(1)

  if (existing && existing.length > 0) {
    console.log('Traject deposit: al verwerkt (idempotent), skip', stripe_session_id)
    return
  }

  // ANTI-DUBBELBOEKING: check opnieuw of blok vrij is
  const { data: alleBoekingen } = await supabase
    .from('traject_boekingen')
    .select('blok_dagen')

  const gevraagdSet = new Set(blok_dagen)
  for (const rij of alleBoekingen ?? []) {
    const existingDays: string[] = rij.blok_dagen ?? []
    if (existingDays.some((d: string) => gevraagdSet.has(d))) {
      // RACE CONDITION: blok is net geboekt door iemand anders
      console.error('CRITICAL: Traject race-condition — blok al geboekt NA betaling.', {
        cursus_id, startdatum, klant_email, stripe_session_id,
      })

      // Auto-refund
      if (payment_intent_id) {
        try {
          await stripe.refunds.create({
            payment_intent: payment_intent_id,
            reason: 'duplicate',
          })
          console.error(`AUTO-REFUND: ${payment_intent_id} (${klant_email}) — blok al geboekt door ander.`)
        } catch (err) {
          console.error('CRITICAL: Auto-refund FAALT:', err)
        }
      }
      return
    }
  }

  // Save booking
  const { error } = await supabase.from('traject_boekingen').insert({
    cursus_id,
    cursus_naam,
    startdatum,
    starttijd,
    blok_dagen,
    klant_naam,
    klant_email,
    aanbetaling_status: 'betaald',
    restbedrag_status: 'open',
    cal_sync_status: 'pending',
    stripe_session_id,
    stripe_payment_intent_id: payment_intent_id || null,
    aanbetaling_cents,
    restbedrag_cents,
  })

  if (error) {
    console.error('Traject deposit: insert mislukt:', error)
    return
  }

  console.log('✅ Traject boeking opgeslagen:', {
    cursus_naam, startdatum, klant_email,
  })
}

/**
 * LAST-RESORT AUTO-REFUND — should NEVER fire if commits 1-3 work correctly.
 * If it does, it's a CRITICAL alarm that something bypassed the idempotency guards.
 */
async function autoRefund(session: { metadata?: { cal_booking_uid?: string }; payment_intent?: string | { id: string }; [key: string]: unknown }, reason: string) {
  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id

  if (!paymentIntentId) {
    console.error('CRITICAL [autoRefund]: No payment_intent ID — cannot refund. Reason:', reason)
    return
  }

  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: 'duplicate',
    })

    console.error(`CRITICAL [autoRefund]: Refunded ${paymentIntentId} (€${(refund.amount / 100).toFixed(2)}) — reason: ${reason} — booking: ${session.metadata?.cal_booking_uid}. THIS SHOULD NEVER HAPPEN. Investigate commits 1-3 guards.`)
  } catch (err) {
    console.error('CRITICAL [autoRefund]: Refund FAILED for', paymentIntentId, ':', err)
  }
}
