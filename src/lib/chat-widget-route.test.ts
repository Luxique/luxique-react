import assert from 'node:assert/strict'
import test from 'node:test'
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { shouldHideChatWidget } from './chat-widget-route.ts'

test('hides the widget on admin and localized customer dashboards', () => {
  for (const pathname of ['/admin', '/admin/customers', '/dashboard', '/nl/dashboard', '/en/dashboard/bookings']) {
    assert.equal(shouldHideChatWidget(pathname), true, pathname)
  }
})

test('keeps the widget on public localized routes', () => {
  for (const pathname of ['/nl', '/nl/behandelingen', '/en/contact']) {
    assert.equal(shouldHideChatWidget(pathname), false, pathname)
  }
})
