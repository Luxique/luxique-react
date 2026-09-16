import assert from 'node:assert/strict'
import test from 'node:test'
import { isLessonPathname } from './lesson-route'

test('recognizes localized and default-locale lesson routes', () => {
  assert.equal(isLessonPathname('/nl/academy/medusa-lash-basics/lesson-id'), true)
  assert.equal(isLessonPathname('/academy/medusa-lash-basics/lesson-id'), true)
  assert.equal(isLessonPathname('/en/academy/course/lesson/'), true)
})

test('does not reduce navigation on academy overview routes', () => {
  assert.equal(isLessonPathname('/nl/academy/medusa-lash-basics'), false)
  assert.equal(isLessonPathname('/nl/academy'), false)
  assert.equal(isLessonPathname('/nl/courses/course/lesson'), false)
  assert.equal(isLessonPathname(null), false)
})
