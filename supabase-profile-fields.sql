-- Add business fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vat_number text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kvk_number text;
