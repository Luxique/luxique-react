import assert from 'node:assert/strict'
import test from 'node:test'

import { updateLessonById } from './course-lesson-state.ts'

test('updates a sub-lesson name without changing its hierarchy', () => {
  const lessons = [
    { id: 'main', name: 'Les 4', parentId: undefined },
    { id: 'sub', name: 'Subles', parentId: 'main' },
  ]

  assert.deepEqual(updateLessonById(lessons, 'sub', { name: 'Les 4.1' }), [
    lessons[0],
    { id: 'sub', name: 'Les 4.1', parentId: 'main' },
  ])
})
