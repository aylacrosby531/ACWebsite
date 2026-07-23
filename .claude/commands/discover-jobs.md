---
description: Research new job leads for Ayla (Remote + Hybrid·West) and surface them on the Daily Job Search page
argument-hint: "[optional: focus, e.g. 'just remote' or 'Portland' or 'comms roles']"
allowed-tools: Bash, Read, Write, Edit, WebSearch, WebFetch
---

You are doing job-search research for Ayla. Goal: find new roles that **plausibly fit her
and that she'd actually want**, verify each is **live**, and add them to her **Daily Job
Search** page by inserting them into the Supabase `leads` table. Optional focus this run:
**$ARGUMENTS** (if empty, do all three tabs and keep it diverse).

## The tabs (set `track` on every lead)
- **🌐 Remote** (`track: "remote"`) — **fully-remote US** roles she'd qualify for. **Scope is
  WIDE (permanent, set 2026-07-01):** environmental/climate/conservation is *preferred* but NOT
  required — include **any reputable, mission-adjacent or professional org** (nonprofits,
  foundations, philanthropy, public health, education/edtech, research institutes, science orgs/
  museums, associations, civic/govtech nonprofits, healthcare, B-corps, higher-ed). All the
  other Remote hard filters still hold (fully-remote-US, $55k+, early-career/IC, not
  coding/data-analyst, industry exclusions). See the **"Remote scope"** note below.
- **📍 Hybrid · West** (`track: "west"`) — **hybrid (preferred) or in-person** roles in the
  West: her target metros **Salt Lake City · Golden CO · Boulder CO · Olympia WA · Portland
  OR · Bend OR**, plus **similar PNW / Mountain-West / Northern-CA metros** (WA, OR, northern
  & coastal CA incl. the **Bay Area / Sacramento**, CO, UT, ID, MT, +WY/NV). **No East Coast;
  not the far South / Southwest** (skip TX, AZ, NM, the Southeast). Prefer **hybrid** over
  fully on-site, but on-site in these metros is fine. **NOTE: Washington now has its own 🌲 tab
  and SLC/Utah has the 🧂 tab — route WA-based roles to `wa` and SLC-based roles to `slc`, NOT
  here.** The West tab is Oregon + Colorado + Northern-CA/Bay Area + ID/MT/WY/NV (and any PNW
  outside WA).
- **🧂 Salt Lake City** (`track: "slc"`) — **Salt Lake City–based** roles that fit her
  background. **In-person, hybrid, OR remote-while-living-in-SLC** all count (location in/around
  SLC & the Wasatch Front — SLC, West Valley, Murray, Sandy, Provo/Orem, Ogden, Park City).
  **Comp floor: $60k** (higher than the others — flag/skip below). Environmental-leaning but
  flexible, same as the rest. This is a **dedicated SLC cut** — a role that's SLC-based should
  go here (`slc`), not on the West tab. See the **"Salt Lake City"** section.
- **🌲 Washington** (`track: "wa"`) — **hybrid (preferred) or in-person** roles anywhere in
  **Washington state**: Seattle, Tacoma, Olympia, Bellingham, Spokane, Everett, Vancouver WA,
  the Tri-Cities, etc. **Comp floor: $55k** (same as West). Environmental-leaning but flexible,
  same as the rest. A WA-based role goes **here** (`wa`), not on the 📍 West tab. See the
  **"Washington"** section.
- **💼 Skills Match** (`track: "skills"`) — **ANY-industry roles her resume/transferable skills
  qualify her for**, deliberately **beyond** environmental/science/nonprofit (she asked for this
  to avoid getting pigeonholed). **NO industry filter of any kind** (she asked to drop even the
  ethical exclusions here — 2026-07-23). Location: **remote anywhere, OR hybrid/in-person in
  WA · UT · CO** (SLC, Seattle area, Olympia, Tacoma, Golden CO + CO outside the Denver metro —
  NOT Denver proper). **$50k floor.** See the **"Skills Match"** section — it's the most
  different tab, read it before running.
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
Run **Remote** first, then **Hybrid·West**, then **Salt Lake City**, then **Washington**, then
**Skills Match**, then **Programs**, then **CA Field Science**.

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

