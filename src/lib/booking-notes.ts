const STANDARD_BOOKING_FIELDS = new Set([
  'name', 'email', 'phone', 'phoneNumber', 'location', 'guests', 'rescheduleReason',
])

const NOTE_FIELD_PATTERN = /(note|notes|opmerking|opmerkingen|bijzonder|bijzonderheden|additional.?information|extra.?information)/i

function responseText(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value)) return value.map(responseText).filter(Boolean).join(', ')
  if (!value || typeof value !== 'object') return ''
  const field = value as Record<string, unknown>
  return responseText(field.value ?? field.response ?? field.answer)
}

/**
 * Cal.com API v2 documents custom answers as `bookingFieldsResponses`. Older
 * Luxique webhooks/list responses expose the same answers under `responses`.
 */
export function extractCalBookingNote(booking: Record<string, unknown>): string {
  const candidates = [booking.bookingFieldsResponses, booking.responses]
  for (const candidate of candidates) {
    if (!candidate || Array.isArray(candidate) || typeof candidate !== 'object') continue
    for (const [key, rawValue] of Object.entries(candidate as Record<string, unknown>)) {
      if (STANDARD_BOOKING_FIELDS.has(key)) continue
      const label = rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue)
        ? responseText((rawValue as Record<string, unknown>).label)
        : ''
      if (!NOTE_FIELD_PATTERN.test(`${key} ${label}`)) continue
      const note = responseText(rawValue)
      if (note) return note.slice(0, 2_000)
    }
  }
  return ''
}
