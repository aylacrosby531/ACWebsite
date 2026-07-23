You are doing job-search research for Ayla. Goal: run **ONE big wide-net search** for roles that
**her resume/skills qualify her for**, verify each is **live**, and add **as many as possible**
to her **Job Search** page by inserting them into the Supabase `leads` table. There are **no
tabs** anymore — it's a single unified list. Optional focus this run: **$ARGUMENTS** (if empty,
keep it wide and diverse).

## The search — one wide net (these are the ONLY tests)
1. **Fits her resume / transferable skills** (see "Her skills" below). A role she'd actually be
   qualified for and could get.
2. **Location:** **fully-remote US (anywhere)** OR **hybrid / in-person** in one of her OK metros:
   - **Utah:** Salt Lake City & the Wasatch Front (SLC, West Valley, Murray, Sandy, Draper, Lehi,
     Provo/Orem, Ogden, Park City)
   - **Washington:** Seattle area, Olympia, Tacoma, Bellingham (+ around the state)
   - **Colorado:** Golden, Boulder, Fort Collins & other CO **OUTSIDE the Denver metro** — **skip
     Denver-proper** in-person/hybrid (a fully-remote role HQ'd in Denver is fine).
   - Skip in-person/hybrid roles outside UT / WA / CO.
3. **Comp: $50k+** (or unposted → benchmark on Levels.fyi/Glassdoor + flag).

**That's it — NO industry filter of any kind.** Any industry is fair game (tech/SaaS, healthcare/
health-tech, higher-ed, government, utilities, insurance/finance, professional services, retail
corporate, media, etc.). Ayla explicitly dropped even the ethical exclusions here (2026-07-23) —
do **not** screen out oil & gas, defense, tobacco, gambling, finance, etc. Just skills + location
+ comp.

**Aim for VOLUME** — populate as many verified-live roles as you reasonably can this run (target
**~10–20+**, not 5). Fan out multiple parallel searches by role-type and by location. Don't pad
with junk, but a big, diverse haul is the goal.

## Her skills (match on THESE — ground in `job-search/about-me.md` + `Ayla_Crosby_Resume_2026.pdf`)
~2 yrs professional. B.S. Marine & Environmental Sciences, 4.0 GPA. The transferable substance:
- **Program / operations management** — ran a statewide program solo (70+ sensors, 40+ communities):
  asset/inventory tracking, operator support, platform rollout & adoption.
- **Salesforce / CRM administration** — maintains all site/community/contact/service records in
  Salesforce (a genuinely cross-industry, marketable skill — surface Salesforce admin/coordinator/
  CRM-ops roles explicitly).
- **Built & shipped a production web app** (Supabase, GitHub, AI-assisted) — technical fluency for
  product-ops / implementation / no-code-tool roles. She **ships working systems** but is **NOT a
  software engineer / data scientist / ML person** — skip real SWE (Python/Java, SQL-heavy
  pipelines, ML). Salesforce admin, ops, implementation, product-ops, no-code, light analytics/
  Excel/reporting = all fine.
- **Project & logistics coordination · technical writing & documentation** (SOPs, reports) **·
  QA/QC + process/compliance · training & instruction / enablement · stakeholder & partnership
  management ·** light data/reporting · risk management & de-escalation.

**Good-fit role types (ANY industry):** project/program coordinator · project/program manager
(associate/coordinator level, **no direct reports**) · **operations coordinator / associate /
analyst** · **Salesforce/CRM administrator or coordinator · CRM/data-operations** · **implementation
coordinator / customer onboarding / customer success associate** · **product/program operations
coordinator** · technical writer / documentation specialist · **training & enablement / L&D
coordinator** · QA / compliance / quality coordinator (process) · account / client-services
coordinator · grants/contracts coordinator · administrative / executive coordinator · logistics /
supply-chain coordinator · research/knowledge coordinator (non-coding).

**Seniority:** early-career / IC. **Skip** 5+ yrs required, Senior/Lead/Principal/Staff, and
people-management (Manager/Director/Head/Supervisor running a team). "Coordinator/Associate/
Specialist" is the sweet spot; a process/ops "Analyst" (not heavy-coding) is fine.

## Credentials check (do this first — stop if missing)
```bash
set -a; [ -f .env ] && . ./.env; set +a
echo "${SUPABASE_SERVICE_ROLE_KEY:+key present}"
```
`$SB_URL` = `https://gtlczgyxbnsplcalhbgv.supabase.co`. If the key is **not** set, STOP and tell
Ayla to add `SUPABASE_SERVICE_ROLE_KEY` to `.env` (Supabase → Project Settings → API →
service_role → reveal).

## Setup (every run)
1. Skim `job-search/about-me.md` (the "Transferable skills profile" section) and
   `Ayla_Crosby_Resume_2026.pdf` for grounding.
2. Pull what's already on her radar so you DON'T duplicate — both `leads` and `applications`:
   ```bash
   curl -s "$SB_URL/rest/v1/leads?select=id,company,role,added" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
   curl -s "$SB_URL/rest/v1/applications?select=company,role,status,url" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
   ```
   **Skip any candidate matching an existing `company` + `role`** (case-insensitive) OR whose
   `apply_url` matches an application's `url`. Don't re-research a `leads` company unless its
   newest `added` is > 60 days old (applications stay excluded regardless of age).
