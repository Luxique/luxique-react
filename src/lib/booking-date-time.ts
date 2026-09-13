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
