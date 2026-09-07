import test from 'node:test'
import assert from 'node:assert/strict'
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { isActiveCustomerBooking } from './customer-booking-visibility.ts'

test('online customer bookings expose paid records only', () => {
  assert.equal(isActiveCustomerBooking('online', 'paid'), true)
  assert.equal(isActiveCustomerBooking('online', 'cancelled'), false)
  assert.equal(isActiveCustomerBooking('online', 'canceled'), false)
  assert.equal(isActiveCustomerBooking('online', 'expired'), false)
})

test('manual customer bookings expose confirmed records only', () => {
  assert.equal(isActiveCustomerBooking('manual', 'confirmed'), true)
  assert.equal(isActiveCustomerBooking('manual', 'cancelled'), false)
  assert.equal(isActiveCustomerBooking('manual', 'canceled'), false)
  assert.equal(isActiveCustomerBooking('manual', 'expired'), false)
})
