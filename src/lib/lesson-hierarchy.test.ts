import assert from 'node:assert/strict'
import test from 'node:test'
import { LESSON_NEST_THRESHOLD_PX, moveLessonInHierarchy } from './lesson-hierarchy.ts'

const lessons = [
  { id: 'one' },
  { id: 'two' },
  { id: 'two-one', parentId: 'two' },
  { id: 'three' },
]

test('vertical reorder does not accidentally change nesting', () => {
  const result = moveLessonInHierarchy(lessons, 'three', 'one', 0)
  assert.equal(result.find(lesson => lesson.id === 'three')?.parentId, undefined)
  assert.equal(result[0].id, 'three')
})

test('intentional right drag turns a main lesson into a sub-lesson', () => {
  const result = moveLessonInHierarchy(lessons, 'three', 'two', LESSON_NEST_THRESHOLD_PX + 1)
  assert.equal(result.find(lesson => lesson.id === 'three')?.parentId, 'two')
})

test('intentional left drag promotes a sub-lesson to main lesson', () => {
  const result = moveLessonInHierarchy(lessons, 'two-one', 'three', -LESSON_NEST_THRESHOLD_PX - 1)
  assert.equal(result.find(lesson => lesson.id === 'two-one')?.parentId, undefined)
})

test('intentional left drag promotes a sub-lesson without crossing another row', () => {
  const result = moveLessonInHierarchy(lessons, 'two-one', 'two-one', -LESSON_NEST_THRESHOLD_PX - 1)
  assert.equal(result.find(lesson => lesson.id === 'two-one')?.parentId, undefined)
  assert.deepEqual(result.map(lesson => lesson.id), ['one', 'two', 'two-one', 'three'])
})

test('intentional right drag nests a main lesson under the main lesson above', () => {
  const result = moveLessonInHierarchy(lessons, 'three', 'three', LESSON_NEST_THRESHOLD_PX + 1)
  assert.equal(result.find(lesson => lesson.id === 'three')?.parentId, 'two')
})

test('a sub-lesson can move under a different main lesson', () => {
  const result = moveLessonInHierarchy(lessons, 'two-one', 'one', LESSON_NEST_THRESHOLD_PX + 1)
  assert.equal(result.find(lesson => lesson.id === 'two-one')?.parentId, 'one')
  assert.deepEqual(result.map(lesson => lesson.id).slice(0, 2), ['one', 'two-one'])
})

test('moving a main lesson keeps its children attached', () => {
  const result = moveLessonInHierarchy(lessons, 'two', 'one', 0)
  assert.deepEqual(result.map(lesson => lesson.id).slice(0, 2), ['two', 'two-one'])
  assert.equal(result.find(lesson => lesson.id === 'two-one')?.parentId, 'two')
})

test('moving a main lesson downward places the full group after the target', () => {
  const result = moveLessonInHierarchy(lessons, 'one', 'three', 0)
  assert.deepEqual(result.map(lesson => lesson.id), ['two', 'two-one', 'three', 'one'])
})
