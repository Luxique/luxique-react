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

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

/** Returns no markup at all when the customer did not submit a note. */
export function renderBookingNoteEmailHtml(note: string | null | undefined, label = 'Jouw notitie'): string {
  const cleanNote = note?.trim()
  if (!cleanNote) return ''

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffaf0; border:1px solid rgba(196,162,101,.35); border-radius:10px; margin:0 0 26px 0;">
    <tr><td style="padding:20px 24px; text-align:left;">
      <div style="font-family:Arial,sans-serif; font-size:10px; letter-spacing:2px; text-transform:uppercase; color:#C4A265; padding-bottom:8px;">${escapeHtml(label)}</div>
      <div style="font-family:Arial,sans-serif; font-size:15px; line-height:23px; color:#4a463e; white-space:pre-wrap; overflow-wrap:anywhere;">${escapeHtml(cleanNote)}</div>
    </td></tr>
  </table>`
}
