alter table public.courses
  add column if not exists certificate_review_required boolean not null default false;

alter table public.enrollments
  add column if not exists certificate_released_at timestamptz,
  add column if not exists certificate_released_by uuid references auth.users(id) on delete set null;

comment on column public.courses.certificate_review_required is
  'When true, a completed student must be manually approved before certificate access.';

comment on column public.enrollments.certificate_released_at is
  'Independent certificate approval timestamp; does not replace or modify completed_at.';

