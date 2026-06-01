/**
 * Stripe Webhook — checkout.session.completed
 *
 * SETUP INSTRUCTIONS (CJ):
 * 1. Go to Stripe Dashboard → Developers → Webhooks
 * 2. Click "Add endpoint"
 * 3. Endpoint URL: https://www.luxique.nl/api/webhooks/stripe
 *    (or your staging domain)
 * 4. Events to listen for: checkout.session.completed
 * 5. After creating, click the endpoint → "Signing secret" → Reveal
 * 6. Add to .env.local: STRIPE_WEBHOOK_SECRET=whsec_xxxxx
 * 7. Redeploy.
 */

import { NextRequest, NextResponse } from 'next/server'

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as {
      metadata?: { course_id?: string; user_id?: string }
      client_reference_id?: string
      payment_intent?: string | { id: string }
      amount_total?: number
      currency?: string
      customer_details?: { name?: string | null }
    }

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

  return NextResponse.json({ received: true })
}
