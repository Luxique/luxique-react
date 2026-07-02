/**
 * STAP 4 Richting 1 — Traject blokkades aanmaken in cal.com
 * via het "TRAJECT BLOK" event type (eventTypeId = 6194679).
 *
 * Per dag in blok_dagen wordt een aparte cal.com-boeking aangemaakt.
 * Cal.com sync deze naar Chiva's Google Calendar → dag is bezet voor behandelingen.
 *
 * Idempotent: checkt cal_sync_status op de boeking vooraf.
 * Fouten zijn non-fatal — de boeking staat al in de DB.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const TRAJECT_BLOK_EVENT_TYPE_ID = 6194679
const CAL_API_VERSION = '2024-09-10'

export interface TrajectSyncInput {
  boekingId: string
  cursus_naam: string
  blok_dagen: string[]
  starttijd: string
  klant_naam: string
  klant_email: string
}

export interface TrajectSyncResult {
  status: 'synced' | 'partial' | 'failed' | 'skipped'
  daysSynced: number
  daysFailed: number
  uids: string[]
  error?: string
}

/**
 * Hooffunctie — sync alle trajectdagen naar cal.com als TRAJECT BLOK boekingen.
 */
export async function syncTrajectBlokNaarCalCom(
  opts: TrajectSyncInput,
  supabase: SupabaseClient,
): Promise<TrajectSyncResult> {
  console.log('[traject-sync] FUNCIČ START', { boekingId: opts.boekingId, dagen: opts.blok_dagen.length })

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

  // Haalt instellingen op voor eindtijd (werktijd_middag_eind)
  const { data: instellingen } = await supabase
    .from('traject_instellingen')
    .select('werktijd_middag_eind')
    .limit(1)
    .single()

  // Default 19:00 als fallback (komt overeen met LUXIQUE werkdag eind)
  const eindtijd = instellingen?.werktijd_middag_eind || '19:00'

  const uids: string[] = []
  let daysSynced = 0
  let daysFailed = 0

  for (const dag of opts.blok_dagen) {
    const startIso = `${dag}T${opts.starttijd}:00+02:00`
    const endIso = `${dag}T${eindtijd}:00+02:00`

    const payload = {
      eventTypeId: TRAJECT_BLOK_EVENT_TYPE_ID,
      start: startIso,
      end: endIso,
      timeZone: 'Europe/Amsterdam',
      language: 'nl',
      metadata: {
        type: 'traject_blok',
        boeking_id: opts.boekingId,
        cursus_naam: opts.cursus_naam,
        dag: dag,
      },
      responses: {
        // Chiva zelf als attendee — dit is haar blok-agenda.
        // Geen klant-email → geen ongewenste bevestigingsmail naar klant.
        name: `TRAJECT: ${opts.cursus_naam}`,
        email: 'info@luxique.nl',
      },
    }

    try {
      const res = await fetch('https://api.cal.com/v2/bookings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'cal-api-version': CAL_API_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      })

      if (!res.ok) {
        const errBody = await res.text().catch(() => '')
        console.error(`[traject-sync] Cal.com HTTP ${res.status} voor ${dag}:`, errBody.slice(0, 200))
        daysFailed++
        continue
      }

      const data = await res.json()
      const uid = data?.data?.uid
      if (uid) uids.push(uid)
      daysSynced++
      console.log(`[traject-sync] ✅ ${dag} geblokkeerd (uid: ${uid})`)
    } catch (err) {
      console.error(`[traject-sync] Fout voor ${dag}:`, err)
      daysFailed++
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

  return { status, daysSynced, daysFailed, uids }
}
