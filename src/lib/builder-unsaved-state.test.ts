import assert from 'node:assert/strict'
import test from 'node:test'
import { resetUnsavedStateAfterSuccessfulSave } from './builder-unsaved-state.ts'

test('clears every dirty lesson after a successful save with no newer edits', () => {
  const dirtyLessonIds = new Set(['lesson-4', 'deleted-lesson'])

  assert.equal(resetUnsavedStateAfterSuccessfulSave(7, 7, dirtyLessonIds), true)
  assert.deepEqual(Array.from(dirtyLessonIds), [])
})

test('keeps dirty lessons when a newer edit happened while saving', () => {
  const dirtyLessonIds = new Set(['lesson-4'])

  assert.equal(resetUnsavedStateAfterSuccessfulSave(7, 8, dirtyLessonIds), false)
  assert.deepEqual(Array.from(dirtyLessonIds), ['lesson-4'])
})
