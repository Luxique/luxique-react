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

export function normalizePhoneNumber(phone: string | null | undefined): string | null {
  const trimmed = phone?.trim()
  if (!trimmed) return null

  const digits = trimmed.replace(/\D/g, '')
  const normalized = trimmed.startsWith('+')
    ? digits.startsWith('310')
      ? `+31${digits.slice(3)}`
      : `+${digits}`
    : digits.startsWith('00')
      ? `+${digits.slice(2)}`
      : digits.startsWith('0')
        ? `+31${digits.slice(1)}`
        : digits.startsWith('31')
          ? `+${digits}`
          : null

  return normalized && /^\+[1-9]\d{7,14}$/.test(normalized) ? normalized : null
}

export function intervalsOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return new Date(startA).getTime() < new Date(endB).getTime()
    && new Date(endA).getTime() > new Date(startB).getTime()
}

type PublicScheduleSnapshot = {
  id: number
  name: string
  timeZone: string
  isDefault: boolean
  availability: Array<{ days: string[]; startTime: string; endTime: string }>
  overrides: Array<{ date: string; startTime: string; endTime: string }>
}

export type ConsumedPublicAvailability = {
  snapshots: PublicScheduleSnapshot[]
  removedOverlappingWindows: number
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

async function getPublicOverlappingSlots(start: string, end: string) {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: MANUAL_TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(start))
  const publicTreatments = [
    { eventTypeId: 5492038, durationMinutes: 180 },
    { eventTypeId: 5492037, durationMinutes: 120 },
  ]

  const results = await Promise.all(publicTreatments.map(async treatment => {
    const url = new URL('https://api.cal.com/v2/slots')
    url.searchParams.set('eventTypeId', String(treatment.eventTypeId))
    url.searchParams.set('start', date)
    const nextDate = new Date(`${date}T00:00:00Z`)
    nextDate.setUTCDate(nextDate.getUTCDate() + 1)
    url.searchParams.set('end', nextDate.toISOString().slice(0, 10))
    url.searchParams.set('timeZone', MANUAL_TIME_ZONE)

    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'cal-api-version': CAL_SLOTS_API_VERSION },
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload?.data) {
      throw new Error(payload?.error?.message || `Publieke Cal.com-beschikbaarheid controleren mislukt (HTTP ${response.status}).`)
    }
    const starts: string[] = Array.isArray(payload.data[date]) ? payload.data[date] : []
    return starts.filter(slotStart => intervalsOverlap(
      start,
      end,
      slotStart,
      addMinutes(slotStart, treatment.durationMinutes),
    ))
  }))

  return results.flat()
}

function timeInAmsterdam(iso: string): string {
  return new Intl.DateTimeFormat('nl-NL', {
    timeZone: MANUAL_TIME_ZONE,
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(iso))
}

async function scheduleRequest(path: string, init?: RequestInit) {
  const apiKey = process.env.CAL_API_KEY
  if (!apiKey) throw new Error('CAL_API_KEY ontbreekt op de server.')
  const response = await fetch(`https://api.cal.com/v2${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'cal-api-version': '2024-06-11',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    },
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.data) {
    throw new Error(payload?.error?.message || payload?.message || `Cal.com schedule HTTP ${response.status}`)
  }
  return payload.data
}

async function writeSchedule(snapshot: PublicScheduleSnapshot) {
  await scheduleRequest(`/schedules/${snapshot.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: snapshot.name,
      timeZone: snapshot.timeZone,
      availability: snapshot.availability,
      isDefault: snapshot.isDefault,
      overrides: snapshot.overrides,
    }),
  })
}

export async function restoreConsumedPublicAvailability(consumed: ConsumedPublicAvailability): Promise<void> {
  for (const snapshot of [...consumed.snapshots].reverse()) await writeSchedule(snapshot)
}

