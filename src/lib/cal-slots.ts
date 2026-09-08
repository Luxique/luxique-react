export type CalAvailabilitySlot = {
  start: string
  time: string
}

function readSlotStart(slot: unknown): string | null {
  if (typeof slot === 'string') return slot
  if (!slot || typeof slot !== 'object') return null

  const start = (slot as { start?: unknown }).start
  return typeof start === 'string' ? start : null
}

export function normalizeCalAvailabilitySlots(
  value: unknown,
  timeZone: string,
): CalAvailabilitySlot[] {
  // Cal omits the requested date key when that day has no availability.
  if (value == null) return []
  if (!Array.isArray(value)) {
    throw new Error('Cal.com gaf een ongeldig beschikbaarheidsformaat terug.')
  }

  return value.map(slot => {
    const start = readSlotStart(slot)
    if (!start || !Number.isFinite(new Date(start).getTime())) {
      throw new Error('Cal.com gaf een ongeldig tijdslot terug.')
    }

    return {
      start,
      time: new Intl.DateTimeFormat('nl-NL', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date(start)),
    }
  })
}
