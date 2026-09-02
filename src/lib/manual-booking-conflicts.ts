import type { SupabaseClient } from '@supabase/supabase-js'

const AMSTERDAM_TIME_ZONE = 'Europe/Amsterdam'
const MAX_TREATMENT_DURATION_MINUTES = 180

type ExistingTreatmentBooking = {
  id: string
  slot_start: string
  event_type: string | null
}

export type ManualBookingConflict = {
  type: 'booking' | 'trajectory'
  message: string
}

export function intervalsOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return new Date(startA).getTime() < new Date(endB).getTime()
    && new Date(endA).getTime() > new Date(startB).getTime()
}

function treatmentDurationMinutes(eventType: string | null): number {
  const normalized = (eventType || '').toLowerCase()
  return normalized.includes('fill') || normalized.includes('opvullen') ? 120 : 180
}

function localDate(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: AMSTERDAM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

export async function findManualBookingConflict(
  supabase: SupabaseClient,
  candidateStart: string,
  candidateEnd: string,
  ignoreManualBookingId?: string,
): Promise<ManualBookingConflict | null> {
  const date = localDate(candidateStart)

  const { data: trajectory, error: trajectoryError } = await supabase
    .from('traject_klassen')
    .select('id')
    .in('status', ['open', 'vol'])
    .contains('blok_dagen', [date])
    .limit(1)
    .maybeSingle()

  if (trajectoryError) throw new Error(`Trajectcontrole mislukt: ${trajectoryError.message}`)
  if (trajectory) return { type: 'trajectory', message: 'Op deze dag loopt een traject.' }

  let manualQuery = supabase
    .from('manual_bookings')
    .select('id')
    .eq('status', 'confirmed')
    .lt('slot_start', candidateEnd)
    .gt('slot_end', candidateStart)
    .limit(1)
  if (ignoreManualBookingId) manualQuery = manualQuery.neq('id', ignoreManualBookingId)
  const { data: manual, error: manualError } = await manualQuery.maybeSingle()

  if (manualError) throw new Error(`Handmatige boekingen controleren mislukt: ${manualError.message}`)
  if (manual) return { type: 'booking', message: 'Er staat al een boeking op dit moment.' }

  const earliestRelevantStart = new Date(
    new Date(candidateStart).getTime() - MAX_TREATMENT_DURATION_MINUTES * 60_000,
  ).toISOString()
  const { data: existingBookings, error: bookingError } = await supabase
    .from('pending_bookings')
    .select('id, slot_start, event_type')
    .in('status', ['pending', 'paid'])
    .gte('slot_start', earliestRelevantStart)
    .lt('slot_start', candidateEnd)

  if (bookingError) throw new Error(`Bestaande boekingen controleren mislukt: ${bookingError.message}`)

  const overlap = ((existingBookings || []) as ExistingTreatmentBooking[]).some(booking => {
    const existingEnd = new Date(
      new Date(booking.slot_start).getTime() + treatmentDurationMinutes(booking.event_type) * 60_000,
    ).toISOString()
    return intervalsOverlap(candidateStart, candidateEnd, booking.slot_start, existingEnd)
  })

  return overlap ? { type: 'booking', message: 'Er staat al een boeking op dit moment.' } : null
}
