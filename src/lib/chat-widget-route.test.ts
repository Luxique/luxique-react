import assert from 'node:assert/strict'
import test from 'node:test'
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { isCustomerAcademyRoute, shouldHideChatWidget } from './chat-widget-route.ts'

test('matches course overviews and every nested customer Academy state', () => {
  for (const pathname of ['/nl/academy/test-course', '/en/academy/test-course/', '/nl/academy/test-course/lesson-1', '/academy/test-course/final-exam']) {
    assert.equal(isCustomerAcademyRoute(pathname), true, pathname)
  }

  for (const pathname of ['/nl/courses', '/cursus/test-course', '/admin/courses/course-id/builder']) {
    assert.equal(isCustomerAcademyRoute(pathname), false, pathname)
  }
})

test('hides the widget on admin, customer dashboards, and all Academy interior routes', () => {
  for (const pathname of ['/admin', '/admin/customers', '/dashboard', '/nl/dashboard', '/en/dashboard/bookings', '/nl/academy/test-course', '/nl/academy/test-course/lesson-1']) {
    assert.equal(shouldHideChatWidget(pathname), true, pathname)
  }
})

test('keeps the widget on public localized routes', () => {
  for (const pathname of ['/nl', '/nl/behandelingen', '/en/contact']) {
    assert.equal(shouldHideChatWidget(pathname), false, pathname)
  }
})
