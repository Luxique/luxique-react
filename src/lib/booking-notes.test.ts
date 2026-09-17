import assert from 'node:assert/strict'
import test from 'node:test'
import { extractCalBookingNote, renderBookingNoteEmailHtml } from './booking-notes.ts'

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

test('extracts and renders a Cal.com custom-field note safely', () => {
  const note = extractCalBookingNote({
    bookingFieldsResponses: {
      bijzonderheden: { label: 'Bijzonderheden', value: 'Waterige ogen & stijve <wimpers>' },
    },
  })
  const html = renderBookingNoteEmailHtml(note)

  assert.equal(note, 'Waterige ogen & stijve <wimpers>')
  assert.match(html, /Jouw notitie/)
  assert.match(html, /Waterige ogen &amp; stijve &lt;wimpers&gt;/)
  assert.doesNotMatch(html, /<wimpers>/)
})

test('omits the entire email note section when no note was submitted', () => {
  assert.equal(renderBookingNoteEmailHtml(''), '')
  assert.equal(renderBookingNoteEmailHtml('   '), '')
  assert.equal(renderBookingNoteEmailHtml(null), '')
})
