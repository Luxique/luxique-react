import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import {
  buildOverride,
  isTreatmentKey,
  isValidLocalDate,
  sameOverride,
  sortOverrides,
  TREATMENTS,
  type CalOverride,
  type CalSchedule,
  type TreatmentKey,
} from '@/lib/cal-admin-availability'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const CAL_API_VERSION = '2024-06-11'
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

export async function GET(req: NextRequest) {
  const denied = await authenticate(req)
  if (denied) return denied

  try {
    const entries = await Promise.all(
      (Object.keys(TREATMENTS) as TreatmentKey[]).map(async key => {
        const schedule = await readSchedule(key)
        return {
          ...TREATMENTS[key],
          timeZone: schedule.timeZone,
          availability: schedule.availability,
          overrides: sortOverrides(schedule.overrides),
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
    const built = buildOverride(body.startTime, treatment.durationMinutes)
    if ('error' in built) return json({ error: built.error }, 400)

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
    const built = buildOverride(body.startTime, treatment.durationMinutes)
    if ('error' in built) return json({ error: built.error }, 400)
    const target = { ...built, date: body.date }

    const schedule = await readSchedule(treatmentKey)
    const remaining = schedule.overrides.filter(existing => !sameOverride(existing, target))
    if (remaining.length === schedule.overrides.length) {
      return json({ error: 'Dit tijdslot bestaat niet meer in Cal.com.' }, 404)
    }

    const updated = await writeOverrides(schedule, remaining)
    if (updated.overrides.some(existing => sameOverride(existing, target))) {
      throw new Error('Cal.com heeft het tijdslot niet verwijderd. Probeer het opnieuw.')
    }

    return json({ treatmentKey, removed: target, overrides: updated.overrides })
  } catch (error) {
    console.error('[admin-cal-availability] DELETE failed:', error)
    return json({ error: error instanceof Error ? error.message : 'Tijdslot verwijderen mislukt.' }, 502)
  }
}
