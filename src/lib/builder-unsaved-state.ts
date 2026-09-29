export function resetUnsavedStateAfterSuccessfulSave(
  saveStartedAtRevision: number,
  currentRevision: number,
  dirtyLessonIds: Set<string>,
) {
  if (currentRevision !== saveStartedAtRevision) return false

  dirtyLessonIds.clear()
  return true
}
