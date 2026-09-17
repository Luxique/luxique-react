import test from 'node:test'
import assert from 'node:assert/strict'
import { runReviewRequestCandidates, type ReviewRequestCandidate } from './review-request-runner.ts'

const candidate: ReviewRequestCandidate = {
  id: 'booking-1',
  source: 'online',
  cal_booking_uid: 'cal-1',
  event_type: 'Nieuwe set',
  slot_start: '2026-09-16T12:00:00.000Z',
}

test('claims and sends an eligible treatment exactly once', async () => {
  let claimed = false
  let sends = 0
  const claim = async () => {
    if (claimed) return false
    claimed = true
    return true
  }

  const first = await runReviewRequestCandidates([candidate], claim, async () => { sends += 1 }, async () => {})
  const second = await runReviewRequestCandidates([candidate], claim, async () => { sends += 1 }, async () => {})

  assert.equal(first[0].action, 'sent')
  assert.equal(second[0].action, 'skipped')
  assert.equal(sends, 1)
})

test('releases a failed claim so a later run can retry', async () => {
  let claimed = false
  let attempts = 0
  const claim = async () => {
    if (claimed) return false
    claimed = true
    return true
  }
  const release = async () => { claimed = false }

  const failed = await runReviewRequestCandidates([candidate], claim, async () => {
    attempts += 1
    throw new Error('Resend unavailable')
  }, release)
  const retried = await runReviewRequestCandidates([candidate], claim, async () => { attempts += 1 }, release)

  assert.equal(failed[0].action, 'error')
  assert.equal(retried[0].action, 'sent')
  assert.equal(attempts, 2)
})
