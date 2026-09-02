BEGIN;

-- Keep exactly one row per Cal booking UID. Preserve paid rows first, then
-- rows already linked to Stripe, then pending rows, followed by the oldest
-- remaining row as a deterministic fallback.
CREATE TEMP TABLE paid_pending_bookings_before ON COMMIT DROP AS
SELECT id
FROM public.pending_bookings
WHERE status = 'paid';

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY cal_booking_uid
      ORDER BY
        CASE WHEN status = 'paid' THEN 0 ELSE 1 END,
        CASE WHEN stripe_session_id IS NOT NULL THEN 0 ELSE 1 END,
        CASE WHEN status = 'pending' THEN 0 ELSE 1 END,
        created_at ASC NULLS LAST,
        id ASC
    ) AS row_rank
  FROM public.pending_bookings
  WHERE cal_booking_uid IS NOT NULL
)
DELETE FROM public.pending_bookings AS booking
USING ranked
WHERE booking.id = ranked.id
  AND ranked.row_rank > 1;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM paid_pending_bookings_before AS paid_before
    LEFT JOIN public.pending_bookings AS booking
      ON booking.id = paid_before.id
    WHERE booking.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Safety check failed: a paid pending_bookings row would be lost';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS pending_bookings_cal_booking_uid_unique
  ON public.pending_bookings (cal_booking_uid);

COMMIT;
