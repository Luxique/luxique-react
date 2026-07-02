/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { syncTrajectBlokNaarCalCom } from '@/lib/traject-cal-sync'

export const dynamic = 'force-dynamic'

/**
 * Cron: Traject cal.com sync
 *
 * Trigger: external cron (cron-jobs.org) every 1-2 min.
 * Auth: CRON_SECRET header check (zelfde patroon als cleanup-bookings).
 *
 * Logic:
 * 1. Select traject_boekingen waar cal_sync_status IN ('pending','partial','failed')
 *    EN aanbetaling_status = 'betaald'. Limit 5 per run.
 * 2. Voor elke boeking: roep syncTrajectBlokNaarCalCom aan.
 * 3. Update cal_sync_status naar 'synced' / 'partial' / 'failed'.
 *
 * Dry-run: set CRON_DRY_RUN=true om te loggen zonder mutaties.
 */
export async function GET(request: NextRequest) {
  // Auth check — zelfde patroon als cleanup-bookings
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

  // Step 1: Selecteer boekingen die gesynced moeten worden
  const { data: boekingen, error: fetchError } = await supabase
    .from('traject_boekingen')
    .select('id, cursus_naam, cursus_id, startdatum, starttijd, blok_dagen, klant_naam, klant_email, cal_sync_status')
    .in('cal_sync_status', ['pending', 'partial', 'failed'])
    .eq('aanbetaling_status', 'betaald')
    .limit(5)
  if (fetchError) {
    console.error('[traject-cron] DB fetch fout:', fetchError.message)
    return NextResponse.json({ error: 'DB fetch failed' }, { status: 500 })
  }

  if (!boekingen || boekingen.length === 0) {
    return NextResponse.json({ dryRun: DRY_RUN, processed: 0, message: 'Geen boekingen om te syncen' })
  }

  console.log(`[traject-cron] ${boekingen.length} boeking(en) te syncen (dry-run: ${DRY_RUN})`)

  const results: any[] = []

  for (const boeking of boekingen) {
    const result: any = {
      id: boeking.id,
      cursus: boeking.cursus_naam,
      dagen: boeking.blok_dagen?.length || 0,
      vorige_status: boeking.cal_sync_status,
      nieuwe_status: 'unknown',
    }

    console.log(`[traject-cron] START sync boeking ${boeking.id}`, {
      cursus: boeking.cursus_naam,
      startdatum: boeking.startdatum,
      dagen: boeking.blok_dagen,
      starttijd: boeking.starttijd,
    })

    if (DRY_RUN) {
      result.nieuwe_status = 'skipped_dry_run'
      results.push(result)
      continue
    }

    try {
      // Haal duur_werkdagen op uit traject_cursussen
      const { data: cursus } = await supabase
        .from('traject_cursussen')
        .select('duur_werkdagen')
        .eq('id', boeking.cursus_id)
        .single()
      const duurWerkdagen = cursus?.duur_werkdagen ?? 1

      const syncResult = await syncTrajectBlokNaarCalCom({
        boekingId: boeking.id,
        cursus_naam: boeking.cursus_naam,
        blok_dagen: boeking.blok_dagen || [],
        starttijd: boeking.starttijd,
        klant_naam: boeking.klant_naam,
        klant_email: boeking.klant_email,
        duur_werkdagen: duurWerkdagen,
      }, supabase)

      const nieuweStatus = syncResult.status === 'skipped' ? 'synced' : syncResult.status
      result.nieuwe_status = nieuweStatus
      result.daysSynced = syncResult.daysSynced
      result.daysFailed = syncResult.daysFailed
      result.uids = syncResult.uids
      if (syncResult.error) result.error = syncResult.error

      // Update DB status
      const { error: updateError } = await supabase
        .from('traject_boekingen')
        .update({ cal_sync_status: nieuweStatus })
        .eq('id', boeking.id)

      if (updateError) {
        console.error(`[traject-cron] DB update fout voor ${boeking.id}:`, updateError.message)
        result.db_update_error = updateError.message
      }

      console.log(`[traject-cron] RESULT boeking ${boeking.id}:`, {
        status: nieuweStatus,
        daysSynced: syncResult.daysSynced,
        daysFailed: syncResult.daysFailed,
        uids: syncResult.uids,
      })
    } catch (err: any) {
      result.nieuwe_status = 'failed'
      result.error = String(err?.message || err)
      console.error(`[traject-cron] CRASH boeking ${boeking.id}:`, err)

      // Probeer alsnog 'failed' in de DB te zetten
      try {
        await supabase
          .from('traject_boekingen')
          .update({ cal_sync_status: 'failed' })
          .eq('id', boeking.id)
      } catch {}
    }

    results.push(result)
  }

  const summary = {
    dryRun: DRY_RUN,
    processed: results.length,
    synced: results.filter(r => r.nieuwe_status === 'synced').length,
    partial: results.filter(r => r.nieuwe_status === 'partial').length,
    failed: results.filter(r => r.nieuwe_status === 'failed').length,
    skipped: results.filter(r => r.nieuwe_status === 'skipped_dry_run').length,
    results,
  }

  console.log('[traject-cron] SUMMARY:', JSON.stringify(summary, null, 2))
  return NextResponse.json(summary)
}
