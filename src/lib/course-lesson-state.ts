export function updateLessonById<T extends { id: string }>(
  lessons: T[] | undefined,
  lessonId: string,
  updates: Partial<T>,
): T[] {
  return (lessons || []).map(lesson =>
    lesson.id === lessonId ? { ...lesson, ...updates } : lesson
  )
}
