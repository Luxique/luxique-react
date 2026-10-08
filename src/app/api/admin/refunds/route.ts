import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { MANUAL_TREATMENTS, type ManualTreatmentKey } from '@/lib/manual-bookings'

export const dynamic = 'force-dynamic'
const responseHeaders = { 'Cache-Control': 'private, no-store' }
const json = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status, headers: responseHeaders })

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return json({ error: auth.error || 'Geen toegang.' }, auth.status || 401)

  const { data: bookings, error } = await supabaseAdmin
    .from('manual_bookings')
    .select('id,user_id,treatment_key,slot_start,salon_deposit_cents,cancelled_at,refund_required_at,refunded_at,refunded_by')
    .not('refund_required_at', 'is', null)
    .order('refund_required_at', { ascending: false })
  if (error) return json({ error: 'Terugbetalingen laden mislukt.' }, 500)

  const userIds = Array.from(new Set((bookings || []).flatMap(item => [item.user_id, item.refunded_by]).filter(Boolean)))
  const { data: profiles } = userIds.length
    ? await supabaseAdmin.from('profiles').select('id,full_name,email').in('id', userIds)
    : { data: [] }
  const profileById = new Map((profiles || []).map(profile => [profile.id, profile]))

  const refunds = (bookings || []).map(booking => {
    const customer = profileById.get(booking.user_id)
    const completedBy = booking.refunded_by ? profileById.get(booking.refunded_by) : null
    return {
      id: booking.id,
      customerName: customer?.full_name || customer?.email || 'Onbekende klant',
      treatmentName: MANUAL_TREATMENTS[booking.treatment_key as ManualTreatmentKey]?.name || 'Behandeling',
      amountCents: Number(booking.salon_deposit_cents || 0),
      appointmentStart: booking.slot_start,
      cancelledAt: booking.cancelled_at,
      requiredAt: booking.refund_required_at,
      refundedAt: booking.refunded_at,
      refundedByName: completedBy?.full_name || completedBy?.email || null,
    }
  })
  return json({ refunds, openCount: refunds.filter(item => !item.refundedAt).length })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok || !auth.user) return json({ error: auth.error || 'Geen toegang.' }, auth.status || 401)
  const body = await request.json().catch(() => null)
  if (typeof body?.bookingId !== 'string' || typeof body?.refunded !== 'boolean') {
    return json({ error: 'Ongeldige terugbetalingsstatus.' }, 400)
  }

  const next = body.refunded
    ? { refunded_at: new Date().toISOString(), refunded_by: auth.user.id }
    : { refunded_at: null, refunded_by: null }
  const { data, error } = await supabaseAdmin
    .from('manual_bookings')
    .update(next)
    .eq('id', body.bookingId)
    .not('refund_required_at', 'is', null)
    .select('id,refunded_at')
    .maybeSingle()
  if (error) return json({ error: 'Terugbetalingsstatus opslaan mislukt.' }, 500)
  if (!data) return json({ error: 'Terugbetaling niet gevonden.' }, 404)
  return json({ refunded: Boolean(data.refunded_at), refundedAt: data.refunded_at })
}

