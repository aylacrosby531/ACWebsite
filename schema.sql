-- ============================================================
-- Ayla Crosby — Job Tracker DB Schema
-- Paste this into your Supabase project's SQL Editor and run it.
-- Project: ACWebsite (gtlczgyxbnsplcalhbgv.supabase.co)
--
-- The OWNER_EMAIL constant in js/config.js MUST match the email
-- in the policies below ('aylacrosby531@gmail.com'). If you change
-- one, change both.
-- ============================================================

-- --------- Applications ---------
create table if not exists applications (
  id           uuid primary key default gen_random_uuid(),
  company      text not null,
  role         text not null,
  status       text not null default 'applied',  -- saved | applied | interview | offer | rejected
  date_applied date,
  url          text,
  resume_path  text,
  cover_path   text,
  short_answers text,
  notes        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists applications_status_idx on applications (status);
create index if not exists applications_company_idx on applications (company);

-- --------- Quick Links ---------
create table if not exists quick_links (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  url         text not null,
  created_at  timestamptz default now()
);

-- --------- Profile (single-row) ---------
create table if not exists profile (
  id              int primary key default 1,
  name            text default 'Ayla Crosby',
  tagline         text default 'Environmental data + sustainability',
  bio             text,
  linkedin_url    text default 'https://www.linkedin.com/in/ayla-crosby-3415023a5',
  profile_pic_path text,
  updated_at      timestamptz default now(),
  check (id = 1)
);

insert into profile (id) values (1)
on conflict (id) do nothing;

-- ============================================================
-- Row Level Security: only aylacrosby531@gmail.com can read/write.
-- This is what makes it safe to publish the repo publicly.
-- ============================================================
alter table applications enable row level security;
alter table quick_links  enable row level security;
alter table profile      enable row level security;

drop policy if exists "owner_only" on applications;
drop policy if exists "owner_only" on quick_links;
drop policy if exists "owner_only" on profile;

create policy "owner_only" on applications
  for all using (auth.email() = 'aylacrosby531@gmail.com')
  with check (auth.email() = 'aylacrosby531@gmail.com');

create policy "owner_only" on quick_links
  for all using (auth.email() = 'aylacrosby531@gmail.com')
  with check (auth.email() = 'aylacrosby531@gmail.com');

create policy "owner_only" on profile
  for all using (auth.email() = 'aylacrosby531@gmail.com')
  with check (auth.email() = 'aylacrosby531@gmail.com');

-- ============================================================
-- Storage buckets (create these in the Dashboard UI first)
--   Storage → New bucket → both PRIVATE:
--     - documents   (resumes + cover letters)
--     - profile     (profile picture)
-- Then run the policy block below.
-- ============================================================
drop policy if exists "docs_read"   on storage.objects;
drop policy if exists "docs_write"  on storage.objects;
drop policy if exists "docs_update" on storage.objects;
drop policy if exists "docs_delete" on storage.objects;
drop policy if exists "owner_storage" on storage.objects;

create policy "owner_storage" on storage.objects
  for all using (
    bucket_id in ('documents', 'profile')
    and auth.email() = 'aylacrosby531@gmail.com'
  )
  with check (
    bucket_id in ('documents', 'profile')
    and auth.email() = 'aylacrosby531@gmail.com'
  );
