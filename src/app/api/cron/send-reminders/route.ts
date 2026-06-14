/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Daily reminder cron — sends reminders for paid bookings ~24h before appointment.
 *
 * Trigger: Vercel Cron once daily at 09:00 AM CET.
 * Schedule: "0 7 * * *" (UTC 7 = CET 8/9 depending on DST)
 *
 * Logic:
 * 1. Find paid bookings where slot_start is between 20-32 hours from now
 *    (covers 09:00 run → reminders for next day 05:00-17:00 appointments)
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
  const in20h = new Date(now + 20 * 60 * 60 * 1000).toISOString()
  const in32h = new Date(now + 32 * 60 * 60 * 1000).toISOString()

  // Find paid bookings in the 20-32h window without reminder sent
  const { data: bookings, error } = await supabase
    .from('pending_bookings')
    .select('*')
    .eq('status', 'paid')
    .gte('slot_start', in20h)
    .lte('slot_start', in32h)
    .is('reminder_sent_at', null)

  if (error) {
    console.error('Reminder cron: fetch failed:', error)
    return NextResponse.json({ error: 'DB fetch failed' }, { status: 500 })
  }

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No reminders needed' })
  }

  console.log(`Reminder cron: ${bookings.length} bookings need reminders`)

  const { sendReminderEmail, getBookingWithCustomerFromCal } = await import('@/lib/email')

  const results: any[] = []

  for (const booking of bookings) {
    try {
      const calBooking = await getBookingWithCustomerFromCal(booking.cal_booking_uid)
      const enriched = {
        ...booking,
        customer_name: calBooking?.customer_name || null,
        customer_email: calBooking?.customer_email || null,
      }

      if (!enriched.customer_email) {
        console.log(`Reminder cron: no email for ${booking.cal_booking_uid}, skipping`)
        results.push({ uid: booking.cal_booking_uid, action: 'skipped', reason: 'no email' })
        continue
      }

      await sendReminderEmail(booking.id, enriched)
      results.push({ uid: booking.cal_booking_uid, action: 'reminder_sent' })
    } catch (err) {
      console.error(`Reminder cron: error for ${booking.cal_booking_uid}:`, err)
      results.push({ uid: booking.cal_booking_uid, action: 'error', error: String(err) })
    }
  }

  const summary = {
    processed: results.length,
    sent: results.filter(r => r.action === 'reminder_sent').length,
    skipped: results.filter(r => r.action === 'skipped').length,
    errors: results.filter(r => r.action === 'error').length,
    results,
  }

  console.log('Reminder cron summary:', JSON.stringify(summary, null, 2))
  return NextResponse.json(summary)
}
