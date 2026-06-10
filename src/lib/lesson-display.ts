/**
 * Lesson display utilities for auto-numbering.
 * Content lessons get ascending numbers (Les 1, Les 2, …).
 * Quiz/Exam lessons get no number — just "Quiz" or "Eindtoets".
 */

export interface DisplayableLesson {
  id: string
  title: string
  lesson_type: 'content' | 'quiz' | 'exam'
}

export interface LessonDisplay {
  label: string          // e.g. "Les 1 · Introductie", "Quiz", "Eindtoets"
  shortLabel: string     // e.g. "Les 1", "Quiz", "Eindtoets"
  number: number | null  // lesson number for content, null for quiz/exam
}

/**
 * Build display labels for an ordered array of lessons.
 * Only content-type lessons are counted; quiz/exam are skipped.
 */
export function getLessonDisplays(lessons: DisplayableLesson[]): Map<string, LessonDisplay> {
  const map = new Map<string, LessonDisplay>()
  let contentIndex = 0

  // Count quizzes and exams separately for unique labeling
  let quizCount = 0
  let examCount = 0

  for (const lesson of lessons) {
    if (lesson.lesson_type === 'content') {
      contentIndex++
      map.set(lesson.id, {
        label: `Les ${contentIndex} · ${lesson.title}`,
        shortLabel: `Les ${contentIndex}`,
        number: contentIndex,
      })
    } else if (lesson.lesson_type === 'quiz') {
      quizCount++
      const quizLabel = quizCount > 1 ? `Quiz ${quizCount}` : 'Quiz'
      map.set(lesson.id, {
        label: quizLabel,
        shortLabel: quizLabel,
        number: null,
      })
    } else if (lesson.lesson_type === 'exam') {
      examCount++
      const examLabel = examCount > 1 ? `Eindtoets ${examCount}` : 'Eindtoets'
      map.set(lesson.id, {
        label: examLabel,
        shortLabel: examLabel,
        number: null,
      })
    }
  }

  return map
}

/**
 * Get display for a single lesson within a list context.
 */
export function getLessonDisplay(lessons: DisplayableLesson[], lessonId: string): LessonDisplay {
  const displays = getLessonDisplays(lessons)
  return displays.get(lessonId) || { label: 'Les', shortLabel: 'Les', number: null }
}

/**
 * Get the content lesson index for a lesson (1-based), or null for quiz/exam.
 */
export function getContentLessonNumber(lessons: DisplayableLesson[], lessonId: string): number | null {
  return getLessonDisplay(lessons, lessonId).number
}
