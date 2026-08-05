-- Migration: Add eindtijd and prijs_override_cents to traject_klassen
-- Date: 2026-08-05
-- Run this in Supabase Dashboard → SQL Editor

-- Item 2: Eindtijd per klas (default 16:00)
ALTER TABLE traject_klassen
ADD COLUMN IF NOT EXISTS eindtijd TEXT DEFAULT '16:00';

-- Backfill existing rows
UPDATE traject_klassen
SET eindtijd = '16:00'
WHERE eindtijd IS NULL;

-- Item 3: Prijs override per klas (NULL = use cursus price)
ALTER TABLE traject_klassen
ADD COLUMN IF NOT EXISTS prijs_override_cents INTEGER;

-- Comment
COMMENT ON COLUMN traject_klassen.eindtijd IS 'Eindtijd van de klas (HH:MM), default 16:00';
COMMENT ON COLUMN traject_klassen.prijs_override_cents IS 'Optionele afwijkende prijs voor deze klas in centen. NULL = gebruik traject_cursussen.prijs_cents';
