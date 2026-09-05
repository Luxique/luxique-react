/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get user from JWT
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  if (userError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, phone')
    .eq('id', user.id)
    .maybeSingle()

  const phoneDigits = String(profile?.phone || '').replace(/\D/g, '').replace(/^00/, '')
  const normalizedPhone = phoneDigits.startsWith('0') ? `31${phoneDigits.slice(1)}` : phoneDigits
  const smsGatewayEmail = normalizedPhone ? `${normalizedPhone}@sms.cal.com` : null
  const accountEmail = profile?.email?.trim().toLowerCase() || user.email?.trim().toLowerCase() || null

  // user_id is authoritative. Exact account email/phone-gateway matches recover
  // bookings created before the best-effort link request completed.
  const ownershipFilters = [`user_id.eq.${user.id}`]
  if (accountEmail) ownershipFilters.push(`customer_email.eq.${accountEmail}`)
  if (smsGatewayEmail) ownershipFilters.push(`customer_email.eq.${smsGatewayEmail}`)

  const { data: bookings, error } = await supabase
    .from('pending_bookings')
    .select('*')
    .or(ownershipFilters.join(','))
    .not('stripe_session_id', 'is', null)
    .order('slot_start', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  return NextResponse.json({ bookings: bookings || [] })
}
