import assert from 'node:assert/strict'
import test from 'node:test'

import { getLessonDisplays } from './lesson-display.ts'

test('numbers a child after its parent as a sublesson', () => {
  const parentId = 'welke-lashes'
  const childId = 'materialen'
  const displays = getLessonDisplays([
    { id: 'beginning', title: 'The beginning', lesson_type: 'content' },
    { id: 'lets-begin', title: 'Lets begin!', lesson_type: 'content' },
    { id: parentId, title: 'Welke lashes gebruik je?', lesson_type: 'content' },
    { id: childId, title: 'materialen', lesson_type: 'content', parent_lesson_id: parentId },
  ])

  assert.equal(displays.get(parentId)?.label, 'Les 3 · Welke lashes gebruik je?')
  assert.equal(displays.get(childId)?.label, 'Les 3.1 · materialen')
  assert.equal(displays.get(childId)?.isSub, true)
})

test('does not count a sublesson as another top-level lesson', () => {
  const displays = getLessonDisplays([
    { id: 'parent', title: 'Parent', lesson_type: 'content' },
    { id: 'child', title: 'Child', lesson_type: 'content', parent_lesson_id: 'parent' },
    { id: 'next', title: 'Next', lesson_type: 'content' },
  ])

  assert.equal(displays.get('child')?.shortLabel, 'Les 1.1')
  assert.equal(displays.get('next')?.shortLabel, 'Les 2')
})
