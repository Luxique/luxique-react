export type CertificateReleaseState = {
  courseCompletedAt: string | null
  reviewRequired: boolean
  releasedAt: string | null
}

export function certificateIsAvailable(state: CertificateReleaseState): boolean {
  if (!state.courseCompletedAt) return false
  return !state.reviewRequired || Boolean(state.releasedAt)
}

export function certificateReleaseStatus(state: CertificateReleaseState) {
  return {
    completed: Boolean(state.courseCompletedAt),
    reviewRequired: state.reviewRequired,
    released: Boolean(state.releasedAt),
    certificateAvailable: certificateIsAvailable(state),
    completedAt: state.courseCompletedAt,
    releasedAt: state.releasedAt,
  }
}

