-- Add user_id column to pending_bookings
-- Links booking to the authenticated user who created it
-- customer_email/customer_name remain as display-only fields

ALTER TABLE pending_bookings
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for fast lookups by user_id (used by my-bookings API)
CREATE INDEX IF NOT EXISTS pending_bookings_user_id_idx
ON pending_bookings (user_id)
WHERE user_id IS NOT NULL;
