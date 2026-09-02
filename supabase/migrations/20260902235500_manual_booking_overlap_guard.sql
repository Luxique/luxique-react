-- Hard database guard against concurrent overlapping manual bookings.
-- This migration only changes public.manual_bookings.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'manual_bookings_no_confirmed_overlap'
      AND conrelid = 'public.manual_bookings'::regclass
  ) THEN
    ALTER TABLE public.manual_bookings
      ADD CONSTRAINT manual_bookings_no_confirmed_overlap
      EXCLUDE USING gist (
        tstzrange(slot_start, slot_end, '[)') WITH &&
      )
      WHERE (status = 'confirmed');
  END IF;
END $$;
