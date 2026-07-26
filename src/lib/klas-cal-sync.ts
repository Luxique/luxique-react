/**
 * FASE 4 — Traject KLASSEN → cal.com sync
 *
 * Vernieuwde sync (voorheen op traject_boekingen, nu op traject_klassen).
 * Per klas met cal_sync_status='pending': maak TRAJECT BLOK DAG (600 min)
 * blokkades voor elke dag in blok_dagen. Sla UIDs op in cal_booking_uids.
 *
 * Bij annulering (status='geannuleerd'): ruim cal.com blokkades op.
 */

import { SupabaseClient } from '@supabase/supabase-js'

const TRAJECT_BLOK_DAG_ID = 6195439  // 600 min (na FASE 3 update)
const CAL_API_VERSION = '2024-09-10'
const CAL_TIMEZONE = 'Europe/Amsterdam'

export interface KlasSyncInput {
  klasId: string
  cursusNaam: string
  blokDagen: string[]
  starttijd: string  // HH:MM (klas start — blok begint op 09:00 schedule)
  weergaveTitel?: string | null
}

export interface KlasSyncResult {
  status: 'synced' | 'partial' | 'failed'
  daysSynced: number
  daysFailed: number
  daysSkipped: number
  uids: string[]  // alle UIDs (inclusief reeds bestaande)
  error?: string
}

