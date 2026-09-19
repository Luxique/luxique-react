import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isTerminalPastBookingCancellationError } from './cancellation-retry.ts'

describe('isTerminalPastBookingCancellationError', () => {
  it('recognizes the Cal.com terminal error for an appointment that already ended', () => {
    assert.equal(isTerminalPastBookingCancellationError(
      'Cal.com annulering niet bevestigd (HTTP 400): {"message":"Cannot cancel a booking that has already ended"}',
    ), true)
  })

  it('keeps transient cancellation errors retryable', () => {
    assert.equal(isTerminalPastBookingCancellationError('Cal.com annulering niet bevestigd (HTTP 503): unavailable'), false)
  })
})
