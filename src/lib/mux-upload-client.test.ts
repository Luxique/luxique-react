import assert from 'node:assert/strict'
import test from 'node:test'

import {
  MUX_ASSET_POLL_TIMEOUT_MS,
  hasMuxPlaybackIdentity,
  requireMuxAssetStatus,
  requireMuxUpload,
} from './mux-upload-client.ts'

test('requires a successful upload response with both Mux identifiers', () => {
  assert.deepEqual(
    requireMuxUpload(true, { upload_url: 'https://upload.example', upload_id: 'upload-1' }),
    { uploadUrl: 'https://upload.example', uploadId: 'upload-1' },
  )
  assert.throws(() => requireMuxUpload(true, { upload_url: 'https://upload.example' }), /upload-ID/)
})

test('surfaces API errors instead of polling undefined identifiers', () => {
  assert.throws(() => requireMuxUpload(false, { error: 'Mux unavailable' }), /Mux unavailable/)
  assert.throws(() => requireMuxAssetStatus(false, { error: 'upload_id required' }), /upload_id required/)
})

test('allows thirty minutes for normal Mux processing', () => {
  assert.equal(MUX_ASSET_POLL_TIMEOUT_MS, 1_800_000)
})

test('finishes builder processing as soon as Mux supplies a playback identity', () => {
  assert.equal(hasMuxPlaybackIdentity({ status: 'preparing', playback_id: 'playback-1' }), true)
  assert.equal(hasMuxPlaybackIdentity({ status: 'ready', playback_id: 'playback-1' }), true)
  assert.equal(hasMuxPlaybackIdentity({ status: 'preparing' }), false)
  assert.equal(hasMuxPlaybackIdentity({ status: 'errored', playback_id: 'playback-1' }), false)
})
