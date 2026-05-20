-- ============================================================
-- Migration: Roles + RLS + Course Landing
-- Date: 2026-05-20
-- ============================================================

-- 1. Course landing columns
ALTER TABLE courses ADD COLUMN IF NOT EXISTS hero_image_url text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS hero_video_url text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS hero_mux_playback_id text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS hero_mux_asset_id text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS long_description text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS what_you_learn jsonb DEFAULT '[]'::jsonb;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS who_is_it_for text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS price_cents integer DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS level text DEFAULT 'beginner';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS gallery_urls jsonb DEFAULT '[]'::jsonb;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS landing_blocks jsonb DEFAULT '[]'::jsonb;

-- 2. Role level in profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role_level smallint NOT NULL DEFAULT 0;

-- 3. is_free on lessons (if not exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'is_free') THEN
    ALTER TABLE lessons ADD COLUMN is_free boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Drop module_id if exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'module_id') THEN
    ALTER TABLE lessons DROP COLUMN module_id;
  END IF;
END $$;

-- ============================================================
-- 4. Helper functions
-- ============================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role_level >= 100
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_role_level(min_level int)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role_level >= min_level
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_enrolled(course_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM enrollments
    WHERE user_id = auth.uid()
      AND enrollments.course_id = is_enrolled.course_id
      AND status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- 5. Drop ALL existing policies
-- ============================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('courses', 'lessons', 'blocks', 'enrollments', 'profiles')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ============================================================
-- 6. New RLS policies
-- ============================================================

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- COURSES
CREATE POLICY "courses_select" ON courses FOR SELECT TO authenticated USING (
  status = 'published' OR is_admin()
);
CREATE POLICY "courses_admin_write" ON courses FOR ALL TO authenticated USING (is_admin());

-- LESSONS
CREATE POLICY "lessons_select" ON lessons FOR SELECT TO authenticated USING (
  is_admin()
  OR (course_id IN (SELECT id FROM courses WHERE status = 'published') AND is_free = true)
  OR (course_id IN (SELECT id FROM courses WHERE status = 'published') AND is_enrolled(course_id))
);
CREATE POLICY "lessons_admin_write" ON lessons FOR ALL TO authenticated USING (is_admin());

-- BLOCKS
CREATE POLICY "blocks_select" ON blocks FOR SELECT TO authenticated USING (
  is_admin()
  OR (lesson_id IN (
    SELECT l.id FROM lessons l
    JOIN courses c ON l.course_id = c.id
    WHERE c.status = 'published' AND (l.is_free = true OR is_enrolled(c.id))
  ))
);
CREATE POLICY "blocks_admin_write" ON blocks FOR ALL TO authenticated USING (is_admin());

-- ENROLLMENTS
CREATE POLICY "enrollments_select" ON enrollments FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR is_admin()
);
CREATE POLICY "enrollments_admin_insert" ON enrollments FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "enrollments_admin_write" ON enrollments FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "enrollments_admin_delete" ON enrollments FOR DELETE TO authenticated USING (is_admin());
-- Service role bypasses RLS, so Stripe webhook inserts work automatically

-- PROFILES
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (
  id = auth.uid() OR is_admin()
);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (
  id = auth.uid()
);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (
  id = auth.uid()
);

-- ============================================================
-- 7. Signup trigger — auto-create profile with role_level=0
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, role_level, created_at)
  VALUES (NEW.id, 0, now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
