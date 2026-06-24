-- Migration: Add 'expired' to enrollments status check constraint
-- Safe: only widens the check constraint, no data changes.

-- First, find and drop the existing constraint
ALTER TABLE public.enrollments
  DROP CONSTRAINT IF EXISTS enrollments_status_check;

-- Add new constraint with 'expired' included
ALTER TABLE public.enrollments
  ADD CONSTRAINT enrollments_status_check
  CHECK (status IN ('active', 'completed', 'cancelled', 'expired'));