## Remote scope (WIDE — permanent, set 2026-07-01)
The 🌐 Remote tab is deliberately **broad**: after several thin environmental-only runs, Ayla
asked to widen it permanently. So on Remote, **do NOT gate on "environmental."** Include any
**reputable, mission-adjacent or professional** org — nonprofits, foundations, philanthropy,
public health, education/edtech, research institutes, science orgs/museums, associations,
civic/govtech nonprofits, healthcare, coops/B-corps, higher-ed. **Prefer** env/climate/
conservation when a role is otherwise equally good, but a great general early-career fit counts.
Good general role types (her lane): program/project coordinator or associate, operations
coordinator, project/program assistant, communications coordinator/associate, content/technical/
science/health writer, community engagement / outreach coordinator, membership/partnerships
coordinator, grants coordinator, research coordinator (non-coding), training/learning
coordinator, events coordinator, admin/executive coordinator at a mission org.
**Everything else on Remote is unchanged and still enforced:** fully-remote-US only, **$55k+**,
early-career/IC (no 5+ yrs / Senior/Lead/Staff / people-management), **not a coding/data-analyst
role**, and the industry exclusions. **Search reputable orgs' OWN ATS boards directly**
(Greenhouse/Lever/Ashby/Workable) — that's where verifiable-live remote IC roles surface;
aggregators skew geo-tied/closed/senior. (This wide scope is **Remote only** — West, SLC,
Programs, and CA Field keep their own location/field rules.)

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

## 🧂 Salt Lake City — SLC-based roles that fit her background (`track: "slc"`)
Run this **after** Remote and Hybrid·West. A dedicated **Salt Lake City** cut (she's eyeing SLC
specifically). Find **up to 5**.

**What counts:**
- **Location: Salt Lake City & the Wasatch Front** — SLC proper plus West Valley, Murray, Sandy,
  Draper, Lehi, Provo/Orem, Ogden, Park City. **In-person, hybrid, OR remote** are all fine **as
  long as the role is based in / tied to SLC** (a US-remote role open to an SLC resident counts;
  a remote role locked to another region does not). If a role is SLC-based, tag it `slc` — don't
  also put it on the West tab.
- **Comp: $60k+** (higher floor than the other tabs — she set this). Skip clearly below $60k; if
  unposted, benchmark (Levels.fyi/Glassdoor for SLC) and flag.
- **Field & function:** environmental-leaning but **genuinely flexible** — same as the rest. Her
  strengths apply (program/project coordination, outreach & community engagement, sustainability
  coordinator, science communication & technical writing, stakeholder partnership, conservation/
  stewardship, research coordinator non-coding, nonprofit program associate, ops/logistics). Good
  SLC homes: University of Utah (sustainability office, research centers — non-coding roles),
  Utah State / Utah Tech, Salt Lake City Corp & Salt Lake County sustainability/public-lands,
  Utah DEQ/DNR (skip if residency-to-apply gated — see field-tab rule), local environmental
  nonprofits (Tracy Aviary, HEAL Utah, Sageland Collaborative, Utah Clean Energy, TreeUtah,
  Swaner Preserve), conservation districts, and reputable private employers HQ'd in SLC.
- **Seniority / industry / not-coding / no-routine-fieldwork:** apply the **same hard filters as
  Remote & Hybrid·West** (early-career IC; no 5+ yrs / Senior / management; no oil&gas/mining/
  extraction/defense; not a data-analyst/coding role; occasional travel fine).
- **Verify-live** the same way; gate (🔒) a strong SLC fit you can't confirm behind a portal
  (Utah state jobs run on **statejobs.utah.gov / NEOGOV**, which is JS-gated — gate those).
Tag every one `track: "slc"`. Same **🔶 stretch** fallback applies if the tab ends with <2 clean
picks (e.g. first red flag "🔶 Stretch — comp $56k, below the $60k SLC floor").

## 🌲 Washington — hybrid / in-person roles in WA (`track: "wa"`)
Run this **after** the SLC tab. A dedicated **Washington state** cut (she's eyeing WA — Bellingham/
Seattle area especially). Find **up to 5**.

