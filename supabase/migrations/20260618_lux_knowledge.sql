-- Create lux_knowledge table for admin-managed chatbot knowledge
CREATE TABLE IF NOT EXISTS lux_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE lux_knowledge ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write (role_level >= 100)
CREATE POLICY "Admins can read lux_knowledge" ON lux_knowledge
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_level >= 100
    )
  );

CREATE POLICY "Admins can write lux_knowledge" ON lux_knowledge
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_level >= 100
    )
  );

-- Allow the service role to bypass RLS (for the chat API route)
-- Service role already bypasses RLS by default

-- Insert the current SYSTEM_PROMPT content (will be done by the app after migration)
