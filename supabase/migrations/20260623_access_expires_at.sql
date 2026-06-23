-- Migration: Add access_expires_at to enrollments
-- Safe: only adds a nullable column, then backfills. No existing data modified.

-- Step 1: Add the column (nullable, no default — backfill below)
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS access_expires_at timestamptz;

-- Step 2: Backfill existing rows: access_expires_at = enrolled_at + 365 days
-- Only update rows where access_expires_at IS NULL (safe for re-runs)
UPDATE public.enrollments
  SET access_expires_at = enrolled_at + INTERVAL '365 days'
  WHERE access_expires_at IS NULL
    AND enrolled_at IS NOT NULL;

-- Step 3: Set default for future inserts
ALTER TABLE public.enrollments
  ALTER COLUMN access_expires_at
  SET DEFAULT (now() + INTERVAL '365 days');
