ALTER TABLE public.manual_bookings
  ADD COLUMN IF NOT EXISTS note text;

ALTER TABLE public.manual_bookings
  DROP CONSTRAINT IF EXISTS manual_bookings_note_length_check;

ALTER TABLE public.manual_bookings
  ADD CONSTRAINT manual_bookings_note_length_check
  CHECK (note IS NULL OR char_length(note) <= 2000);

COMMENT ON COLUMN public.manual_bookings.note IS
  'Optional internal note entered by Chiva while creating a manual booking.';
