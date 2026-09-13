export function shouldSyncLessonBlocks(
  dirtyLessonIds: ReadonlySet<string>,
  lessonId: string,
): boolean {
  return dirtyLessonIds.has(lessonId)
}

export function getBlockIdsToDelete(
  existingBlockIds: readonly string[],
  desiredBlockIds: readonly string[],
): string[] {
  const desired = new Set(desiredBlockIds)
  return existingBlockIds.filter(id => !desired.has(id))
}
