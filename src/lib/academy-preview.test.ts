import assert from 'node:assert/strict'
import test from 'node:test'

import { getAcademyPreviewSuffix, isAdminConceptPreview } from './academy-preview.ts'

test('adds the explicit admin preview query only when requested', () => {
  assert.equal(getAcademyPreviewSuffix(true), '?preview=admin')
  assert.equal(getAcademyPreviewSuffix(false), '')
})

test('shows the concept treatment only for an admin previewing a draft', () => {
  assert.equal(isAdminConceptPreview({ requested: true, role: 'admin', status: 'draft' }), true)
  assert.equal(isAdminConceptPreview({ requested: false, role: 'admin', status: 'draft' }), false)
  assert.equal(isAdminConceptPreview({ requested: true, role: 'student', status: 'draft' }), false)
  assert.equal(isAdminConceptPreview({ requested: true, role: 'admin', status: 'published' }), false)
})
