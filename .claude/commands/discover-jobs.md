---
description: Research new job leads for Ayla (Remote + Hybrid·West) and surface them on the Daily Job Search page
argument-hint: "[optional: focus, e.g. 'just remote' or 'Portland' or 'comms roles']"
allowed-tools: Bash, Read, Write, Edit, WebSearch, WebFetch
---

You are doing job-search research for Ayla. Goal: find new roles that **plausibly fit her
and that she'd actually want**, verify each is **live**, and add them to her **Daily Job
Search** page by inserting them into the Supabase `leads` table. Optional focus this run:
**$ARGUMENTS** (if empty, do both branches and keep it diverse).

## The two tabs (set `track` on every lead)
- **🌐 Remote** (`track: "remote"`) — **fully-remote US** roles she'd qualify for.
- **📍 Hybrid · West** (`track: "west"`) — **hybrid (preferred) or in-person** roles in the
  West: her target metros **Salt Lake City · Golden CO · Boulder CO · Olympia WA · Portland
  OR · Bend OR**, plus **similar PNW / Mountain-West / Northern-CA metros** (WA, OR, northern
  & coastal CA incl. the **Bay Area / Sacramento**, CO, UT, ID, MT, +WY/NV). **No East Coast;
  not the far South / Southwest** (skip TX, AZ, NM, the Southeast). Prefer **hybrid** over
  fully on-site, but on-site in these metros is fine.

Aim for **up to ~5 per tab** (stop sooner if the verified-live pool is thin — don't pad).
Run the **Remote** search first, then **Hybrid·West**.

## What she's looking for (READ THIS — it changed)
Ground fit in `job-search/about-me.md`, but the **priorities have been reset**:
- **Comp floor: $70k.** $70–75k is acceptable; flag the low end. If unposted, benchmark
  (Levels.fyi/Glassdoor) and flag.
- **🌐 Remote tab — two-step comp floor:** First search **at the $70k floor**. If that yields
  **fewer than 2 verified-live clean picks**, run a **second pass with the floor dropped to
  $60k**, and **MARK** every pick that only clears on the $60k pass: set `stretch: true` with
  the **first `red_flags` entry** = "🔶 Stretch — comp $Xk, below the $70k floor (Remote
  widened to $60k)". So $70k+ Remote picks render clean; $60–70k ones render as flagged 🔶
  stretches below them. **The 📍 Hybrid·West tab keeps the firm $70k floor** (no $60k step).
- **Environmental-leaning but genuinely flexible** — prioritize environmental / sustainability
  / climate / conservation / outdoors / mission-aligned roles, **but include any reputable
  early-career role she'd qualify for**. "Sort of environmental" is the preference, not a gate.
- **NOT a data-analyst / heavy-coding lane.** She does **not** have (or want) strong
  CS/coding/SQL/Python/ML skills, and data-analyst roles aren't "her." **Skip** data analyst /
  data scientist / BI / analytics-engineer / software roles that hinge on coding. Light
  reporting/Excel/spreadsheets is fine; a role built around programming is not.
- **Lean into her actual strengths** (from about-me.md): community engagement & outreach,
  stakeholder / tribal / community partnership, **science communication & technical writing**,
  public reporting, **training & instruction**, **program / project coordination**, operations
  & logistics, QA/QC (process, not code), conservation / stewardship / field-science generalist,
  risk management, and outdoor/guiding leadership. Good-fit titles: program/project coordinator,
  outreach / engagement / community coordinator or specialist, sustainability coordinator,
  conservation/stewardship/parks coordinator, communications / science-writer / content,
  research coordinator or assistant (non-coding), operations/logistics coordinator, nonprofit
  program associate, grants/partnerships coordinator, environmental specialist/associate (entry,
  not fieldwork-heavy). De-emphasize **air quality** specifically — it's just where she landed,
  not an interest; only include AQ roles if they're otherwise a great fit.

## Credentials check (do this first — stop if missing)
```bash
set -a; [ -f .env ] && . ./.env; set +a
echo "${SUPABASE_SERVICE_ROLE_KEY:+key present}"
```
`$SB_URL` = `https://gtlczgyxbnsplcalhbgv.supabase.co` (also in `js/config.js`). If the key
is **not** set, STOP and tell Ayla to add `SUPABASE_SERVICE_ROLE_KEY` to `.env` (Supabase →
Project Settings → API → service_role → reveal) and to run `schema.sql` once if the `leads`
table / `track` / `stretch` columns are missing.

