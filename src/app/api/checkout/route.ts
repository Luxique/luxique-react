import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

    const { course_id, user_id, email } = await request.json()

    if (!course_id || !user_id || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: course } = await supabase
      .from('courses')
      .select('title, price_cents, stripe_price_id')
      .eq('id', course_id)
      .single()

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const unitAmount = course.price_cents || 199700

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      payment_method_types: ['ideal', 'card'],
      line_items: course.stripe_price_id
        ? [{ price: course.stripe_price_id, quantity: 1 }]
        : [{
            price_data: {
              currency: 'eur',
              product_data: { name: `LXQ Academy — ${course.title}` },
              unit_amount: unitAmount,
            },
            quantity: 1,
          }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.luxique.nl'}/dashboard?enrolled=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.luxique.nl'}/courses`,
      metadata: { course_id, user_id },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    console.error('Stripe checkout error:', String(err))
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
