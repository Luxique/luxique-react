/**
 * Lesson display utilities for auto-numbering.
 *
 * SINDS AUG 2026 — subles-ondersteuning:
 * Lessen kunnen een parent_lesson_id hebben (subles). Nummering:
 *   - Top-level content lessen tellen op: Les 1, Les 2, …
 *   - Sublessen krijgen hoofdstuk.nummer: Les 1.1, Les 1.2, …
 *   - Quiz/Exam lessen krijgen geen nummer — alleen "Quiz" of "Eindtoets"
 *
 * De volgorde van de input-array is leidend (sort_order): sublessen staan
 * direct na hun parent. Wees-sublessen (parent bestaat niet in de array)
 * worden als top-level genummerd.
 */

export interface DisplayableLesson {
  id: string
  title: string
  lesson_type: 'content' | 'quiz' | 'exam'
  parent_lesson_id?: string | null
}

export interface LessonDisplay {
  label: string          // e.g. "Les 1.2 · Introductie", "Quiz", "Eindtoets"
  shortLabel: string     // e.g. "Les 1.2", "Quiz", "Eindtoets"
  number: string | null  // "1", "1.2" for content, null for quiz/exam
  isSub: boolean         // true als dit een subles is
}

/**
 * Build display labels for an ordered array of lessons.
 * Only content-type lessons are counted; quiz/exam are skipped.
 */
export function getLessonDisplays(lessons: DisplayableLesson[]): Map<string, LessonDisplay> {
  const map = new Map<string, LessonDisplay>()

  const byId = new Map(lessons.map(l => [l.id, l]))
  const childrenOf = new Map<string, DisplayableLesson[]>()
  for (const lesson of lessons) {
    if (lesson.parent_lesson_id && byId.has(lesson.parent_lesson_id)) {
      const arr = childrenOf.get(lesson.parent_lesson_id) || []
      arr.push(lesson)
      childrenOf.set(lesson.parent_lesson_id, arr)
    }
  }

  let topIndex = 0
  let quizCount = 0
  let examCount = 0

  for (const lesson of lessons) {
    const isSub = !!(lesson.parent_lesson_id && byId.has(lesson.parent_lesson_id))
    if (isSub) continue // sublessen worden bij hun parent behandeld

    if (lesson.lesson_type === 'content') {
      topIndex++
      map.set(lesson.id, {
        label: `Les ${topIndex} · ${lesson.title}`,
        shortLabel: `Les ${topIndex}`,
        number: String(topIndex),
        isSub: false,
      })

      // Sublessen onder deze les: {topIndex}.{n}
      const children = childrenOf.get(lesson.id) || []
      let subIndex = 0
      for (const child of children) {
        if (child.lesson_type === 'content') {
          subIndex++
          map.set(child.id, {
            label: `Les ${topIndex}.${subIndex} · ${child.title}`,
            shortLabel: `Les ${topIndex}.${subIndex}`,
            number: `${topIndex}.${subIndex}`,
            isSub: true,
          })
        } else if (child.lesson_type === 'quiz') {
          quizCount++
          const quizLabel = quizCount > 1 ? `Quiz ${quizCount}` : 'Quiz'
          map.set(child.id, { label: quizLabel, shortLabel: quizLabel, number: null, isSub: true })
        } else if (child.lesson_type === 'exam') {
          examCount++
          const examLabel = examCount > 1 ? `Eindtoets ${examCount}` : 'Eindtoets'
          map.set(child.id, { label: examLabel, shortLabel: examLabel, number: null, isSub: true })
        }
      }
    } else if (lesson.lesson_type === 'quiz') {
      quizCount++
      const quizLabel = quizCount > 1 ? `Quiz ${quizCount}` : 'Quiz'
      map.set(lesson.id, { label: quizLabel, shortLabel: quizLabel, number: null, isSub: false })
    } else if (lesson.lesson_type === 'exam') {
      examCount++
      const examLabel = examCount > 1 ? `Eindtoets ${examCount}` : 'Eindtoets'
      map.set(lesson.id, { label: examLabel, shortLabel: examLabel, number: null, isSub: false })
    }
  }

  // Wees-sublessen (parent niet in array) → als top-level nummeren
  for (const lesson of lessons) {
    if (map.has(lesson.id)) continue
    if (lesson.lesson_type === 'content') {
      topIndex++
      map.set(lesson.id, {
        label: `Les ${topIndex} · ${lesson.title}`,
        shortLabel: `Les ${topIndex}`,
        number: String(topIndex),
        isSub: false,
      })
    } else if (lesson.lesson_type === 'quiz') {
      quizCount++
      const quizLabel = quizCount > 1 ? `Quiz ${quizCount}` : 'Quiz'
      map.set(lesson.id, { label: quizLabel, shortLabel: quizLabel, number: null, isSub: false })
    } else if (lesson.lesson_type === 'exam') {
      examCount++
      const examLabel = examCount > 1 ? `Eindtoets ${examCount}` : 'Eindtoets'
      map.set(lesson.id, { label: examLabel, shortLabel: examLabel, number: null, isSub: false })
    }
  }

  return map
}

/**
 * Get display for a single lesson within a list context.
 */
export function getLessonDisplay(lessons: DisplayableLesson[], lessonId: string): LessonDisplay {
  const displays = getLessonDisplays(lessons)
  return displays.get(lessonId) || { label: 'Les', shortLabel: 'Les', number: null, isSub: false }
}

/**
 * Get the content lesson number string for a lesson ("1", "1.2"), or null for quiz/exam.
 */
export function getContentLessonNumber(lessons: DisplayableLesson[], lessonId: string): string | null {
  return getLessonDisplay(lessons, lessonId).number
}
