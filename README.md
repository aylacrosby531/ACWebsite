# Ayla Crosby — Job Tracker

A personal job-application tracking site. Three pages:

- **Job Search** (landing) — fresh remote roles from Remotive + RemoteOK, filtered by your interests (environmental / sustainability / data science).
- **My Applications** — log every job you apply to with attachments (resume, cover letter, short answers).
- **My Info** — resumes, LinkedIn, profile pic, quick links, bio.

Built with vanilla HTML/CSS/JS + Supabase (database + file storage).

## First-time setup

### 1. Database schema

1. Open your Supabase project: <https://supabase.com/dashboard/project/gtlczgyxbnsplcalhbgv>
2. Click **SQL Editor** in the left sidebar.
3. Click **New query**, paste the contents of `schema.sql`, click **Run**.

### 2. Storage buckets

1. In Supabase, click **Storage** in the left sidebar.
2. Click **New bucket**. Create:
   - `documents` (Private)
   - `profile` (Private)
3. Back in the SQL Editor, re-run the policy block at the bottom of `schema.sql`.

### 3. Open the site

Just double-click `index.html` in Finder. It opens in your browser. No build step.

## Day-to-day use

- Click **+ Add Application** on My Applications to log a new one. Drop in the resume + cover letter PDF.
- On the Job Search page, click **Save to Applications** on any listing to start tracking it.
- On My Info, upload resumes once and reuse them.

## Color palette

Soft pink / beige / white — see `css/styles.css` for the CSS variables.

## Tech

- HTML / CSS / vanilla JS — no framework
- [Supabase JS SDK v2](https://supabase.com/docs/reference/javascript) loaded from CDN
- Job feeds: [Remotive](https://remotive.com/api-documentation), [RemoteOK](https://remoteok.com/api)

## Privacy

This repo is private on GitHub. The `.gitignore` keeps PDFs and the profile pic out of git. Your data lives in Supabase, gated by the anon key in `js/config.js`.

⚠️ Don't make this repo public — anyone could then hit your Supabase project.
Before publishing the site to the open internet, add Supabase Auth + RLS policies.
