import assert from 'node:assert/strict'
import test from 'node:test'
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { canonicalCustomerEmail, isCalSmsGatewayEmail } from './customer-email.ts'

test('detects Cal SMS gateway addresses case-insensitively', () => {
  assert.equal(isCalSmsGatewayEmail('31624484075@sms.cal.com'), true)
  assert.equal(isCalSmsGatewayEmail(' 31624484075@SMS.CAL.COM '), true)
  assert.equal(isCalSmsGatewayEmail('customer@example.com'), false)
})

test('always prefers the profile email', () => {
  assert.equal(canonicalCustomerEmail({
    profileEmail: 'CJ@Example.com', authEmail: 'old@example.com',
    bookingEmail: '31624484075@sms.cal.com',
  }), 'cj@example.com')
})

test('never returns an SMS gateway address', () => {
  assert.equal(canonicalCustomerEmail({ bookingEmail: '31624484075@sms.cal.com' }), null)
})
