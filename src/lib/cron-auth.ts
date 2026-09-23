export function hasValidCronAuthorization(headers: Headers, expectedSecret = process.env.CRON_SECRET): boolean {
  if (!expectedSecret) return false

  return headers.get('authorization') === `Bearer ${expectedSecret}`
}
