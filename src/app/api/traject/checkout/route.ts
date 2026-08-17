import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

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
 * Maakt een Stripe Checkout sessie voor de 20% aanbetaling (cursussen).
 * KLAS-gebaseerd: boekt een plek in een klas (klas_id), niet een losse datum.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      klas_id,
      cursus_id,
      cursus_naam,
      startdatum,
      starttijd,
      klant_naam,
      klant_email,
      prijs_cents, // volledige prijs in cents (ex BTW)
    } = body

    // === AUTH: haal user_id op uit JWT ===
    const authHeader = req.headers.get('authorization')
    let userId: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
      if (!userError && user) {
        userId = user.id
      }
    }

    // Validatie — klas_id verplicht
    if (!klas_id || !cursus_id || !startdatum || !starttijd || !klant_naam || !klant_email) {
      return NextResponse.json(
        { error: 'Ontbrekende velden (klas_id verplicht)' },
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

    // === CAPACITEIT PRE-CHECK ===
    const { data: klas, error: klasError } = await supabaseAdmin
      .from('traject_klassen')
      .select('id, cursus_id, startdatum, starttijd, blok_dagen, max_deelnemers, status')
      .eq('id', klas_id)
      .single()

    if (klasError || !klas) {
      return NextResponse.json(
        { error: 'Klas niet gevonden' },
        { status: 404, headers: NO_STORE_HEADERS },
      )
    }

    if (klas.status === 'geannuleerd') {
      return NextResponse.json(
        { error: 'Deze klas is geannuleerd.' },
        { status: 409, headers: NO_STORE_HEADERS },
      )
    }

    const { count: betaaldCount, error: countError } = await supabaseAdmin
      .from('traject_boekingen')
      .select('id', { count: 'exact', head: true })
      .eq('klas_id', klas_id)
      .eq('aanbetaling_status', 'betaald')

    if (countError) {
      return NextResponse.json(
        { error: 'DB-fout bij capaciteitscheck' },
        { status: 500, headers: NO_STORE_HEADERS },
      )
    }

    const plekkenOver = klas.max_deelnemers - (betaaldCount ?? 0)
    if (plekkenOver <= 0) {
      return NextResponse.json(
        { error: 'Deze klas is helaas volgeboekt.' },
        { status: 409, headers: NO_STORE_HEADERS },
      )
    }

    // Haal cursus op voor naam + prijs
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

    // Blok_dagen van de klas gebruiken (altijd actueel)
    const blok_dagen = klas.blok_dagen

    // Prijs berekening: prijs_cents is EX BTW. Eerst BTW toevoegen, dan 20%.
    // De 20% aanbetaling is onder geen enkele omstandigheid restitueerbaar.
    const prijsInclBtw = Math.round(prijs_cents * 1.21)
    const aanbetaling = Math.round(prijsInclBtw * 0.2)

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
              description: `20% aanbetaling (niet-restitueerbaar) — restbedrag betaal je in de studio op de startdag.`,
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
        klas_id,
        startdatum,
        starttijd,
        blok_dagen: JSON.stringify(blok_dagen),
        klant_naam,
        klant_email,
        user_id: userId || '',
        prijs_cents_volledig: String(prijs_cents),
        aanbetaling_cents: String(aanbetaling),
        restbedrag_cents: String(prijsInclBtw - aanbetaling),
      },
    }, {
      idempotencyKey: `traject-klas-${klas_id}-${klant_email}`,
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
