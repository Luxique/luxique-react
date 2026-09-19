import test from 'node:test'
import assert from 'node:assert/strict'
import { GOOGLE_REVIEW_WRITE_URL, REVIEW_SOCIAL_PROOF, renderEmailReviewHero, renderEmailReviewProof } from './review-social-proof.ts'

test('email review proof uses the same rating, count, and avatars as the website', () => {
  const html = renderEmailReviewProof()

  assert.match(html, new RegExp(REVIEW_SOCIAL_PROOF.rating.replace('.', '\\.')))
  assert.match(html, new RegExp(`${REVIEW_SOCIAL_PROOF.count} reviews`))
  assert.equal(REVIEW_SOCIAL_PROOF.avatars.every(avatar => html.includes(avatar)), true)
})

test('review CTA uses the direct Google review destination', () => {
  assert.match(GOOGLE_REVIEW_WRITE_URL, /^https:\/\/search\.google\.com\/local\/writereview\?placeid=/)
})

test('email review proof supports an overlay-safe zero margin', () => {
  const html = renderEmailReviewProof('0')

  assert.match(html, /margin:0 auto 0 auto/)
  assert.match(html, /background-color:#FFFFFF/)
})

test('review-email hero is compact, overlays the badge, and includes an Outlook VML fallback', () => {
  const imageUrl = 'https://www.luxique.nl/images/hero-bg.jpg'
  const html = renderEmailReviewHero(imageUrl)

  assert.match(html, /width="360"/)
  assert.match(html, /height="240"/)
  assert.match(html, /background-size:cover/)
  assert.match(html, /valign="bottom"/)
  assert.match(html, /5\.0 &middot; 47 reviews/)
  assert.match(html, /\[if gte mso 9\]/)
  assert.match(html, /<v:fill type="frame"/)
  assert.match(html, /background-color:#D8D1C7/)
})
