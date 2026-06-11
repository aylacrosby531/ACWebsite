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

-- --------- Leads (curated by the /discover-jobs command) ---------
-- Surfaced on the Daily Job Search page as the ✨ Curated source.
-- Written by the slash command via the service_role key; read in the
-- browser under the owner-only RLS policy below.
create table if not exists leads (
  id            text primary key,        -- stable slug: company-slug__role-slug
  company       text not null,
  role          text not null,
  track         text default 'core',     -- 'core' = in-field & remote ($60k+) | 'anchorage' = in-field, Anchorage-based ($75k+) | 'bellingham' = in-field, Bellingham WA-based ($80k+) | 'other' = adjacent roles outside the field, remote ($60k+) | 'gradschool' = funded environmental/science master's (PNW or genuinely funded online)
  stretch       boolean default false,   -- true = fallback "🔶 Stretch" pick: verified-live but misses a hard filter (comp/seniority/location/fieldwork); shown so a tab is never empty, flagged on the page
  categories    text[] default '{}',     -- corporate-sustainability, climate-tech, …
  apply_url     text,                    -- canonical company ATS/careers link
  location      text,
  comp          text,                    -- posted band or benchmark + note
  salary_min    int,                     -- numeric floor if known (reference only)
  posted        text,                    -- original posting date or "not visible"
  verified_live date,                    -- date canonical listing confirmed open
  summary       text,
  fit           text,
  green_flags   text[] default '{}',
  red_flags     text[] default '{}',
  sources       jsonb  default '[]',     -- [{name, url}, …]
  notes         text,
  added         date   default current_date,
  created_at    timestamptz default now()
);

create index if not exists leads_added_idx on leads (added desc);

-- If the leads table already existed, add the track column (safe to re-run).
-- Tabs on the Job Search page are driven by this column:
--   'core'       = in-field & remote, $60k+        → 🌿 My Picks
--   'anchorage'  = in-field, Anchorage AK, $75k+   → 🏔️ Anchorage Picks
--   'bellingham' = in-field, Bellingham WA, $80k+  → 🌲 Bellingham Picks
--   'other'      = adjacent, outside field, remote → 🥕 Other Picks
--   'gradschool' = funded environmental/science master's → 🎓 Grad School
alter table leads add column if not exists track text default 'core';
-- Fallback "stretch" picks (shown but flagged when a strict search comes up short):
alter table leads add column if not exists stretch boolean default false;
update leads set track = 'core' where track is null;

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
-- Life hub: daily log (+ daily photo) and the recovery roadmap.
-- ============================================================

-- Daily log: one entry per day. Each day can carry one photo, which
-- shows up in the Home collage (hover = that day's wins, click = entry).
create table if not exists daily_logs (
  id              uuid primary key default gen_random_uuid(),
  log_date        date not null,
  wins            text,                -- 🌸 three wins
  looking_forward text,                -- ☀️ looking forward to tomorrow
  reflection      text,                -- 🐌 one hard / slow thing
  photo_paths     text[] default '{}', -- 📷 up to 3 paths in the `photos` bucket
  created_at      timestamptz default now()
);
create index if not exists daily_logs_date_idx on daily_logs (log_date desc);

-- Recovery roadmap: checkable milestones grouped into loose clusters
-- (a "progress web" — order isn't required, nothing is hidden).
create table if not exists milestones (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  phase      text default 'Other',  -- cluster label (Bike, Walking, …)
  sort       int  default 0,
  done       boolean default false,
  done_on    date,                  -- date achieved
  created_at timestamptz default now()
);
create index if not exists milestones_phase_idx on milestones (phase);

-- Therapy sessions: one positive note each → a critter in the recovery garden.
create table if not exists therapy_sessions (
  id         uuid primary key default gen_random_uuid(),
  note       text not null,
  critter    text,
  created_at timestamptz default now()
);
-- if the table already existed, add the critter column:
alter table therapy_sessions add column if not exists critter text;
alter table therapy_sessions enable row level security;
drop policy if exists "owner_only" on therapy_sessions;
create policy "owner_only" on therapy_sessions
  for all using (auth.email() = 'aylacrosby531@gmail.com')
  with check (auth.email() = 'aylacrosby531@gmail.com');

-- ============================================================
-- Row Level Security: only aylacrosby531@gmail.com can read/write.
-- This is what makes it safe to publish the repo publicly.
-- ============================================================
alter table applications enable row level security;
alter table quick_links  enable row level security;
alter table profile      enable row level security;
alter table leads        enable row level security;
alter table daily_logs   enable row level security;
alter table milestones   enable row level security;

drop policy if exists "owner_only" on applications;
drop policy if exists "owner_only" on quick_links;
drop policy if exists "owner_only" on profile;
drop policy if exists "owner_only" on leads;
drop policy if exists "owner_only" on daily_logs;
drop policy if exists "owner_only" on milestones;

create policy "owner_only" on applications
  for all using (auth.email() = 'aylacrosby531@gmail.com')
  with check (auth.email() = 'aylacrosby531@gmail.com');

-- The browser reads leads under this policy. The /discover-jobs command writes
-- with the service_role key, which bypasses RLS entirely.
create policy "owner_only" on leads
  for all using (auth.email() = 'aylacrosby531@gmail.com')
  with check (auth.email() = 'aylacrosby531@gmail.com');

create policy "owner_only" on quick_links
  for all using (auth.email() = 'aylacrosby531@gmail.com')
  with check (auth.email() = 'aylacrosby531@gmail.com');

create policy "owner_only" on profile
  for all using (auth.email() = 'aylacrosby531@gmail.com')
  with check (auth.email() = 'aylacrosby531@gmail.com');

create policy "owner_only" on daily_logs
  for all using (auth.email() = 'aylacrosby531@gmail.com')
  with check (auth.email() = 'aylacrosby531@gmail.com');

create policy "owner_only" on milestones
  for all using (auth.email() = 'aylacrosby531@gmail.com')
  with check (auth.email() = 'aylacrosby531@gmail.com');

-- ============================================================
-- Storage buckets (create these in the Dashboard UI first)
--   Storage → New bucket → all PRIVATE:
--     - documents   (resumes + cover letters)
--     - profile     (profile picture)
--     - photos      (daily-log photos for the Home collage)
-- Then run the policy block below.
-- ============================================================
drop policy if exists "docs_read"   on storage.objects;
drop policy if exists "docs_write"  on storage.objects;
drop policy if exists "docs_update" on storage.objects;
drop policy if exists "docs_delete" on storage.objects;
drop policy if exists "owner_storage" on storage.objects;

create policy "owner_storage" on storage.objects
  for all using (
    bucket_id in ('documents', 'profile', 'photos')
    and auth.email() = 'aylacrosby531@gmail.com'
  )
  with check (
    bucket_id in ('documents', 'profile', 'photos')
    and auth.email() = 'aylacrosby531@gmail.com'
  );
