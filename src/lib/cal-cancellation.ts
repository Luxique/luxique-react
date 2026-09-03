const CAL_API_VERSION = '2024-08-13'

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
  if (response.ok) return

  const failureBody = await response.text()
  const verification = await fetch(`https://api.cal.com/v2/bookings/${encodeURIComponent(uid)}`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${apiKey}`, 'cal-api-version': CAL_API_VERSION },
  })
  const verificationBody = await verification.json().catch(() => null)
  const status = String(verificationBody?.data?.status || verificationBody?.data?.booking?.status || '').toLowerCase()
  if (verification.ok && (status === 'cancelled' || status === 'canceled')) return

  throw new Error(`Cal.com annulering geweigerd (HTTP ${response.status}): ${failureBody.slice(0, 500)}`)
}
