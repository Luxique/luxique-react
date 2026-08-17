-- 2026-08-17 — Ghost cursussen + sublessen
-- Ghost (👻): cursus is published maar verborgen op de publieke siteoverzichten.
--   Toegang via directe link of handmatige toewijzing (admin "Cursus toewijzen").
-- Sublessen: lessen kunnen genest worden onder een hoofdes (nummering 1.1, 1.2, …).

alter table public.courses
  add column if not exists is_ghost boolean not null default false;

alter table public.lessons
  add column if not exists parent_lesson_id uuid
  references public.lessons(id) on delete cascade;

-- Index voor snelle parent-lookups
create index if not exists lessons_parent_lesson_id_idx
  on public.lessons(parent_lesson_id);
