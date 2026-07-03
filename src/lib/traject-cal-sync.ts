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
 * Idempotent (per dag): checkt cal.com OF er al een TRAJECT BLOK bestaat
 * voor die datum+eventTypeId voordat een nieuwe wordt aangemaakt.
 * Dubbele aanmaak wordt voorkomen zelfs bij retries na partial sync.
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
 * Haal alle bestaande TRAJECT BLOK bookings op voor een eventTypeId.
 * Retourneert een Set van datum strings (YYYY-MM-DD) die al een blok hebben.
 *
 * Dit maakt de sync per-dag idempotent: als een dag al een blok heeft
 * (van een eerdere succesvolle sync die niet in de DB werd geregistreerd,
 * of van een handmatige aanmaak), wordt geen nieuwe aangemaakt.
 */
async function fetchExistingTrajectBlokDagen(
  eventTypeId: number,
  apiKey: string,
): Promise<Set<string>> {
  const bezetteDagen = new Set<string>()
  let cursor: string | null = null
  let pages = 0
  const MAX_PAGES = 10 // veiligheidslimiet

  while (pages < MAX_PAGES) {
    const params = new URLSearchParams({
      eventTypeId: String(eventTypeId),
      status: 'upcoming',
      limit: '100',
    })
    if (cursor) params.set('cursor', cursor)

    let res: Response
    try {
      res = await calApi('GET', `/bookings?${params.toString()}`, apiKey)
    } catch {
      console.warn(`[traject-sync] Kon bestaande bookings niet ophalen (netwerkfout) — idempotentie-check overgeslagen`)
      return bezetteDagen
    }

    if (!res.ok) {
      console.warn(`[traject-sync] Kan bestaande bookings niet ophalen (HTTP ${res.status}) — idempotentie-check overgeslagen`)
      return bezetteDagen
    }

    const json = await res.json()
    const bookings: Array<Record<string, unknown>> = json.data?.bookings || json.bookings || json.data || []

    for (const b of bookings) {
      const metadata = b.metadata as Record<string, string> | undefined
      const responses = b.responses as Record<string, string> | undefined
      const name = responses?.name || ''

      // Herken TRAJECT BLOK bookings: metadata.type === 'traject_blok' OF naam begint met 'TRAJECT:'
      const isTrajectBlok = metadata?.type === 'traject_blok' || name.startsWith('TRAJECT:')
      if (!isTrajectBlok) continue

      //Voor dag-blokken (8u): startTime bevat de datum (cal.com v2 field)
      const start = String(b.startTime || b.start || '')
      const dag = start.slice(0, 10) // ISO datum gedeelte
      if (dag && /^\d{4}-\d{2}-\d{2}$/.test(dag)) {
        bezetteDagen.add(dag)
      }

      // Ook metadata.dag als backup
      if (metadata?.dag) {
        bezetteDagen.add(metadata.dag)
      }
    }

    // Paginatie
    const nextCursor = json.meta?.nextCursor ?? json.meta?.cursor?.next
    if (!nextCursor || nextCursor === cursor) break
    cursor = nextCursor
    pages++
  }

  console.log(`[traject-sync] ${bezetteDagen.size} bestaande TRAJECT BLOK dag(en) gevonden voor eventTypeId ${eventTypeId}: ${Array.from(bezetteDagen).join(', ')}`)
  return bezetteDagen
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

  // === IDEMPOTENTIE-CHECK (per dag) ===
  // Haal bestaande TRAJECT BLOK dagen op uit cal.com
  const bestaandeBlokDagen = await fetchExistingTrajectBlokDagen(eventTypeId, apiKey)

  const uids: string[] = []
  let daysSynced = 0
  let daysFailed = 0
  let daysSkipped = 0
  let lastError: string | undefined

  for (const dag of opts.blok_dagen) {
    // Skip als er al een TRAJECT BLOK bestaat voor deze dag
    if (bestaandeBlokDagen.has(dag)) {
      console.log(`[traject-sync] ⏭️  ${dag} al geblokkeerd in cal.com — skip (idempotent)`)
      daysSkipped++
      continue
    }

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

  // Bepaal finale status:
  // - Alle dagen zijn gesynced OF overgeslagen (al bestaand) → synced
  // - Enkele dagen gesynced/overgeslagen, andere gefaald → partial
  // - Niets gesynced en niets overgeslagen → failed
  const totalSuccess = daysSynced + daysSkipped

  let status: TrajectSyncResult['status']
  if (totalSuccess === opts.blok_dagen.length) {
    status = 'synced'
  } else if (totalSuccess > 0) {
    status = 'partial'
  } else {
    status = 'failed'
  }

  if (daysSkipped > 0) {
    console.log(`[traject-sync] ${daysSkipped} dag(en) overgeslagen (al geblokkeerd in cal.com)`)
  }

  return { status, daysSynced, daysFailed, uids, eventTypeId, error: lastError }
}
