---
description: Research new job leads for Ayla (Remote + Hybrid·West) and surface them on the Daily Job Search page
argument-hint: "[optional: focus, e.g. 'just remote' or 'Portland' or 'comms roles']"
allowed-tools: Bash, Read, Write, Edit, WebSearch, WebFetch
---

You are doing job-search research for Ayla. Goal: find new roles that **plausibly fit her
and that she'd actually want**, verify each is **live**, and add them to her **Daily Job
Search** page by inserting them into the Supabase `leads` table. Optional focus this run:
**$ARGUMENTS** (if empty, do all three tabs and keep it diverse).

## The three tabs (set `track` on every lead)
- **🌐 Remote** (`track: "remote"`) — **fully-remote US** roles she'd qualify for.
- **📍 Hybrid · West** (`track: "west"`) — **hybrid (preferred) or in-person** roles in the
  West: her target metros **Salt Lake City · Golden CO · Boulder CO · Olympia WA · Portland
  OR · Bend OR**, plus **similar PNW / Mountain-West / Northern-CA metros** (WA, OR, northern
  & coastal CA incl. the **Bay Area / Sacramento**, CO, UT, ID, MT, +WY/NV). **No East Coast;
  not the far South / Southwest** (skip TX, AZ, NM, the Southeast). Prefer **hybrid** over
  fully on-site, but on-site in these metros is fine.
- **🎓 Programs** (`track: "programs"`) — **paid early-career programs built for recent grads**:
  graduate / rotational / mentorship / fellowship / apprenticeship programs and substantial
  paid internships. **Location: remote OR West** (same Western metros/regions as the West tab).
  **No hard comp floor — but it must be PAID** (flag the rate). See the **"Programs"** section.
- **🔬 CA Field Science** (`track: "field"`) — **early-career FIELD scientist roles in California**:
  environmental & marine science (also biology / ecology / fisheries / natural resources).
  **This tab WANTS fieldwork** — it's the exception to the no-fieldwork rule; seasonal-field +
  office combined is fine. **$50k+ floor AND it must come with full-time benefits** (health
  insurance, etc.). See the **"CA Field Science"** section.

Aim for **up to ~5 per tab** (stop sooner if the verified-live pool is thin — don't pad).
Run **Remote** first, then **Hybrid·West**, then **Programs**, then **CA Field Science**.

## What she's looking for (READ THIS — it changed)
Ground fit in `job-search/about-me.md`, but the **priorities have been reset**:
- **Comp floor: $55k** (hard, all tabs). Skip clearly below $55k; if unposted, benchmark
  (Levels.fyi/Glassdoor) and flag. $55–65k is fine — just note it. (Programs has no floor —
  must be paid.)
- **This run especially: look HARD for environmental sustainability + coordinator roles** —
  sustainability coordinator, environmental coordinator/specialist, program/project coordinator
  at environmental/sustainability orgs, conservation/stewardship coordinator, outreach &
  engagement coordinator — in **both Remote and Hybrid·West**. These are her sweet spot.
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
     **BUT third-party job-board MIRRORS do NOT prove currency** — Climatebase, ClimateTechList,
     Schmidt Marine, Idealist/LinkedIn/Indeed copies, EPIP, etc. keep DEAD listings up for months.
     A mirror is a *lead*, never proof a role is still open. If the only "confirmation" is a mirror
     and you can't reach the employer's own canonical page/board, **GATE it** (`gated: true`) so
     Ayla checks the employer site herself — do NOT mark it a clean pick. (This is how a stale SFEI
     listing got mis-added once.)
   - If still unconfirmable **but it's a genuinely strong fit**, DON'T drop it — **insert it as a
     GATED lead** (`gated: true`, with a real `apply_url` so she can open it): it renders in the
     "🔒 you decide" strip at the top of its tab with Approve/Deny buttons. Put the reason as the
     **first `red_flags` entry** (e.g. "🔒 Couldn't verify open — NREL Workday is login/JS-gated;
     open it to confirm"). Only gate roles that clear the OTHER hard filters (comp, seniority,
     region, not-coding) — a gated lead is "probably-live + good fit, just unverifiable," not a
     way to smuggle in off-criteria roles. If it's a weak fit OR fails another filter, just skip
     it and note it in the recap.
4. Posting older than ~45 days with no "still hiring" signal → add a red flag.

## Hard filters (apply to Remote & Hybrid·West — never relax; see Programs for its exceptions)
- **Comp:** base **≥ $55k** (or unposted → benchmark + flag). Applies to Remote & Hybrid·West.
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
beyond Pass 3 but not people-management; comp somewhat below $55k; a West metro just outside the
target list / region-locked-remote not confirmed open to her; mild category reach). Set
**`stretch: true`** and make the **first `red_flags` entry** name the exact miss
(e.g. "🔶 Stretch — comp $50k, below the $55k floor", "🔶 Stretch — 5+ yrs requested",
"🔶 Stretch — Phoenix, outside the West target region"). Clean picks keep `stretch: false`.
(Needs the `stretch` column — see `schema.sql` if an insert errors on it.)

