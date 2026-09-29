import assert from 'node:assert/strict'
import test from 'node:test'
import { getNextLessonButtonLabel } from './lesson-navigation.ts'

test('uses the actual next lesson title for a sub-lesson', () => {
  assert.equal(getNextLessonButtonLabel({ title: 'Les 4.2 — Mapping' }), 'Les 4.2 — Mapping')
})

test('keeps a safe fallback when a lesson has no title', () => {
  assert.equal(getNextLessonButtonLabel({ title: '   ' }), 'Volgende les')
  assert.equal(getNextLessonButtonLabel(null), 'Volgende les')
})
