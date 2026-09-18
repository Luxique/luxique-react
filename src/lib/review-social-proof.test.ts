import test from 'node:test'
import assert from 'node:assert/strict'
import { GOOGLE_REVIEW_WRITE_URL, REVIEW_SOCIAL_PROOF, renderEmailReviewProof } from './review-social-proof.ts'

test('email review proof uses the same rating, count, and avatars as the website', () => {
  const html = renderEmailReviewProof()

  assert.match(html, new RegExp(REVIEW_SOCIAL_PROOF.rating.replace('.', '\\.')))
  assert.match(html, new RegExp(`${REVIEW_SOCIAL_PROOF.count} reviews`))
  assert.equal(REVIEW_SOCIAL_PROOF.avatars.every(avatar => html.includes(avatar)), true)
})

test('review CTA uses the direct Google review destination', () => {
  assert.match(GOOGLE_REVIEW_WRITE_URL, /^https:\/\/search\.google\.com\/local\/writereview\?placeid=/)
})
