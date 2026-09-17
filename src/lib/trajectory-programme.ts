import nlMessages from '../../messages/nl.json' with { type: 'json' }
import { MEDUSA_TRAJECTORY_CONTENT } from './medusa-trajectory-content.ts'

const copy = nlMessages.PersoonlijkTraject as Record<string, string>

export const TRAJECT_COURSE_IDS = {
  beginner: 'ac16d676-cb17-43ea-a3a7-a1dce56c143a',
  wispy: 'b43062ef-2756-4d9f-90fe-962e2abd1548',
  medusa: 'e33310cb-2c73-4f8e-a878-ecaf35c5a4c3',
  techToArtist: 'af8adfc8-ae38-4869-bf8a-e3dd9381c231',
} as const

export interface TrajectoryProgrammeGroup {
  title?: string
  items: string[]
}

export interface TrajectoryProgrammeDay {
  label: string
  title: string
  description?: string
  groups: TrajectoryProgrammeGroup[]
}

export interface TrajectoryProgramme {
  days: TrajectoryProgrammeDay[]
  modelWarning?: { title: string; text: string }
  included?: { title: string; items: string[] }
  investment?: { title: string; price: string; priceLabel: string; certificate: string }
}

const values = (...keys: string[]) => keys.map((key) => copy[key])
const numberedValues = (prefix: string, count: number) =>
  values(...Array.from({ length: count }, (_, index) => `${prefix}${index + 1}`))

const programmes: Record<string, TrajectoryProgramme> = {
  [TRAJECT_COURSE_IDS.beginner]: {
    days: [
      { label: copy.dp1Day1Label, title: copy.dp1Day1Title, description: copy.dp1Day1Desc, groups: [{ items: numberedValues('dp1Day1Item', 8) }] },
      { label: copy.dp1Day2Label, title: copy.dp1Day2Title, description: copy.dp1Day2Desc, groups: [{ items: numberedValues('dp1Day2Item', 5) }] },
      { label: copy.dp1Day3Label, title: copy.dp1Day3Title, description: copy.dp1Day3Desc, groups: [{ items: numberedValues('dp1Day3Item', 6) }] },
      { label: copy.dp1Day4Label, title: copy.dp1Day4Title, description: copy.dp1Day4Desc, groups: [{ items: numberedValues('dp1Day4Item', 4) }] },
    ],
    modelWarning: { title: copy.modelWarningTitle, text: copy.dp1ModelWarning },
  },
  [TRAJECT_COURSE_IDS.wispy]: {
    days: [{
      label: 'Dag 1',
      title: copy.dp2LearnTitle,
      groups: [
        { title: copy.dp2Group1Title, items: numberedValues('dp2Group1Item', 5) },
        { title: copy.dp2Group2Title, items: numberedValues('dp2Group2Item', 5) },
        { title: copy.dp2Group3Title, items: numberedValues('dp2Group3Item', 8) },
      ],
    }],
    modelWarning: { title: copy.modelWarningTitle, text: copy.dp2ModelWarning },
  },
  [TRAJECT_COURSE_IDS.medusa]: {
    days: MEDUSA_TRAJECTORY_CONTENT.days.map(day => ({ ...day, groups: day.groups.map(group => ({ ...group, items: [...group.items] })) })),
    modelWarning: { ...MEDUSA_TRAJECTORY_CONTENT.modelWarning },
    included: { ...MEDUSA_TRAJECTORY_CONTENT.included, items: [...MEDUSA_TRAJECTORY_CONTENT.included.items] },
    investment: { ...MEDUSA_TRAJECTORY_CONTENT.investment },
  },
  [TRAJECT_COURSE_IDS.techToArtist]: {
    days: [
      {
        label: copy.dp4Day1Label,
        title: copy.dp4Day1Title,
        groups: [
          { title: copy.dp4Day1Group1Title, items: numberedValues('dp4Day1Group1Item', 7) },
          { title: copy.dp4Day1Group2Title, items: numberedValues('dp4Day1Group2Item', 5) },
        ],
      },
      {
        label: copy.dp4Day2Label,
        title: copy.dp4Day2Title,
        description: copy.dp4Day2Desc,
        groups: [
          { title: copy.dp4Day2Group1Title, items: numberedValues('dp4Day2Group1Item', 4) },
          { title: copy.dp4Day2Group2Title, items: numberedValues('dp4Day2Group2Item', 4) },
        ],
      },
      {
        label: copy.dp4Day3Label,
        title: copy.dp4Day3Title,
        description: copy.dp4Day3Desc,
        groups: [
          { title: copy.dp4Day3Group1Title, items: numberedValues('dp4Day3Group1Item', 4) },
          { title: copy.dp4Day3Group2Title, items: numberedValues('dp4Day3Group2Item', 4) },
        ],
      },
    ],
    modelWarning: { title: copy.modelWarningTitle, text: copy.dp4ModelWarning },
  },
}

const courseIdByName: Record<string, string> = {
  'beginner lash artist': TRAJECT_COURSE_IDS.beginner,
  'wispy masterclass': TRAJECT_COURSE_IDS.wispy,
  'medusa masterclass': TRAJECT_COURSE_IDS.medusa,
  'lash tech to artist': TRAJECT_COURSE_IDS.techToArtist,
}

export function getTrajectoryProgramme(courseId: string | null | undefined, courseName?: string): TrajectoryProgramme | null {
  const resolvedId = courseId || courseIdByName[courseName?.trim().toLowerCase() || '']
  return resolvedId ? programmes[resolvedId] ?? null : null
}
