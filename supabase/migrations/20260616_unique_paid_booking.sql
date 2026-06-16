-- Partial unique index: only ONE 'paid' status per cal_booking_uid
-- Physically prevents double-payment at the database level
-- Second UPDATE/INSERT to 'paid' for same booking will fail with unique violation

CREATE UNIQUE INDEX IF NOT EXISTS pending_bookings_one_paid_per_booking
ON pending_bookings (cal_booking_uid)
WHERE status = 'paid';
