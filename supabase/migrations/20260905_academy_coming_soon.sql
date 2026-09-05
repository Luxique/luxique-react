-- Run manually in Supabase only after CJ approval.
create table if not exists public.site_settings (
  id text primary key,
  academy_coming_soon boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid null references auth.users(id) on delete set null
);

alter table public.site_settings enable row level security;

insert into public.site_settings (id, academy_coming_soon)
values ('global', false)
on conflict (id) do nothing;
