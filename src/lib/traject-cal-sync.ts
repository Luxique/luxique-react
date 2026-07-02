/**
 * STAP 4 Richting 1 — Traject blokkades aanmaken in cal.com
 * via het "TRAJECT BLOK" event type (eventTypeId = 6194679).
 *
 * Per dag in blok_dagen wordt een aparte cal.com-boeking aangemaakt.
 * Cal.com sync deze naar Chiva's Google Calendar → dag is bezet voor behandelingen.
 *
 * DUUR: cal.com v2 staat geen variabele duur toe op een vast event type
 * ("Invalid event length" als start+end != event type length). Oplossing:
 * vóór elke boeking PATCH het event type naar de juiste length, dan POST.
 *
 * Idempotent: checkt cal_sync_status op de boeking vooraf.
 * Fouten zijn non-fatal — de boeking staat al in de DB.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const TRAJECT_BLOK_EVENT_TYPE_ID = 6194679
const CAL_API_VERSION = '2024-09-10'
const DEFAULT_EVENT_LENGTH = 60 // cal.com default, wordt restored na elke boeking

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

/** Zet het event type length tijdelijk naar de gewenste waarde. */
async function patchEventTypeLength(
  apiKey: string,
  lengthMinutes: number,
): Promise<boolean> {
  try {
    const res = await calApi('PATCH', `/event-types/${TRAJECT_BLOK_EVENT_TYPE_ID}`, apiKey, {
      length: lengthMinutes,
    })
    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      console.error(`[traject-sync] PATCH event type length ${lengthMinutes}m faalde: HTTP ${res.status} ${errBody.slice(0, 200)}`)
      return false
    }
    return true
  } catch (err) {
    console.error(`[traject-sync] PATCH event type length crash:`, err)
    return false
  }
}

/** Bereken blok-duur in minuten op basis van werktijden. */
function berekenBlokDuurMinuten(
  starttijd: string,
  instellingen: { werktijd_ochtend_start?: string; werktijd_middag_eind?: string } | null,
): number {
  const ochtendStart = instellingen?.werktijd_ochtend_start || '09:00'
  const middagEind = instellingen?.werktijd_middag_eind || '19:00'

  const [sh, sm] = starttijd.split(':').map(Number)
  const [eh, em] = middagEind.split(':').map(Number)
  const startMin = sh * 60 + sm
  const eindMin = eh * 60 + em
  const duur = eindMin - startMin
  return duur > 0 ? duur : 600 // fallback 10 uur
}

/**
 * Hooffunctie — sync alle trajectdagen naar cal.com als TRAJECT BLOK boekingen.
 */
export async function syncTrajectBlokNaarCalCom(
  opts: TrajectSyncInput,
  supabase: SupabaseClient,
): Promise<TrajectSyncResult> {
  console.log('[traject-sync] FUNCTIE START', { boekingId: opts.boekingId, dagen: opts.blok_dagen.length })

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

  // Haalt instellingen op voor start-/eindtijd
  const { data: instellingen } = await supabase
    .from('traject_instellingen')
    .select('werktijd_ochtend_start, werktijd_middag_eind')
    .limit(1)
    .single()

  // Bereken blok-duur in minuten
  const blokDuurMinuten = berekenBlokDuurMinuten(opts.starttijd, instellingen)
  console.log(`[traject-sync] Blok-duur: ${blokDuurMinuten} minuten (${opts.starttijd} → ${instellingen?.werktijd_middag_eind || '19:00'})`)

  // PATCH event type length naar gewenste duur vóór alle boekingen
  const patchOk = await patchEventTypeLength(apiKey, blokDuurMinuten)
  if (!patchOk) {
    return {
      status: 'failed',
      daysSynced: 0,
      daysFailed: opts.blok_dagen.length,
      uids: [],
      error: `Kon event type length niet op ${blokDuurMinuten}m zetten`,
    }
  }

  const uids: string[] = []
  let daysSynced = 0
  let daysFailed = 0
  let lastError: string | undefined

  for (const dag of opts.blok_dagen) {
    const startIso = `${dag}T${opts.starttijd}:00+02:00`

    const payload = {
      eventTypeId: TRAJECT_BLOK_EVENT_TYPE_ID,
      start: startIso,
      timeZone: 'Europe/Amsterdam',
      language: 'nl',
      metadata: {
        type: 'traject_blok',
        boeking_id: opts.boekingId,
        cursus_naam: opts.cursus_naam,
        dag: dag,
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
      console.log(`[traject-sync] ✅ ${dag} geblokkeerd (uid: ${uid}, ${blokDuurMinuten}m)`)
    } catch (err) {
      const errMsg = `Exception: ${String(err).slice(0, 300)}`
      console.error(`[traject-sync] ${errMsg} voor ${dag}`)
      daysFailed++
      if (!lastError) lastError = errMsg
    }
  }

  // Restore event type length naar default
  await patchEventTypeLength(apiKey, DEFAULT_EVENT_LENGTH)

  let status: TrajectSyncResult['status']
  if (daysSynced === opts.blok_dagen.length) {
    status = 'synced'
  } else if (daysSynced > 0) {
    status = 'partial'
  } else {
    status = 'failed'
  }

  return { status, daysSynced, daysFailed, uids, error: lastError }
}
