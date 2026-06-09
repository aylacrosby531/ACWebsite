---
description: Research 5 new job leads for Ayla and surface them on the Daily Job Search page
argument-hint: "[optional: focus, e.g. 'climate-tech' or 'more nonprofits']"
allowed-tools: Bash, Read, Write, Edit, WebSearch, WebFetch
---

You are doing job-search research for Ayla. Goal: find **up to 5 new roles** that
plausibly fit her, verify each is live, and add them to her **Daily Job Search**
page by inserting them into the Supabase `leads` table (they render there as the
✨ Curated source). Target 5, but when the market is slim, widen the net per the
**"Widen the net if the market is slim"** section below rather than padding —
and never re-surface a job already in her leads or applications (see Setup).
Optional focus from the user this run: **$ARGUMENTS** (if empty, keep it diverse).

The page has **four tabs**, driven by the `track` column on each lead. Run the
searches **in this order** and always set `track` explicitly on every lead:
- **🌿 My Picks** (`track: "core"`) — the in-field roles (climate / environmental /
  energy / policy / sustainability / data), **remote-only**, **$60k+**. This is the
  main goal above. Do this search first.
- **🏔️ Anchorage Picks** (`track: "anchorage"`) — the **same in-field criteria** as
  the core search, **except** the role may be **in person in Anchorage, AK** (on-site
  or hybrid there) as well as remote, and the **comp floor is $75k+**. All other hard
  filters are identical (seniority, industry exclusions, no routine fieldwork, verify
  live). Run this **after** the core search, per the **"Anchorage Picks"** section.
- **🌲 Bellingham Picks** (`track: "bellingham"`) — identical to Anchorage Picks but
  the role may be **in person in Bellingham, WA**, and the **comp floor is $80k+**.
  Run this **after** Anchorage Picks, per the **"Bellingham Picks"** section.
- **🥕 Other Picks** (`track: "other"`) — roles **outside** the environmental field
  that her resume & skills still qualify her for, **remote-only**, **$60k+**, held to
  the **same hard filters** otherwise. *Secondary* — do them **last**, after all three
  in-field passes, per the **"Other Picks"** section below.

Work in the repo root: `/Users/aylacrosby/Desktop/2026JobSearch`.

## Credentials check (do this first — stop if missing)

