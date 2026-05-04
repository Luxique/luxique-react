-- Enhanced enrollments table with full payment tracking
-- Drop existing if needed and recreate

-- First, add payment columns if not exist
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS payment_amount numeric(10,2);
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS payment_currency text DEFAULT 'eur';
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS payment_intent text;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS invoice_number text;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS granted_by text; -- admin user_id who manually granted access

-- Payment reminders table
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
CREATE POLICY "Admin sees all reminders" ON payment_reminders FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Add price column to courses if not exists
ALTER TABLE courses ADD COLUMN IF NOT EXISTS price numeric(10,2);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- Grant admin full access to enrollments
CREATE POLICY "Admin manages enrollments" ON enrollments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
