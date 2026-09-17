import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error || 'Geen toegang.' },
      { status: auth.status || 401, headers: NO_STORE_HEADERS },
    )
  }

  const { data, error } = await supabaseAdmin
    .from('pending_bookings')
    .select('id, user_id, event_type, slot_start, status, amount_cents, customer_name, customer_email, created_at, agreed_at')
    .eq('status', 'paid')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin-dashboard-sales] Paid bookings ophalen mislukt:', error)
    return NextResponse.json(
      { error: 'Betaalde behandelingen laden mislukt.' },
      { status: 500, headers: NO_STORE_HEADERS },
    )
  }

  return NextResponse.json({ paidBookings: data || [] }, { headers: NO_STORE_HEADERS })
}