The command writes to Supabase with the **service_role** key (it bypasses RLS,
which the anon key can't). Load it from `.env`:

```bash
set -a; [ -f .env ] && . ./.env; set +a
echo "${SUPABASE_SERVICE_ROLE_KEY:+key present}"
```

- Supabase URL is in `js/config.js` (`SUPABASE_URL`) — currently
  `https://gtlczgyxbnsplcalhbgv.supabase.co`. Use that as `$SB_URL`.
- If `SUPABASE_SERVICE_ROLE_KEY` is **not** set, STOP and tell Ayla:
  "Add your service_role key to `.env` as `SUPABASE_SERVICE_ROLE_KEY=...`
  (Supabase dashboard → Project Settings → API → service_role → reveal). Also
  make sure the `leads` table exists — run `schema.sql` in the SQL editor once."
- The `leads` table needs a **`track`** column (for the My Picks / Other Picks
  tabs). If an insert fails with `column leads.track does not exist`, tell Ayla to
  run this once in the Supabase SQL editor (it's also in `schema.sql`):
  `alter table leads add column if not exists track text default 'core';`
  Then re-run. (Existing rows default to `core`, so the main tab is unaffected.)

## Setup (every run)

1. Read `job-search/about-me.md` — her background, skills, dealbreakers, prefs.
   Ground the Fit assessment in this; don't invent things about her.
2. Pull what's ALREADY on her radar so you DON'T duplicate — both the curated
   `leads` table AND her **applications** (the jobs she's saved / applied to /
   is interviewing for). Re-surfacing a job she's already tracking is the most
   annoying failure mode, so check both:
   ```bash
   # Curated leads already on the page
   curl -s "$SB_URL/rest/v1/leads?select=id,company,role,added" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
   # Jobs already in her application tracker (saved | applied | interview | offer | rejected)
   curl -s "$SB_URL/rest/v1/applications?select=company,role,status,url" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
   ```
   Build one combined exclusion set from both. **Skip any candidate that matches
   an existing `company` + `role`** (case-insensitive; treat near-identical titles
   at the same company as the same job — e.g. "Sustainability Analyst" vs
   "Sustainability Analyst II"). Also skip if the candidate's `apply_url` matches
   an application's `url`. Don't re-research a company already in `leads` unless
   its newest `added` is > 60 days old (this 60-day rule is for `leads` only —
   anything in `applications` stays excluded regardless of age).
3. Read `job-search/sources.md` — boards to check. **Sample from at least 3
   different sources** so the shortlist stays diverse across categories.
4. Get today's date: `date +%F`. Use it for `added` and `verified_live`.

## Find candidates

Vary across these categories (variety > precision): corporate-sustainability,
climate-tech, consulting, nonprofit, research, agency, other-adjacent. Use
WebSearch / WebFetch against the sources.

### Verify each listing is LIVE before anything else

Aggregators keep dead listings up. For every candidate:

1. Follow the link through to the company's **canonical** ATS / careers page
   (Greenhouse, Lever, Workday, Ashby, company site).
2. Confirm it's still posted there. If the canonical page 404s, redirects to the
   careers index, or says "no longer available" → **dead, skip it**. Record
   under "skipped" as "listing expired."
3. If you can't reach the canonical page (auth wall / JS-only), try a second
   source for the same title+company before skipping. If still unverifiable,
   skip as "could not verify live."
4. Note the posting date if visible. Older than ~45 days with no "still hiring"
   signal → add a red flag.

### Then apply the four hard filters

- **Industry exclusion:** skip oil & gas, mining, large/industrial agriculture,
  defense, or companies with meaningfully negative public reputation. For
  consulting firms, check whose clients they primarily serve.
- **Seniority stretch-up:** ~1.5 yrs experience. Skip 5+ yrs required, "Senior"/
  "Lead"/"Principal" titles, or people-management roles.
- **Location (remote-only for now):** keep fully-remote roles, including remote
  with occasional travel to an HQ/main-office city. The ONLY hybrid exception is
  the **Seattle area** — keep those. Skip all other hybrid and on-site roles.
- **Fieldwork conflict:** skip roles needing routine/weekly field/site work.
  Occasional travel is fine.
- **Comp floor:** use the floor from `about-me.md` ("What I want" → base figure;
  **currently $60k**, set by Ayla — read it fresh each run rather than trusting
  this number). Skip if posted base is clearly below it. If unposted, benchmark
  on Levels.fyi / Glassdoor and flag it.

## Widen the net if the market is slim

Aim for **5**, but the verified-live, all-filters-passing pool can be thin on a
given day. Don't pad with junk — but DO widen before settling for fewer. Work in
passes, and stop as soon as you have 5:

1. **Pass 1 — strict.** Everything above, diverse across categories.
2. **Pass 2 — widen the soft levers (only if Pass 1 yields < 5).** Keep the
   **hard dealbreakers firm — never relax these:** remote-only location (Seattle-
   hybrid is the sole exception), industry exclusions, routine-fieldwork conflict,
   and the comp floor. Relax the *soft* preferences instead:
   - **Seniority:** allow roles asking up to ~3 yrs as a stretch (still skip 5+
     yrs, and still skip "Senior"/"Lead"/"Principal"/"Staff" titles and people-
     management — those stay hard).
   - **Category:** go broader than the named buckets — any data / analysis /
     research / QA / coordination / science-writing role at a mission-aligned or
     science/tech/public-sector org counts, even if it's not obviously "climate."
   - **Sources:** pull from more boards than the usual 3 (work through
     `sources.md` more fully, plus company ATS boards directly).
   - **Comp unposted:** keep it and flag with a benchmark (don't drop for missing
     pay).
   - **Fixed-term:** a solid 6+ month contract/fellowship is OK if flagged as
     such (still skip short gigs and anything hourly below the floor).
3. **Pass 3 — cast wider still (only if Pass 2 yields < 5).** The hard
   dealbreakers from Pass 2 *stay* hard. Push the same soft levers further:
   - **Seniority:** stretch to ~4 yrs preferred where the day-to-day still reads
     as ic/early-career (5+ yrs *required* and Senior/Lead/Principal/Staff +
     people-management remain hard, no exceptions).
   - **Category:** treat "mission-aligned" generously — public health, education,
     civic-tech, scientific nonprofits, sustainability-curious startups, and
     general analyst/coordinator/research roles at reputable orgs all count.
   - **Sources:** go past `sources.md` entirely — search company ATS boards
     directly (Greenhouse/Lever/Ashby/Workday), general boards (LinkedIn, Indeed,
     Wellfound, Idealist, WorkforClimate, 80,000 Hours), and run a couple of
     broad WebSearch queries by role + "remote" rather than relying on curated
     boards alone.
   - **Posting age:** a slightly older but *still-verified-live* posting (up to
     ~60 days) is acceptable here if it clears every hard filter.
   Don't lower the bar on truthfulness or the hard dealbreakers — just look in
   more places and read the buckets more loosely.
4. **Label widened picks.** For any role that only made it in via Pass 2 or 3,
   add a `"wider-net"` note in `notes` and an honest red flag naming the stretch
   (e.g. "3 yrs preferred — mild seniority stretch", "adjacent category — public-
   health analyst, not climate") so Ayla can tell the core fits from the reaches.
5. **Floor on honesty.** If after widening you still can't reach 5 verified-live
   roles that clear the hard dealbreakers, add what you found and say so plainly
   in the recap. A genuine "the market was slim today — here are 3 real ones" is
   better than a padded 5. Never invent a role or include one you couldn't verify
   live just to hit the number. When you land below 5, the recap should name how
   far you widened (e.g. "went through Pass 3 and still found only 3") so the thin
   result reads as the market being slim, not the search stopping early.

## Anchorage Picks — in-field roles she can do in person in Anchorage (`track: "anchorage"`)

After the remote core search above is done (whether you hit 5 or not), do a **separate
pass** for the **🏔️ Anchorage Picks** tab. This is the **same in-field search** as the
core run — climate / environmental / energy / policy / sustainability / data — with two
changes:

- **Location:** keep fully-remote roles **and** roles that are **on-site or hybrid in
  the Anchorage, AK area** (she lives there). Anchorage-area in-person is fine here;
  skip on-site/hybrid roles in *other* cities (a remote role open to AK still counts).
- **Comp floor: $75k+** (higher than the remote search's $60k). Skip if posted base is
  clearly below $75k; if unposted, benchmark and flag.

**Everything else stays identical to the core search** — the same in-field scope, the
same hard filters on **seniority** (early-career/IC; skip 5+ yrs and Senior/Lead/
Principal/Staff + people-management), **industry exclusions** (oil & gas, mining,
large/industrial agriculture, defense, bad-reputation orgs), and **no routine/weekly
fieldwork** (occasional travel is fine). Verify-live the same way, and apply the same
widening passes if the pool is thin. Target **up to 5**; this is a real in-field group,
not a throwaway — but Anchorage is a small market, so honestly report a thin result
rather than padding. Tag every one with `track: "anchorage"`. Don't re-surface anything
already in her leads/applications (same dedup set).

## Bellingham Picks — in-field roles she can do in person in Bellingham, WA (`track: "bellingham"`)

After the Anchorage pass, do a **separate pass** for the **🌲 Bellingham Picks** tab.
**Identical to the Anchorage pass in every way**, except:

- **Location:** keep fully-remote roles **and** roles that are **on-site or hybrid in
  the Bellingham, WA area** (skip on-site/hybrid roles elsewhere; a remote role open to
  WA still counts).
- **Comp floor: $80k+** (higher again). Skip clearly-below; benchmark + flag if unposted.

Same in-field scope, same hard filters (seniority, industry exclusions, no routine
fieldwork), same verify-live and widening rules. Target **up to 5**, honestly report
thin. Tag every one with `track: "bellingham"`. Same dedup set — don't re-surface.

> Note: the **Seattle-area hybrid exception** from the core/Other searches is unchanged
> and still belongs in **My Picks** (`core`). The Anchorage and Bellingham tabs are for
> in-person roles in *those specific* metros, at their higher comp floors.

## Other Picks — adjacent roles outside the field (secondary, `track: "other"`)

After **all three in-field passes** above are done (whether you hit 5 or not), do a
**separate, secondary pass** for the **🥕 Other Picks** tab: roles **outside** the
environmental field that her **resume & skills** still qualify her for. Target **up to 3**
here (it's secondary — don't let it crowd out the in-field searches; stop at 3 even if
you could find more). Tag every one with `track: "other"`.

**What stays hard (identical to the core search — never relax):** remote-only location
(Seattle-area hybrid is the sole exception), the **comp floor** (read fresh from
`about-me.md`, currently $60k), **seniority** (early-career/IC — skip 5+ yrs required and
Senior/Lead/Principal/Staff + people-management), **no routine fieldwork**, and the
**industry exclusions** (oil & gas, mining, large/industrial agriculture, defense,
meaningfully bad-reputation orgs). Verify-live the same way.

**What changes:** drop the climate/environmental **mission** requirement. Instead, match
on **transferable skills from her resume** — ground this in `about-me.md`, don't invent:
- **Data & analysis:** data analyst, data quality / QA-QC, regression/statistical
  analysis, reporting & dashboards, data coordination, research analyst.
- **Technical & science writing:** technical writing, documentation, SOPs, science/
  technical communication.
- **Program & stakeholder work:** program/project coordination, operations, logistics,
  community/stakeholder engagement, training & outreach.
- **Tooling she's built:** light web-app / internal-tooling, automated data pipelines,
  Excel/R, GIS/GNSS.

Reasonable destination industries (non-exhaustive, all must clear the exclusions above):
public health & health-data, education/ed-tech, civic-tech & gov-tech, public-sector /
research institutes, general SaaS/tech data or QA roles, biotech/labs, finance/insurance
data ops, libraries/archives, GIS/mapping. Use her transferable strengths as the "fit"
anchor and be honest about what would be a stretch.

Label and honesty work the same as the core search: if a pick is a reach (skill or
seniority), say so in `red_flags`/`notes`. If you can't find 3 clean ones, add what you
found (even 0) and say so — never pad, never include unverifiable or hard-filter-failing
roles just to fill the tab.

## For each role that survives (one at a time, IN ORDER)

This applies to **all four** tracks. Set `track` to `"core"` (remote in-field),
`"anchorage"` (in-field, Anchorage-based), `"bellingham"` (in-field, Bellingham-based),
or `"other"` (Other Picks).

0. **Final dedup guard (do this right before posting each role).** Re-check the
   candidate against the combined exclusion set from Setup (curated `leads` +
   her `applications`). Match on `company` + `role` (case-insensitive, near-
   identical titles count as the same job) OR on `apply_url` vs an application's
   `url`. If it matches anything she's already tracking — **drop it silently and
   move to the next candidate.** Re-surfacing a job already in her applications is
   the worst failure mode, so this guard catches anything the Setup pass missed
   (e.g. a job she applied to between fetch and insert, or a title you only
   normalized once you had the canonical posting).
1. **Post the full lead to chat as a ```json code block** first, so it's captured
   no matter what. Use this shape (matches the `leads` table in `schema.sql`):
   ```json
   {
     "id": "acme-climate__sustainability-analyst",
     "company": "Acme Climate",
     "role": "Sustainability Analyst",
     "track": "core",
     "categories": ["corporate-sustainability"],
     "apply_url": "https://boards.greenhouse.io/acme/jobs/123",
     "location": "Remote (US)",
     "comp": "$72k–$85k",
     "salary_min": 72000,
     "posted": "2026-05-20",
     "verified_live": "2026-06-02",
     "summary": "What the company does + the role.",
     "fit": "Why it plausibly fits Ayla — grounded in about-me.md, honest both ways.",
     "green_flags": ["Remote-first", "Clear $70k+ band"],
     "red_flags": ["Comp not posted — Levels.fyi benchmark"],
     "sources": [{"name": "Climatebase", "url": "https://climatebase.org/job/123"}],
     "notes": "",
     "added": "2026-06-02"
   }
   ```
   - `id` = `company-slug__role-slug` (lowercase, non-alphanumeric → `-`), stable.
   - `track` = `"core"` (🌿 My Picks), `"anchorage"` (🏔️ Anchorage Picks),
     `"bellingham"` (🌲 Bellingham Picks), or `"other"` (🥕 Other Picks). Required.
   - `apply_url` MUST be the canonical company ATS/careers link, never the aggregator.
2. **Insert it into Supabase.** Write the JSON object to a temp file and upsert
   (upsert on `id` so a re-run is safe):
   ```bash
   cat > /tmp/lead.json <<'JSON'
   { ...the object above... }
   JSON
   curl -s -X POST "$SB_URL/rest/v1/leads" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -H "Prefer: resolution=merge-duplicates,return=minimal" \
     --data-binary @/tmp/lead.json
   ```
   Check the curl exit code / response. If it errors, note it in the run summary
   and move on — don't abort the whole run.

## End of run

1. Write a run summary to `job-search/run-summaries/<today>.md` (gitignored,
   stays local):
   - **New leads added** — one bullet each: company, category, one-line why, apply
     link. **Group by track** — 🌿 My Picks (core) and 🥕 Other Picks (other) — so
     the two tabs are easy to scan.
   - **Skipped** — which filter caught each (incl. "listing expired" /
     "could not verify live"), short list.
   - **Patterns worth flagging** — e.g. "3 climate-tech roles were all on-site
     Bay Area" or "Climatebase had 4 expired listings up top."
2. Print a short recap to chat: how many added **per track** (My Picks vs Other
   Picks), how many skipped (with main filter reasons), and the run-summary path.

> No git push is needed — leads live in Supabase and the page reads them live.
> (A one-time deploy of the site code change is what makes the page read the
> table; after that, every run just writes to the DB.)

## Style
Short bullets, no padding. Cite sources inline as `[name](url)`. Honest both
ways — red flags alongside green ones. Don't recommend whether she should apply;
lay out the evidence. "Not enough public info" is a valid answer — don't guess.
