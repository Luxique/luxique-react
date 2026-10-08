import assert from 'node:assert/strict'
import test from 'node:test'
import { needsManualRefund } from './manual-refund.ts'

test('in-salon payment cancelled outside 24 hours needs a manual refund', () => {
  assert.equal(needsManualRefund({ source: 'manual', status: 'cancelled', salonDepositStatus: 'paid', depositCents: 7500, cancelledWithin24h: false }), true)
})
test('in-salon payment cancelled within 24 hours is non-refundable', () => {
  assert.equal(needsManualRefund({ source: 'manual', status: 'cancelled', salonDepositStatus: 'paid', depositCents: 7500, cancelledWithin24h: true }), false)
})
test('online payment is never added to the manual refund queue', () => {
  assert.equal(needsManualRefund({ source: 'online', status: 'cancelled', salonDepositStatus: 'paid', depositCents: 7500, cancelledWithin24h: false }), false)
})

