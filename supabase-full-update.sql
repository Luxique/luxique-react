-- ============================================
-- LUXIQUE — Supabase Schema Update
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Profile fields (personal + business)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tiktok text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vat_number text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kvk_number text;

-- 2. Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  treatment_name text NOT NULL,
  appointment_date timestamptz NOT NULL,
  status text DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin manages bookings" ON bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. Enhanced enrollments (payment tracking)
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS payment_amount numeric(10,2);
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS payment_currency text DEFAULT 'eur';
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS payment_intent text;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS invoice_number text;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS granted_by text;

-- Admin can manage all enrollments
CREATE POLICY "Admin manages enrollments" ON enrollments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Payment reminders
CREATE TABLE IF NOT EXISTS payment_reminders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  reminder_type text DEFAULT 'first' CHECK (reminder_type IN ('first', 'second', 'final')),
  sent_at timestamptz DEFAULT now(),
  sent_by uuid REFERENCES auth.users(id)
);

ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages reminders" ON payment_reminders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. Course pricing
ALTER TABLE courses ADD COLUMN IF NOT EXISTS price numeric(10,2);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- 6. Update CJ's profile with first/last name
UPDATE profiles SET first_name = 'CJ', last_name = 'Williams' WHERE email = 'curtis.jr.w@live.com';
