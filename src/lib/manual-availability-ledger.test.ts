import assert from 'node:assert/strict'
import test from 'node:test'
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { isManualAvailabilityLedger, mergeWindows, subtractWindow } from './manual-availability-ledger.ts'

test('subtractWindow records exact provenance and retains only bookable fragments', () => {
  const result = subtractWindow(
    { date: '2026-09-04', startTime: '09:00', endTime: '17:00' },
    { date: '2026-09-04', startTime: '12:00', endTime: '15:00' },
    180,
  )
  assert.deepEqual(result.removed, { date: '2026-09-04', startTime: '09:00', endTime: '17:00' })
  assert.deepEqual(result.remaining, [
    { date: '2026-09-04', startTime: '09:00', endTime: '12:00' },
  ])
})

test('mergeWindows restores idempotently without affecting another date', () => {
  const restored = { date: '2026-09-04', startTime: '09:00', endTime: '17:00' }
  assert.deepEqual(mergeWindows([
    { date: '2026-09-05', startTime: '10:00', endTime: '12:00' },
    { date: '2026-09-04', startTime: '09:00', endTime: '12:00' },
    restored,
    restored,
  ]), [
    restored,
    { date: '2026-09-05', startTime: '10:00', endTime: '12:00' },
  ])
})

test('ledger validation rejects legacy or malformed data', () => {
  assert.equal(isManualAvailabilityLedger(null), false)
  assert.equal(isManualAvailabilityLedger({ treatmentKey: 'new_lash_set' }), false)
  assert.equal(isManualAvailabilityLedger({
    version: 1,
    treatmentKey: 'new_lash_set',
    scheduleId: 2292165,
    removedWindows: [{ date: '2026-09-04', startTime: '12:00', endTime: '15:00' }],
  }), true)
})
