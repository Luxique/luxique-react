-- ============================================================
-- Migration: Course Landing Page v2
-- Date: 2026-05-20
-- Adds hero text fields, differentiators, final CTA, curriculum toggle
-- Migrates what_you_learn/who_is_it_for to landing_blocks
-- Drops gallery_urls
-- ============================================================

-- 1. Hero text fields
ALTER TABLE courses ADD COLUMN IF NOT EXISTS hero_badge_text text DEFAULT '';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS hero_title text DEFAULT '';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS hero_title_accent text DEFAULT '';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS hero_tagline text DEFAULT '';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS hero_cta_text text DEFAULT 'Schrijf je in';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS hero_social_proof text DEFAULT '';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS hero_rating numeric DEFAULT NULL;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS show_payment_icons boolean DEFAULT true;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS trust_microcopy text DEFAULT 'Veilig betalen · Direct toegang';

-- 2. Differentiators
ALTER TABLE courses ADD COLUMN IF NOT EXISTS differentiators_eyebrow text DEFAULT '— Waarom Luxique —';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS differentiators_title text DEFAULT 'Niet zomaar een online cursus';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS differentiators_lead text DEFAULT '';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS differentiators jsonb DEFAULT '[
  {"icon": "✦", "title": "Eerst begrijpen, dan doen", "body": "Geen kopieer-werk. Eerst snap je oogvormen, anatomie en waarom keuzes werken. Daarna pak je de pincet."},
  {"icon": "✧", "title": "Persoonlijke feedback", "body": "Chiva bekijkt je werk en geeft directe feedback. Geen anonieme cursus — je krijgt mentorship."},
  {"icon": "◈", "title": "Levenslange toegang", "body": "De industrie verandert. Jouw toegang ook. Updates met nieuwe technieken zonder bij te betalen."}
]'::jsonb;

-- 3. Final CTA
ALTER TABLE courses ADD COLUMN IF NOT EXISTS final_cta_eyebrow text DEFAULT '— Klaar om te starten —';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS final_cta_title text DEFAULT '';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS final_cta_title_accent text DEFAULT '';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS final_cta_lead text DEFAULT '';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS final_cta_button_text text DEFAULT 'Schrijf je nu in';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS final_cta_includes jsonb DEFAULT '[]'::jsonb;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS final_cta_fine_print text DEFAULT 'Direct toegang na betaling';

-- 4. Curriculum toggle
ALTER TABLE courses ADD COLUMN IF NOT EXISTS show_curriculum boolean DEFAULT true;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS curriculum_eyebrow text DEFAULT '— Curriculum —';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS curriculum_title text DEFAULT 'Het volledige programma';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS curriculum_intro text DEFAULT 'Elke les start met theorie. Pas als je begrijpt waarom iets werkt, ga je het doen.';

-- 5. Data migration: what_you_learn → landing_blocks flex block
UPDATE courses
SET landing_blocks = (
  CASE
    WHEN what_you_learn IS NOT NULL AND jsonb_array_length(what_you_learn) > 0 THEN
      COALESCE(landing_blocks, '[]'::jsonb) ||
      jsonb_build_array(
        jsonb_build_object(
          'id', gen_random_uuid()::text,
          'type', 'what_you_learn',
          'order', 0,
          'data', jsonb_build_object(
            'eyebrow', '— Het Programma —',
            'title', 'Wat ga je leren',
            'lead', '',
            'items', what_you_learn
          )
        )
      )
    ELSE landing_blocks
  END
)
WHERE landing_blocks IS NULL OR jsonb_array_length(COALESCE(landing_blocks, '[]'::jsonb)) = 0;

-- 6. Data migration: who_is_it_for → landing_blocks flex block
UPDATE courses
SET landing_blocks = (
  COALESCE(landing_blocks, '[]'::jsonb) ||
  jsonb_build_array(
    jsonb_build_object(
      'id', gen_random_uuid()::text,
      'type', 'rich_text',
      'order', 1,
      'data', jsonb_build_object(
        'eyebrow', '— Voor wie —',
        'title', 'Voor wie is deze cursus?',
        'body_html', COALESCE(who_is_it_for, '')
      )
    )
  )
)
WHERE who_is_it_for IS NOT NULL AND who_is_it_for != '';

-- 7. Set default hero content for existing courses that have none
UPDATE courses SET
  hero_badge_text = COALESCE(hero_badge_text, title, ''),
  hero_title = COALESCE(hero_title, 
    CASE 
      WHEN title IS NOT NULL THEN title
      ELSE ''
    END, ''),
  hero_tagline = COALESCE(hero_tagline, description, '')
WHERE hero_title = '' OR hero_title IS NULL;

-- 8. Drop gallery_urls (already confirmed: not used)
ALTER TABLE courses DROP COLUMN IF EXISTS gallery_urls;
