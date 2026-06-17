import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Cron — send review requests 1 day after paid appointments.
 *
 * Trigger: external cron (Vercel Cron, cron-job.org, etc.) daily.
 * Auth: CRON_SECRET header check.
 *
 * Logic:
 * 1. Find paid bookings where slot_start was yesterday AND review_request_sent_at is NULL
 * 2. Send review request email via Resend to account email
 * 3. Mark review_request_sent_at to prevent duplicates
 */

export async function GET(request: NextRequest) {
  // Auth check — accept Vercel Cron (user-agent check) OR external CRON_SECRET bearer
  const userAgent = request.headers.get('user-agent') || ''
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET
  const isVercelCron = userAgent.includes('vercel-cron')

  if (!isVercelCron && expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const DRY_RUN = process.env.CRON_DRY_RUN === 'true'

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Step 1: Find paid bookings from yesterday that haven't had a review request
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString()
  const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999)).toISOString()

  const { data: candidates, error: fetchError } = await supabase
    .from('pending_bookings')
    .select('*')
    .eq('status', 'paid')
    .is('review_request_sent_at', null)
    .gte('slot_start', yesterdayStart)
    .lte('slot_start', yesterdayEnd)

  if (fetchError) {
    console.error('Cron: failed to fetch review candidates:', fetchError)
    return NextResponse.json({ error: 'DB fetch failed' }, { status: 500 })
  }

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ dryRun: DRY_RUN, processed: 0, message: 'No review requests to send' })
  }

  console.log(`Cron: found ${candidates.length} bookings from yesterday for review requests (dry-run: ${DRY_RUN})`)

  const results: any[] = []

  for (const booking of candidates) {
    const result: any = { uid: booking.cal_booking_uid, event: booking.event_type, action: 'unknown' }

    try {
      result.action = DRY_RUN ? 'would_send' : 'sent'
      result.reason = 'review request'

      if (!DRY_RUN) {
        // Send review request email
        const { sendReviewRequestEmail } = await import('@/lib/email')
        await sendReviewRequestEmail(booking)
        result.emailSent = true
      } else {
        console.log(`Cron [DRY-RUN]: would send review request for ${booking.cal_booking_uid}`)
      }
    } catch (err) {
      result.action = 'error'
      result.error = String(err)
      console.error(`Cron: error sending review request for ${booking.cal_booking_uid}:`, err)
    }

    results.push(result)
  }

  const summary = {
    dryRun: DRY_RUN,
    processed: results.length,
    sent: results.filter(r => r.action === 'sent' || r.action === 'would_send').length,
    errors: results.filter(r => r.action === 'error').length,
    results,
  }

  console.log('Cron summary:', JSON.stringify(summary, null, 2))
  return NextResponse.json(summary)
}