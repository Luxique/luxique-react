/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { syncKlasNaarCalCom, cancelKlasBlokkades } from '@/lib/klas-cal-sync'

export const dynamic = 'force-dynamic'

/**
 * Cron: Traject KLASSEN → cal.com sync
 *
 * Trigger: external cron (cron-jobs.org) every 1-2 min.
 * Auth: CRON_SECRET header check.
 *
 * Twee taken:
 * 1. SYNC: Klassen met cal_sync_status IN ('pending','partial','failed')
 *    EN status='open'/'vol' → maak TRAJECT BLOK DAG blokkades.
 * 2. CANCEL: Klassen met status='geannuleerd' EN cal_booking_uids niet leeg
 *    → ruim cal.com blokkades op.
 *
 * Limit: 5 klassen per run (sync) + 3 (cancel).
 */
export async function GET(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || ''
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET
  const isVercelCron = userAgent.includes('vercel-cron')

  const NO_STORE = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
  }

  if (!isVercelCron && expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE })
  }

  // Vercel Data Cache bypass — supabase-js uses fetch() which Vercel auto-caches.
  // Force no-store on every fetch to prevent stale PostgREST responses.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        fetch: (url: RequestInfo | URL, init?: RequestInit) =>
          fetch(url, { ...init, cache: 'no-store' } as RequestInit),
      },
    },
  )

  const results: {
    synced: number
    partial: number
    failed: number
    cancelled: number
    cancel_failed: number
    details: any[]
  } = {
    synced: 0,
    partial: 0,
    failed: 0,
    cancelled: 0,
    cancel_failed: 0,
    details: [],
  }

  // === TAAK 1: SYNC pending klassen ===
  const { data: klassenToSync, error: syncFetchError } = await supabase
    .from('traject_klassen')
    .select(`
      id, cursus_id, startdatum, starttijd, blok_dagen, status, cal_sync_status, weergave_titel,
      traject_cursussen (naam, duur_werkdagen)
    `)
    .in('cal_sync_status', ['pending', 'partial', 'failed'])
    .in('status', ['open', 'vol'])
    .limit(5)

  if (syncFetchError) {
    console.error('[klas-cron] DB fetch fout:', syncFetchError.message)
    return NextResponse.json({ error: 'DB fetch failed' }, { status: 500, headers: NO_STORE })
  }

  for (const klas of klassenToSync ?? []) {
    const cursus = klas.traject_cursussen as any
    const detail: any = {
      klasId: klas.id,
      cursus: cursus?.naam ?? 'onbekend',
      dagen: klas.blok_dagen?.length ?? 0,
      vorige_status: klas.cal_sync_status,
    }

    try {
      const syncResult = await syncKlasNaarCalCom({
        klasId: klas.id,
        cursusNaam: cursus?.naam ?? 'Onbekend traject',
        blokDagen: klas.blok_dagen ?? [],
        starttijd: klas.starttijd,
        weergaveTitel: klas.weergave_titel,
      }, supabase)

      detail.nieuwe_status = syncResult.status
      detail.daysSynced = syncResult.daysSynced
      detail.daysFailed = syncResult.daysFailed
      detail.daysSkipped = syncResult.daysSkipped
      detail.uids = syncResult.uids

      if (syncResult.error) detail.error = syncResult.error

      // Update cal_sync_status in DB
      await supabase
        .from('traject_klassen')
        .update({ cal_sync_status: syncResult.status })
        .eq('id', klas.id)

      if (syncResult.status === 'synced') results.synced++
      else if (syncResult.status === 'partial') results.partial++
      else results.failed++
    } catch (err: any) {
      detail.nieuwe_status = 'failed'
      detail.error = String(err?.message || err)
      console.error(`[klas-cron] CRASH sync ${klas.id}:`, err)
      try {
        await supabase
          .from('traject_klassen')
          .update({ cal_sync_status: 'failed' })
          .eq('id', klas.id)
      } catch {}
      results.failed++
    }

    results.details.push(detail)
  }

  // === TAAK 2: CANCEL geannuleerde klassen met openstaande blokkades ===
  const { data: klassenToCancel, error: cancelFetchError } = await supabase
    .from('traject_klassen')
    .select('id, cal_booking_uids')
    .eq('status', 'geannuleerd')
    .not('cal_booking_uids', 'eq', '{}')
    .limit(3)

  if (cancelFetchError) {
    console.error('[klas-cron] cancel fetch fout:', cancelFetchError.message)
  }

  for (const klas of klassenToCancel ?? []) {
    try {
      const cancelResult = await cancelKlasBlokkades(klas.id, supabase)
      results.cancelled += cancelResult.cancelled.length
      results.cancel_failed += cancelResult.failed.length
      results.details.push({
        klasId: klas.id,
        cancel: cancelResult,
      })
    } catch (err: any) {
      console.error(`[klas-cron] CANCEL crash ${klas.id}:`, err)
      results.cancel_failed++
    }
  }

  const processed = (klassenToSync?.length ?? 0) + (klassenToCancel?.length ?? 0)
  console.log(`[klas-cron] processed=${processed}, synced=${results.synced}, cancelled=${results.cancelled}`)

  return NextResponse.json({
    processed,
    ...results,
  }, { headers: NO_STORE })
}
