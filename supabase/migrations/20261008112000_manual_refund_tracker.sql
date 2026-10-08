-- Admin visibility layer for manual in-salon deposit refunds.
-- Eligibility deliberately reuses cancelled_within_24h, which is written by
-- the existing cancellation flow using its canonical 24-hour calculation.

ALTER TABLE public.manual_bookings
  ADD COLUMN IF NOT EXISTS refund_required_at timestamptz,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
  ADD COLUMN IF NOT EXISTS refunded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.track_manual_booking_refund()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'cancelled'
     AND NEW.salon_deposit_status = 'paid'
     AND COALESCE(NEW.salon_deposit_cents, 0) > 0
     AND NEW.cancelled_within_24h IS FALSE
     AND NEW.refund_required_at IS NULL THEN
    NEW.refund_required_at := COALESCE(NEW.cancelled_at, NEW.cancellation_requested_at, now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS manual_bookings_refund_tracker ON public.manual_bookings;
CREATE TRIGGER manual_bookings_refund_tracker
  BEFORE INSERT OR UPDATE OF status, salon_deposit_status, salon_deposit_cents,
    cancelled_within_24h, cancelled_at
  ON public.manual_bookings
  FOR EACH ROW EXECUTE FUNCTION public.track_manual_booking_refund();

-- Historical backfill: real customer accounts only. Admin-owned test bookings
-- are intentionally excluded. Online/Stripe bookings are in another table and
-- can never enter this tracker.
UPDATE public.manual_bookings AS booking
SET refund_required_at = COALESCE(booking.cancelled_at, booking.cancellation_requested_at, now())
FROM public.profiles AS profile
WHERE profile.id = booking.user_id
  AND profile.role <> 'admin'
  AND booking.status = 'cancelled'
  AND booking.salon_deposit_status = 'paid'
  AND COALESCE(booking.salon_deposit_cents, 0) > 0
  AND booking.cancelled_within_24h IS FALSE
  AND booking.refund_required_at IS NULL;

CREATE INDEX IF NOT EXISTS manual_bookings_open_refund_idx
  ON public.manual_bookings (refund_required_at)
  WHERE refund_required_at IS NOT NULL AND refunded_at IS NULL;

COMMENT ON COLUMN public.manual_bookings.refund_required_at IS
  'Set only for a paid in-salon deposit cancelled outside 24 hours; derived from canonical cancellation result.';
COMMENT ON COLUMN public.manual_bookings.refunded_at IS
  'Reversible admin acknowledgement that the manual refund was paid.';

