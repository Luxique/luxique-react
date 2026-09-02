-- Delivery state for 24-hour manual-booking reminders.
-- This migration only changes public.manual_bookings.

ALTER TABLE public.manual_bookings
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_error text;

CREATE INDEX IF NOT EXISTS manual_bookings_reminder_due_idx
  ON public.manual_bookings (slot_start)
  WHERE status = 'confirmed' AND reminder_sent_at IS NULL;
