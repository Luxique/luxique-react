import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { MANUAL_TREATMENTS } from '@/lib/manual-bookings'
import {
  dueReviewRequestCandidates,
  runReviewRequestCandidates,
  type ReviewRequestCandidate,
} from '@/lib/review-request-runner'

export const dynamic = 'force-dynamic'

/**
 * cron-jobs.org: recommended every 10 minutes.
 * Sends one review request shortly after each regular treatment appointment ends.
 * Academy purchases and trajectory bookings live in different tables and are
 * deliberately excluded.
 */
export async function GET(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || ''
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET
  if (!userAgent.includes('vercel-cron') && expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = process.env.CRON_DRY_RUN === 'true'
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const now = new Date()
  const nowIso = now.toISOString()

  const [{ data: onlineRows, error: onlineError }, { data: manualRows, error: manualError }] = await Promise.all([
    supabase
      .from('pending_bookings')
      .select('id,cal_booking_uid,event_type,slot_start,customer_name,customer_email,user_id')
      .eq('status', 'paid')
      .is('review_request_sent_at', null)
      .lt('slot_start', nowIso),
    supabase
      .from('manual_bookings')
      .select('id,cal_booking_uid,treatment_key,slot_start,user_id')
      .eq('status', 'confirmed')
      .is('review_request_sent_at', null)
      .lt('slot_start', nowIso),
  ])

  if (onlineError || manualError) {
    console.error('Review request cron: fetch failed', { onlineError, manualError })
    return NextResponse.json({ error: 'DB fetch failed' }, { status: 500 })
  }

  const candidates = dueReviewRequestCandidates([
    ...(onlineRows || []).map((row) => ({
      ...row,
      source: 'online' as const,
      duration_minutes: row.event_type.toLowerCase().includes('opvullen') || row.event_type.toLowerCase().includes('refill') ? 120 : 180,
    })),
    ...(manualRows || []).map((row) => ({
      id: row.id,
      source: 'manual' as const,
      cal_booking_uid: row.cal_booking_uid,
      event_type: MANUAL_TREATMENTS[row.treatment_key as keyof typeof MANUAL_TREATMENTS]?.name || 'Lashbehandeling',
      slot_start: row.slot_start,
      duration_minutes: MANUAL_TREATMENTS[row.treatment_key as keyof typeof MANUAL_TREATMENTS]?.durationMinutes || 180,
      user_id: row.user_id,
    })),
  ], now)

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      evaluatedAt: nowIso,
      processed: candidates.length,
      sent: 0,
      skipped: 0,
      errors: 0,
      results: candidates.map(({ id, source, cal_booking_uid }) => ({ id, source, uid: cal_booking_uid, action: 'would_send' })),
    })
  }

  const claimedAt = now.toISOString()
  const { sendReviewRequestEmail } = await import('@/lib/email')
  const tableFor = (candidate: ReviewRequestCandidate) => candidate.source === 'manual' ? 'manual_bookings' : 'pending_bookings'

  const results = await runReviewRequestCandidates(
    candidates,
    async (candidate) => {
      const { data: claimed, error } = await supabase
        .from(tableFor(candidate))
        .update({ review_request_sent_at: claimedAt, review_request_error: null })
        .eq('id', candidate.id)
        .is('review_request_sent_at', null)
        .select('id')
        .maybeSingle()
      if (error) throw new Error(`Review claim failed: ${error.message}`)
      return !!claimed
    },
    async (candidate) => sendReviewRequestEmail({ ...candidate, amount_cents: 0 }),
    async (candidate, message) => {
      const { error } = await supabase
        .from(tableFor(candidate))
        .update({ review_request_sent_at: null, review_request_error: message })
        .eq('id', candidate.id)
        .eq('review_request_sent_at', claimedAt)
      if (error) console.error(`Review request cron: claim release failed for ${candidate.id}:`, error)
    },
  )

  const summary = {
    dryRun: false,
    evaluatedAt: nowIso,
    processed: results.length,
    sent: results.filter((result) => result.action === 'sent').length,
    skipped: results.filter((result) => result.action === 'skipped').length,
    errors: results.filter((result) => result.action === 'error').length,
    results,
  }
  console.log('Review request cron summary:', JSON.stringify(summary))
  return NextResponse.json(summary)
}