## Setup (every run)
1. Read `job-search/about-me.md` (background, skills, dealbreakers) — but apply the reset
   priorities above (they override the older air-quality/data framing if about-me lags).
2. Pull what's already on her radar so you DON'T duplicate — both `leads` and `applications`:
   ```bash
   curl -s "$SB_URL/rest/v1/leads?select=id,company,role,track,added" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
   curl -s "$SB_URL/rest/v1/applications?select=company,role,status,url" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
   ```
   Build one combined exclusion set. **Skip any candidate matching an existing `company` +
   `role`** (case-insensitive; near-identical titles at the same company = same job) OR whose
   `apply_url` matches an application's `url`. Don't re-research a `leads` company unless its
   newest `added` is > 60 days old (applications stay excluded regardless of age).
3. Read `job-search/sources.md` — sample from **≥3 different sources** for diversity. Also go
   direct to company ATS boards (Greenhouse/Lever/Ashby/Workable/Breezy) and general boards
   (LinkedIn, Indeed, Idealist, Built In, WorkforClimate, 80,000 Hours, conservationjobboard,
   ProFellow), plus the metro/state boards for the West tab (governmentjobs.com,
   careers.wa.gov, statejobs.utah.gov, etc.).
4. `date +%F` → use for `added` and `verified_live`.

## Verify each listing is LIVE before anything else
1. Follow through to the company's **canonical** ATS/careers page.
2. If it 404s / redirects to the careers index / says "no longer available" → **dead, skip**
   ("listing expired").