3. `date +%F` → use for `added` and `verified_live`.

## Where to search
Go straight to **reputable orgs' OWN ATS boards** (Greenhouse / Lever / Ashby / Workable /
Breezy) sorted by most-recent — that's where verifiable-live IC roles surface; aggregators skew
stale/closed/senior. Also: general boards (LinkedIn, Indeed, Built In, Idealist), and for the
UT/WA/CO in-person cut hit the state/metro/university portals (governmentjobs.com,
statejobs.utah.gov, careers.wa.gov, University of Utah `utah.peopleadmin.com`, UW, CU Boulder /
CSU, big regional employers). Salesforce-heavy shops (SaaS, health-tech, edtech) are a rich vein
for her CRM experience.

## Verify each listing is LIVE before adding
1. Follow through to the company's **canonical** ATS/careers page and confirm it's **still
   accepting applications**.
2. 404 / redirect to careers index / "no longer available" → **dead, skip**.
3. **Third-party MIRRORS (LinkedIn/Indeed/Idealist/Climatebase copies) do NOT prove currency** —
   a mirror is a lead, never proof a role is open. If the only "confirmation" is a mirror and you
   can't reach the employer's own canonical page → **GATE it** (`gated: true`).
4. If a strong-fit role's canonical page is **login/JS-gated** (Workday, ADP, NEOGOV, Ashby index,
   Greenhouse embed) and you can't confirm it live → insert it as a **GATED lead** (`gated: true`,
   real `apply_url`) with the reason as the **first `red_flags` entry** (e.g. "🔒 Couldn't verify
   open — <portal> is JS-gated; open it to confirm"). Gated roles must still clear the OTHER tests
   (skills, location, $50k). Renders in the "🔒 you decide" strip.
5. Posting older than ~45 days with no "still hiring" signal → add a red flag.

## 🔶 Stretch — only to fill out a thin run
If the verified-live haul is thin, you may include **closest verified-live near-misses** with
`stretch: true` and the **first `red_flags` entry** naming the exact miss (e.g. "🔶 Stretch — asks
3+ yrs (she's ~2)", "🔶 Stretch — comp $47k, below the $50k floor", "🔶 Stretch — Denver metro").
Clean picks keep `stretch: false`.

## LOCATION FIELD — make it read clearly (important for the page)
Every card is tagged **🌐 Remote / 🔀 Hybrid / 🏢 In-person** based on the `location` string, so
write `location` so the mode is unambiguous and the place is named:
- Remote → start with **"Remote (US)"** (add "; occasional travel" etc. if relevant).
- Hybrid → include the word **"Hybrid"** + the city/state, e.g. **"Hybrid — Salt Lake City, UT"**.
- In-person → include **"In-person"** (or "On-site") + city/state, e.g. **"In-person — Tacoma, WA"**.
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
     "role": "Operations Coordinator",
     "track": "all",
     "stretch": false,
     "gated": false,
     "categories": ["saas", "operations", "salesforce"],
     "apply_url": "https://job-boards.greenhouse.io/acme/jobs/123",
     "location": "Remote (US)",
     "comp": "$60k–$75k",
     "salary_min": 60000,
     "posted": "2026-07-20",
     "verified_live": "2026-07-23",
     "summary": "What the org does + the role.",
     "fit": "Why her resume qualifies her — grounded in her transferable skills, honest both ways.",
     "green_flags": ["Remote US", "$60k+", "Uses her Salesforce/ops/coordination skills"],
     "red_flags": ["Asks 2–3 yrs — she's ~2"],
     "sources": [{"name": "Greenhouse", "url": "https://..."}],
     "notes": "",
     "added": "2026-07-23"
   }
   ```
   - `id` = `company-slug__role-slug` (lowercase, non-alphanumeric → `-`), stable.
   - `track` = `"all"` (the page ignores it — one unified list; just set it to `"all"`).
   - `stretch` = `false` clean, or `true` for a 🔶 near-miss (first red flag names the miss).
   - `gated` = `false` normally; `true` for a strong fit you couldn't verify live behind a portal.
   - `apply_url` MUST be the canonical company ATS/careers link, never an aggregator.
   - `location` — follow the LOCATION FIELD rules above.
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
   (with company/role/mode/comp), marking any 🔶 stretch and any 🔒 gated; **Skipped** with the
   reason (expired / could not verify live / below $50k / wrong location / not-her-skills / real-SWE);
   **Patterns** worth flagging.
2. Print a short recap to chat: how many added (and the Remote/Hybrid/In-person split), how many
   skipped (main reasons), and the run-summary path.

## Style
Short bullets, no padding. Cite sources inline. Honest both ways — red flags beside green ones.
Don't tell her whether to apply; lay out the evidence. "Couldn't verify live" is a valid answer —
don't guess. Verify finalists on canonical pages yourself before inserting.
