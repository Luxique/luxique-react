import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  addMinutes,
  cancelManualCalBooking,
  consumePublicAvailability,
  createManualCalBooking,
  getManualAvailability,
  isWithin24Hours,
  MANUAL_TREATMENTS,
  restoreConsumedPublicAvailability,
  type ManualTreatmentKey,
} from '@/lib/manual-bookings'
import { findManualBookingConflict } from '@/lib/manual-booking-conflicts'
import { sendManualBookingRescheduled } from '@/lib/manual-booking-email'

export const dynamic = 'force-dynamic'

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })
}

function amsterdamDate(iso: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(iso))
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value || ''
  return `${read('year')}-${read('month')}-${read('day')}`
}

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)
  const body = await request.json().catch(() => null)
  if (!body?.bookingId || !body?.newStart || !Number.isFinite(new Date(body.newStart).getTime())) {
    return json({ error: 'bookingId and newStart are required' }, 400)
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: { user }, error: userError } = await supabase.auth.getUser(auth.slice(7))
  if (userError || !user) return json({ error: 'Invalid token' }, 401)
  const { data: booking } = await supabase.from('manual_bookings').select('*').eq('id', body.bookingId).maybeSingle()
  if (!booking) return json({ error: 'Booking not found' }, 404)
  if (booking.user_id !== user.id) return json({ error: 'Forbidden' }, 403)
  if (booking.status !== 'confirmed') return json({ error: 'Deze afspraak kan niet worden verplaatst.' }, 400)
  if (isWithin24Hours(booking.slot_start)) return json({ error: 'Verplaatsen kan tot 24 uur voor je afspraak.' }, 400)

  const newStart = new Date(body.newStart).toISOString()
  if (new Date(newStart).getTime() <= Date.now()) return json({ error: 'Kies een tijdstip in de toekomst.' }, 400)
  const treatment = MANUAL_TREATMENTS[booking.treatment_key as ManualTreatmentKey]
  if (!treatment) return json({ error: 'Onbekende behandeling.' }, 409)
  const candidateEnd = addMinutes(newStart, treatment.durationMinutes)

  try {
    const conflict = await findManualBookingConflict(supabase, newStart, candidateEnd, booking.id)
    if (conflict) return json({ error: conflict.message, conflictType: conflict.type }, 409)

    const available = await getManualAvailability({
      eventTypeId: Number(booking.event_type_id), date: amsterdamDate(newStart), bookingUidToIgnore: booking.cal_booking_uid,
    })
    if (!available.some(slot => new Date(slot.start).getTime() === new Date(newStart).getTime())) {
      return json({ error: 'Dit tijdstip is niet meer beschikbaar. Kies een ander tijdstip.' }, 409)
    }

    const { data: authData } = await supabase.auth.admin.getUserById(user.id)
    const { data: profile } = await supabase.from('profiles').select('email, full_name').eq('id', user.id).maybeSingle()
    const customerEmail = authData?.user?.email || profile?.email
    const customerName = profile?.full_name || authData?.user?.user_metadata?.full_name || customerEmail?.split('@')[0]
    if (!customerEmail || !customerName) return json({ error: 'Je accountgegevens zijn niet compleet.' }, 409)

    const replacement = await createManualCalBooking({
      eventTypeId: Number(booking.event_type_id), start: newStart,
      customerName, customerEmail,
      customerPhone: authData?.user?.phone || authData?.user?.user_metadata?.phone || null,
    })
    const replacementEnd = replacement.end || addMinutes(replacement.start, treatment.durationMinutes)

    const conflictAfterCalCreation = await findManualBookingConflict(
      supabase, replacement.start, replacementEnd, booking.id,
    )
    if (conflictAfterCalCreation) {
      await cancelManualCalBooking(replacement.uid, 'Luxique overlap check failed')
      return json({ error: conflictAfterCalCreation.message, conflictType: conflictAfterCalCreation.type }, 409)
    }

    const { error: updateError } = await supabase.from('manual_bookings').update({
      cal_booking_uid: replacement.uid,
      cal_booking_id: replacement.id,
      previous_cal_booking_uid: booking.cal_booking_uid,
      slot_start: replacement.start,
      slot_end: replacementEnd,
      rescheduled_at: new Date().toISOString(),
      sync_status: 'synced',
      sync_error: null,
      updated_at: new Date().toISOString(),
    }).eq('id', booking.id).eq('user_id', user.id)

    if (updateError) {
      await cancelManualCalBooking(replacement.uid, 'Luxique reschedule database rollback').catch(rollbackError => {
        console.error('[manual-reschedule] replacement rollback failed:', rollbackError)
      })
      return json({ error: 'Verplaatsen kon niet worden opgeslagen; de nieuwe Cal.com-boeking is teruggedraaid.' }, 500)
    }

    let consumedAvailability
    try {
      consumedAvailability = await consumePublicAvailability(replacement.start, replacementEnd)
    } catch (availabilityError) {
      await supabase.from('manual_bookings').update({
        cal_booking_uid: booking.cal_booking_uid,
        cal_booking_id: booking.cal_booking_id,
        previous_cal_booking_uid: booking.previous_cal_booking_uid,
        slot_start: booking.slot_start,
        slot_end: booking.slot_end,
        rescheduled_at: booking.rescheduled_at,
        updated_at: new Date().toISOString(),
      }).eq('id', booking.id).eq('user_id', user.id)
      await cancelManualCalBooking(replacement.uid, 'Public availability could not be consumed').catch(cleanupError => {
        console.error('[manual-reschedule] replacement rollback failed:', cleanupError)
      })
      return json({
        error: availabilityError instanceof Error ? availabilityError.message : 'Publieke beschikbaarheid bijwerken mislukt.',
      }, 502)
    }

    try {
      await cancelManualCalBooking(booking.cal_booking_uid, 'Replaced by a new manual Luxique booking')
    } catch (cleanupError) {
      await restoreConsumedPublicAvailability(consumedAvailability).catch(restoreError => {
        console.error('[manual-reschedule] publieke beschikbaarheid herstellen mislukt:', restoreError)
      })
      const message = cleanupError instanceof Error ? cleanupError.message : 'Oude Cal.com-boeking kon niet worden geannuleerd.'
      await supabase.from('manual_bookings').update({
        sync_status: 'cleanup_required', sync_error: message, updated_at: new Date().toISOString(),
      }).eq('id', booking.id)
      return json({
        error: 'De nieuwe afspraak staat vast, maar de oude Cal.com-boeking kon niet automatisch worden opgeruimd. Neem contact op met LUXIQUE.',
        syncStatus: 'cleanup_required', newStart: replacement.start,
      }, 502)
    }

    let emailSent = true
    try {
      await sendManualBookingRescheduled({
        bookingId: booking.id, customerName, customerEmail, treatmentName: treatment.name,
        slotStart: replacement.start,
        salonDepositStatus: booking.salon_deposit_status,
        salonDepositCents: booking.salon_deposit_cents,
      })
    } catch (mailError) {
      emailSent = false
      console.error('[manual-reschedule] mail failed:', mailError)
    }
    return json({ success: true, newUid: replacement.uid, newStart: replacement.start, emailSent })
  } catch (error) {
    console.error('[manual-reschedule] failed:', error)
    return json({ error: error instanceof Error ? error.message : 'Verplaatsen mislukt.' }, 502)
  }
}
