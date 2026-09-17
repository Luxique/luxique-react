import assert from 'node:assert/strict'
import test from 'node:test'

import { getBlockIdsToDelete, shouldSyncLessonBlocks } from './course-block-sync.ts'

test('saving lesson A ignores unopened lesson B', () => {
  const dirtyLessonIds = new Set(['lesson-a'])
  assert.equal(shouldSyncLessonBlocks(dirtyLessonIds, 'lesson-a'), true)
  assert.equal(shouldSyncLessonBlocks(dirtyLessonIds, 'lesson-b'), false)
})

test('saving a three-lesson course ignores an unopened middle lesson', () => {
  const dirtyLessonIds = new Set(['lesson-a', 'lesson-c'])
  assert.equal(shouldSyncLessonBlocks(dirtyLessonIds, 'lesson-a'), true)
  assert.equal(shouldSyncLessonBlocks(dirtyLessonIds, 'lesson-b'), false)
  assert.equal(shouldSyncLessonBlocks(dirtyLessonIds, 'lesson-c'), true)
})

test('delete calculation removes only blocks absent from a dirty lesson', () => {
  assert.deepEqual(
    getBlockIdsToDelete(['block-1', 'block-2', 'block-3'], ['block-1', 'block-3']),
    ['block-2'],
  )
})
