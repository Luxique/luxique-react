import type { ManualTreatmentKey } from './manual-bookings'

export type AvailabilityWindow = {
  date: string
  startTime: string
  endTime: string
}

export type ManualAvailabilityLedger = {
  version: 1
  treatmentKey: ManualTreatmentKey
  scheduleId: number
  removedWindows: AvailabilityWindow[]
}

export function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

export function windowsOverlap(a: AvailabilityWindow, b: AvailabilityWindow): boolean {
  return a.date === b.date
    && timeToMinutes(a.startTime) < timeToMinutes(b.endTime)
    && timeToMinutes(a.endTime) > timeToMinutes(b.startTime)
}

export function subtractWindow(
  source: AvailabilityWindow,
  blocked: AvailabilityWindow,
  minimumDurationMinutes: number,
): { remaining: AvailabilityWindow[]; removed: AvailabilityWindow | null } {
  if (!windowsOverlap(source, blocked)) return { remaining: [source], removed: null }

  const sourceStart = timeToMinutes(source.startTime)
  const sourceEnd = timeToMinutes(source.endTime)
  const blockedStart = timeToMinutes(blocked.startTime)
  const blockedEnd = timeToMinutes(blocked.endTime)
  const remaining: AvailabilityWindow[] = []

  if (blockedStart - sourceStart >= minimumDurationMinutes) {
    remaining.push({ ...source, endTime: blocked.startTime })
  }
  if (sourceEnd - blockedEnd >= minimumDurationMinutes) {
    remaining.push({ ...source, startTime: blocked.endTime })
  }

  // Record the complete source window. Re-merging this exact provenance with
  // any retained fragments reconstructs only availability that actually existed.
  return { remaining, removed: { ...source } }
}

export function mergeWindows(windows: AvailabilityWindow[]): AvailabilityWindow[] {
  const sorted = [...windows]
    .map(window => ({ ...window }))
    .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`))
  const merged: AvailabilityWindow[] = []
  for (const window of sorted) {
    const previous = merged[merged.length - 1]
    if (!previous || previous.date !== window.date || window.startTime > previous.endTime) {
      merged.push(window)
    } else if (window.endTime > previous.endTime) {
      previous.endTime = window.endTime
    }
  }
  return merged
}

export function isManualAvailabilityLedger(value: unknown): value is ManualAvailabilityLedger {
  if (!value || typeof value !== 'object') return false
  const ledger = value as Partial<ManualAvailabilityLedger>
  return ledger.version === 1
    && (ledger.treatmentKey === 'new_lash_set' || ledger.treatmentKey === 'fill_lash_set')
    && Number.isInteger(ledger.scheduleId)
    && Array.isArray(ledger.removedWindows)
    && ledger.removedWindows.every(window => Boolean(
      window
      && /^\d{4}-\d{2}-\d{2}$/.test(window.date)
      && /^\d{2}:\d{2}$/.test(window.startTime)
      && /^\d{2}:\d{2}$/.test(window.endTime),
    ))
}
