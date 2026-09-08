import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeCalAvailabilitySlots } from './cal-slots.ts'

test('normalizes current Cal.com slot objects', () => {
  assert.deepEqual(
    normalizeCalAvailabilitySlots([
      { start: '2026-09-24T09:00:00.000+02:00' },
      { start: '2026-09-24T12:00:00.000+02:00' },
    ], 'Europe/Amsterdam'),
    [
      { start: '2026-09-24T09:00:00.000+02:00', time: '09:00' },
      { start: '2026-09-24T12:00:00.000+02:00', time: '12:00' },
    ],
  )
})

test('keeps compatibility with legacy string slots', () => {
  assert.deepEqual(
    normalizeCalAvailabilitySlots([
      '2026-09-24T09:00:00.000+02:00',
    ], 'Europe/Amsterdam'),
    [{ start: '2026-09-24T09:00:00.000+02:00', time: '09:00' }],
  )
})

test('rejects malformed slot payloads with a controlled error', () => {
  assert.throws(
    () => normalizeCalAvailabilitySlots([{ start: 'not-a-date' }], 'Europe/Amsterdam'),
    /ongeldig tijdslot/,
  )
  assert.throws(
    () => normalizeCalAvailabilitySlots({}, 'Europe/Amsterdam'),
    /ongeldig beschikbaarheidsformaat/,
  )
})

test('returns no slots when Cal omits an unavailable date', () => {
  assert.deepEqual(normalizeCalAvailabilitySlots(undefined, 'Europe/Amsterdam'), [])
})
