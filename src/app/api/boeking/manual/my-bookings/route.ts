import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { MANUAL_TREATMENTS, type ManualTreatmentKey } from '@/lib/manual-bookings'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.slice(7))
  if (userError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const { data, error } = await supabase.from('manual_bookings')
    .select('id, cal_booking_uid, event_type_id, treatment_key, slot_start, slot_end, status, salon_deposit_cents, salon_deposit_status, cancelled_within_24h, sync_status')
    .eq('user_id', user.id)
    .order('slot_start', { ascending: false })
  if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 })

  const bookings = (data || []).map(booking => ({
    ...booking,
    source: 'manual' as const,
    event_type: MANUAL_TREATMENTS[booking.treatment_key as ManualTreatmentKey]?.name || 'Behandeling',
    amount_cents: booking.salon_deposit_cents || 0,
  }))
  return NextResponse.json({ bookings }, { headers: { 'Cache-Control': 'private, no-store' } })
}
