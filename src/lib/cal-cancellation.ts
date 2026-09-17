const CAL_API_VERSION = '2024-08-13'

export function isCancelledCalStatus(status: unknown): boolean {
  const normalized = String(status || '').toLowerCase()
  return normalized === 'cancelled' || normalized === 'canceled'
}

async function readCalBookingStatus(uid: string, apiKey: string): Promise<string> {
  const verification = await fetch(`https://api.cal.com/v2/bookings/${encodeURIComponent(uid)}`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${apiKey}`, 'cal-api-version': CAL_API_VERSION },
  })
  const body = await verification.json().catch(() => null)
  if (!verification.ok) return ''
  return String(body?.data?.status || body?.data?.booking?.status || '')
}

export async function cancelCalBookingVerified(uid: string, reason: string): Promise<void> {
  const apiKey = process.env.CAL_API_KEY
  if (!apiKey) throw new Error('CAL_API_KEY ontbreekt op de server.')

  const response = await fetch(`https://api.cal.com/v2/bookings/${encodeURIComponent(uid)}/cancel`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'cal-api-version': CAL_API_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cancellationReason: reason }),
  })
  const failureBody = await response.text()
  // A successful POST only means Cal accepted the request. Confirm the booking
  // itself changed state before the database and emails claim cancellation.
  for (const delayMs of [0, 250, 750, 1500]) {
    if (delayMs) await new Promise(resolve => setTimeout(resolve, delayMs))
    if (isCancelledCalStatus(await readCalBookingStatus(uid, apiKey))) return
  }

  throw new Error(`Cal.com annulering niet bevestigd (HTTP ${response.status}): ${failureBody.slice(0, 500)}`)
}
