import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isWithin24Hours, MANUAL_TREATMENTS, restoreManualBookingPublicAvailability, type ManualTreatmentKey } from '@/lib/manual-bookings'
import { cancelCalBookingVerified } from '@/lib/cal-cancellation'
import { sendManualBookingCancellation, sendManualBookingCancellationNotification } from '@/lib/manual-booking-email'

export const dynamic = 'force-dynamic'

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })
}

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)
  const body = await request.json().catch(() => null)
  if (!body?.bookingId) return json({ error: 'Missing bookingId' }, 400)

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: { user }, error: userError } = await supabase.auth.getUser(auth.slice(7))
  if (userError || !user) return json({ error: 'Invalid token' }, 401)
  const { data: booking } = await supabase.from('manual_bookings').select('*').eq('id', body.bookingId).maybeSingle()
  if (!booking) return json({ error: 'Booking not found' }, 404)
  if (booking.user_id !== user.id) return json({ error: 'Forbidden' }, 403)
  if (booking.status === 'cancelled') return json({ error: 'Deze afspraak is al geannuleerd.' }, 400)

  const within24h = isWithin24Hours(booking.slot_start)
  const requestedAt = new Date().toISOString()
  try {
    await cancelCalBookingVerified(booking.cal_booking_uid, 'Cancelled by customer via Luxique dashboard')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cal.com-annulering mislukt.'
    console.error('[manual-cancel] Cal cancellation failed:', { bookingId: booking.id, uid: booking.cal_booking_uid, error: message })
    await supabase.from('manual_bookings').update({
      status: 'cancellation_pending', cancellation_requested_at: requestedAt,
      sync_status: 'cancellation_pending', sync_error: message, updated_at: requestedAt,
    }).eq('id', booking.id).eq('user_id', user.id)
    return json({ success: false, pending: true, error: 'Annulering in behandeling. We proberen Cal.com automatisch opnieuw.' }, 202)
  }

  try {
    await restoreManualBookingPublicAvailability(booking.slot_start, booking.slot_end)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Publieke beschikbaarheid herstellen mislukt.'
    console.error('[manual-cancel] Cal cancelled but availability restore failed:', { bookingId: booking.id, error: message })
    await supabase.from('manual_bookings').update({
      status: 'cancellation_pending', cancellation_requested_at: requestedAt,
      sync_status: 'cancellation_pending', sync_error: message, updated_at: requestedAt,
    }).eq('id', booking.id).eq('user_id', user.id)
    return json({ success: false, partial: true, pending: true, error: 'Cal.com is geannuleerd, maar het tijdslot kon nog niet worden vrijgegeven. We proberen dit automatisch opnieuw.' }, 202)
  }

  const { error: updateError } = await supabase.from('manual_bookings').update({
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
    cancelled_within_24h: within24h,
    sync_status: 'synced',
    sync_error: null,
    cancellation_requested_at: requestedAt,
    updated_at: new Date().toISOString(),
  }).eq('id', booking.id).eq('user_id', user.id)
  if (updateError) {
    await supabase.from('manual_bookings').update({
      status: 'cancellation_pending', cancellation_requested_at: requestedAt,
      sync_status: 'cancellation_pending', sync_error: `Cal.com geannuleerd; database afronding mislukt: ${updateError.message}`,
      updated_at: new Date().toISOString(),
    }).eq('id', booking.id).eq('user_id', user.id)
    return json({ error: 'Cal.com is geannuleerd, maar de dashboardstatus kon niet worden bijgewerkt. Neem contact op met LUXIQUE.' }, 500)
  }

  const { data: authData } = await supabase.auth.admin.getUserById(user.id)
  const { data: profile } = await supabase.from('profiles').select('email, full_name').eq('id', user.id).maybeSingle()
  const customerEmail = authData?.user?.email || profile?.email
  const customerName = profile?.full_name || authData?.user?.user_metadata?.full_name || customerEmail?.split('@')[0] || 'klant'
  const treatment = MANUAL_TREATMENTS[booking.treatment_key as ManualTreatmentKey]
  let emailSent = true
  if (customerEmail) {
    try {
      await sendManualBookingCancellation({
        bookingId: booking.id, customerName, customerEmail,
        treatmentName: treatment?.name || 'Behandeling', slotStart: booking.slot_start,
        salonDepositStatus: booking.salon_deposit_status,
        salonDepositCents: booking.salon_deposit_cents, within24h,
      })
      await sendManualBookingCancellationNotification({
        bookingId: booking.id, customerName, customerEmail,
        treatmentName: treatment?.name || 'Behandeling', slotStart: booking.slot_start,
        salonDepositStatus: booking.salon_deposit_status,
        salonDepositCents: booking.salon_deposit_cents, within24h,
      })
    } catch (mailError) {
      emailSent = false
      console.error('[manual-cancel] mail failed:', mailError)
    }
  } else emailSent = false

  return json({ success: true, within24h, emailSent })
}
