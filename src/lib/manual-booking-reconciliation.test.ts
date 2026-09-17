import assert from 'node:assert/strict'
import test from 'node:test'
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { reconcileManualBookingUids } from './manual-booking-reconciliation.ts'

test('a cancelled manual UID suppresses a stale ACCEPTED Cal list entry', () => {
  const ghostUid = 'dYTqZBQFknwT16fjFg1Vwo'
  const reconciled = reconcileManualBookingUids(
    [{ uid: ghostUid, status: 'ACCEPTED', source: 'manual' }],
    [],
    [ghostUid],
  )

  assert.equal(reconciled.has(ghostUid), false)
})

test('an active manual record remains authoritative over the Cal list entry', () => {
  const uid = 'manual-active'
  const localBooking = { uid, status: 'confirmed', source: 'manual', title: 'Fill Lash Set' }
  const reconciled = reconcileManualBookingUids(
    [{ uid, status: 'ACCEPTED', source: 'manual', title: 'Cal title' }],
    [localBooking],
    [],
  )

  assert.deepEqual(reconciled.get(uid), localBooking)
})