3. If the canonical page is auth/JS-gated (Workday, ADP, NEOGOV, CSOD, SelectMinds often are),
   try a **second source** (a dated aggregator or the company's own listing) before skipping.
   - If a second source confirms it's live → treat it as verified (flag the canonical-unfetchable).
   - If still unconfirmable **but it's a genuinely strong fit**, DON'T drop it — **insert it as a
     GATED lead** (`gated: true`, with a real `apply_url` so she can open it): it renders in the
     "🔒 you decide" strip at the top of its tab with Approve/Deny buttons. Put the reason as the
     **first `red_flags` entry** (e.g. "🔒 Couldn't verify open — NREL Workday is login/JS-gated;
     open it to confirm"). Only gate roles that clear the OTHER hard filters (comp, seniority,
     region, not-coding) — a gated lead is "probably-live + good fit, just unverifiable," not a
     way to smuggle in off-criteria roles. If it's a weak fit OR fails another filter, just skip
     it and note it in the recap.
4. Posting older than ~45 days with no "still hiring" signal → add a red flag.

## Hard filters (apply to BOTH tabs — never relax)
- **Comp:** base **≥ $70k** (or unposted → benchmark + flag). **Remote tab only:** if the $70k
  pass yields <2 clean picks, do a second $60k pass and mark those `stretch: true` (see the
  two-step note above). West stays firm at $70k.
- **Seniority:** early-career / individual-contributor. **Skip** 5+ yrs required, **Senior /
  Lead / Principal / Staff** titles, and **any people-management** (Manager/Director/Head/
  Supervisor running a team). A "Coordinator/Specialist/Associate" titled Manager that
  supervises no one is OK — verify.
- **Industry exclusions:** oil & gas, mining/extraction, large/industrial agriculture,
  defense/weapons, or meaningfully bad-reputation orgs. For consultancies, check whose clients
  they primarily serve (skip those serving mainly extraction/defense).
- **No routine/weekly fieldwork** — occasional travel/site visits are fine; a role built around
  regular field/site work is not.
- **Not a coding/data-analyst role** (see "What she's looking for").
- **Location:** Remote tab = fully-remote US (open to her). West tab = the metros / regions
  listed above; skip on-site/hybrid outside them, and skip East Coast / far-South locations.

## Widen the net if a tab is thin
Work in passes, stop once you have ~5: **Pass 1** strict; **Pass 2** (if <5) widen the *soft*
levers — seniority up to ~3 yrs (still no 5+/Senior/Lead/Staff/management), broader role types,
more sources, unposted-comp kept-with-benchmark, solid 6+ month contracts/fellowships flagged;
**Pass 3** (if <5) seniority up to ~4 yrs where the day-to-day still reads IC, treat
"reputable & mission-aligned" generously, search company ATS + general boards directly, accept
a still-live posting up to ~60 days old. Label any Pass-2/3 pick with a `"wider-net"` note and
an honest red flag naming the stretch. **Never** relax the hard filters or truthfulness.

## Closest-picks fallback (🔶 Stretch) — never leave a tab empty
If a tab ends Pass 3 with **fewer than 2** clean picks, top it up with the **closest
verified-live near-misses** (at most 2 per tab). A stretch pick **must still be verified-live**
and must **not** be an excluded industry. Everything else may bend by ONE step (seniority
beyond Pass 3 but not people-management; comp somewhat below $70k; a West metro just outside the
target list / region-locked-remote not confirmed open to her; mild category reach). Set
**`stretch: true`** and make the **first `red_flags` entry** name the exact miss
(e.g. "🔶 Stretch — comp $64k, below the $70k floor", "🔶 Stretch — 5+ yrs requested",
"🔶 Stretch — Phoenix, outside the West target region"). Clean picks keep `stretch: false`.
(Needs the `stretch` column — see `schema.sql` if an insert errors on it.)

## For each role that survives (one at a time, IN ORDER)
0. **Final dedup guard** right before posting: re-check against the combined exclusion set
   (`leads` + `applications`) on company+role (case-insensitive) or apply_url vs an
   application url. If it matches anything she's already tracking, **drop it silently**.
1. **Post the full lead to chat as a ```json code block** first. Shape:
   ```json
   {
     "id": "company-slug__role-slug",
     "company": "Acme Org",
     "role": "Program Coordinator",
     "track": "remote",
     "stretch": false,
     "gated": false,
     "categories": ["nonprofit", "program-coordination"],
     "apply_url": "https://boards.greenhouse.io/acme/jobs/123",
     "location": "Remote (US)",
     "comp": "$72k–$85k",
     "salary_min": 72000,
     "posted": "2026-06-10",
     "verified_live": "2026-06-20",
     "summary": "What the org does + the role.",
     "fit": "Why it fits her — grounded in about-me.md + the reset priorities, honest both ways.",
     "green_flags": ["Remote US", "Clear $70k+ band", "Outreach/coordination — her lane"],
     "red_flags": ["Comp not posted — Glassdoor benchmark"],
     "sources": [{"name": "Greenhouse", "url": "https://..."}],
     "notes": "",
     "added": "2026-06-20"
   }
   ```
   - `id` = `company-slug__role-slug` (lowercase, non-alphanumeric → `-`), stable.
   - `track` = `"remote"` (🌐) or `"west"` (📍 Hybrid·West). Required.
   - `stretch` = `false` clean, or `true` for a 🔶 fallback (first red flag names the miss).
   - `gated` = `false` normally; `true` for a strong fit you couldn't verify live behind a
     login/JS portal (renders in the "🔒 you decide" strip; first red flag names what to confirm).
   - `apply_url` MUST be the canonical company ATS/careers link, never an aggregator.
2. **Insert it into Supabase** (upsert on `id` so re-runs are safe):
   ```bash
   cat > /tmp/lead.json <<'JSON'
   { ...the object above... }
   JSON
   curl -s -X POST "$SB_URL/rest/v1/leads" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" -H "Prefer: resolution=merge-duplicates,return=minimal" \
     --data-binary @/tmp/lead.json
   ```
   Check the HTTP code; if it errors, note it in the run summary and move on.

## End of run
1. Append a run summary to `job-search/run-summaries/<today>.md` (gitignored): **New leads
   added** grouped by track (🌐 Remote / 📍 Hybrid·West), marking any 🔶 stretch with the miss;
   **Skipped** with the filter that caught each (incl. "listing expired" / "could not verify
   live" / "below $70k" / "coding/data role" / "wrong region"); **Patterns** worth flagging.
2. Print a short recap to chat: count per tab, count skipped (with main reasons), and the
   run-summary path.

## Style
Short bullets, no padding. Cite sources inline as `[name](url)`. Honest both ways — red flags
beside green ones. Don't tell her whether to apply; lay out the evidence. "Couldn't verify
live" / "not enough public info" are valid answers — don't guess.
