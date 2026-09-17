-- Diagnostics and idempotent claim support for post-treatment review requests.
-- review_request_sent_at doubles as the atomic claim timestamp. A failed send
-- releases the claim by setting it back to NULL and stores the error below.

ALTER TABLE public.pending_bookings
  ADD COLUMN IF NOT EXISTS review_request_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_request_error text;

ALTER TABLE public.manual_bookings
  ADD COLUMN IF NOT EXISTS review_request_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_request_error text;

CREATE INDEX IF NOT EXISTS pending_bookings_review_request_due_idx
  ON public.pending_bookings (slot_start)
  WHERE status = 'paid' AND review_request_sent_at IS NULL;

CREATE INDEX IF NOT EXISTS manual_bookings_review_request_due_idx
  ON public.manual_bookings (slot_start)
  WHERE status = 'confirmed' AND review_request_sent_at IS NULL;
