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
    const session = event.data.object as { metadata?: { course_id?: string; user_id?: string }; payment_intent?: string }
    const { course_id, user_id } = session.metadata || {}

    if (course_id && user_id) {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      await supabase.from('enrollments').upsert({
        user_id,
        course_id,
        status: 'active',
        enrolled_at: new Date().toISOString(),
        payment_intent: session.payment_intent as string,
      })
    }
  }

  return NextResponse.json({ received: true })
}
