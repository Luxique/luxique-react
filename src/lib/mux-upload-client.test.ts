import assert from 'node:assert/strict'
import test from 'node:test'

import {
  MUX_ASSET_POLL_TIMEOUT_MS,
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

test('surfaces the provider error instead of continuing with undefined URLs', () => {
  assert.throws(
    () => requireMuxUpload(false, { error: 'Mux account locked' }),
    /Mux account locked/,
  )
  assert.throws(
    () => requireMuxAssetStatus(false, { error: 'upload_id required' }),
    /upload_id required/,
  )
})

test('allows up to thirty minutes for normal Mux processing', () => {
  assert.equal(MUX_ASSET_POLL_TIMEOUT_MS, 1_800_000)
})
