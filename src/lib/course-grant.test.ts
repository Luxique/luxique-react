import assert from 'node:assert/strict'
import test from 'node:test'

import { courseGrantErrorMessage, withCourseGrantTimeout } from './course-grant.ts'

test('returns a successful course grant result', async () => {
  assert.deepEqual(await withCourseGrantTimeout(Promise.resolve({ error: null }), 50), { error: null })
})

test('turns a hanging grant into a visible timeout error', async () => {
  await assert.rejects(
    withCourseGrantTimeout(new Promise(() => {}), 5),
    error => error instanceof Error
      && courseGrantErrorMessage(error) === 'Toewijzen duurde te lang. Controleer je verbinding en probeer opnieuw.',
  )
})

test('uses a clear generic message for rejected assignments', () => {
  assert.equal(
    courseGrantErrorMessage(new Error('foreign key violation')),
    'Toewijzen mislukt. Controleer de cursist en cursus en probeer opnieuw.',
  )
})
