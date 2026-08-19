You are doing job-search research for Ayla. Goal: find roles that **her resume/skills make her at
least mostly qualified for**, verify each is **live**, and add them to her **Job Search** page by
inserting them into the Supabase `leads` table. The page has **THREE tabs** — populate all three.
Optional focus this run: **$ARGUMENTS** (if empty, do all three tabs and keep it diverse).

## The three tabs (set `track` on every lead)
- **🌐 Remote** (`track: "remote"`) — **fully-remote US** roles.
- **🌲 Washington** (`track: "wa"`) — **in-person or hybrid** roles in the **Seattle · Olympia ·
  Tacoma area** (the Puget Sound / I-5 corridor: Seattle, Bellevue, Redmond, Kirkland, Everett,
  Tacoma, Lakewood, Olympia, Lacey, Tumwater + nearby). Skip WA roles far outside this area
  (e.g. Spokane, Tri-Cities) unless remote — and skip a WA role that's actually fully remote
  (that goes on the Remote tab).
- **🧂 Salt Lake City** (`track: "slc"`) — **in-person or hybrid** roles in **SLC & the Wasatch
  Front** (SLC, West Valley, Murray, Sandy, Draper, Lehi, Provo/Orem, Ogden, Park City). A fully
  remote SLC-HQ'd role goes on the Remote tab.

**Aim for ~5–8 verified-live per tab** (stop sooner if a tab's live pool is thin — don't pad).
Run **Remote**, then **Washington**, then **Salt Lake City** (fan out parallel searches).

## What she's looking for
- **Lean ENVIRONMENTAL** — prioritize environmental / sustainability / climate / conservation /
  outdoors / mission-aligned roles her resume fits. **But it's not a gate:** if the
  environmental pool for a tab is thin, **poke in reputable non-environmental roles** her resume
  suits (tech/SaaS, healthcare/health-tech, higher-ed, government, utilities, professional
  services, etc.). Environmental is the preference; "mostly suited to her resume" is the bar.
- **Comp: $50k+** (or unposted → benchmark on Levels.fyi/Glassdoor + flag).
- **Seniority:** early-career / IC. **Skip** 5+ yrs required, Senior/Lead/Principal/Staff, and
  people-management (Manager/Director/Head/Supervisor running a team). "Coordinator/Associate/
  Specialist" is the sweet spot; a process/ops "Analyst" (not heavy-coding) is fine.
- **Include intro-tech / tech-adjacent roles** (env or non-env) — her app-building + CRM-data +
  QA background makes these a real lane: technical/product support, IT/help-desk (tier 1),
  implementation/onboarding, product/program operations at a tech co, manual QA/software-QA,
  data-operations / reporting analyst (light), CRM-operations / RevOps, no-code/low-code &
  business-systems/tools roles, software technical writing. **But she is NOT a software engineer /
  data scientist** — skip real SWE (Python/Java, SQL-heavy pipelines, ML) and pure data-science.

## Her resume / skills — MATCH ON THESE; don't overstate (ground in `job-search/about-me.md` + `Ayla_Crosby_Resume_2026.pdf`)
~2 yrs professional. B.S. Marine & Environmental Sciences, 4.0 GPA. Transferable substance:
- **Program / operations management** — ran a statewide program (70+ sensors, 45 communities):
  asset/inventory tracking, operator support, platform rollout & adoption.
- **CRM data operations (Salesforce)** — maintains all records in Salesforce (site/community/contact/
  service data). **ACCURACY GUARDRAIL:** she's a Salesforce *data user* — genuine CRM data-ops /
  data-hygiene — NOT a certified Salesforce Administrator; she does **not** build flows/validation
  rules/custom objects/permission sets or write Apex. Surface **CRM-ops / data-coordinator / RevOps-
  that-uses-Salesforce** roles; treat literal **"Salesforce Administrator"** roles (admin config /
  SF Admin cert / Apex required) as a **🔶 stretch**, not a clean pick.
