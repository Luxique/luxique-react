import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  buildOverride,
  isPastTimeslot,
  isTreatmentKey,
  isValidLocalDate,
  PAST_TIMESLOT_ERROR,
  sameOverride,
  sortOverrides,
  TREATMENTS,
  type CalOverride,
  type CalSchedule,
  type TreatmentKey,
} from '@/lib/cal-admin-availability'
import { subtractWindow } from '@/lib/manual-availability-ledger'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const CAL_API_VERSION = '2024-06-11'
const CAL_SLOTS_API_VERSION = '2024-09-04'
const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
}

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS })
}

async function calRequest(path: string, init?: RequestInit): Promise<Response> {
  const apiKey = process.env.CAL_API_KEY
  if (!apiKey) throw new Error('CAL_API_KEY ontbreekt op de server.')

  return fetch(`https://api.cal.com/v2${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'cal-api-version': CAL_API_VERSION,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
}

async function readSchedule(treatmentKey: TreatmentKey): Promise<CalSchedule> {
  const treatment = TREATMENTS[treatmentKey]
  const response = await calRequest(`/schedules/${treatment.scheduleId}`)
  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.data) {
    const reason = payload?.error?.message || payload?.message || `HTTP ${response.status}`
    throw new Error(`Cal.com kon ${treatment.name} niet laden: ${reason}`)
  }

  return {
    ...payload.data,
    overrides: Array.isArray(payload.data.overrides) ? payload.data.overrides : [],
    availability: Array.isArray(payload.data.availability) ? payload.data.availability : [],
  }
}

async function readEffectiveSlots(treatmentKey: TreatmentKey, start: string, end: string) {
  const treatment = TREATMENTS[treatmentKey]
  const apiKey = process.env.CAL_API_KEY
  if (!apiKey) throw new Error('CAL_API_KEY ontbreekt op de server.')
  const url = new URL('https://api.cal.com/v2/slots')
  url.searchParams.set('eventTypeId', String(treatment.eventTypeId))
  url.searchParams.set('start', start)
  url.searchParams.set('end', end)
  url.searchParams.set('timeZone', 'Europe/Amsterdam')
  const response = await fetch(url, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${apiKey}`, 'cal-api-version': CAL_SLOTS_API_VERSION },
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.data) {
    const reason = payload?.error?.message || payload?.message || `HTTP ${response.status}`
    throw new Error(`Cal.com kon effectieve ${treatment.name}-slots niet laden: ${reason}`)
  }

  return Object.entries(payload.data).flatMap(([date, values]) =>
    (Array.isArray(values) ? values : []).flatMap(value => {
      const slotStart = typeof value === 'string'
        ? value
        : value && typeof value === 'object' && 'start' in value
          ? String(value.start)
          : ''
      if (!slotStart || !Number.isFinite(new Date(slotStart).getTime())) return []
      const slotEnd = new Date(new Date(slotStart).getTime() + treatment.durationMinutes * 60_000).toISOString()
      const formatTime = (iso: string) => new Intl.DateTimeFormat('nl-NL', {
        timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit', hour12: false,
      }).format(new Date(iso))
      return [{ date, start: slotStart, end: slotEnd, startTime: formatTime(slotStart), endTime: formatTime(slotEnd) }]
    }),
  )
}

