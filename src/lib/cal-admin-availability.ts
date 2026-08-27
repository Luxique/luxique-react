export type TreatmentKey = 'new_lash_set' | 'fill_lash_set'

export type CalOverride = {
  date: string
  startTime: string
  endTime: string
}

export type CalAvailability = {
  days: string[]
  startTime: string
  endTime: string
}

export type CalSchedule = {
  id: number
  name: string
  timeZone: string
  isDefault: boolean
  availability: CalAvailability[]
  overrides: CalOverride[]
}

export const TREATMENTS: Record<TreatmentKey, {
  key: TreatmentKey
  name: string
  durationMinutes: number
  eventTypeId: number
  scheduleId: number
}> = {
  new_lash_set: {
    key: 'new_lash_set',
    name: 'New Lash Set',
    durationMinutes: 180,
    eventTypeId: 5492038,
    scheduleId: 2292165,
  },
  fill_lash_set: {
    key: 'fill_lash_set',
    name: 'Fill Lash Set',
    durationMinutes: 120,
    eventTypeId: 5492037,
    scheduleId: 2292166,
  },
}

export const WORKDAY_START = '09:00'
export const WORKDAY_END = '19:00'

export function isTreatmentKey(value: unknown): value is TreatmentKey {
  return value === 'new_lash_set' || value === 'fill_lash_set'
}

export function isValidLocalDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function isValidTime(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) return false
  const [hours, minutes] = value.split(':').map(Number)
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
}

export function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

export function minutesToTime(value: number): string {
  const hours = Math.floor(value / 60)
  const minutes = value % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function defaultEndTime(startTime: string, durationMinutes: number): string {
  if (!isValidTime(startTime)) return ''
  return minutesToTime(timeToMinutes(startTime) + durationMinutes)
}

export function buildOverride(startTime: string, durationMinutes: number, requestedEndTime?: string): CalOverride | { error: string } {
  if (!isValidTime(startTime)) return { error: 'Kies een geldige starttijd.' }
  const endTime = requestedEndTime ?? defaultEndTime(startTime, durationMinutes)
  if (!isValidTime(endTime)) return { error: 'Kies een geldige eindtijd.' }

  const start = timeToMinutes(startTime)
  const workdayStart = timeToMinutes(WORKDAY_START)
  const workdayEnd = timeToMinutes(WORKDAY_END)
  const end = timeToMinutes(endTime)

  if (start < workdayStart) {
    return { error: `Een behandeling kan niet vóór ${WORKDAY_START} starten.` }
  }
  if (start >= workdayEnd) {
    return { error: `Een behandeling moet vóór ${WORKDAY_END} starten.` }
  }
  if (end <= start) {
    return { error: 'De eindtijd moet na de starttijd liggen.' }
  }
  if (end > workdayEnd) {
    return {
      error: `De eindtijd mag niet later zijn dan ${WORKDAY_END}.`,
    }
  }

  return { date: '', startTime, endTime }
}

export function sameOverride(a: CalOverride, b: CalOverride): boolean {
  return a.date === b.date && a.startTime === b.startTime && a.endTime === b.endTime
}

export function sortOverrides(overrides: CalOverride[]): CalOverride[] {
  return [...overrides].sort((a, b) =>
    `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`),
  )
}