- **Built & shipped a web app** (Supabase/GitHub, AI-assisted with Claude Code/Copilot) — real
  technical fluency & citizen-developer / no-code aptitude. **GUARDRAIL:** she ships working systems
  but is **NOT** a professional software engineer (no production codebase / CS degree / SWE role) —
  fits tech-support / implementation / product-ops / QA / no-code-tools / technical writing; skip
  real SWE.
- **Data & QA** — environmental data analysis, regression & statistical analysis, QA/QC, Excel:
  genuine *light-to-moderate* data + quality skills. Reporting / data-ops / QA-analyst-adjacent roles
  are fair game; **skip** pure data-scientist / ML / SQL-engineering.
- **Project & logistics coordination · technical writing** (SOPs, QAPPs, reports) **· process/
  compliance · training & instruction / enablement · stakeholder / tribal / community & partnership
  management ·** community outreach & engagement · risk management.
- **Good-fit titles (env-leaning first, then general & TECH-ADJACENT):** sustainability / environmental /
  conservation / stewardship / outreach / community-engagement coordinator or specialist · program /
  project coordinator or associate · operations coordinator/associate/analyst · **CRM operations /
  data coordinator / RevOps analyst (uses Salesforce)** · implementation / onboarding / customer-
  success associate · **product / program operations (tech)** · **technical / product support
  specialist · IT / help-desk support (tier 1)** · **QA analyst / software-QA tester (manual,
  non-coding)** · **data-operations / data-quality / reporting analyst (light)** · **no-code/low-code
  builder / business-systems / tools coordinator** · technical writer / documentation (incl. software
  docs) · training & enablement coordinator · QA/compliance coordinator · grants/contracts coordinator ·
  research coordinator (non-coding) · administrative/executive coordinator · (env+tech crossover:
  GIS technician — cautious, may want ArcGIS).

## Credentials check (do this first — stop if missing)
```bash
set -a; [ -f .env ] && . ./.env; set +a
echo "${SUPABASE_SERVICE_ROLE_KEY:+key present}"
```
`$SB_URL` = `https://gtlczgyxbnsplcalhbgv.supabase.co`. If the key is **not** set, STOP and tell
Ayla to add `SUPABASE_SERVICE_ROLE_KEY` to `.env`.

## Setup (every run)
1. Skim `job-search/about-me.md` + `Ayla_Crosby_Resume_2026.pdf` for grounding.
2. Pull what's already on her radar so you DON'T duplicate — both `leads` and `applications`:
   ```bash
   curl -s "$SB_URL/rest/v1/leads?select=id,company,role,track,added" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
   curl -s "$SB_URL/rest/v1/applications?select=company,role,status,url" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
   ```
   **Skip any candidate matching an existing `company` + `role`** (case-insensitive) OR whose
   `apply_url` matches an application's `url`. Don't re-research a `leads` company unless its
   newest `added` is > 60 days old (applications stay excluded regardless of age).
3. `date +%F` → use for `added` and `verified_live`.

## Where to search
Go straight to **reputable orgs' OWN ATS boards** (Greenhouse / Lever / Ashby / Workable) sorted
by most-recent, and **verify via the ATS JSON API** where possible (HTML SPA shells return 200
even when a job is dead). For the WA/SLC in-person cuts, also hit the state/metro/university
portals: **careers.wa.gov** (WA Dept. of Ecology, Commerce, Fish & Wildlife, State Parks, Puget
Sound Partnership), **governmentjobs.com** (King/Pierce/Thurston/Snohomish counties, Seattle,
Tacoma, Olympia), **wadistricts.us** (WA conservation districts — strong environmental vein), UW;
and for SLC: **utah.peopleadmin.com** (University of Utah), **statejobs.utah.gov** (Utah DEQ/DNR),
Salt Lake City/County, plus SLC-area employers (SaaS: Podium/Lucid/Weave/Domo; health:
Intermountain ops; nonprofits: Tracy Aviary, HEAL Utah, Sageland, Utah Clean Energy). Salesforce-
heavy shops (SaaS/health-tech/edtech) are a rich vein for her CRM experience.

