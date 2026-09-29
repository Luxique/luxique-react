import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getBuilderSaveErrorMessage,
  isRetryableSaveNetworkError,
  retryBuilderSaveOperation,
} from './builder-save-retry.ts'

test('recognizes the browser Failed to fetch response as retryable', () => {
  assert.equal(isRetryableSaveNetworkError({ message: 'TypeError: Failed to fetch' }), true)
  assert.equal(isRetryableSaveNetworkError({ message: 'duplicate key value violates unique constraint' }), false)
})

test('retries a transient network result and returns the successful response', async () => {
  let calls = 0
  const result = await retryBuilderSaveOperation(async () => {
    calls += 1
    return calls < 3
      ? { data: null, error: { message: 'TypeError: Failed to fetch' } }
      : { data: { saved: true }, error: null }
  }, { attempts: 3, delayMs: 0 })

  assert.equal(calls, 3)
  assert.deepEqual(result.data, { saved: true })
})

test('does not retry a database validation error', async () => {
  let calls = 0
  const result = await retryBuilderSaveOperation(async () => {
    calls += 1
    return { error: { message: 'invalid input syntax' } }
  }, { attempts: 3, delayMs: 0 })

  assert.equal(calls, 1)
  assert.equal(result.error?.message, 'invalid input syntax')
})

test('network message is clear and confirms that editor content is retained', () => {
  assert.equal(
    getBuilderSaveErrorMessage(new TypeError('Failed to fetch'), 'opslaan'),
    'De verbinding viel weg tijdens het opslaan. Je wijzigingen staan nog in de builder. Controleer je internetverbinding en probeer het opnieuw.',
  )
})
