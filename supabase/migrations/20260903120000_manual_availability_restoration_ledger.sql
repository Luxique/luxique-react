-- Provenance ledger and cancellation/restoration state separation.
-- Apply manually before deploying the matching application code.

ALTER TABLE public.manual_bookings
  ADD COLUMN IF NOT EXISTS availability_restoration_ledger jsonb,
  ADD COLUMN IF NOT EXISTS pending_availability_restore_ledger jsonb;

ALTER TABLE public.manual_bookings
  DROP CONSTRAINT IF EXISTS manual_bookings_sync_status_check;

ALTER TABLE public.manual_bookings
  ADD CONSTRAINT manual_bookings_sync_status_check
    CHECK (sync_status IN (
      'synced',
      'cleanup_required',
      'cancellation_pending',
      'availability_restore_pending',
      'availability_review_required'
    ));

CREATE INDEX IF NOT EXISTS manual_bookings_availability_restore_pending_idx
  ON public.manual_bookings (updated_at)
  WHERE status = 'cancelled'
    AND sync_status = 'availability_restore_pending';

COMMENT ON COLUMN public.manual_bookings.availability_restoration_ledger IS
  'Exact treatment-specific Cal schedule provenance eligible for restoration when this booking is cancelled.';

COMMENT ON COLUMN public.manual_bookings.pending_availability_restore_ledger IS
  'Temporary prior ledger awaiting restoration after a successful reschedule.';