## 🎓 Programs — paid early-career programs for recent grads (`track: "programs"`)
Run this **after** Remote and Hybrid·West. This tab is a **different realm** from the other two:
structured programs designed *for* recent grads (her ~1.5 yrs is the target, not a stretch).
Archetype she likes: a **"Graduate Sustainability Consultant" 18-month mentorship, $70–90k**
(carbon accounting / ESG / building efficiency, mentored by senior staff). Find **up to 5**.

**What counts (search these program-shaped keywords, not just "coordinator"):**
- "Graduate [X] Consultant/Analyst/Associate", "Graduate Programme/Program", "Graduate Scheme"
- "Rotational" / "Analyst Development Program" / "Early Career Program" / "[Company] Academy"
- structured **Mentorship** / **Fellowship** / **Apprenticeship** programs
- substantial **paid internships** (real work + pay, not coffee-runs)
Good homes: sustainability/ESG/environmental **consultancies** (graduate consultant schemes),
utilities & energy companies, national labs, corporates' sustainability/EHS grad programs,
foundations & large nonprofits with fellowships, conservation corps with stipended fellowships,
AmeriCorps/VISTA-adjacent **only if** the stipend is livable (flag it).

**Filters for this tab (different from the others):**
- **Location:** **remote OR West** (same Western metros/regions as the 📍 West tab). Skip
  East-Coast / far-South in-person programs (a remote-US program is fine).
