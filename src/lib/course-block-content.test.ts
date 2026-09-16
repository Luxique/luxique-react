import assert from 'node:assert/strict'
import test from 'node:test'

import {
  extractStoredBlockContent,
  getBuilderVideoPlaybackConfig,
  normalizeRichTextHtml,
} from './course-block-content.ts'

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

test('uses the legacy media object as the image preview fallback', () => {
  const stored = extractStoredBlockContent({
    media: {
      type: 'image',
      url: 'https://example.test/legacy-photo.jpg',
      caption: 'Legacy caption',
    },
  })

  assert.equal(stored.url, 'https://example.test/legacy-photo.jpg')
  assert.equal(stored.caption, 'Legacy caption')
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

test('uses public playback without a token for a free lesson', () => {
  assert.deepEqual(
    getBuilderVideoPlaybackConfig({
      mux_playback_id: 'signed-id',
      mux_public_playback_id: 'public-id',
    }, true),
    { playbackId: 'public-id', signed: false },
  )
})

test('uses signed playback with a token for a paid lesson', () => {
  assert.deepEqual(
    getBuilderVideoPlaybackConfig({ mux_playback_id: 'signed-id' }, false),
    { playbackId: 'signed-id', signed: true },
  )
})
