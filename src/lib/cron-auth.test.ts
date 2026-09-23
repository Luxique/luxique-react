import assert from 'node:assert/strict'
import test from 'node:test'

import { hasValidCronAuthorization } from './cron-auth.ts'

const SECRET = 'test-cron-secret'

test('rejects a spoofed Vercel Cron user agent without authorization', () => {
  const headers = new Headers({ 'user-agent': 'vercel-cron/1.0' })

  assert.equal(hasValidCronAuthorization(headers, SECRET), false)
})

test('rejects a spoofed Vercel Cron user agent with the wrong bearer secret', () => {
  const headers = new Headers({
    authorization: 'Bearer wrong-secret',
    'user-agent': 'custom-client vercel-cron',
  })

  assert.equal(hasValidCronAuthorization(headers, SECRET), false)
})

test('accepts the correct bearer secret regardless of user agent', () => {
  for (const userAgent of ['vercel-cron/1.0', 'curl/8.0', '']) {
    const headers = new Headers({
      authorization: `Bearer ${SECRET}`,
      'user-agent': userAgent,
    })

    assert.equal(hasValidCronAuthorization(headers, SECRET), true)
  }
})

test('fails closed when CRON_SECRET is not configured', () => {
  const headers = new Headers({ authorization: 'Bearer undefined' })

  assert.equal(hasValidCronAuthorization(headers, undefined), false)
})
