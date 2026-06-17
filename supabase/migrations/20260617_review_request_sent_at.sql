-- Add review_request_sent_at column to prevent duplicate review emails
ALTER TABLE pending_bookings
ADD COLUMN review_request_sent_at TIMESTAMPTZ;