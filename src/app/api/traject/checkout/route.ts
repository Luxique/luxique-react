import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { berekenWerkdagenBlok } from '@/lib/traject'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
}

/**
 * POST /api/traject/checkout
 *
 * Maakt een Stripe Checkout sessie voor de 50% aanbetaling.
 * Stuurt alle boekingsgegevens mee als metadata.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      cursus_id,
      cursus_naam,
      startdatum,
      starttijd,
      klant_naam,
      klant_email,
      prijs_cents, // volledige prijs in cents (ex BTW)
    } = body

    // Validatie
    if (!cursus_id || !startdatum || !starttijd || !klant_naam || !klant_email) {
      return NextResponse.json(
        { error: 'Ontbrekende velden' },
        { status: 400, headers: NO_STORE_HEADERS },
      )
    }

    if (!klant_email.includes('@') || klant_email.length < 5) {
      return NextResponse.json(
        { error: 'Ongeldig e-mailadres' },
        { status: 400, headers: NO_STORE_HEADERS },
      )
    }

    if (klant_naam.trim().length < 2) {
      return NextResponse.json(
        { error: 'Naam is te kort' },
        { status: 400, headers: NO_STORE_HEADERS },
      )
    }

    // Haal cursus op om duur_werkdagen te bepalen
    const { data: cursus, error: cursusError } = await supabaseAdmin
      .from('traject_cursussen')
      .select('id, naam, duur_werkdagen, prijs_cents')
      .eq('id', cursus_id)
      .single()

    if (cursusError || !cursus) {
      return NextResponse.json(
        { error: 'Cursus niet gevonden' },
        { status: 404, headers: NO_STORE_HEADERS },
      )
    }

    // Bereken blok
    const blok_dagen = berekenWerkdagenBlok(startdatum, cursus.duur_werkdagen)

    // Anti-dubbelboeking PRE-CHECK (voor Stripe)
    const { data: bestaandeBoekingen, error: boekingError } = await supabaseAdmin
      .from('traject_boekingen')
      .select('blok_dagen')

    if (boekingError) {
      return NextResponse.json(
        { error: 'DB-fout bij beschikbaarheidscheck' },
        { status: 500, headers: NO_STORE_HEADERS },
      )
    }

    const gevraagdSet = new Set(blok_dagen)
    for (const rij of bestaandeBoekingen ?? []) {
      const existing: string[] = rij.blok_dagen ?? []
      if (existing.some(d => gevraagdSet.has(d))) {
        return NextResponse.json(
          { error: 'Dit traject is helaas net geboekt. Kies een andere startdatum.' },
          { status: 409, headers: NO_STORE_HEADERS },
        )
      }
    }

    // Prijs berekening: prijs_cents is EX BTW. Eerst BTW toevoegen, dan 50%.
    const prijsInclBtw = Math.round(prijs_cents * 1.21)
    const aanbetaling = Math.round(prijsInclBtw / 2)

    // Stripe checkout
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://luxique-next.vercel.app'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['ideal', 'card', 'bancontact', 'klarna'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: aanbetaling,
            product_data: {
              name: `Aanbetaling: ${cursus.naam}`,
              description: `50% aanbetaling — restbedrag betaal je in de studio op de startdag.`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/nl/traject/bevestigd?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/nl/traject-boeken?cancelled=1`,
      metadata: {
        type: 'traject_deposit',
        cursus_id,
        cursus_naam: cursus.naam,
        startdatum,
        starttijd,
        blok_dagen: JSON.stringify(blok_dagen),
        klant_naam,
        klant_email,
        prijs_cents_volledig: String(prijs_cents),
        aanbetaling_cents: String(aanbetaling),
        restbedrag_cents: String(prijsInclBtw - aanbetaling),
      },
    }, {
      idempotencyKey: `traject-${cursus_id}-${startdatum}-${starttijd}`,
    })

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    }, { status: 200, headers: NO_STORE_HEADERS })
  } catch (error) {
    console.error('Fout in traject checkout:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: msg },
      { status: 500, headers: NO_STORE_HEADERS },
    )
  }
}
