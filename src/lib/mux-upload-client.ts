export const MUX_ASSET_POLL_INTERVAL_MS = 2_000
export const MUX_ASSET_POLL_TIMEOUT_MS = 30 * 60 * 1_000

type JsonRecord = Record<string, unknown>

export function getMuxErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback
  const error = (payload as JsonRecord).error
  if (typeof error === 'string' && error.trim()) return error
  return fallback
}

export function requireMuxUpload(
  responseOk: boolean,
  payload: unknown,
): { uploadUrl: string; uploadId: string } {
  if (!responseOk) {
    throw new Error(getMuxErrorMessage(payload, 'Mux kon de upload niet starten.'))
  }

  const record = payload && typeof payload === 'object' ? payload as JsonRecord : {}
  const uploadUrl = record.upload_url
  const uploadId = record.upload_id
  if (typeof uploadUrl !== 'string' || !uploadUrl || typeof uploadId !== 'string' || !uploadId) {
    throw new Error('Mux gaf geen geldige upload-URL of upload-ID terug.')
  }

  return { uploadUrl, uploadId }
}

export function requireMuxAssetStatus(responseOk: boolean, payload: unknown): JsonRecord {
  if (!responseOk) {
    throw new Error(getMuxErrorMessage(payload, 'Mux-verwerking kon niet worden gecontroleerd.'))
  }
  if (!payload || typeof payload !== 'object') {
    throw new Error('Mux gaf een ongeldig verwerkingsantwoord terug.')
  }
  return payload as JsonRecord
}
