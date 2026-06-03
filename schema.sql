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
-- Life hub: goals → actions, weekly reviews, where-to-live.
-- Action-focused (no vision-board fluff).
-- ============================================================

-- Big rocks. Each goal owns a list of concrete actions.
create table if not exists goals (
  id          uuid primary key default gen_random_uuid(),
  area        text default 'career',   -- career | skills | health | money | adventure | other
  title       text not null,
  detail      text,                    -- optional context / definition of done
  target_date date,
  status      text default 'active',   -- active | done | parked
  sort        int  default 0,
  created_at  timestamptz default now()
);

-- Concrete next steps. this_week pulls them onto the Home dashboard.
create table if not exists actions (
  id           uuid primary key default gen_random_uuid(),
  goal_id      uuid references goals(id) on delete cascade,  -- null = standalone task
  title        text not null,
  this_week    boolean default false,
  is_milestone boolean default false,
  status       text default 'todo',    -- todo | done
  due_date     date,
  done_at      timestamptz,
  sort         int default 0,
  created_at   timestamptz default now()
);
create index if not exists actions_goal_idx on actions (goal_id);
create index if not exists actions_week_idx on actions (this_week);

-- Weekly review ritual.
create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  week_start  date not null,
  wins        text,
  stuck       text,
  top3        text,                    -- top 3 for next week
  created_at  timestamptz default now()
);

-- Where-to-live comparison. Scores 1-5 (5 = better).
create table if not exists cities (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  cost        int default 3,           -- affordability
  outdoors    int default 3,
  job_market  int default 3,
  climate     int default 3,
  community   int default 3,           -- people / proximity
  notes       text,
  pros        text,
  cons        text,
  sort        int default 0,
  created_at  timestamptz default now()
);

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

-- ============================================================
-- Row Level Security: only aylacrosby531@gmail.com can read/write.
-- This is what makes it safe to publish the repo publicly.
-- ============================================================
alter table applications enable row level security;
alter table quick_links  enable row level security;
alter table profile      enable row level security;
alter table leads        enable row level security;
alter table goals        enable row level security;
alter table actions      enable row level security;
alter table reviews      enable row level security;
alter table cities       enable row level security;
alter table milestones   enable row level security;

drop policy if exists "owner_only" on applications;
drop policy if exists "owner_only" on quick_links;
drop policy if exists "owner_only" on profile;
drop policy if exists "owner_only" on leads;
drop policy if exists "owner_only" on goals;
drop policy if exists "owner_only" on actions;
drop policy if exists "owner_only" on reviews;
drop policy if exists "owner_only" on cities;
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

create policy "owner_only" on goals
  for all using (auth.email() = 'aylacrosby531@gmail.com')
  with check (auth.email() = 'aylacrosby531@gmail.com');

create policy "owner_only" on actions
  for all using (auth.email() = 'aylacrosby531@gmail.com')
  with check (auth.email() = 'aylacrosby531@gmail.com');

create policy "owner_only" on reviews
  for all using (auth.email() = 'aylacrosby531@gmail.com')
  with check (auth.email() = 'aylacrosby531@gmail.com');

create policy "owner_only" on cities
  for all using (auth.email() = 'aylacrosby531@gmail.com')
  with check (auth.email() = 'aylacrosby531@gmail.com');

create policy "owner_only" on milestones
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
