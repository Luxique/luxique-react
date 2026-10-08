import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { canonicalCustomerEmail } from '@/lib/customer-email'
import { MANUAL_TREATMENTS, type ManualTreatmentKey } from '@/lib/manual-bookings'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const headers = { 'Cache-Control': 'private, no-store, no-cache, must-revalidate, max-age=0' }

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error || 'Geen toegang.' }, { status: auth.status || 401, headers })
  }

  const { data: rows, error } = await supabaseAdmin
    .from('manual_bookings')
    .select('id,cal_booking_uid,event_type_id,treatment_key,slot_start,slot_end,status,user_id,note,refunded_at')
    .in('status', ['confirmed', 'cancellation_pending', 'cancelled'])
    .order('slot_start', { ascending: false })
  if (error) {
    console.error('[agenda-manual-bookings] manual bookings query failed:', error)
    return NextResponse.json({ error: 'Handmatige afspraken laden mislukt.' }, { status: 500, headers })
  }

  const userIds = Array.from(new Set((rows || []).map(row => row.user_id).filter(Boolean)))
  const { data: profiles, error: profilesError } = userIds.length
    ? await supabaseAdmin.from('profiles').select('id,email,full_name,phone').in('id', userIds)
    : { data: [], error: null }
  if (profilesError) {
    console.error('[agenda-manual-bookings] profiles query failed:', profilesError)
    return NextResponse.json({ error: 'Klanten laden mislukt.' }, { status: 500, headers })
  }

  const profileById = new Map((profiles || []).map(profile => [profile.id, profile]))
  const bookings = (rows || []).map(row => {
    const profile = profileById.get(row.user_id)
    const email = canonicalCustomerEmail({ profileEmail: profile?.email }) || ''
    const treatment = MANUAL_TREATMENTS[row.treatment_key as ManualTreatmentKey]
    return {
      id: row.id,
      uid: row.cal_booking_uid || row.id,
      status: row.status,
      startTime: row.slot_start,
      endTime: row.slot_end,
      customerName: profile?.full_name || email || 'Onbekend',
      customerEmail: email,
      customerPhone: profile?.phone || '',
      eventTypeId: row.event_type_id,
      eventTypeTitle: treatment?.name || 'Behandeling',
      source: 'manual',
      paymentStatus: null,
      note: row.note || '',
      refundedAt: row.refunded_at,
    }
  })

  return NextResponse.json({ bookings }, { headers })
}
