export const MANUAL_TIME_ZONE = 'Europe/Amsterdam'
export const MANUAL_CAL_API_VERSION = '2026-02-25'
const CAL_SLOTS_API_VERSION = '2024-09-04'

export type ManualTreatmentKey = 'new_lash_set' | 'fill_lash_set'
export type ManualDepositStatus = 'paid' | 'not_recorded'

export const MANUAL_TREATMENTS: Record<ManualTreatmentKey, {
  key: ManualTreatmentKey
  name: string
  durationMinutes: number
  envName: 'CAL_MANUAL_NEW_LASH_EVENT_TYPE_ID' | 'CAL_MANUAL_FILL_LASH_EVENT_TYPE_ID'
}> = {
  new_lash_set: {
    key: 'new_lash_set',
    name: 'New Lash Set',
    durationMinutes: 180,
    envName: 'CAL_MANUAL_NEW_LASH_EVENT_TYPE_ID',
  },
  fill_lash_set: {
    key: 'fill_lash_set',
    name: 'Fill Lash Set',
    durationMinutes: 120,
    envName: 'CAL_MANUAL_FILL_LASH_EVENT_TYPE_ID',
  },
}

export function isManualTreatmentKey(value: unknown): value is ManualTreatmentKey {
  return value === 'new_lash_set' || value === 'fill_lash_set'
}

export function getManualEventTypeId(key: ManualTreatmentKey): number {
  const value = Number(process.env[MANUAL_TREATMENTS[key].envName])
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${MANUAL_TREATMENTS[key].envName} ontbreekt of is ongeldig.`)
  }
  return value
}

export function getManualTreatmentByEventTypeId(eventTypeId: number) {
  return (Object.keys(MANUAL_TREATMENTS) as ManualTreatmentKey[])
    .map(key => ({ ...MANUAL_TREATMENTS[key], eventTypeId: getManualEventTypeId(key) }))
    .find(treatment => treatment.eventTypeId === eventTypeId) || null
}

export function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString()
}

export function isWithin24Hours(iso: string): boolean {
  return new Date(iso).getTime() - Date.now() < 24 * 60 * 60 * 1000
}

async function calRequest(path: string, init?: RequestInit) {
  const apiKey = process.env.CAL_API_KEY
  if (!apiKey) throw new Error('CAL_API_KEY ontbreekt op de server.')

  const response = await fetch(`https://api.cal.com/v2${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'cal-api-version': MANUAL_CAL_API_VERSION,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const reason = payload?.error?.message || payload?.message || `HTTP ${response.status}`
    throw new Error(`Cal.com: ${reason}`)
  }
  return payload?.data
}

export async function createManualCalBooking(input: {
  eventTypeId: number
  start: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
}) {
  const data = await calRequest('/bookings', {
    method: 'POST',
    body: JSON.stringify({
      eventTypeId: input.eventTypeId,
      start: input.start,
      attendee: {
        name: input.customerName,
        email: input.customerEmail,
        timeZone: MANUAL_TIME_ZONE,
        language: 'nl',
        ...(input.customerPhone ? { phoneNumber: input.customerPhone } : {}),
      },
      metadata: { source: 'luxique-manual' },
    }),
  })

  if (!data?.uid) throw new Error('Cal.com gaf geen booking UID terug.')
  return {
    uid: String(data.uid),
    id: data.id == null ? null : Number(data.id),
    start: String(data.startTime || input.start),
    end: data.endTime ? String(data.endTime) : null,
  }
}

export async function cancelManualCalBooking(uid: string, reason: string): Promise<void> {
  await calRequest(`/bookings/${encodeURIComponent(uid)}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ cancellationReason: reason }),
  })
}

export async function getManualAvailability(input: {
  eventTypeId: number
  date: string
  bookingUidToIgnore?: string | null
}): Promise<Array<{ start: string; time: string }>> {
  const url = new URL('https://api.cal.com/v2/slots')
  url.searchParams.set('eventTypeId', String(input.eventTypeId))
  url.searchParams.set('start', input.date)
  const end = new Date(`${input.date}T00:00:00Z`)
  end.setUTCDate(end.getUTCDate() + 1)
  url.searchParams.set('end', end.toISOString().slice(0, 10))
  url.searchParams.set('timeZone', MANUAL_TIME_ZONE)
  if (input.bookingUidToIgnore) url.searchParams.set('bookingUidToReschedule', input.bookingUidToIgnore)

  const apiKey = process.env.CAL_API_KEY
  if (!apiKey) throw new Error('CAL_API_KEY ontbreekt op de server.')
  const response = await fetch(url, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${apiKey}`, 'cal-api-version': CAL_SLOTS_API_VERSION },
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.data) {
    throw new Error(payload?.error?.message || 'Cal.com beschikbaarheid kon niet worden geladen.')
  }
  const starts = Array.isArray(payload.data[input.date]) ? payload.data[input.date] : []
  return starts.map((start: string) => ({
    start,
    time: new Intl.DateTimeFormat('nl-NL', {
      timeZone: MANUAL_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(start)),
  }))
}
