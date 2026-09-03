import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { cancelCalBookingVerified } from '@/lib/cal-cancellation'
import { isWithin24Hours, MANUAL_TREATMENTS, restoreManualBookingPublicAvailability, type ManualTreatmentKey } from '@/lib/manual-bookings'
import { sendManualBookingCancellation, sendManualBookingCancellationNotification } from '@/lib/manual-booking-email'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'private, no-store' }
function json(body: Record<string, unknown>, status = 200) { return NextResponse.json(body, { status, headers }) }

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return json({ error: auth.error || 'Geen toegang.' }, auth.status || 401)
  const body = await request.json().catch(() => null)
  const uid = typeof body?.uid === 'string' ? body.uid.trim() : ''
  const source = body?.source === 'manual' ? 'manual' : 'online'
  if (!uid) return json({ error: 'Booking UID ontbreekt.' }, 400)

  const table = source === 'manual' ? 'manual_bookings' : 'pending_bookings'
  const { data: booking, error: fetchError } = await supabaseAdmin.from(table).select('*').eq('cal_booking_uid', uid).maybeSingle()
  if (fetchError || !booking) return json({ error: 'Boeking niet gevonden in LUXIQUE.' }, 404)
  if (booking.status === 'cancelled') return json({ error: 'Deze afspraak is al geannuleerd.' }, 400)

  const slotStart = source === 'manual' ? booking.slot_start : booking.slot_start
  const within24h = isWithin24Hours(slotStart)
  const refundEligible = source === 'online' && booking.status === 'paid' && !within24h && booking.amount_cents > 0
  const requestedAt = new Date().toISOString()
  try {
    await cancelCalBookingVerified(uid, 'Cancelled by Chiva via Luxique admin agenda')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Onbekende Cal.com-fout'
    console.error('[admin-cancel] Cal cancellation failed:', { table, bookingId: booking.id, uid, error: message })
    const update = source === 'manual'
      ? { status: 'cancellation_pending', cancellation_requested_at: requestedAt, sync_status: 'cancellation_pending', sync_error: message, updated_at: requestedAt }
      : { status: 'cancellation_pending', cancellation_requested_at: requestedAt, cancellation_error: message, cancellation_refund_eligible: refundEligible }
    const { error: pendingError } = await supabaseAdmin.from(table).update(update).eq('id', booking.id)
    if (pendingError) console.error('[admin-cancel] pending status update failed:', pendingError)
    return json({ success: false, pending: true, error: 'Annulering in behandeling. Cal.com accepteerde de annulering nog niet; de cron probeert automatisch opnieuw.' }, 202)
  }

  if (source === 'manual') {
    try {
      await restoreManualBookingPublicAvailability(booking.slot_start, booking.slot_end)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Publieke beschikbaarheid herstellen mislukt.'
      console.error('[admin-cancel] availability restore failed:', { bookingId: booking.id, uid, error: message })
      await supabaseAdmin.from('manual_bookings').update({
        status: 'cancellation_pending', cancellation_requested_at: requestedAt,
        sync_status: 'cancellation_pending', sync_error: message, updated_at: requestedAt,
      }).eq('id', booking.id)
      return json({ success: false, partial: true, pending: true, error: 'Cal.com is geannuleerd, maar het tijdslot is nog niet vrijgegeven. De cron probeert dit opnieuw.' }, 202)
    }
  }

  const finalUpdate = source === 'manual'
    ? { status: 'cancelled', cancelled_at: requestedAt, cancelled_within_24h: within24h, cancellation_requested_at: requestedAt, sync_status: 'synced', sync_error: null, updated_at: requestedAt }
    : { status: 'cancelled', cancelled_at: requestedAt, cancelled_within_24h: within24h, cancellation_requested_at: requestedAt, cancellation_error: null, cancellation_refund_eligible: refundEligible }
  const { error: updateError } = await supabaseAdmin.from(table).update(finalUpdate).eq('id', booking.id)
  if (updateError) {
    console.error('[admin-cancel] Cal succeeded but database update failed:', updateError)
    const pendingUpdate = source === 'manual'
      ? { status: 'cancellation_pending', cancellation_requested_at: requestedAt, sync_status: 'cancellation_pending', sync_error: `Database afronding mislukt: ${updateError.message}`, updated_at: requestedAt }
      : { status: 'cancellation_pending', cancellation_requested_at: requestedAt, cancellation_error: `Database afronding mislukt: ${updateError.message}`, cancellation_refund_eligible: refundEligible }
    await supabaseAdmin.from(table).update(pendingUpdate).eq('id', booking.id)
    return json({ success: false, partial: true, error: 'Cal.com is geannuleerd, maar de LUXIQUE-status kon niet worden bijgewerkt.' }, 500)
  }

  const warnings: string[] = []
  try {
    if (source === 'online') {
      const { sendCancellationNotification, sendCustomerCancellationEmail } = await import('@/lib/email')
      await Promise.all([
        sendCustomerCancellationEmail({ ...booking, cancelled_within_24h: within24h }),
        sendCancellationNotification({ ...booking, cancelled_within_24h: within24h, cancellation_refund_eligible: refundEligible }),
      ])
    } else {
      const [{ data: profile }, { data: authUser }] = await Promise.all([
        supabaseAdmin.from('profiles').select('email, full_name').eq('id', booking.user_id).maybeSingle(),
        supabaseAdmin.auth.admin.getUserById(booking.user_id),
      ])
      const customerEmail = authUser?.user?.email || profile?.email
      if (!customerEmail) throw new Error('Klant heeft geen e-mailadres.')
      const customerName = profile?.full_name || authUser?.user?.user_metadata?.full_name || customerEmail.split('@')[0]
      const treatment = MANUAL_TREATMENTS[booking.treatment_key as ManualTreatmentKey]
      const mail = { bookingId: booking.id, customerName, customerEmail, treatmentName: treatment?.name || 'Behandeling', slotStart: booking.slot_start, salonDepositStatus: booking.salon_deposit_status, salonDepositCents: booking.salon_deposit_cents, within24h }
      await Promise.all([sendManualBookingCancellation(mail), sendManualBookingCancellationNotification(mail)])
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Onbekende mailfout'
    console.error('[admin-cancel] cancellation mail failed:', { bookingId: booking.id, error: message })
    warnings.push(`De afspraak is geannuleerd, maar niet alle e-mails zijn verzonden: ${message}`)
  }

  return json({ success: true, cancelled: true, within24h, warnings })
}
