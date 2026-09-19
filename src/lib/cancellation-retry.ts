const TERMINAL_PAST_BOOKING_MESSAGES = [
  'Cannot cancel a booking that has already ended',
  'booking has already ended',
]

export function isTerminalPastBookingCancellationError(message: string): boolean {
  const normalized = message.toLowerCase()
  return TERMINAL_PAST_BOOKING_MESSAGES.some(candidate => normalized.includes(candidate.toLowerCase()))
}
