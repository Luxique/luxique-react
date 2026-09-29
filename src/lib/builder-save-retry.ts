export type SaveOperationResult = {
  error?: { message?: string | null } | null
}

const NETWORK_ERROR_PATTERNS = [
  'failed to fetch',
  'fetch failed',
  'networkerror',
  'network error',
  'load failed',
]

export function isRetryableSaveNetworkError(error: unknown): boolean {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : String(error ?? '')

  const normalized = message.toLowerCase()
  return NETWORK_ERROR_PATTERNS.some(pattern => normalized.includes(pattern))
}

export async function retryBuilderSaveOperation<T extends SaveOperationResult>(
  operation: () => PromiseLike<T>,
  options: { attempts?: number; delayMs?: number } = {},
): Promise<T> {
  const attempts = Math.max(1, options.attempts ?? 3)
  const delayMs = Math.max(0, options.delayMs ?? 350)
  let lastThrownError: unknown

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const result = await operation()
      if (!result.error || !isRetryableSaveNetworkError(result.error) || attempt === attempts) {
        return result
      }
    } catch (error) {
      lastThrownError = error
      if (!isRetryableSaveNetworkError(error) || attempt === attempts) throw error
    }

    await new Promise(resolve => setTimeout(resolve, delayMs * attempt))
  }

  throw lastThrownError ?? new Error('Save operation failed without a response')
}

export function getBuilderSaveErrorMessage(error: unknown, action: 'opslaan' | 'publiceren'): string {
  if (isRetryableSaveNetworkError(error)) {
    return `De verbinding viel weg tijdens het ${action}. Je wijzigingen staan nog in de builder. Controleer je internetverbinding en probeer het opnieuw.`
  }

  return action === 'publiceren'
    ? 'Publiceren is niet gelukt. Je wijzigingen staan nog in de builder. Probeer het opnieuw.'
    : 'Opslaan is niet gelukt. Je wijzigingen staan nog in de builder. Probeer het opnieuw.'
}
