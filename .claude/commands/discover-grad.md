---
description: Research funded environmental/science master's programs for Ayla and surface them on the Grad School tab
argument-hint: "[optional: focus, e.g. 'air quality' or 'data science' or 'just UW']"
allowed-tools: Bash, Read, Write, Edit, WebSearch, WebFetch
---

You are doing **grad-school research** for Ayla. Goal: find **up to 5 funded
environmental/science master's programs** that fit her, verify each is **currently
admitting for the target cycle**, and add them to her **Daily Job Search** page on the
**🎓 Grad School** tab by inserting them into the Supabase `leads` table with
`track: "gradschool"`. Optional focus this run: **$ARGUMENTS** (if empty, keep it diverse
across PNW schools + any genuinely-funded online program).

This is the companion to `/discover-jobs` — same page, same `leads` table, same Supabase
write path, same honesty bar. It just searches **degree programs**, not jobs.

## Her fixed parameters (decided 2026-06-10)
- **Degree: funded MS / master's** (research/thesis-based preferred). Not PhD, not
  professional/course-only. A program that admits master's students into a funded cohort
  counts even if the department also has a PhD.
- **Funding is the HARD rule.** Must include a **living stipend + tuition waiver/remission**
  via TA, RA, fellowship, or traineeship. **Prefer PNW in-person; include online ONLY if
  it is genuinely funded with a stipend** (rare — see honesty note).
