import assert from 'node:assert/strict'
import test from 'node:test'
import { completedManualRefundLabel } from './manual-refund-presentation.ts'

test('completed manual refund shows the cancelled and refunded label', () => {
  assert.equal(completedManualRefundLabel('2026-10-08T10:00:00.000Z'), 'Geannuleerd + terugbetaald')
})

test('reopening a manual refund removes the completed label', () => {
  assert.equal(completedManualRefundLabel(null), null)
})
