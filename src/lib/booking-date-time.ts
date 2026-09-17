export const BOOKING_TIME_ZONE = 'Europe/Amsterdam'

export function formatBookingDate(iso: string, locale = 'nl-NL'): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: BOOKING_TIME_ZONE,
  }).format(new Date(iso))
}

export function formatBookingTime(iso: string, locale = 'nl-NL'): string {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: BOOKING_TIME_ZONE,
  }).format(new Date(iso))
}

export function formatAmsterdamDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: BOOKING_TIME_ZONE,
  }).format(date)
}

export function getAmsterdamDateKeyAfterDays(now: Date, days: number): string {
  const today = formatAmsterdamDateKey(now)
  const [year, month, day] = today.split('-').map(Number)
  const shifted = new Date(Date.UTC(year, month - 1, day + days, 12))
  return formatAmsterdamDateKey(shifted)
}

export function formatBookingDateOnly(isoDate: string, locale = 'nl-NL'): string {
  return formatBookingDate(`${isoDate}T12:00:00Z`, locale)
}
