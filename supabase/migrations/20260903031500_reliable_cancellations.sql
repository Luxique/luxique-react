-- Retryable Cal.com cancellations. No payment, Stripe, checkout, webhook or refund mutation.
ALTER TABLE public.pending_bookings
  ADD COLUMN IF NOT EXISTS cancellation_error text,
  ADD COLUMN IF NOT EXISTS cancellation_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_refund_eligible boolean NOT NULL DEFAULT false;

ALTER TABLE public.manual_bookings
  ADD COLUMN IF NOT EXISTS cancellation_requested_at timestamptz;

ALTER TABLE public.pending_bookings
  DROP CONSTRAINT IF EXISTS pending_bookings_status_check;

ALTER TABLE public.pending_bookings
  ADD CONSTRAINT pending_bookings_status_check
    CHECK (status IN ('pending', 'paid', 'cancelled', 'expired', 'cancellation_pending'));

ALTER TABLE public.manual_bookings
  DROP CONSTRAINT IF EXISTS manual_bookings_status_check,
  DROP CONSTRAINT IF EXISTS manual_bookings_sync_status_check;

ALTER TABLE public.manual_bookings
  ADD CONSTRAINT manual_bookings_status_check
    CHECK (status IN ('confirmed', 'cancelled', 'cancellation_pending')),
  ADD CONSTRAINT manual_bookings_sync_status_check
    CHECK (sync_status IN ('synced', 'cleanup_required', 'cancellation_pending'));

CREATE INDEX IF NOT EXISTS pending_bookings_cancellation_retry_idx
  ON public.pending_bookings (cancellation_requested_at)
  WHERE status = 'cancellation_pending';

CREATE INDEX IF NOT EXISTS manual_bookings_cancellation_retry_idx
  ON public.manual_bookings (cancellation_requested_at)
  WHERE status = 'cancellation_pending';
