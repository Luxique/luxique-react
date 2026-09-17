import assert from 'node:assert/strict'
import test from 'node:test'
import { extractCalBookingNote } from './booking-notes.ts'

test('reads note from current Cal.com bookingFieldsResponses', () => {
  assert.equal(extractCalBookingNote({ bookingFieldsResponses: { notes: 'Waterige ogen' } }), 'Waterige ogen')
})

test('reads note from legacy nested responses without mistaking contact data for notes', () => {
  assert.equal(extractCalBookingNote({ responses: {
    name: { label: 'Naam', value: 'Test' },
    email: { label: 'E-mail', value: 'test@example.com' },
    bijzonderheden: { label: 'Bijzonderheden', value: 'Sterk gekrulde wimpers' },
  } }), 'Sterk gekrulde wimpers')
})

test('returns empty when no note field is present', () => {
  assert.equal(extractCalBookingNote({ responses: { phone: { value: '+31600000000' } } }), '')
})
