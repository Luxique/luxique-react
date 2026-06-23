import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Daily cron: expire enrollments past their access_expires_at.
 * Secured with CRON_SECRET header. Respects CRON_DRY_RUN.
 *
 * Vercel Cron: runs 1x/day at 03:00 UTC.
 */
export async function POST(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = process.env.CRON_DRY_RUN === 'true'

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Find enrollments that should be expired
  const { data: expired, error: findError } = await supabase
    .from('enrollments')
    .select('id, user_id, course_id, enrolled_at, access_expires_at, status')
    .eq('status', 'active')
    .lt('access_expires_at', new Date().toISOString())

  if (findError) {
    console.error('Cron expire-access: query failed', findError)
    return NextResponse.json({ error: 'Query failed', details: findError.message }, { status: 500 })
  }

  if (!expired || expired.length === 0) {
    return NextResponse.json({
      ok: true,
      message: 'No enrollments to expire',
      dryRun,
      expiredCount: 0,
    })
  }

  console.log(`Cron expire-access: found ${expired.length} enrollment(s) to expire`, { dryRun })

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      message: 'DRY RUN — no changes made',
      dryRun: true,
      wouldExpire: expired.map(e => ({
        id: e.id,
        user_id: e.user_id,
        course_id: e.course_id,
        access_expires_at: e.access_expires_at,
      })),
    })
  }

  // Live run: update status to 'expired'
  const ids = expired.map(e => e.id)
  const { error: updateError } = await supabase
    .from('enrollments')
    .update({ status: 'expired' })
    .in('id', ids)

  if (updateError) {
    console.error('Cron expire-access: update failed', updateError)
    return NextResponse.json({ error: 'Update failed', details: updateError.message }, { status: 500 })
  }

  console.log(`Cron expire-access: expired ${ids.length} enrollment(s)`)

  return NextResponse.json({
    ok: true,
    message: `Expired ${ids.length} enrollment(s)`,
    dryRun: false,
    expiredCount: ids.length,
    expired: expired.map(e => ({
      id: e.id,
      user_id: e.user_id,
      course_id: e.course_id,
      access_expires_at: e.access_expires_at,
    })),
  })
}

// Also support GET for Vercel Cron (which sends GET by default)
export async function GET(request: NextRequest) {
  return POST(request)
}
