import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  addMinutes,
  createManualCalBooking,
  cancelManualCalBooking,
  getManualEventTypeId,
  isManualTreatmentKey,
  MANUAL_TREATMENTS,
  type ManualDepositStatus,
  type ManualTreatmentKey,
} from '@/lib/manual-bookings'
import { sendManualBookingConfirmation } from '@/lib/manual-booking-email'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const noStoreHeaders = { 'Cache-Control': 'private, no-store, no-cache, must-revalidate, max-age=0' }
function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: noStoreHeaders })
}

async function accountFor(userId: string) {
  const [{ data: profile }, { data: authData }] = await Promise.all([
    supabaseAdmin.from('profiles').select('id, email, full_name').eq('id', userId).maybeSingle(),
    supabaseAdmin.auth.admin.getUserById(userId),
  ])
  if (!profile || !authData?.user) return null
  const email = authData.user.email || profile.email
  if (!email) return null
  return {
    id: profile.id,
    email,
    name: profile.full_name || authData.user.user_metadata?.full_name || email.split('@')[0],
    phone: authData.user.phone || authData.user.user_metadata?.phone || null,
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return json({ error: auth.error || 'Geen toegang.' }, auth.status || 401)

  const raw = (request.nextUrl.searchParams.get('q') || '').trim()
  if (raw.length < 2) return json({ customers: [] })
  const query = raw.replace(/[%_,()]/g, ' ').replace(/\s+/g, ' ').trim()
  if (query.length < 2) return json({ customers: [] })

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name')
    .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
    .order('full_name', { ascending: true })
    .limit(12)
  if (error) return json({ error: 'Klanten zoeken mislukt.' }, 500)

  return json({ customers: data || [] })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok || !auth.user) return json({ error: auth.error || 'Geen toegang.' }, auth.status || 401)

  const body = await request.json().catch(() => null)
  const userId = typeof body?.userId === 'string' ? body.userId : ''
  const start = typeof body?.start === 'string' ? body.start : ''
  const depositStatus: ManualDepositStatus = body?.salonDepositStatus === 'paid' ? 'paid' : 'not_recorded'
  const depositCents = depositStatus === 'paid' && Number.isInteger(body?.salonDepositCents)
    ? Number(body.salonDepositCents)
    : null

  if (!userId || !isManualTreatmentKey(body?.treatmentKey) || !start) {
    return json({ error: 'Klant, behandeling, datum en tijd zijn verplicht.' }, 400)
  }
  if (!Number.isFinite(new Date(start).getTime()) || new Date(start).getTime() <= Date.now()) {
    return json({ error: 'Kies een geldige toekomstige datum en tijd.' }, 400)
  }
  if (depositStatus === 'paid' && (depositCents == null || depositCents < 0)) {
    return json({ error: 'Vul een geldig aanbetalingsbedrag in.' }, 400)
  }

  const customer = await accountFor(userId)
  if (!customer) return json({ error: 'Dit account bestaat niet meer of heeft geen e-mailadres.' }, 404)

  const treatmentKey = body.treatmentKey as ManualTreatmentKey
  const treatment = MANUAL_TREATMENTS[treatmentKey]
  try {
    const eventTypeId = getManualEventTypeId(treatment.key)
    const calBooking = await createManualCalBooking({
      eventTypeId,
      start: new Date(start).toISOString(),
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
    })
    const slotStart = calBooking.start
    const slotEnd = calBooking.end || addMinutes(slotStart, treatment.durationMinutes)

    const { data: booking, error: insertError } = await supabaseAdmin
      .from('manual_bookings')
      .insert({
        user_id: customer.id,
        created_by: auth.user.id,
        cal_booking_uid: calBooking.uid,
        cal_booking_id: calBooking.id,
        event_type_id: eventTypeId,
        treatment_key: treatment.key,
        slot_start: slotStart,
        slot_end: slotEnd,
        status: 'confirmed',
        salon_deposit_cents: depositCents,
        salon_deposit_status: depositStatus,
        sync_status: 'synced',
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single()

    if (insertError || !booking) {
      await cancelManualCalBooking(calBooking.uid, 'Luxique database creation failed').catch(cleanupError => {
        console.error('[manual-bookings] Cal rollback failed:', cleanupError)
      })
      return json({ error: `Boeking kon niet worden opgeslagen: ${insertError?.message || 'onbekende fout'}` }, 500)
    }

    try {
      await sendManualBookingConfirmation({
        bookingId: booking.id,
        customerName: customer.name,
        customerEmail: customer.email,
        treatmentName: treatment.name,
        slotStart,
        salonDepositStatus: depositStatus,
        salonDepositCents: depositCents,
      })
      await supabaseAdmin.from('manual_bookings').update({
        confirmation_sent_at: new Date().toISOString(), confirmation_error: null, updated_at: new Date().toISOString(),
      }).eq('id', booking.id)
    } catch (mailError) {
      await supabaseAdmin.from('manual_bookings').update({
        confirmation_error: mailError instanceof Error ? mailError.message : 'Onbekende mailfout',
        updated_at: new Date().toISOString(),
      }).eq('id', booking.id)
      return json({ booking, emailSent: false, warning: 'De afspraak staat vast, maar de bevestigingsmail kon niet worden verzonden.' }, 201)
    }

    return json({ booking, emailSent: true }, 201)
  } catch (error) {
    console.error('[manual-bookings] create failed:', error)
    return json({ error: error instanceof Error ? error.message : 'Handmatig inboeken mislukt.' }, 502)
  }
}
