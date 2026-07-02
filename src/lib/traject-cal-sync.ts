/**
 * STAP 4 Richting 1 — Traject blokkades aanmaken in cal.com
 *
 * TWEE vaste event types (Optie B — geen dynamisch PATCHen):
 * - Lange trajecten (duur_werkdagen >= 1) → TRAJECT BLOK DAG (8u)
 * - Workshop (duur_werkdagen = 0) → TRAJECT BLOK (1u)
 *
 * Per dag in blok_dagen wordt een aparte cal.com-boeking aangemaakt.
 * Cal.com sync deze naar Chiva's Google Calendar → dag is bezet voor behandelingen.
 *
 * Idempotent: checkt cal_sync_status op de boeking vooraf.
 * Fouten zijn non-fatal — de boeking staat al in de DB.
 */

import { SupabaseClient } from '@supabase/supabase-js'

// Event type IDs in cal.com
const TRAJECT_BLOK_WORKSHOP_ID = 6194679  // 60 min — voor workshops (1u)
const TRAJECT_BLOK_DAG_ID = 6195439       // 480 min — voor lange trajecten (8u)
const CAL_API_VERSION = '2024-09-10'

export interface TrajectSyncInput {
  boekingId: string
  cursus_naam: string
  blok_dagen: string[]
  starttijd: string
  klant_naam: string
  klant_email: string
  duur_werkdagen: number  // 0 = workshop, >=1 = lang traject
}

export interface TrajectSyncResult {
  status: 'synced' | 'partial' | 'failed' | 'skipped'
  daysSynced: number
  daysFailed: number
  uids: string[]
  eventTypeId?: number
  error?: string
}

async function calApi(
  method: string,
  path: string,
  apiKey: string,
  body?: unknown,
) {
  const res = await fetch(`https://api.cal.com/v2${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'cal-api-version': CAL_API_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(8000),
  })
  return res
}

/**
 * Hooffunctie — sync alle trajectdagen naar cal.com als TRAJECT BLOK boekingen.
 */
export async function syncTrajectBlokNaarCalCom(
  opts: TrajectSyncInput,
  supabase: SupabaseClient,
): Promise<TrajectSyncResult> {
  console.log('[traject-sync] FUNCTIE START', {
    boekingId: opts.boekingId,
    dagen: opts.blok_dagen.length,
    duur_werkdagen: opts.duur_werkdagen,
  })

  // IDEMPOTENTIE: check cal_sync_status eerst
  const { data: existing } = await supabase
    .from('traject_boekingen')
    .select('cal_sync_status')
    .eq('id', opts.boekingId)
    .single()

  if (existing?.cal_sync_status === 'synced') {
    console.log(`[traject-sync] Al synced, skip (boeking ${opts.boekingId})`)
    return { status: 'synced', daysSynced: 0, daysFailed: 0, uids: [] }
  }

  const apiKey = process.env.CAL_API_KEY
  if (!apiKey) {
    console.error('[traject-sync] CAL_API_KEY ontbreekt')
    return {
      status: 'failed',
      daysSynced: 0,
      daysFailed: opts.blok_dagen.length,
      uids: [],
      error: 'CAL_API_KEY ontbreekt',
    }
  }

  // KIES EVENT TYPE op basis van cursus-type
  const isLangeTraject = opts.duur_werkdagen >= 1
  const eventTypeId = isLangeTraject ? TRAJECT_BLOK_DAG_ID : TRAJECT_BLOK_WORKSHOP_ID
  const lengthLabel = isLangeTraject ? '8u (DAG)' : '1u (WORKSHOP)'

  console.log(`[traject-sync] Event type: ${eventTypeId} (${lengthLabel}) voor boeking ${opts.boekingId}`)

  const uids: string[] = []
  let daysSynced = 0
  let daysFailed = 0
  let lastError: string | undefined

  for (const dag of opts.blok_dagen) {
    const startIso = `${dag}T${opts.starttijd}:00+02:00`

    // GEEN end-field — cal.com gebruikt de event type length (vast)
    const payload = {
      eventTypeId,
      start: startIso,
      timeZone: 'Europe/Amsterdam',
      language: 'nl',
      metadata: {
        type: 'traject_blok',
        boeking_id: opts.boekingId,
        cursus_naam: opts.cursus_naam,
        dag: dag,
        blok_type: isLangeTraject ? 'dag' : 'workshop',
      },
      responses: {
        name: `TRAJECT: ${opts.cursus_naam}`,
        email: 'info@luxique.nl',
      },
    }

    try {
      const res = await calApi('POST', '/bookings', apiKey, payload)

      if (!res.ok) {
        const errBody = await res.text().catch(() => '')
        const errMsg = `Cal.com HTTP ${res.status}: ${errBody.slice(0, 300)}`
        console.error(`[traject-sync] ${errMsg} voor ${dag}`)
        daysFailed++
        if (!lastError) lastError = errMsg
        continue
      }

      const data = await res.json()
      const uid = data?.data?.uid
      if (uid) uids.push(uid)
      daysSynced++
      console.log(`[traject-sync] ✅ ${dag} geblokkeerd (uid: ${uid}, ${lengthLabel})`)
    } catch (err) {
      const errMsg = `Exception: ${String(err).slice(0, 300)}`
      console.error(`[traject-sync] ${errMsg} voor ${dag}`)
      daysFailed++
      if (!lastError) lastError = errMsg
    }
  }

  let status: TrajectSyncResult['status']
  if (daysSynced === opts.blok_dagen.length) {
    status = 'synced'
  } else if (daysSynced > 0) {
    status = 'partial'
  } else {
    status = 'failed'
  }

  return { status, daysSynced, daysFailed, uids, eventTypeId, error: lastError }
}