async function writeOverrides(schedule: CalSchedule, overrides: CalOverride[]): Promise<CalSchedule> {
  const response = await calRequest(`/schedules/${schedule.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: schedule.name,
      timeZone: schedule.timeZone,
      availability: schedule.availability,
      isDefault: schedule.isDefault,
      overrides: sortOverrides(overrides),
    }),
  })
  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.data) {
    const reason = payload?.error?.message || payload?.message || `HTTP ${response.status}`
    throw new Error(`Cal.com heeft de wijziging geweigerd: ${reason}`)
  }

  return {
    ...payload.data,
    overrides: Array.isArray(payload.data.overrides) ? payload.data.overrides : [],
    availability: Array.isArray(payload.data.availability) ? payload.data.availability : [],
  }
}

async function authenticate(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return json({ error: auth.error || 'Geen toegang.' }, auth.status || 401)
  return null
}

async function findTrajectOnDate(date: string): Promise<{ cursus_naam: string } | null> {
  const { data, error } = await supabaseAdmin
    .from('traject_klassen')
    .select('traject_cursussen (naam)')
    .in('status', ['open', 'vol'])
    .contains('blok_dagen', [date])
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`Traject-dag controleren mislukt: ${error.message}`)
  if (!data) return null

  const cursus = Array.isArray(data.traject_cursussen)
    ? data.traject_cursussen[0]
    : data.traject_cursussen
  return { cursus_naam: cursus?.naam || 'Onbekend traject' }
}

export async function GET(req: NextRequest) {
  const denied = await authenticate(req)
  if (denied) return denied

  try {
    const start = req.nextUrl.searchParams.get('start') || new Date().toISOString().slice(0, 10)
    const defaultEnd = new Date(`${start}T00:00:00Z`)
    defaultEnd.setUTCDate(defaultEnd.getUTCDate() + 42)
    const end = req.nextUrl.searchParams.get('end') || defaultEnd.toISOString().slice(0, 10)
    if (!isValidLocalDate(start) || !isValidLocalDate(end) || end <= start) {
      return json({ error: 'Ongeldig agendabereik.' }, 400)
    }
    const entries = await Promise.all(
      (Object.keys(TREATMENTS) as TreatmentKey[]).map(async key => {
        const [schedule, slots] = await Promise.all([readSchedule(key), readEffectiveSlots(key, start, end)])
        return {
          ...TREATMENTS[key],
          timeZone: schedule.timeZone,
          availability: schedule.availability,
          overrides: sortOverrides(schedule.overrides),
          slots,
        }
      }),
    )
    return json({ treatments: entries })
  } catch (error) {
    console.error('[admin-cal-availability] GET failed:', error)
    return json({ error: error instanceof Error ? error.message : 'Beschikbaarheid laden mislukt.' }, 502)
  }
}

export async function POST(req: NextRequest) {
  const denied = await authenticate(req)
  if (denied) return denied

  try {
    const body = await req.json().catch(() => null)
    if (!isTreatmentKey(body?.treatmentKey) || !isValidLocalDate(body?.date)) {
      return json({ error: 'Kies een geldige behandeling en datum.' }, 400)
    }

    const treatmentKey: TreatmentKey = body.treatmentKey
    const treatment = TREATMENTS[treatmentKey]
    const built = buildOverride(body.startTime, treatment.durationMinutes, body.endTime)
    if ('error' in built) return json({ error: built.error }, 400)
    if (isPastTimeslot(body.date, built.startTime)) {
      return json({ error: PAST_TIMESLOT_ERROR }, 400)
    }

    const traject = await findTrajectOnDate(body.date)
    if (traject) {
      return json({
        error: `Op deze dag loopt een traject (${traject.cursus_naam}). Er kunnen geen behandelingen worden ingepland.`,
      }, 409)
    }

    const candidate = { ...built, date: body.date }
    const schedule = await readSchedule(treatmentKey)
    if (schedule.overrides.some(existing => sameOverride(existing, candidate))) {
      return json({ error: 'Dit tijdslot bestaat al voor deze behandeling.' }, 409)
    }

    const updated = await writeOverrides(schedule, [...schedule.overrides, candidate])
    if (!updated.overrides.some(existing => sameOverride(existing, candidate))) {
      throw new Error('Cal.com bevestigde de wijziging niet. Probeer het opnieuw.')
    }

    return json({ treatmentKey, override: candidate, overrides: updated.overrides }, 201)
  } catch (error) {
    console.error('[admin-cal-availability] POST failed:', error)
    return json({ error: error instanceof Error ? error.message : 'Tijdslot opslaan mislukt.' }, 502)
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await authenticate(req)
  if (denied) return denied

  try {
    const body = await req.json().catch(() => null)
    if (!isTreatmentKey(body?.treatmentKey) || !isValidLocalDate(body?.date)) {
      return json({ error: 'Ongeldige behandeling of datum.' }, 400)
    }

    const treatmentKey: TreatmentKey = body.treatmentKey
    const treatment = TREATMENTS[treatmentKey]
    const built = buildOverride(body.startTime, treatment.durationMinutes, body.endTime)
    if ('error' in built) return json({ error: built.error }, 400)
    const target = { ...built, date: body.date }

    const schedule = await readSchedule(treatmentKey)
    let removed = false
    const remaining = schedule.overrides.flatMap(existing => {
      const result = subtractWindow(existing, target, treatment.durationMinutes)
      if (result.removed) removed = true
      return result.remaining
    })
    if (!removed) {
      return json({ error: 'Dit tijdslot bestaat niet meer in Cal.com.' }, 404)
    }

    const updated = await writeOverrides(schedule, remaining)
    if (updated.overrides.some(existing => subtractWindow(existing, target, treatment.durationMinutes).removed)) {
      throw new Error('Cal.com heeft het tijdslot niet verwijderd. Probeer het opnieuw.')
    }

    return json({ treatmentKey, removed: target, overrides: updated.overrides })
  } catch (error) {
    console.error('[admin-cal-availability] DELETE failed:', error)
    return json({ error: error instanceof Error ? error.message : 'Tijdslot verwijderen mislukt.' }, 502)
  }
}