## 🏔️ Alaska tab (`track: "ak"`) — run when focused on Alaska or when Ayla asks
Not part of the default Remote/WA/SLC sweep — run this cut when the focus is Alaska. Find
**Alaska-based employers** offering roles that let her stay flexible: **remote-from-Alaska,
hybrid, OR in-person-with-remote-flexibility** (able to work from other states for periods /
travel). **ANY field her resume fits** (env-lean is a nice-to-have, not required here). $50k+
(or benchmark/flag). Early-career/IC, same seniority + not-real-SWE guardrails as the other tabs.
Set `track: "ak"`; write `location` clearly (e.g. "Remote (Alaska-based)", "Hybrid — Anchorage, AK",
"In-person — Anchorage, AK (remote-flexible)").
**Alaska employer homes:** State of Alaska (Workplace Alaska / governmentjobs.com/careers/alaska),
University of Alaska (UAA/UAF/UAS — careers.alaska.edu), **Alaska Native regional & village
corporations** (Doyon, NANA, Bristol Bay Native Corp, Ahtna, Calista, Sealaska, Chugach, CIRI,
Arctic Slope/ASRC, Bering Straits, Aleut, Koniag, Chenega) and their subsidiaries, **Alaska Native
tribal health** (Alaska Native Tribal Health Consortium/ANTHC, Southcentral Foundation, YKHC,
SEARHC, Tanana Chiefs), Alaska nonprofits (Alaska Conservation Foundation, TNC-Alaska, Audubon
Alaska, Alaska SeaLife Center, First Alaskans Institute, Rasmuson Foundation), municipalities
(Municipality of Anchorage, Mat-Su Borough), utilities & telecom (Chugach Electric, GVEA, GCI,
Alaska Communications), Providence Alaska (ops/admin, not clinical), and remote-first employers
that explicitly hire Alaskans. Verify-live + gate the same way (Workplace Alaska/NEOGOV and
corporate Workday/iCIMS boards are often JS-gated → gate).

## Watchlist — check these recurring-fit employers' LIVE boards every run
Read `job-search/watchlist.md`. It lists orgs that post near-perfect roles for her but fill fast
(so weekly runs keep catching them mid-closed — this is the #1 reason past recaps felt repetitive).
**Open each board's LIVE page and add a role ONLY if it's actually open today.** If a run turns up
a genuinely-great fit that's already closed, **add that employer to `watchlist.md`** so we catch its
next cycle — but do NOT surface the closed role to Ayla (see recap rule below).

## Verify each listing is LIVE before adding
1. Follow through to the company's **canonical** ATS/careers page and confirm it's **still
   accepting applications** (use the ATS JSON API when you can — it's authoritative).
2. 404 / redirect to careers index / "no longer available" → **dead, skip**.
3. **Third-party MIRRORS (LinkedIn/Indeed/Idealist/Built In/Climatebase) do NOT prove currency** —
   a mirror is a lead, never proof a role is open. If the only "confirmation" is a mirror and you
   can't reach the employer's own page → **GATE it** (`gated: true`).
4. If a strong-fit role's canonical page is **login/JS-gated** (Workday, NEOGOV, iCIMS, peopleadmin,
   Ashby index) and you can't confirm it live → insert it as a **GATED lead** (`gated: true`, real
   `apply_url`) with the reason as the **first `red_flags` entry** (e.g. "🔒 Couldn't verify open —
   <portal> is JS-gated; open it to confirm"). Gated roles must still clear the OTHER tests (skills,
   location tab, $50k). Renders in the "🔒 you decide" strip on their tab.
5. Posting older than ~45 days with no "still hiring" signal → add a red flag.