export async function restoreManualBookingPublicAvailability(start: string, end: string): Promise<void> {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: MANUAL_TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(start))
  const restored = { date, startTime: timeInAmsterdam(start), endTime: timeInAmsterdam(end) }

  for (const scheduleId of [2292165, 2292166]) {
    const data = await scheduleRequest(`/schedules/${scheduleId}`)
    const snapshot: PublicScheduleSnapshot = {
      id: data.id,
      name: data.name,
      timeZone: data.timeZone,
      isDefault: data.isDefault,
      availability: Array.isArray(data.availability) ? data.availability : [],
      overrides: Array.isArray(data.overrides) ? data.overrides : [],
    }
    const sameDate = snapshot.overrides.filter(override => override.date === restored.date)
    const otherDates = snapshot.overrides.filter(override => override.date !== restored.date)
    const windows = [...sameDate, restored]
      .map(override => ({ ...override }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
    const merged: typeof windows = []
    for (const window of windows) {
      const previous = merged[merged.length - 1]
      if (!previous || window.startTime > previous.endTime) merged.push(window)
      else if (window.endTime > previous.endTime) previous.endTime = window.endTime
    }
    await writeSchedule({ ...snapshot, overrides: [...otherDates, ...merged] })
  }


  // Cal schedule writes can propagate asynchronously. Do not finalize the DB
  // cancellation until the public slots endpoint confirms this window is back.
  for (const delayMs of [0, 250, 750, 1500]) {
    if (delayMs) await new Promise(resolve => setTimeout(resolve, delayMs))
    const requestedStart = new Date(start).getTime()
    if ((await getPublicOverlappingSlots(start, end)).some(slot => new Date(slot).getTime() === requestedStart)) return
  }
  throw new Error('Het herstelde tijdslot is nog niet zichtbaar in de publieke Cal.com-widget.')
}

export async function consumePublicAvailability(start: string, end: string): Promise<ConsumedPublicAvailability> {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: MANUAL_TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(start))
  const startTime = timeInAmsterdam(start)
  const endTime = timeInAmsterdam(end)
  const publicSchedules = [
    { scheduleId: 2292165, durationMinutes: 180 },
    { scheduleId: 2292166, durationMinutes: 120 },
  ]
  const consumed: ConsumedPublicAvailability = { snapshots: [], removedOverlappingWindows: 0 }

  try {
    for (const publicSchedule of publicSchedules) {
      const data = await scheduleRequest(`/schedules/${publicSchedule.scheduleId}`)
      const snapshot: PublicScheduleSnapshot = {
        id: data.id,
        name: data.name,
        timeZone: data.timeZone,
        isDefault: data.isDefault,
        availability: Array.isArray(data.availability) ? data.availability : [],
        overrides: Array.isArray(data.overrides) ? data.overrides : [],
      }
      const nextOverrides: PublicScheduleSnapshot['overrides'] = []
      let changed = false

      for (const override of snapshot.overrides) {
        if (override.date !== date || !intervalsOverlap(
          `${date}T${startTime}:00+02:00`, `${date}T${endTime}:00+02:00`,
          `${date}T${override.startTime}:00+02:00`, `${date}T${override.endTime}:00+02:00`,
        )) {
          nextOverrides.push(override)
          continue
        }

        changed = true
        consumed.removedOverlappingWindows++
        const overrideStart = Number(override.startTime.slice(0, 2)) * 60 + Number(override.startTime.slice(3, 5))
        const overrideEnd = Number(override.endTime.slice(0, 2)) * 60 + Number(override.endTime.slice(3, 5))
        const bookedStart = Number(startTime.slice(0, 2)) * 60 + Number(startTime.slice(3, 5))
        const bookedEnd = Number(endTime.slice(0, 2)) * 60 + Number(endTime.slice(3, 5))
        if (bookedStart - overrideStart >= publicSchedule.durationMinutes) {
          nextOverrides.push({ ...override, endTime: startTime })
        }
        if (overrideEnd - bookedEnd >= publicSchedule.durationMinutes) {
          nextOverrides.push({ ...override, startTime: endTime })
        }
      }

      if (changed) {
        consumed.snapshots.push(snapshot)
        await writeSchedule({ ...snapshot, overrides: nextOverrides })
      }
    }

    const overlapping = await getPublicOverlappingSlots(start, end)
    if (overlapping.length > 0) {
      throw new Error('Het tijdslot bleef publiek boekbaar na het bijwerken van de beschikbaarheid.')
    }
    return consumed
  } catch (error) {
    await restoreConsumedPublicAvailability(consumed).catch(restoreError => {
      console.error('[manual-bookings] publieke beschikbaarheid herstellen mislukt:', restoreError)
    })
    throw error
  }
}
