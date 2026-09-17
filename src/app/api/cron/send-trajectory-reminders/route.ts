import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { formatAmsterdamDateKey, getAmsterdamDateKeyAfterDays } from '@/lib/booking-date-time'
import { runTrajectoryReminderCandidates, type TrajectoryReminderCandidate } from '@/lib/trajectory-reminder-runner'

export const dynamic = 'force-dynamic'
const TRAJECT_REMINDER_DAYS_BEFORE = 2

export async function GET(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || ''
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET
  if (!userAgent.includes('vercel-cron') && expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const now = new Date()
  const today = formatAmsterdamDateKey(now)
  const targetDate = getAmsterdamDateKeyAfterDays(now, TRAJECT_REMINDER_DAYS_BEFORE)
  const { data, error } = await supabase
    .from('traject_boekingen')
    .select('id,cursus_id,cursus_naam,startdatum,starttijd,blok_dagen,klant_naam,klant_email,aanbetaling_cents,restbedrag_cents')
    .eq('aanbetaling_status', 'betaald')
    .gt('startdatum', today)
    .lte('startdatum', targetDate)
    .is('traject_reminder_verzonden_op', null)

  if (error) {
    console.error('Traject reminder cron: fetch failed:', error)
    return NextResponse.json({ error: 'DB fetch failed' }, { status: 500 })
  }

  const claimedAt = now.toISOString()
  const { sendTrajectReminderMail } = await import('@/lib/email')
  const results = await runTrajectoryReminderCandidates(
    (data || []) as TrajectoryReminderCandidate[],
    async (id) => {
      const { data: claimed, error: claimError } = await supabase
        .from('traject_boekingen')
        .update({ traject_reminder_verzonden_op: claimedAt, traject_reminder_fout: null })
        .eq('id', id)
        .is('traject_reminder_verzonden_op', null)
        .select('id')
        .maybeSingle()
      if (claimError) throw new Error(`Reminder claim mislukt: ${claimError.message}`)
      return !!claimed
    },
    async (candidate) => sendTrajectReminderMail({ ...candidate, boekingId: candidate.id }),
    async (id, message) => {
      const { error: releaseError } = await supabase
        .from('traject_boekingen')
        .update({ traject_reminder_verzonden_op: null, traject_reminder_fout: message })
        .eq('id', id)
        .eq('traject_reminder_verzonden_op', claimedAt)
      if (releaseError) console.error(`Traject reminder cron: claim vrijgeven mislukt voor ${id}:`, releaseError)
    },
  )

  const summary = {
    targetDate,
    afterDate: today,
    daysBefore: TRAJECT_REMINDER_DAYS_BEFORE,
    processed: results.length,
    sent: results.filter((result) => result.action === 'sent').length,
    skipped: results.filter((result) => result.action === 'skipped').length,
    errors: results.filter((result) => result.action === 'error').length,
    results,
  }
  console.log('Traject reminder cron summary:', JSON.stringify(summary))
  return NextResponse.json(summary)
}
