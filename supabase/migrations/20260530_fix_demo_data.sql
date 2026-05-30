-- Fix: update Medusa demo data — "Levenslang" → "12 maanden toegang"
-- Run this in Supabase SQL Editor

UPDATE courses SET
  hero_chips = '["Stap-voor-stap begeleiding","Persoonlijke feedback","12 maanden toegang","150+ artists opgeleid"]'::jsonb,
  final_cta_lead = 'Direct toegang tot alle modules. Begin meteen of in je eigen tempo. 12 maanden toegang.'
WHERE slug = 'medusa-lash-basics';