**What counts:**
- **Location: anywhere in Washington** — Seattle, Tacoma, Olympia, Bellingham, Spokane, Everett,
  Vancouver WA, Bremerton, the Tri-Cities, etc. **Hybrid (preferred) or in-person**; a role
  that's remote-but-WA-tied counts too. A WA-based role goes here (`wa`), **not** on the 📍 West
  tab.
- **Comp: $55k+** (same as West). Skip clearly below $55k; if unposted, benchmark + flag.
- **Field & function:** environmental-leaning but **genuinely flexible** — same as the rest. Her
  strengths apply (program/project coordination, outreach & community engagement, sustainability
  coordinator, science communication & technical writing, stakeholder/tribal partnership,
  conservation/stewardship, research coordinator non-coding, nonprofit program associate, ops/
  logistics). Good WA homes: WA state agencies (Dept. of Ecology, DNR, Fish & Wildlife, Commerce,
  State Parks, Puget Sound Partnership — via **careers.wa.gov / governmentjobs.com**), WA
  **conservation districts** (the WACD hub **wadistricts.us** is a strong recurring vein),
  counties & cities (King, Pierce, Snohomish, Thurston, Seattle, Tacoma), universities (UW, WWU
  in Bellingham, WSU, Evergreen State), tribal nations & orgs, Puget Sound / Salish Sea marine &
  estuary orgs, and WA environmental nonprofits (Forterra, Futurewise, Washington Conservation
  Action, Sound salmon/watershed councils, land trusts).
- **Seniority / industry / not-coding / no-routine-fieldwork:** apply the **same hard filters as
  Remote & Hybrid·West** (early-career IC; no 5+ yrs / Senior / management; no oil&gas/mining/
  extraction/defense; not a data-analyst/coding role; occasional travel fine).
- **Verify-live** the same way; gate (🔒) a strong WA fit you can't confirm behind a portal (WA
  state jobs run on **careers.wa.gov / NEOGOV governmentjobs**, and county Workday/NEOGOV portals
  are often JS-gated — gate those). Tag every one `track: "wa"`. Same **🔶 stretch** fallback
  applies if the tab ends with <2 clean picks.

## 💼 Skills Match — any-industry roles her resume qualifies her for (`track: "skills"`)
Run this **after** Washington. This is the tab Ayla added to **break out of the environmental/
science/nonprofit box** — she feels pigeonholed and wants roles matched to her **transferable
skills**, in **any reputable industry**. Ground this tab in her **resume**
(`Ayla_Crosby_Resume_2026.pdf` in the repo root, and the "Transferable skills" section of
`about-me.md`), NOT the environmental framing. Find **up to 5**.

**Her transferable-skills profile (what actually qualifies her — lead with these):**
- **Program / operations management** — ran a statewide program solo (70+ sensors, 40+
  communities): asset/inventory tracking, vendor/operator support, platform rollout & adoption.
- **Salesforce / CRM administration** — maintains all site/community/contact/service records in
  Salesforce (a genuinely cross-industry, marketable skill — surface Salesforce admin/coordinator/
  "CRM operations" roles explicitly).
- **Built & shipped a production web app** (Supabase, GitHub, AI-assisted w/ Claude Code/Copilot)
  — reads as **product/ops/implementation aptitude and technical fluency**, not just "scientist."
  Good for product-ops, implementation, sales-engineering-adjacent, no-code/low-code tool roles.
- **Project & logistics coordination** — end-to-end travel/logistics for field visits; multi-week
  expedition logistics under pressure.
- **Technical writing & documentation** — SOPs, QAPPs, public reports, regulatory waiver requests,
  automated report generation → technical writer / documentation / knowledge-base roles.
- **QA/QC, process & compliance** — data-quality thresholds, SOP development, regulatory
  compliance → quality/compliance/process-coordinator roles (process, not code).
- **Training & instruction / enablement** — quarterly community calls, trainings, mountaineering
  instruction (breaking complex skills into clear teaching), youth coaching → training/enablement/
  onboarding/customer-education roles.
- **Stakeholder & partnership management** — tribal entities, residents, EPA, operators →
  account/client-services, partnerships, stakeholder-facing coordination.
