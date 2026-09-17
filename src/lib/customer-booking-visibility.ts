type CustomerBookingSource = 'online' | 'manual'

export function isActiveCustomerBooking(source: CustomerBookingSource, status: unknown) {
  const normalizedStatus = String(status || '').trim().toLowerCase()
  return source === 'online'
    ? normalizedStatus === 'paid'
    : normalizedStatus === 'confirmed'
}