## 🔶 Stretch — only to fill out a thin tab
If a tab's verified-live haul is thin, include **closest verified-live near-misses** with
`stretch: true` and the **first `red_flags` entry** naming the exact miss (e.g. "🔶 Stretch — asks
3+ yrs (she's ~2)", "🔶 Stretch — comp $47k, below the $50k floor"). Clean picks keep `stretch: false`.

## LOCATION FIELD — make it read clearly (drives the card's work-mode badge)
Every card is tagged **🌐 Remote / 🔀 Hybrid / 🏢 In-person** from the `location` string, so write
`location` so the mode is unambiguous and the place is named:
- Remote (Remote tab) → start with **"Remote (US)"**.
- Hybrid (WA/SLC tabs) → include the word **"Hybrid"** + city/state, e.g. **"Hybrid — Tacoma, WA"**.
- In-person (WA/SLC tabs) → include **"In-person"** + city/state, e.g. **"In-person — Lehi, UT"**.
(The page shows Hybrid if "hybrid" appears, else Remote if "remote" appears, else In-person.)

## For each role that survives (one at a time)
0. **Final dedup guard** right before posting: re-check against `leads` + `applications` on
   company+role (case-insensitive) or apply_url vs an application url. If it matches anything she's
   already tracking, **drop it silently**.
1. **Post the full lead to chat as a ```json code block**, then insert it. Shape:
   ```json
   {
     "id": "company-slug__role-slug",
     "company": "Acme Corp",
     "role": "Sustainability Coordinator",
     "track": "wa",
     "stretch": false,
     "gated": false,
     "categories": ["nonprofit", "sustainability", "coordination"],
     "apply_url": "https://job-boards.greenhouse.io/acme/jobs/123",
     "location": "Hybrid — Seattle, WA",
     "comp": "$58k–$70k",
     "salary_min": 58000,
     "posted": "2026-08-01",
     "verified_live": "2026-08-03",
     "summary": "What the org does + the role.",
     "fit": "Why her resume fits — grounded in her skills, honest both ways.",
     "green_flags": ["Seattle hybrid", "$58k+", "Outreach/coordination — her lane"],
     "red_flags": ["Asks 2–3 yrs — she's ~2"],
     "sources": [{"name": "Greenhouse", "url": "https://..."}],
     "notes": "",
     "added": "2026-08-03"
   }
   ```
   - `id` = `company-slug__role-slug` (lowercase, non-alphanumeric → `-`), stable.
   - `track` = `"remote"` (🌐), `"wa"` (🌲 Seattle/Olympia/Tacoma), or `"slc"` (🧂 SLC/Wasatch). Required.
   - `stretch` = `false` clean, or `true` for a 🔶 near-miss (first red flag names the miss).
   - `gated` = `false` normally; `true` for a strong fit you couldn't verify live behind a portal.
   - `apply_url` MUST be the canonical company ATS/careers link, never an aggregator.
   - `location` — follow the LOCATION FIELD rules above (must match the tab: Remote→remote,
     WA-metro→wa, SLC-metro→slc).
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
1. Append a run summary to `job-search/run-summaries/<today>.md` (gitignored): **New leads added**
   grouped by tab (🌐 Remote / 🌲 Washington / 🧂 Salt Lake City), with company/role/mode/comp,
   marking any 🔶 stretch and any 🔒 gated; **Skipped** with the reason (expired / could not verify
   live / below $50k / wrong location / not-her-skills / real-SWE); **Patterns** worth flagging.
   (The gitignored run-summary is the ONLY place closed/expired near-misses get recorded.)
2. Print a short recap to chat — **LIVE, ADDED roles ONLY.** Count per tab + the actual new leads.
   **Do NOT report "great fits that just closed," a watchlist of dead roles, or expired near-misses
   to Ayla** — she runs this often and that reads as noise/dead-ends. A closed recurring-fit employer
   goes silently into `watchlist.md` (step above), never into the chat recap. If a tab genuinely had
   0 live adds, just say so in one line — don't backfill with closed roles.

## Style
Short bullets, no padding. Cite sources inline. Honest both ways — red flags beside green ones.
Don't tell her whether to apply; lay out the evidence. "Couldn't verify live" is a valid answer —
don't guess. Verify finalists on canonical pages yourself before inserting.
