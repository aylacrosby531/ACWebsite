-- ============================================================
-- Ayla Crosby — Job Tracker DB Schema
-- Paste this into your Supabase project's SQL Editor and run it.
-- Project: ACWebsite (gtlczgyxbnsplcalhbgv.supabase.co)
-- ============================================================

-- --------- Applications ---------
create table if not exists applications (
  id           uuid primary key default gen_random_uuid(),
  company      text not null,
  role         text not null,
  status       text not null default 'applied',  -- saved | applied | interview | offer | rejected
  date_applied date,
  url          text,
  resume_path  text,    -- path inside the 'documents' storage bucket
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

-- --------- Row Level Security ---------
-- MVP: RLS is disabled so the anon key in the frontend can read/write.
-- Your data stays private as long as the GitHub repo is PRIVATE.
-- Before deploying this site publicly, turn on RLS + add Supabase Auth.
alter table applications disable row level security;
alter table quick_links  disable row level security;
alter table profile      disable row level security;

-- ============================================================
-- Storage buckets (run AFTER tables are created)
-- ============================================================
-- The buckets below are created via the Supabase dashboard UI, not SQL:
--   1. Go to Storage in the left sidebar
--   2. Click "New bucket"
--   3. Create THREE buckets, all PRIVATE:
--        - documents   (for resumes + cover letters)
--        - profile     (for profile picture)
-- After creating them, run the policy block below:

-- Allow anon role to read/write to documents + profile buckets (MVP only).
-- Drop any existing policy with these names so it's safe to re-run.
drop policy if exists "docs_read"  on storage.objects;
drop policy if exists "docs_write" on storage.objects;
drop policy if exists "docs_update" on storage.objects;
drop policy if exists "docs_delete" on storage.objects;

create policy "docs_read" on storage.objects
  for select using ( bucket_id in ('documents', 'profile') );

create policy "docs_write" on storage.objects
  for insert with check ( bucket_id in ('documents', 'profile') );

create policy "docs_update" on storage.objects
  for update using ( bucket_id in ('documents', 'profile') );

create policy "docs_delete" on storage.objects
  for delete using ( bucket_id in ('documents', 'profile') );
