/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * Cron cleanup — expire stale pending bookings and free Cal slots.
 *
 * Trigger: external cron (Vercel Cron, Uptime Robot, etc.) every 2 min.
 * Auth: CRON_SECRET header check.
 *
 * Logic:
 * 1. Find pending_bookings where status='pending' AND expires_at + 3min grace < now()
 * 2. For each: check Stripe for active payment. If paid → correct to 'paid'.
 * 3. If no active payment → cancel Cal booking, set status='expired'.
 *
 * Dry-run: set CRON_DRY_RUN=true to log without cancelling.
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
  const GRACE_MINUTES = 3

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Step 1: Find candidates
  const graceAgo = new Date(Date.now() - GRACE_MINUTES * 60 * 1000).toISOString()

  const { data: candidates, error: fetchError } = await supabase
    .from('pending_bookings')
    .select('*')
    .eq('status', 'pending')
    .lt('expires_at', graceAgo)

  if (fetchError) {
    console.error('Cron: failed to fetch candidates:', fetchError)
    return NextResponse.json({ error: 'DB fetch failed' }, { status: 500 })
  }

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ dryRun: DRY_RUN, processed: 0, message: 'No stale bookings' })
  }

  console.log(`Cron: found ${candidates.length} stale pending bookings (dry-run: ${DRY_RUN})`)

  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  const results: any[] = []

  for (const booking of candidates) {
    const result: any = { uid: booking.cal_booking_uid, event: booking.event_type, action: 'unknown' }

    try {
      // Step 2: Check Stripe for active payment
      let stripePaid = false
      let stripeActive = false

      if (booking.stripe_session_id) {
        const session = await stripe.checkout.sessions.retrieve(booking.stripe_session_id)

        if (session.payment_status === 'paid') {
          stripePaid = true
        }
        if (session.payment_status === 'unpaid' && session.status === 'open') {
          // Session still open — payment might be in progress (iDEAL redirect flow)
          const sessionAge = Date.now() - new Date(session.created * 1000).getTime()
          if (sessionAge < 15 * 60 * 1000) {
            stripeActive = true
          }
        }
      }

      // Also check by metadata (in case webhook created a different session)
      if (!stripeActive && !stripePaid) {
        const sessions = await stripe.checkout.sessions.list({
          limit: 10,
          expand: ['data.payment_intent'],
        })

        for (const s of sessions.data) {
          if (s.metadata?.cal_booking_uid === booking.cal_booking_uid) {
            if (s.payment_status === 'paid') {
              stripePaid = true
              break
            }
            if (s.payment_status === 'unpaid' && s.status === 'open') {
              // Session exists but not paid — check if it's recent enough to be active
              const sessionAge = Date.now() - new Date(s.created * 1000).getTime()
              if (sessionAge < 15 * 60 * 1000) { // Less than 15 min old
                stripeActive = true
                break
              }
            }
          }
        }
      }

      if (stripePaid) {
        // Payment succeeded but webhook missed it → correct status
        result.action = 'corrected_to_paid'
        result.reason = 'Stripe shows paid but booking still pending'

        if (!DRY_RUN) {
          await supabase
            .from('pending_bookings')
            .update({ status: 'paid' })
            .eq('id', booking.id)

          console.log(`Cron: corrected ${booking.cal_booking_uid} to 'paid' (Stripe confirmed)`)
          
          // Send confirmation + Chiva notification (non-blocking, error-safe)
          try {
            const { sendConfirmationEmail, sendNewBookingNotification } = await import('@/lib/email')
            const enriched = {
              ...booking,
              customer_name: booking.customer_name || null,
              customer_email: booking.customer_email || null,
            }
            if (enriched.customer_email) {
              await sendConfirmationEmail(booking.id, enriched)
            }
            await sendNewBookingNotification(enriched)
          } catch (mailErr) {
            console.error('Cron: mail failed (non-fatal):', mailErr)
          }
        } else {
          console.log(`Cron [DRY-RUN]: would correct ${booking.cal_booking_uid} to 'paid'`)
        }
        results.push(result)
        continue
      }

      if (stripeActive) {
        // Payment still processing — skip this booking, give it more time
        result.action = 'skipped'
        result.reason = 'Stripe payment still processing'

        console.log(`Cron: skipping ${booking.cal_booking_uid} — Stripe payment active`)
        results.push(result)
        continue
      }

      // Step 3: No active payment — cancel Cal booking
      result.action = DRY_RUN ? 'would_cancel' : 'cancelled'
      result.reason = 'expired without payment'

      if (!DRY_RUN) {
        // Cancel in Cal.com
        const calRes = await fetch(`https://api.cal.com/v2/bookings/${booking.cal_booking_uid}/cancel`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.CAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reason: 'Payment expired — automatic cancellation',
            allRemainingBookings: true,
          }),
        })

        if (calRes.ok) {
          result.calCancelled = true
          console.log(`Cron: Cal booking ${booking.cal_booking_uid} cancelled`)
        } else {
          result.calCancelled = false
          result.calError = await calRes.text()
          console.error(`Cron: Cal cancel failed for ${booking.cal_booking_uid}:`, result.calError)
        }

        // Mark as expired in DB (even if Cal cancel fails — don't retry forever)
        await supabase
          .from('pending_bookings')
          .update({ status: 'expired' })
          .eq('id', booking.id)

        console.log(`Cron: marked ${booking.cal_booking_uid} as expired`)
        
        // Send Chiva expired notification (non-blocking, error-safe)
        try {
          const { sendExpiredNotification } = await import('@/lib/email')
          await sendExpiredNotification(booking)
        } catch (mailErr) {
          console.error('Cron: expired mail failed (non-fatal):', mailErr)
        }
      } else {
        console.log(`Cron [DRY-RUN]: would cancel ${booking.cal_booking_uid} (${booking.event_type}, expired ${booking.expires_at})`)
      }

    } catch (err) {
      result.action = 'error'
      result.error = String(err)
      console.error(`Cron: error processing ${booking.cal_booking_uid}:`, err)
    }

    results.push(result)
  }

  const summary = {
    dryRun: DRY_RUN,
    processed: results.length,
    correctedToPaid: results.filter(r => r.action === 'corrected_to_paid').length,
    cancelled: results.filter(r => r.action === 'cancelled' || r.action === 'would_cancel').length,
    skipped: results.filter(r => r.action === 'skipped').length,
    errors: results.filter(r => r.action === 'error').length,
    results,
  }

  console.log('Cron summary:', JSON.stringify(summary, null, 2))
  return NextResponse.json(summary)
}
