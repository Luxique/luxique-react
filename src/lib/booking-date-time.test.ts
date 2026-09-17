import assert from 'node:assert/strict'
import test from 'node:test'
import { formatBookingTime } from './booking-date-time.ts'

test('reminder and dashboard show the same Amsterdam time for the affected booking', () => {
  const slotStart = '2026-09-14T07:00:00+00:00'
  assert.equal(formatBookingTime(slotStart, 'en-GB'), '09:00')
  assert.equal(formatBookingTime(slotStart, 'nl-NL'), '09:00')
})

test('reminder and dashboard show the same Amsterdam time for another booking', () => {
  const slotStart = '2026-09-14T10:00:00+00:00'
  assert.equal(formatBookingTime(slotStart, 'en-GB'), '12:00')
  assert.equal(formatBookingTime(slotStart, 'nl-NL'), '12:00')
})
