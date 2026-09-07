const CAL_SMS_GATEWAY_DOMAIN = 'sms.cal.com'

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  return email || null
}

export function isCalSmsGatewayEmail(value: unknown): boolean {
  const email = normalizeEmail(value)
  return email?.endsWith(`@${CAL_SMS_GATEWAY_DOMAIN}`) ?? false
}

export function canonicalCustomerEmail(input: {
  profileEmail?: unknown
  authEmail?: unknown
  bookingEmail?: unknown
}): string | null {
  for (const candidate of [input.profileEmail, input.authEmail, input.bookingEmail]) {
    const email = normalizeEmail(candidate)
    if (email && !isCalSmsGatewayEmail(email)) return email
  }
  return null
}
