-- Fix: Allow anonymous visitors to read lesson metadata for published courses
-- This enables the course landing page curriculum section to show lesson titles/order
-- for anonymous visitors. Video playback_ids are NOT in the lessons table (they're in blocks),
-- so this is safe — anonymous users see the curriculum LIST but not video content.

-- Add anon policy for lessons: only metadata for published courses
CREATE POLICY "lessons_anon_select" ON lessons FOR SELECT TO anon USING (
  course_id IN (SELECT id FROM courses WHERE status = 'published' AND is_published = true)
);

-- Also add anon policy for courses: published courses visible to everyone
CREATE POLICY "courses_anon_select" ON courses FOR SELECT TO anon USING (
  status = 'published' AND is_published = true
);

-- And blocks: only free lesson blocks visible to anon
CREATE POLICY "blocks_anon_select" ON blocks FOR SELECT TO anon USING (
  lesson_id IN (
    SELECT l.id FROM lessons l
    JOIN courses c ON l.course_id = c.id
    WHERE c.status = 'published' AND c.is_published = true AND l.is_free = true
  )
);