- **Light data & reporting** — regression/stats, Excel, PowerPoint (light analytics is fine; she
  is NOT a software engineer or ML/data-scientist).
- **Risk management & judgment, de-escalation** — expedition leadership, crisis de-escalation.

**Good-fit role types (across ANY industry — tech, healthcare/health-tech, higher-ed, government,
utilities, insurance/finance ops, professional services, media, SaaS, etc.):**
project coordinator · project/program manager (associate/coordinator level, no direct reports) ·
program coordinator/associate · **operations coordinator / operations associate / ops analyst** ·
**Salesforce/CRM administrator or coordinator · CRM/data-operations coordinator** ·
**implementation coordinator / customer onboarding / customer success associate** ·
**product operations / program operations coordinator** · technical writer / documentation
specialist · **training & enablement / learning-&-development coordinator** · QA / compliance /
quality coordinator (process) · account coordinator / client-services coordinator · grants/
contracts coordinator · administrative / executive coordinator · logistics / supply-chain
coordinator · research/knowledge coordinator (non-coding).

**Filters for this tab:**
- **Location:** **fully-remote US (anywhere)** OR **hybrid / in-person in WA, UT, or CO** — SLC &
  Wasatch Front, Seattle area, Olympia, Tacoma, Golden CO, Boulder/Fort Collins & other CO
  **outside the Denver metro** (skip Denver-proper in-person; remote roles HQ'd in Denver are
  fine). Skip in-person/hybrid outside WA/UT/CO.
- **Comp: $50k+** (lower than the other tabs — or unposted → benchmark + flag).
- **Seniority:** early-career / IC (she has ~2 yrs pro experience + strong adjacent experience).
  Skip 5+ yrs required, Senior/Lead/Principal/Staff, and people-management. "Coordinator/
  Associate/Specialist" is the sweet spot; an "Analyst" that's process/ops (not heavy-coding) is
  fine.
- **NOT a software-engineer / data-scientist / ML / heavy-coding role.** She built a low-code app
  and knows Salesforce/Excel — so **Salesforce admin, ops/implementation, product-ops, no-code,
  light-analytics/reporting are all fine**; a role that requires real SWE (Python/Java/SQL-heavy
  data pipelines, ML) is not.
- **Industry: literally ANY industry — NO exclusions of any kind (Ayla's call, 2026-07-23).**
  Do NOT screen out oil & gas, mining, defense, tobacco, gambling, finance, etc. on this tab —
  the only tests are **skills-fit + location + $50k comp**. (This zero-exclusions override is
  **Skills-Match-only**; every other tab keeps its industry exclusions.)
- **Verify-live** the same way; gate (🔒) a strong fit behind a login/JS portal you can't confirm.
Tag every one `track: "skills"`. Keep `stretch: false` unless it misses a hard filter (comp/
seniority/location), then flag the miss. Prioritize a **diverse mix** of role types & industries
(a Salesforce admin + an ops coordinator + a technical writer + a customer-success associate is
more useful than five of the same) — and lean into the roles that best use her standout,
cross-industry skills (Salesforce/CRM, program/ops coordination, technical writing, the built-a-
web-app technical fluency).

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
   - `track` = `"remote"` (🌐), `"west"` (📍 Hybrid·West), `"slc"` (🧂 Salt Lake City),
     `"wa"` (🌲 Washington), `"skills"` (💼 Skills Match), `"programs"` (🎓 Programs), or
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
   added** grouped by track (🌐 Remote / 📍 Hybrid·West / 🧂 Salt Lake City / 🌲 Washington / 💼 Skills Match / 🎓 Programs / 🔬 CA Field Science), marking any 🔶 stretch
   (with the miss) and any 🔒 gated; **Skipped** with the filter that caught each (incl. "listing
   expired" / "could not verify live" / "below $55k" / "coding/data role" / "wrong region" /
   "unpaid"); **Patterns** worth flagging.
2. Print a short recap to chat: count per tab, count skipped (with main reasons), and the
   run-summary path.

## Style
Short bullets, no padding. Cite sources inline as `[name](url)`. Honest both ways — red flags
beside green ones. Don't tell her whether to apply; lay out the evidence. "Couldn't verify
live" / "not enough public info" are valid answers — don't guess.
