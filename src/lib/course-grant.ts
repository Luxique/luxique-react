export const COURSE_GRANT_TIMEOUT_MS = 15_000

export function withCourseGrantTimeout<T>(
  operation: PromiseLike<T>,
  timeoutMs = COURSE_GRANT_TIMEOUT_MS,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('COURSE_GRANT_TIMEOUT')), timeoutMs)
    Promise.resolve(operation).then(
      value => { clearTimeout(timeout); resolve(value) },
      error => { clearTimeout(timeout); reject(error) },
    )
  })
}

export function courseGrantErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message === 'COURSE_GRANT_TIMEOUT') {
    return 'Toewijzen duurde te lang. Controleer je verbinding en probeer opnieuw.'
  }
  return 'Toewijzen mislukt. Controleer de cursist en cursus en probeer opnieuw.'
}
