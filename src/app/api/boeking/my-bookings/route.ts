/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

  const userEmail = user.email
  if (!userEmail) {
    return NextResponse.json({ error: 'No email on account' }, { status: 400 })
  }

  // Fetch all bookings for this customer — only those that were actually paid
  const { data: bookings, error } = await supabase
    .from('pending_bookings')
    .select('*')
    .eq('customer_email', userEmail)
    .not('stripe_session_id', 'is', null)
    .order('slot_start', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  return NextResponse.json({ bookings: bookings || [] })
}