async function calApi(method: string, path: string, apiKey: string, body?: unknown) {
  return fetch(`https://api.cal.com/v2${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'cal-api-version': CAL_API_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(8000),
  })
}

/**
 * Haal bestaande TRAJECT BLOK DAG bookings op uit cal.com (idempotentie).
 * Retourneert Map: datum → booking UID.
 */
async function fetchExistingBlokDagen(
  eventTypeId: number,
  apiKey: string,
): Promise<Map<string, string>> {
  const bezet = new Map<string, string>()
  let cursor: string | null = null
  let pages = 0
  const MAX_PAGES = 10

  while (pages < MAX_PAGES) {
    const params = new URLSearchParams({
      eventTypeId: String(eventTypeId),
      status: 'upcoming',
      limit: '100',
    })
    if (cursor) params.set('cursor', cursor)

    let res: Response
    try {
      res = await calApi('GET', `/bookings?${params}`, apiKey)
    } catch {
      console.warn('[klas-sync] bestaande bookings ophalen mislukt — idempotentie overgeslagen')
      return bezet
    }

    if (!res.ok) {
      console.warn(`[klas-sync] kan bestaande bookings niet ophalen (HTTP ${res.status})`)
      return bezet
    }

    const json = await res.json()
    const bookings: Array<Record<string, unknown>> = json.data?.bookings || json.bookings || json.data || []

    for (const b of bookings) {
      const metadata = b.metadata as Record<string, string> | undefined
      const responses = b.responses as Record<string, string> | undefined
      const name = responses?.name || ''

      const isTrajectBlok = metadata?.type === 'traject_blok' || name.startsWith('TRAJECT:')
      if (!isTrajectBlok) continue

      const start = String(b.startTime || b.start || '')
      const dag = start.slice(0, 10)
      const uid = String(b.uid || b.id || '')
      if (dag && /^\d{4}-\d{2}-\d{2}$/.test(dag) && uid) {
        if (!bezet.has(dag)) bezet.set(dag, uid)
      }
      if (metadata?.dag && uid) {
        if (!bezet.has(metadata.dag)) bezet.set(metadata.dag, uid)
      }
    }

    const nextCursor = json.meta?.nextCursor ?? json.meta?.cursor?.next
    if (!nextCursor || nextCursor === cursor) break
    cursor = nextCursor
    pages++
  }

  console.log(`[klas-sync] ${bezet.size} bestaande TRAJECT BLOK dag(en) in cal.com`)
  return bezet
}

/**
 * Maak TRAJECT BLOK DAG blokkades voor een klas.
 * Start altijd op 09:00 schedule-tijd (niet de klas starttijd) zodat
 * de blokkade de volledige werkdag dekt (09:00-19:00 = 600 min).
 */
export async function syncKlasNaarCalCom(
  opts: KlasSyncInput,
  supabase: SupabaseClient,
): Promise<KlasSyncResult> {
  console.log('[klas-sync] START', {
    klasId: opts.klasId,
    cursus: opts.cursusNaam,
    dagen: opts.blokDagen.length,
  })

  // Idempotentie: check cal_sync_status
  const { data: existing } = await supabase
    .from('traject_klassen')
    .select('cal_sync_status, cal_booking_uids')
    .eq('id', opts.klasId)
    .single()

  if (existing?.cal_sync_status === 'synced') {
    console.log(`[klas-sync] ${opts.klasId} al synced — skip`)
    return {
      status: 'synced',
      daysSynced: 0,
      daysFailed: 0,
      daysSkipped: opts.blokDagen.length,
      uids: existing.cal_booking_uids ?? [],
    }
  }

  const apiKey = process.env.CAL_API_KEY
  if (!apiKey) {
    return {
      status: 'failed',
      daysSynced: 0,
      daysFailed: opts.blokDagen.length,
      daysSkipped: 0,
      uids: [],
      error: 'CAL_API_KEY ontbreekt',
    }
  }

  // Haal bestaande blok-dagen op voor idempotentie
  const bestaande = await fetchExistingBlokDagen(TRAJECT_BLOK_DAG_ID, apiKey)

  const titel = opts.weergaveTitel || opts.cursusNaam
  const nieuweUids: string[] = [...(existing?.cal_booking_uids ?? [])]
  let daysSynced = 0
  let daysFailed = 0
  let daysSkipped = 0
  let lastError: string | undefined

  for (const dag of opts.blokDagen) {
    // Skip als dag al geblokkeerd is
    if (bestaande.has(dag)) {
      const existingUid = bestaande.get(dag)!
      if (!nieuweUids.includes(existingUid)) nieuweUids.push(existingUid)
      console.log(`[klas-sync] ⏭️  ${dag} al geblokkeerd (${existingUid}) — skip`)
      daysSkipped++
      continue
    }

    // Blok start altijd 09:00 Amsterdam (schedule start) — dekt 09:00-19:00 (600 min)
    const startIso = `${dag}T09:00:00+02:00`

    const payload = {
      eventTypeId: TRAJECT_BLOK_DAG_ID,
      start: startIso,
      timeZone: CAL_TIMEZONE,
      language: 'nl',
      metadata: {
        type: 'traject_blok',
        klas_id: opts.klasId,
        cursus_naam: opts.cursusNaam,
        dag: dag,
        blok_type: 'klas_dag',
      },
      responses: {
        name: `TRAJECT: ${titel}`,
        email: 'info@luxique.nl',
      },
    }

    try {
      const res = await calApi('POST', '/bookings', apiKey, payload)

      if (!res.ok) {
        const errBody = await res.text().catch(() => '')
        lastError = `Cal.com HTTP ${res.status}: ${errBody.slice(0, 300)}`
        console.error(`[klas-sync] ${lastError} voor ${dag}`)
        daysFailed++
        continue
      }

      const data = await res.json()
      const uid = data?.data?.uid
      if (uid && !nieuweUids.includes(uid)) nieuweUids.push(uid)
      daysSynced++
      console.log(`[klas-sync] ✅ ${dag} geblokkeerd (uid: ${uid})`)
    } catch (err) {
      lastError = `Exception: ${String(err).slice(0, 300)}`
      console.error(`[klas-sync] ${lastError} voor ${dag}`)
      daysFailed++
    }
  }

  const totalSuccess = daysSynced + daysSkipped
  let status: KlasSyncResult['status']
  if (totalSuccess === opts.blokDagen.length) {
    status = 'synced'
  } else if (totalSuccess > 0) {
    status = 'partial'
  } else {
    status = 'failed'
  }

  // Sla UIDs op in DB
  await supabase
    .from('traject_klassen')
    .update({ cal_booking_uids: nieuweUids })
    .eq('id', opts.klasId)

  return { status, daysSynced, daysFailed, daysSkipped, uids: nieuweUids, error: lastError }
}

/**
 * Ruim cal.com blokkades op voor een geannuleerde/verwijderde klas.
 */
export async function cancelKlasBlokkades(
  klasId: string,
  supabase: SupabaseClient,
): Promise<{ cancelled: string[]; failed: string[] }> {
  const apiKey = process.env.CAL_API_KEY
  if (!apiKey) {
    console.error('[klas-cancel] CAL_API_KEY ontbreekt')
    return { cancelled: [], failed: [] }
  }

  const { data: klas } = await supabase
    .from('traject_klassen')
    .select('cal_booking_uids, weergave_titel, cursus_id')
    .eq('id', klasId)
    .single()

  const uids: string[] = klas?.cal_booking_uids ?? []
  if (uids.length === 0) {
    console.log(`[klas-cancel] ${klasId} geen cal_booking_uids — niets op te ruimen`)
    return { cancelled: [], failed: [] }
  }

  const cancelled: string[] = []
  const failed: string[] = []

  for (const uid of uids) {
    try {
      const res = await calApi('POST', `/bookings/${uid}/cancel`, apiKey, {
        cancellationReason: 'Klas verwijderd/geannuleerd door admin',
        allRemainingBookings: true,
      })

      if (res.ok) {
        cancelled.push(uid)
        console.log(`[klas-cancel] ✅ ${uid} geannuleerd`)
      } else {
        failed.push(uid)
        const body = await res.text().catch(() => '')
        console.error(`[klas-cancel] ❌ ${uid} HTTP ${res.status}: ${body.slice(0, 200)}`)
      }
    } catch (err) {
      failed.push(uid)
      console.error(`[klas-cancel] ❌ ${uid} exception:`, err)
    }
  }

  // Reset cal_booking_uids en cal_sync_status in DB
  await supabase
    .from('traject_klassen')
    .update({
      cal_booking_uids: '{}',
      cal_sync_status: 'failed', // markeer als failed zodat cron 'm niet opnieuw probeert te syncen
    })
    .eq('id', klasId)

  return { cancelled, failed }
}
