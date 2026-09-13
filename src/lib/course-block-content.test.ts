import assert from 'node:assert/strict'
import test from 'node:test'

import { extractStoredBlockContent, normalizeRichTextHtml } from './course-block-content.ts'

test('reads current flat block JSON without trimming rich text spacing', () => {
  const stored = extractStoredBlockContent({
    title: '<p>De  vormen</p>',
    content: '<p>links   rechts </p>',
    url: 'https://example.test/photo.jpg',
    caption: 'Meer uitleg over de vormen',
  })

  assert.equal(stored.title, '<p>De  vormen</p>')
  assert.equal(stored.body, '<p>links   rechts </p>')
  assert.equal(stored.url, 'https://example.test/photo.jpg')
  assert.equal(stored.caption, 'Meer uitleg over de vormen')
})

test('reads image and text fields from the legacy nested content shape', () => {
  const stored = extractStoredBlockContent({
    content: {
      content: '<p><strong>Volledige uitleg</strong> met einde</p>',
      url: 'https://example.test/legacy.jpg',
      caption: 'Legacy bijschrift',
    },
  })

  assert.equal(stored.body, '<p><strong>Volledige uitleg</strong> met einde</p>')
  assert.equal(stored.url, 'https://example.test/legacy.jpg')
  assert.equal(stored.caption, 'Legacy bijschrift')
})

test('decodes escaped legacy rich text tags instead of showing raw markup', () => {
  assert.equal(
    normalizeRichTextHtml('&lt;p&gt;&lt;strong&gt;The Wet look&lt;/strong&gt; volledig&lt;/p&gt;'),
    '<p><strong>The Wet look</strong> volledig</p>',
  )
  assert.equal(normalizeRichTextHtml('Gebruik < en > als vergelijking'), 'Gebruik < en > als vergelijking')
  assert.equal(
    normalizeRichTextHtml('&lt;p&gt;Veilig&lt;/p&gt;&lt;script&gt;alert(1)&lt;/script&gt;'),
    '<p>Veilig</p>&lt;script&gt;alert(1)&lt;/script&gt;',
  )
})
