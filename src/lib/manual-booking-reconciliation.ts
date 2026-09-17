export function reconcileManualBookingUids<T extends Record<string, unknown>>(
  calBookings: T[],
  activeManualBookings: T[],
  cancelledManualUids: unknown[],
): Map<string, T> {
  const bookingsByUid = new Map<string, T>(
    calBookings.map(booking => [String(booking.uid), booking]),
  )

  for (const booking of activeManualBookings) {
    bookingsByUid.set(String(booking.uid), booking)
  }
  for (const uid of cancelledManualUids) {
    if (uid) bookingsByUid.delete(String(uid))
  }

  return bookingsByUid
}
