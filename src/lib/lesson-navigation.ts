export interface NavigableLesson {
  title?: string | null
}

export function getNextLessonButtonLabel(nextLesson: NavigableLesson | null) {
  return nextLesson?.title?.trim() || 'Volgende les'
}
