/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * Daily reminder cron — sends reminders for paid and manual bookings within 32h of the appointment.
 *
 * Trigger: Vercel Cron once daily at 09:00 AM CET.
 * Schedule: "0 7 * * *" (UTC 7 = CET 8/9 depending on DST)
 *
 * Logic:
 * 1. Find every future paid or confirmed manual booking within 32 hours.
 * 2. Send reminder email if not already sent.
 */

export async function GET(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || ''
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET
  const isVercelCron = userAgent.includes('vercel-cron')

  if (!isVercelCron && expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = Date.now()
  const nowIso = new Date(now).toISOString()
  const in32h = new Date(now + 32 * 60 * 60 * 1000).toISOString()

  const [{ data: bookings, error }, { data: manualBookings, error: manualError }] = await Promise.all([
    supabase
      .from('pending_bookings')
      .select('*')
      .eq('status', 'paid')
      .gt('slot_start', nowIso)
      .lte('slot_start', in32h)
      .is('reminder_sent_at', null),
    supabase
      .from('manual_bookings')
      .select('*')
      .eq('status', 'confirmed')
      .gt('slot_start', nowIso)
      .lte('slot_start', in32h)
      .is('reminder_sent_at', null),
  ])

  if (error) {
    console.error('Reminder cron: fetch failed:', error)
    return NextResponse.json({ error: 'DB fetch failed' }, { status: 500 })
  }
  if (manualError) {
    console.error('Reminder cron: manual fetch failed:', manualError)
    return NextResponse.json({ error: 'Manual booking DB fetch failed' }, { status: 500 })
  }

  console.log(`Reminder cron: ${bookings?.length || 0} paid and ${manualBookings?.length || 0} manual bookings need reminders`)

  const { sendReminderEmail, getBookingWithCustomerFromCal } = await import('@/lib/email')
  const { sendManualBookingReminder } = await import('@/lib/manual-booking-email')
  const { MANUAL_TREATMENTS } = await import('@/lib/manual-bookings')

  const results: any[] = []

  for (const booking of bookings || []) {
    try {
      const calBooking = await getBookingWithCustomerFromCal(booking.cal_booking_uid)
      const enriched = {
        ...booking,
        customer_name: calBooking?.customer_name || null,
        customer_email: calBooking?.customer_email || null,
        user_id: booking.user_id,
      }

      // Reminder goes to account email via user_id — no need to check customer_email
      await sendReminderEmail(booking.id, enriched)
      results.push({ source: 'online', uid: booking.cal_booking_uid, action: 'reminder_sent' })
    } catch (err) {
      console.error(`Reminder cron: error for ${booking.cal_booking_uid}:`, err)
      results.push({ source: 'online', uid: booking.cal_booking_uid, action: 'error', error: String(err) })
    }
  }

  for (const booking of manualBookings || []) {
    try {
      const [{ data: authData }, { data: profile }] = await Promise.all([
        supabase.auth.admin.getUserById(booking.user_id),
        supabase.from('profiles').select('email, full_name').eq('id', booking.user_id).maybeSingle(),
      ])
      const customerEmail = authData?.user?.email || profile?.email
      const customerName = profile?.full_name
        || authData?.user?.user_metadata?.full_name
        || customerEmail?.split('@')[0]
      const treatment = MANUAL_TREATMENTS[booking.treatment_key as keyof typeof MANUAL_TREATMENTS]
      if (!customerEmail || !customerName || !treatment) throw new Error('Klant- of behandelingsgegevens ontbreken.')

      await sendManualBookingReminder({
        bookingId: booking.id,
        customerName,
        customerEmail,
        treatmentName: treatment.name,
        slotStart: booking.slot_start,
        salonDepositStatus: booking.salon_deposit_status,
        salonDepositCents: booking.salon_deposit_cents,
      })
      const { error: reminderUpdateError } = await supabase.from('manual_bookings').update({
        reminder_sent_at: new Date().toISOString(),
        reminder_error: null,
        updated_at: new Date().toISOString(),
      }).eq('id', booking.id)
      if (reminderUpdateError) throw new Error(`Reminderstatus opslaan mislukt: ${reminderUpdateError.message}`)
      results.push({ source: 'manual', uid: booking.cal_booking_uid, action: 'reminder_sent' })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`Reminder cron: manual error for ${booking.cal_booking_uid}:`, err)
      await supabase.from('manual_bookings').update({
        reminder_error: message,
        updated_at: new Date().toISOString(),
      }).eq('id', booking.id)
      results.push({ source: 'manual', uid: booking.cal_booking_uid, action: 'error', error: message })
    }
  }

  const summary = {
    processed: results.length,
    sent: results.filter(r => r.action === 'reminder_sent').length,
    skipped: results.filter(r => r.action === 'skipped').length,
    errors: results.filter(r => r.action === 'error').length,
    online: results.filter(r => r.source === 'online').length,
    manual: results.filter(r => r.source === 'manual').length,
    results,
  }

  console.log('Reminder cron summary:', JSON.stringify(summary, null, 2))
  return NextResponse.json(summary)
}
