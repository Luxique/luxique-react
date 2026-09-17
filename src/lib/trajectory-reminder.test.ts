import test from 'node:test'
import assert from 'node:assert/strict'
import { renderTrajectoryProgrammeHtml } from './trajectory-email-content.ts'
import { TRAJECT_COURSE_IDS } from './trajectory-programme.ts'
import { getAmsterdamDateKeyAfterDays } from './booking-date-time.ts'
import { runTrajectoryReminderCandidates, type TrajectoryReminderCandidate } from './trajectory-reminder-runner.ts'

const booking: TrajectoryReminderCandidate = {
  id: 'test-booking-medusa',
  cursus_id: TRAJECT_COURSE_IDS.medusa,
  cursus_naam: 'Medusa Masterclass',
  startdatum: '2026-10-28',
  starttijd: '09:00:00',
  blok_dagen: ['2026-10-28', '2026-10-29', '2026-10-30'],
  klant_naam: 'Test Klant',
  klant_email: 'test@example.com',
  aanbetaling_cents: 31460,
  restbedrag_cents: 125840,
}

test('multi-day confirmation/reminder programme contains every Medusa day and model warning', () => {
  const html = renderTrajectoryProgrammeHtml(booking.cursus_id, booking.cursus_naam)
  assert.match(html, /Dag 1/)
  assert.match(html, /De Medusa techniek/)
  assert.match(html, /Dag 2/)
  assert.match(html, /Van demonstratie naar uitvoering · modeldag/)
  assert.match(html, /Dag 3/)
  assert.match(html, /Zelfstandig Medusa design · modeldag/)
  assert.match(html, /LET OP — MODEL VEREIST/)
  assert.match(html, /Je regelt zelf een model voor beide modeldagen, dag 2 en dag 3/)
  assert.match(html, /Medusa certificaat bij voldoende beheersing/)
})

test('Amsterdam date selection remains two local calendar days ahead across DST end', () => {
  assert.equal(getAmsterdamDateKeyAfterDays(new Date('2026-10-24T21:30:00Z'), 2), '2026-10-26')
  assert.equal(getAmsterdamDateKeyAfterDays(new Date('2026-10-24T22:30:00Z'), 2), '2026-10-27')
})

test('atomic claim prevents a second cron run from sending the same booking', async () => {
  const claimed = new Set<string>()
  const sent: string[] = []
  const run = () => runTrajectoryReminderCandidates(
    [booking],
    async (id) => claimed.has(id) ? false : (claimed.add(id), true),
    async (candidate) => { sent.push(candidate.id) },
    async (id) => { claimed.delete(id) },
  )

  assert.deepEqual((await run()).map((result) => result.action), ['sent'])
  assert.deepEqual((await run()).map((result) => result.action), ['skipped'])
  assert.deepEqual(sent, ['test-booking-medusa'])
})

test('failed send releases the claim for a later retry', async () => {
  const claimed = new Set<string>()
  let attempts = 0
  const run = () => runTrajectoryReminderCandidates(
    [booking],
    async (id) => claimed.has(id) ? false : (claimed.add(id), true),
    async () => { attempts += 1; if (attempts === 1) throw new Error('test failure') },
    async (id) => { claimed.delete(id) },
  )

  assert.equal((await run())[0].action, 'error')
  assert.equal((await run())[0].action, 'sent')
  assert.equal(attempts, 2)
})
