import assert from 'node:assert/strict'
import test from 'node:test'
import { isExactQuizSelectionCorrect, isMultiSelectQuestion, normalizeQuizSelection, toggleQuizSelection } from './quiz-selection.ts'

const options = [
  { id: 'a', correct: true },
  { id: 'b', correct: true },
  { id: 'c', correct: false },
]

test('detects multi-select only when two or more answers are correct', () => {
  assert.equal(isMultiSelectQuestion(options), true)
  assert.equal(isMultiSelectQuestion([{ id: 'a', correct: true }, { id: 'b', correct: false }]), false)
})

test('keeps radio behavior for a single-correct question', () => {
  assert.equal(toggleQuizSelection(['a'], 'b', false), 'b')
})

test('toggles independent checkbox choices for multi-select', () => {
  assert.deepEqual(toggleQuizSelection('a', 'b', true), ['a', 'b'])
  assert.deepEqual(toggleQuizSelection(['a', 'b'], 'a', true), ['b'])
})

test('requires exactly all correct answers and no incorrect answers', () => {
  assert.equal(isExactQuizSelectionCorrect(options, ['a', 'b']), true)
  assert.equal(isExactQuizSelectionCorrect(options, ['a']), false)
  assert.equal(isExactQuizSelectionCorrect(options, ['a', 'b', 'c']), false)
})

test('normalizes legacy single-answer persistence', () => {
  assert.deepEqual(normalizeQuizSelection('a'), ['a'])
})
