-- ============================================================
-- Migration: Course Landing v3 — new columns + demo content
-- Date: 2026-05-29
-- Branch: feature/course-landing-v3
-- ============================================================

-- 1. NEW COLUMNS ON courses

-- Hero
ALTER TABLE courses ADD COLUMN IF NOT EXISTS hero_badge_text text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS hero_title text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS hero_title_accent text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS hero_title_suffix text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS hero_tagline text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS hero_cta_text text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS hero_social_proof text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS hero_chips jsonb DEFAULT '[]'::jsonb;

-- Differentiators
ALTER TABLE courses ADD COLUMN IF NOT EXISTS differentiators_eyebrow text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS differentiators_title text;

-- Curriculum
ALTER TABLE courses ADD COLUMN IF NOT EXISTS curriculum_eyebrow text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS curriculum_title text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS curriculum_intro text;

-- Reviews
ALTER TABLE courses ADD COLUMN IF NOT EXISTS reviews_eyebrow text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS reviews_title text;

-- Pricing
ALTER TABLE courses ADD COLUMN IF NOT EXISTS access_duration_text text DEFAULT '12 maanden toegang';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS pricing_includes jsonb DEFAULT '[]'::jsonb;

-- Final CTA
ALTER TABLE courses ADD COLUMN IF NOT EXISTS final_cta_eyebrow text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS final_cta_title text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS final_cta_title_accent text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS final_cta_lead text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS final_cta_button_text text;

-- 2. LESSON ACCORDION DESCRIPTION
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS what_you_learn_text text;

-- 3. DEMO CONTENT FOR MEDUSA LASH BASICS

UPDATE courses SET
  -- Hero
  hero_badge_text = 'Beperkte plaatsen beschikbaar',
  hero_title = 'Word de',
  hero_title_accent = 'artist',
  hero_title_suffix = 'die je wil zijn',
  hero_tagline = 'Het exacte framework dat Chiva ontwikkelde om beginners te transformeren naar lash artists. Geen kopieer-werk — eerst begrijpen, dan doen.',
  hero_cta_text = 'Schrijf je in',
  hero_social_proof = '★★★★★ 4.9/5 · 47 reviews · Direct toegang',
  hero_chips = $json$["Stap-voor-stap begeleiding","Persoonlijke feedback","Levenslange toegang","150+ artists opgeleid"]$json$::jsonb,

  -- Differentiators
  differentiators_eyebrow = '— Waarom Luxique —',
  differentiators_title = 'Niet zomaar een online cursus',

  -- Curriculum
  curriculum_eyebrow = '— Het programma —',
  curriculum_title = 'Wat ga je leren',
  curriculum_intro = 'Elke les start met theorie. Pas als je begrijpt waarom iets werkt, ga je het doen. Klik op een les voor details.',

  -- Reviews
  reviews_eyebrow = '— Wat studenten zeggen —',
  reviews_title = 'Verhalen van onze artists',

  -- Pricing
  price_cents = 199700,
  access_duration_text = '12 maanden toegang',
  pricing_includes = $json$["8 modules · 4 uur video","Persoonlijke feedback van Chiva","12 maanden toegang & updates","Certificaat bij afronding","Eindtoets en quizzen","14 dagen niet-goed-geld-terug"]$json$::jsonb,

  -- Final CTA
  final_cta_eyebrow = '— Klaar om te starten —',
  final_cta_title = 'Begin vandaag aan je reis als',
  final_cta_title_accent = 'artist',
  final_cta_lead = 'Direct toegang tot alle modules. Begin meteen of in je eigen tempo. Levenslang van jou.',
  final_cta_button_text = 'Schrijf je nu in'
WHERE slug = 'medusa-lash-basics';