- **Comp:** **no hard floor — but it MUST be genuinely paid.** Put the stipend/salary/hourly
  rate in `comp` and **flag the rate** (e.g. "$22/hr stipend ≈ $46k — below her usual $55k, but
  it's a mentorship program"). Skip unpaid / "for credit only" / sub-livable token stipends.
- **Seniority:** these *target* recent grads, so the "skip 5+ yrs / entry-level" logic inverts —
  **keep** roles explicitly for new grads / 0–3 yrs. Still skip anything actually senior or
  people-management (a real grad program won't be).
- **Field & function:** env-leaning but flexible (same as the other tabs); her strengths apply.
  A graduate **consultant/analyst** program that includes some carbon-accounting / ESG / Excel
  modeling **is fine** (it's mentored and broad) — just skip pure software/CS/dev programs.
- **Verify-live** the same way; gate (🔒) a strong-fit program you can't confirm behind a portal.
Tag every one `track: "programs"`. A below-usual-pay program is **not** a 🔶 stretch here (low
pay is expected) — just flag the rate in `comp`/`red_flags` and keep `stretch: false`.

## 🔬 CA Field Science — early-career field scientist in California (`track: "field"`)
Run this **last**. This tab is the **exception to the no-fieldwork rule** — here fieldwork is
**wanted**. Find **up to 5** early-career FIELD scientist roles **in California**.

**What counts:** field scientist / field biologist / environmental field scientist / marine
science technician / field research assistant / fisheries / ecology / wildlife / botany /
natural-resources technician — **emphasis on environmental science and marine science**.
Seasonal-field + office combined is fine; some lab/data is fine. Good homes: CA universities &
marine labs (UC Davis Bodega/Bodega Marine Lab, UC Santa Cruz, Scripps/UCSD, Moss Landing,
Hopkins/Stanford, Humboldt/Cal Poly Humboldt, San Diego State), CA state agencies (CDFW, State
Water Boards, State Parks, Ocean Protection Council, CA Sea Grant), NOAA/NMFS SW Fisheries &
cooperative institutes in CA, estuary/reserve programs (NERRS — Elkhorn Slough, Tijuana River,
SF Bay NERR), RCDs & resource conservation districts, watershed councils, Audubon/TNC/PRBO/Point
Blue field roles, environmental consultancies w/ CA field crews (screen out those serving mainly
oil&gas/mining/defense).

**Filters for this tab (different from the others):**
- **Location: California** (statewide — coastal & inland; SoCal is fine here, marine science
  spans the whole coast). On-site/field in CA. **But SKIP roles that require CA residency *to
  apply*** — some CA state / CalCareers postings require existing CA residency or list/exam
  eligibility; she's not a CA resident yet, so those don't count. (Willing-to-relocate is fine;
  must-already-be-a-resident-to-apply is not.)
- **Comp: $50k+** (lower floor than the other tabs). Skip clearly below $50k.
- **MUST come with full-time benefits** — the role must include **health insurance + standard
  FT benefits** (a benefitted full-time role, OR a benefitted seasonal/term position). **SKIP**
  bare seasonal/temp/hourly gigs with **no benefits**, AmeriCorps/intern token stipends, and
  anything where benefits aren't offered. (This is the key gate — say so in red_flags if benefits
  are unclear and you're gating it.)
- **Fieldwork is EXPECTED** (do NOT apply the no-fieldwork filter here). Routine field/site work,
  seasonal field seasons, boats, remote sites — all fine.
- **Seniority:** early-career / IC (0–3 yrs, technician/assistant/scientist I-II). Skip 5+ yrs,
  Senior/Lead/Principal, and people-management.
- **Industry exclusions still apply** (oil&gas/mining/extraction/defense/bad-rep). For
  consultancies, check whose CA field projects they primarily serve.
- **Verify-live** the same way; gate (🔒) a strong-fit role behind a portal (CalCareers/NEOGOV
  and university Workdays are common here). Tag every one `track: "field"`. Keep `stretch: false`
  unless it misses a hard filter (then flag the miss).

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
     "green_flags": ["Remote US", "Clear $55k+ band", "Outreach/coordination — her lane"],
     "red_flags": ["Comp not posted — Glassdoor benchmark"],
     "sources": [{"name": "Greenhouse", "url": "https://..."}],
     "notes": "",
     "added": "2026-06-20"
   }
   ```
   - `id` = `company-slug__role-slug` (lowercase, non-alphanumeric → `-`), stable.
   - `track` = `"remote"` (🌐), `"west"` (📍 Hybrid·West), `"programs"` (🎓 Programs), or
     `"field"` (🔬 CA Field Science). Required.
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
   added** grouped by track (🌐 Remote / 📍 Hybrid·West / 🎓 Programs / 🔬 CA Field Science), marking any 🔶 stretch
   (with the miss) and any 🔒 gated; **Skipped** with the filter that caught each (incl. "listing
   expired" / "could not verify live" / "below $55k" / "coding/data role" / "wrong region" /
   "unpaid"); **Patterns** worth flagging.
2. Print a short recap to chat: count per tab, count skipped (with main reasons), and the
   run-summary path.

## Style
Short bullets, no padding. Cite sources inline as `[name](url)`. Honest both ways — red flags
beside green ones. Don't tell her whether to apply; lay out the evidence. "Couldn't verify
live" / "not enough public info" are valid answers — don't guess.
