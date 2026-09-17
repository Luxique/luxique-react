import assert from 'node:assert/strict'
import test from 'node:test'
import { MEDUSA_TRAJECTORY_CONTENT } from './medusa-trajectory-content.ts'
import { TRAJECT_COURSE_IDS, getTrajectoryProgramme } from './trajectory-programme.ts'
import { renderTrajectoryProgrammeHtml } from './trajectory-email-content.ts'

test('site and both trajectory emails share the exact Medusa source', () => {
  const programme = getTrajectoryProgramme(TRAJECT_COURSE_IDS.medusa, 'Medusa Masterclass')
  assert.deepEqual(programme?.days, MEDUSA_TRAJECTORY_CONTENT.days)
  const html = renderTrajectoryProgrammeHtml(TRAJECT_COURSE_IDS.medusa, 'Medusa Masterclass')
  const required = [
    ...MEDUSA_TRAJECTORY_CONTENT.days.flatMap(day => [day.label, day.title, day.description, ...day.groups.flatMap(group => [group.title, ...group.items])]),
    MEDUSA_TRAJECTORY_CONTENT.modelWarning.title,
    MEDUSA_TRAJECTORY_CONTENT.modelWarning.text,
    MEDUSA_TRAJECTORY_CONTENT.included.title,
    ...MEDUSA_TRAJECTORY_CONTENT.included.items,
    MEDUSA_TRAJECTORY_CONTENT.investment.title,
    MEDUSA_TRAJECTORY_CONTENT.investment.price,
    MEDUSA_TRAJECTORY_CONTENT.investment.priceLabel,
    MEDUSA_TRAJECTORY_CONTENT.investment.certificate,
  ]
  for (const text of required) assert.ok(html.includes(text), `Missing email content: ${text}`)
})
