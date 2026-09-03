import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { cancelCalBookingVerified } from '@/lib/cal-cancellation'
import { isWithin24Hours, MANUAL_TREATMENTS, restoreManualBookingPublicAvailability, type ManualTreatmentKey } from '@/lib/manual-bookings'
import { sendManualBookingCancellation, sendManualBookingCancellationNotification } from '@/lib/manual-booking-email'
import { isManualAvailabilityLedger } from '@/lib/manual-availability-ledger'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function authorized(request: NextRequest) {
  const expected = process.env.CRON_SECRET
  const supplied = request.headers.get('authorization')
  return Boolean(expected && supplied === `Bearer ${expected}`)
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [
    { data: online, error: onlineError },
    { data: manualCancellations, error: manualError },
    { data: manualRestorations, error: restorationError },
  ] = await Promise.all([
    supabaseAdmin.from('pending_bookings').select('*').eq('status', 'cancellation_pending').order('cancellation_requested_at').limit(10),
    supabaseAdmin.from('manual_bookings').select('*').eq('status', 'cancellation_pending').order('cancellation_requested_at').limit(10),
    supabaseAdmin.from('manual_bookings').select('*').eq('sync_status', 'availability_restore_pending').order('updated_at').limit(10),
  ])
  if (onlineError || manualError || restorationError) {
    return NextResponse.json({ error: onlineError?.message || manualError?.message || restorationError?.message }, { status: 500 })
  }

  const results: Array<Record<string, unknown>> = []
  for (const booking of online || []) {
    let finalized = false
    const within24h = isWithin24Hours(booking.slot_start)
    try {
      await cancelCalBookingVerified(booking.cal_booking_uid, 'Luxique cancellation retry')
      const now = new Date().toISOString()
      const { error } = await supabaseAdmin.from('pending_bookings').update({
        status: 'cancelled', cancelled_at: now, cancelled_within_24h: within24h, cancellation_error: null,
      }).eq('id', booking.id).eq('status', 'cancellation_pending')
      if (error) throw error
      finalized = true
      const { sendCancellationNotification, sendCustomerCancellationEmail } = await import('@/lib/email')
      await Promise.all([
        sendCustomerCancellationEmail({ ...booking, cancelled_within_24h: within24h }),
        sendCancellationNotification({ ...booking, cancelled_within_24h: within24h }),
      ])
      results.push({ source: 'online', id: booking.id, status: 'cancelled' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Onbekende fout'
      console.error('[retry-cancellations] online failed:', { id: booking.id, uid: booking.cal_booking_uid, error: message })
      if (finalized) {
        results.push({ source: 'online', id: booking.id, status: 'cancelled_with_mail_warning', error: message })
        continue
      }
      await supabaseAdmin.from('pending_bookings').update({ cancellation_error: message }).eq('id', booking.id)
      results.push({ source: 'online', id: booking.id, status: 'pending', error: message })
    }
  }

  for (const booking of manualCancellations || []) {
    let cancellationFinalized = false
    const within24h = isWithin24Hours(booking.slot_start)
    try {
      await cancelCalBookingVerified(booking.cal_booking_uid, 'Luxique manual cancellation retry')
      const now = new Date().toISOString()
      const hasLedger = isManualAvailabilityLedger(booking.availability_restoration_ledger)
      const { error } = await supabaseAdmin.from('manual_bookings').update({
        status: 'cancelled', cancelled_at: now, cancelled_within_24h: within24h,
        sync_status: hasLedger ? 'availability_restore_pending' : 'availability_review_required',
        sync_error: hasLedger ? null : 'Bestaande boeking zonder betrouwbare beschikbaarheidsledger; handmatige controle vereist.',
        updated_at: now,
      }).eq('id', booking.id).eq('status', 'cancellation_pending')
      if (error) throw error
      cancellationFinalized = true
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
      results.push({ source: 'manual', id: booking.id, status: hasLedger ? 'availability_restore_pending' : 'availability_review_required' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Onbekende fout'
      console.error('[retry-cancellations] manual failed:', { id: booking.id, uid: booking.cal_booking_uid, error: message })
      if (cancellationFinalized) {
        results.push({ source: 'manual', id: booking.id, status: 'cancelled_with_mail_warning', error: message })
        continue
      }
      await supabaseAdmin.from('manual_bookings').update({ sync_status: 'cancellation_pending', sync_error: message, updated_at: new Date().toISOString() }).eq('id', booking.id)
      results.push({ source: 'manual', id: booking.id, status: 'pending', error: message })
    }
  }

  for (const booking of manualRestorations || []) {
    const ledger = booking.status === 'cancelled'
      ? booking.availability_restoration_ledger
      : booking.pending_availability_restore_ledger
    try {
      await restoreManualBookingPublicAvailability(booking.treatment_key as ManualTreatmentKey, ledger)
      await supabaseAdmin.from('manual_bookings').update({
        sync_status: 'synced', sync_error: null,
        pending_availability_restore_ledger: null,
        updated_at: new Date().toISOString(),
      }).eq('id', booking.id).eq('sync_status', 'availability_restore_pending')
      results.push({ source: 'manual-restoration', id: booking.id, status: 'restored' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Onbekende fout'
      const reviewRequired = message.startsWith('AVAILABILITY_REVIEW_REQUIRED:')
      await supabaseAdmin.from('manual_bookings').update({
        sync_status: reviewRequired ? 'availability_review_required' : 'availability_restore_pending',
        sync_error: message,
        updated_at: new Date().toISOString(),
      }).eq('id', booking.id)
      results.push({ source: 'manual-restoration', id: booking.id, status: reviewRequired ? 'review_required' : 'pending', error: message })
    }
  }

  return NextResponse.json({ processed: results.length, cancelled: results.filter(result => result.status === 'cancelled').length, pending: results.filter(result => result.status === 'pending').length, results })
}
