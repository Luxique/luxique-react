export interface HierarchyLesson {
  id: string
  parentId?: string
}

export const LESSON_NEST_THRESHOLD_PX = 36

/** Flatten lessons as parent followed by its children, preserving sibling order. */
export function flattenLessonHierarchy<T extends HierarchyLesson>(lessons: T[]): T[] {
  const ids = new Set(lessons.map(lesson => lesson.id))
  const result: T[] = []
  for (const lesson of lessons) {
    if (lesson.parentId && ids.has(lesson.parentId)) continue
    result.push({ ...lesson, parentId: undefined })
    result.push(...lessons.filter(child => child.parentId === lesson.id))
  }
  return result
}

/**
 * Reorder one lesson (and its children) and change nesting only after a deliberate
 * horizontal movement. Vertical scrolling/reordering alone therefore cannot nest.
 */
export function moveLessonInHierarchy<T extends HierarchyLesson>(
  lessons: T[],
  activeId: string,
  overId: string,
  horizontalDelta: number,
): T[] {
  const flat = flattenLessonHierarchy(lessons)
  const active = flat.find(lesson => lesson.id === activeId)
  const overIndex = flat.findIndex(lesson => lesson.id === overId)
  if (!active || overIndex < 0 || activeId === overId) return flat

  const movingIds = new Set([activeId])
  if (!active.parentId) {
    flat.filter(lesson => lesson.parentId === activeId).forEach(lesson => movingIds.add(lesson.id))
  }
  const moving = flat.filter(lesson => movingIds.has(lesson.id))
  const remaining = flat.filter(lesson => !movingIds.has(lesson.id))
  const over = flat[overIndex]
  const activeIndex = flat.findIndex(lesson => lesson.id === activeId)

  let nextParentId = active.parentId
  if (horizontalDelta <= -LESSON_NEST_THRESHOLD_PX) {
    nextParentId = undefined
  } else if (horizontalDelta >= LESSON_NEST_THRESHOLD_PX) {
    const candidate = over.parentId
      ? remaining.find(lesson => lesson.id === over.parentId)
      : over
    if (candidate && candidate.id !== activeId) nextParentId = candidate.id
  }

  const normalizedMoving = moving.map((lesson, index) => ({
    ...lesson,
    parentId: index === 0 ? nextParentId : nextParentId ? undefined : activeId,
  }))
  const targetIndex = Math.max(0, remaining.findIndex(lesson => lesson.id === overId))
  let insertionIndex = targetIndex + (activeIndex < overIndex ? 1 : 0)
  if (nextParentId) {
    const parentIndex = remaining.findIndex(lesson => lesson.id === nextParentId)
    insertionIndex = parentIndex + 1
    while (insertionIndex < remaining.length && remaining[insertionIndex].parentId === nextParentId) insertionIndex++
  }
  remaining.splice(insertionIndex, 0, ...normalizedMoving)
  return flattenLessonHierarchy(remaining)
}
