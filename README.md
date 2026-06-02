# Ayla Crosby — Job Tracker

A personal job-application tracking site. Three pages:

- **Job Search** (landing) — fresh remote roles from Remotive + RemoteOK.
- **My Applications** — log every job you apply to with attachments.
- **My Info** — resumes, LinkedIn, profile pic, quick links, bio.

Built with vanilla HTML/CSS/JS + Supabase. Hosted free on GitHub Pages.

## Live site

<https://aylacrosby531.github.io/ACWebsite/>

Sign in is via magic link to `aylacrosby531@gmail.com`. Only that email can read or write data — Supabase Row Level Security enforces it on the server.

## First-time setup (one-time, ~10 min)

### 1. Database schema

1. Open <https://supabase.com/dashboard/project/gtlczgyxbnsplcalhbgv/sql>.
2. Click **New query**, paste the contents of `schema.sql`, click **Run**.

### 2. Storage buckets

1. In Supabase, click **Storage** in the left sidebar.
2. Click **New bucket** twice. Create both as **Private**:
   - `documents`
   - `profile`
3. Back in **SQL Editor**, re-run the policy block at the bottom of `schema.sql` so the buckets have an access policy.

### 3. Allowed redirect URLs

In Supabase: **Authentication → URL Configuration**. Add to the **Redirect URLs** list:

- `https://aylacrosby531.github.io/ACWebsite/index.html`
- `http://localhost:*` (optional, if you ever serve locally)

Save.

### 4. First sign-in

Visit the live site, type your email, click **Send Magic Link**, click the link in your email. You're in.

## Day-to-day use

- **Add an application**: My Applications → **+ Add Application** → attach resume/cover PDF.
- **Save from job feed**: Job Search → click **Save to Applications** on a card.
- **Upload resumes once**: My Info → resumes section. Reuse them across applications.

## Updating the site

Just edit the files and push:

```bash
git add -A
git commit -m "your message"
git push
```

GitHub Pages redeploys automatically (takes 30–60 seconds).

## Changing the owner email

Both of these must match:

1. `js/config.js` → `OWNER_EMAIL`
2. `schema.sql` policies → `'aylacrosby531@gmail.com'` strings (re-run them in SQL Editor)

## Tech

- HTML / CSS / vanilla JS — no framework, no build step
- [Supabase JS SDK v2](https://supabase.com/docs/reference/javascript) from CDN
- Auth: Supabase email magic link
- Job feeds: [Remotive](https://remotive.com/api-documentation), [RemoteOK](https://remoteok.com/api)