- **Target start: Fall 2027** (normal cycle — deadlines roughly **Dec 2026–Jan 2027**).
  The "verify-live" test is: the program is admitting for Fall 2027 and the **application
  deadline has not passed** (or isn't posted yet but the program clearly runs an annual cycle).

## Credentials, setup, dedup (same as /discover-jobs)
1. Load the key: `set -a; [ -f .env ] && . ./.env; set +a; echo "${SUPABASE_SERVICE_ROLE_KEY:+key present}"`.
   `$SB_URL` = `https://gtlczgyxbnsplcalhbgv.supabase.co`. If the key is missing, STOP and
   tell her to add `SUPABASE_SERVICE_ROLE_KEY` to `.env` (see `/discover-jobs`).
2. Read `job-search/about-me.md` to ground fit (her AQ / environmental-data / QA / community-
   engagement / science-comm background; B.A. Marine & Environmental Sciences, 4.0 GPA).
3. Pull existing leads to dedup (especially `track=gradschool`): `curl` the `leads` table and
   **skip any program already present** (match on `company` = institution + `role` = degree;
   near-identical programs at the same school count as the same). Don't re-research a
   gradschool lead newer than 60 days.
4. `date +%F` for `added` / `verified_live`.

## Hard filters (a program must clear ALL)
- **Funded with a stipend + tuition waiver.** If a program is unfunded, loan-based, or only
  "funding may be available," it does NOT qualify — unless you can confirm funded MS cohorts
  exist (then cite it). Professional/online master's are usually unfunded → skip unless proven funded.
- **Field:** environmental science, atmospheric/air-quality science, climate, environmental
  data science, ecology, earth/marine science, environmental health, environmental policy-
  science, or natural-resource science. Anchor on her AQ + environmental-data strengths but
  stay open across the environmental sciences.
- **Location:** PNW **in-person/hybrid** (WA, OR, ID; extend to AK & MT; **BC/Canada only if
  she's flagged open to it — note it as a flag**) **OR** genuinely-funded online/majority-online.
- **Accredited, research-oriented, reputable** institution. Skip for-profit / diploma-mill /
  unaccredited online programs.
- **Admitting for Fall 2027** with the **deadline not passed** (verify on the program/grad-
  school page — this is the verify-live analog; a program that isn't taking master's
  applications, or whose deadline already closed with no next cycle, is "dead, skip it").

## Soft / ranking factors (use to choose among qualifiers; note in flags)
- Stipend size vs local cost of living; **funding guaranteed for the full degree** (~2 yrs).
- **Research/lab fit** — labs or advisors in air quality, environmental monitoring, community-
  based/environmental-justice science, environmental data science, climate, water/air. Name
  specific labs/advisors when you find them.
- **GRE-optional / not required** (a plus; flag if the GRE is still required).
- Funding type: **RA / fellowship / traineeship** (e.g. NSF NRT, EPA, NOAA, USDA) > heavy TA load.
- Thesis/research-based (builds her research profile) over course-only.
- Cohort/community fit, placement outcomes, and whether the dept explicitly funds **terminal MS**
  (some only fund PhD students — flag that as a red flag).

## Honesty note — funded + online barely coexist
Funded programs are almost always **in-person research** programs; online environmental
master's are typically **unfunded/professional**. So expect the realistic pool to be
**PNW in-person, funded**. If you can't find a genuinely-funded online MS, say so plainly —
do NOT add an unfunded online program just to honor the "online" preference (funding is the
hard rule). It's fine to land below 5; report how far you searched.

## Where to look
- **PNW universities (grad program + funding pages, the canonical source):** University of
  Washington (Environmental & Forest Sciences / SEFS; Atmospheric Sciences; Civil &
  Environmental Eng; Marine & Environmental Affairs; Aquatic & Fishery Sciences),
  **Western Washington University — College of the Environment** (Bellingham; ties to her
  relocation interest), Washington State University, **Oregon State University** (strong
  atmospheric/ocean/environmental sciences), University of Oregon, **Portland State University**
  (Environmental Science & Management — ESM), University of Idaho, Boise State, University of
  Montana, University of Alaska Fairbanks/Anchorage, Oregon Health & Science University (env health).
- **BC (flag if used):** UBC, University of Victoria, SFU.
- **Funding/discovery aggregators (then verify on the school's page):** ProFellow, NSF NRT
  program list, GradCafe, the school's grad-school funding/assistantship pages, and dept
  "prospective students / financial support" pages. Run a couple of broad WebSearch queries
  like `"funded MS environmental science PNW 2027 assistantship stipend"`.
- Many program pages render fine; some grad portals are JS-gated — if you can't verify funding
  or the deadline on the canonical page, try a second source, else skip as "could not verify."

## Closest-pick fallback (🔶 Stretch) — never leave the tab empty
Same idea as `/discover-jobs`. If after a thorough search you have **fewer than 2** programs
clearing every hard filter, top up to 2 with the **closest verified near-misses**, set
`stretch: true`, and name the exact miss in the first `red_flags` entry. Allowed misses (pick
the softest, still real & currently-admitting): **partial funding** (e.g. tuition waiver but
small/competitive stipend), **just-outside-PNW** in-person, **unfunded online** at a reputable
school, or a department that funds **MS via a PhD-track admit / MS-to-PhD**. Never bend the
"reputable & currently-admitting" line, and never invent funding.

## For each program that survives (post JSON, then insert) — `track: "gradschool"`
Reuse the `leads` shape; map degree fields onto it like this:
```json
{
  "id": "western-washington-university__ms-environmental-science",
  "company": "Western Washington University — College of the Environment",
  "role": "MS, Environmental Science",
  "track": "gradschool",
  "stretch": false,
  "categories": ["MS", "environmental-science", "funded", "PNW"],
  "apply_url": "https://<program or application page>",
  "location": "Bellingham, WA (in person)",
  "comp": "Funded — ~$24k/yr TA/RA stipend + full tuition waiver",
  "salary_min": 24000,
  "posted": null,
  "verified_live": "2026-06-10",
  "summary": "What the program is + funding structure + research areas relevant to her.",
  "fit": "Why it fits — grounded in about-me.md (AQ/env-data/community science), honest both ways.",
  "green_flags": ["Deadline ~Jan 15 2027 (Fall 2027) — OPEN", "Funded: stipend + tuition waiver", "Air-quality / env-data labs", "GRE not required"],
  "red_flags": ["Funding competitive / not guaranteed all 2 yrs — confirm", "Thesis required"],
  "sources": [{"name": "WWU CoE grad funding page", "url": "https://..."}],
  "notes": "Fall 2027 cycle. Deadline <date>. Advisors of interest: <names/labs>.",
  "added": "2026-06-10"
}
```
- **Always put the application DEADLINE** as the first green/red flag AND in `notes` — it's
  the most actionable detail.
- `comp` carries the **funding** (stipend + waiver, or "Partial — …", or "Unfunded online" for a
  flagged stretch). `salary_min` = the stipend number if known, else null.
- `apply_url` = the canonical program / application page, never an aggregator.
- Insert with the same `curl` upsert as `/discover-jobs` (upsert on `id`,
  `Prefer: resolution=merge-duplicates,return=minimal`). Check the HTTP code; note errors and move on.

## End of run
1. Append to `job-search/run-summaries/<today>.md` (gitignored): the programs added (school,
   degree, funding, deadline, link), what was skipped (unfunded / deadline passed / not PNW /
   couldn't verify), and patterns (e.g. "most online env MS are unfunded").
2. Print a short recap to chat: how many programs added, how many skipped (with reasons), any
   honest "funded-online was empty" note, and the run-summary path.

## Style
Short bullets, no padding. Cite sources inline. Honest both ways — name the deadline, the
funding caveats, and whether funding is guaranteed. Don't tell her whether to apply; lay out
the evidence. "Couldn't confirm funding" is a valid answer — don't guess a program is funded.
