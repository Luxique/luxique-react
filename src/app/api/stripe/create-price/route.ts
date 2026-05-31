import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

    const { course_id, price_cents, title } = await request.json()

    if (!course_id || !price_cents) {
      return NextResponse.json({ error: 'Missing course_id or price_cents' }, { status: 400 })
    }

    // Create a one-time Price in Stripe
    const price = await stripe.prices.create({
      currency: 'eur',
      unit_amount: price_cents,
      product_data: {
        name: `LXQ Academy — ${title || 'Course'}`,
      },
    })

    // Save stripe_price_id on the course
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await supabase
      .from('courses')
      .update({ stripe_price_id: price.id })
      .eq('id', course_id)

    return NextResponse.json({ stripe_price_id: price.id })
  } catch (err: unknown) {
    console.error('Stripe create-price error:', String(err))
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
