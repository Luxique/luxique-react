-- Customer-management fields for manual treatment bookings.
-- This migration only extends public.manual_bookings. It does not touch
-- pending_bookings or any payment/refund table.

ALTER TABLE public.manual_bookings
  ADD COLUMN IF NOT EXISTS salon_deposit_cents integer,
  ADD COLUMN IF NOT EXISTS salon_deposit_status text NOT NULL DEFAULT 'not_recorded',
  ADD COLUMN IF NOT EXISTS cancelled_within_24h boolean,
  ADD COLUMN IF NOT EXISTS rescheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS previous_cal_booking_uid text,
  ADD COLUMN IF NOT EXISTS sync_status text NOT NULL DEFAULT 'synced',
  ADD COLUMN IF NOT EXISTS sync_error text;

ALTER TABLE public.manual_bookings
  DROP CONSTRAINT IF EXISTS manual_bookings_salon_deposit_cents_check,
  DROP CONSTRAINT IF EXISTS manual_bookings_salon_deposit_status_check,
  DROP CONSTRAINT IF EXISTS manual_bookings_sync_status_check;

ALTER TABLE public.manual_bookings
  ADD CONSTRAINT manual_bookings_salon_deposit_cents_check
    CHECK (salon_deposit_cents IS NULL OR salon_deposit_cents >= 0),
  ADD CONSTRAINT manual_bookings_salon_deposit_status_check
    CHECK (salon_deposit_status IN ('paid', 'not_recorded')),
  ADD CONSTRAINT manual_bookings_sync_status_check
    CHECK (sync_status IN ('synced', 'cleanup_required'));
