export const ACADEMY_PREVIEW_PARAM = 'preview'
export const ACADEMY_PREVIEW_VALUE = 'admin'

export function getAcademyPreviewSuffix(enabled: boolean) {
  return enabled ? `?${ACADEMY_PREVIEW_PARAM}=${ACADEMY_PREVIEW_VALUE}` : ''
}

export function isAdminConceptPreview({ requested, role, status }: {
  requested: boolean
  role: string | null
  status?: string | null
}) {
  return requested && role === 'admin' && status !== 'published'
}
