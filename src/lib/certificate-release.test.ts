import assert from 'node:assert/strict'
import test from 'node:test'
import { certificateIsAvailable, certificateReleaseStatus } from './certificate-release'

test('automatic courses remain available immediately after completion', () => {
  assert.equal(certificateIsAvailable({ courseCompletedAt: '2026-09-17T12:00:00Z', reviewRequired: false, releasedAt: null }), true)
})

test('review courses remain blocked after completion until release', () => {
  const pending = certificateReleaseStatus({ courseCompletedAt: '2026-09-17T12:00:00Z', reviewRequired: true, releasedAt: null })
  assert.equal(pending.completed, true)
  assert.equal(pending.certificateAvailable, false)
})

test('review courses become available after manual release', () => {
  assert.equal(certificateIsAvailable({ courseCompletedAt: '2026-09-17T12:00:00Z', reviewRequired: true, releasedAt: '2026-09-17T13:00:00Z' }), true)
})

test('release cannot make an incomplete course certificate available', () => {
  assert.equal(certificateIsAvailable({ courseCompletedAt: null, reviewRequired: true, releasedAt: '2026-09-17T13:00:00Z' }), false)
})

