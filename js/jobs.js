// =============================================================
// Daily Job Search page
// Shows the curated picks researched by the /discover-jobs command
// and stored in the Supabase `leads` table. (The old live job-feed
// integrations — Remotive, RemoteOK, Arbeitnow, Jobicy, The Muse —
// were removed; this page is curated-only now.)
// =============================================================

const $list = document.getElementById("job-list");
const $status = document.getElementById("job-status");
const $keyword = document.getElementById("filter-keyword");
const $tabs = document.getElementById("job-tabs");
const $blurb = document.getElementById("tab-blurb");

const DAY_MS = 24 * 60 * 60 * 1000;

// Which tab is showing. Tracks:
//   core       — in-field, remote-only ($60k+)
//   anchorage  — in-field, can be in person in Anchorage, AK ($75k+)
//   bellingham — in-field, can be in person in Bellingham, WA ($80k+)
//   boulder    — in-field, can be in person in Boulder, CO area ($75k+)
//   saltlake   — in-field, can be in person in Salt Lake City, UT area ($75k+)
//   other      — adjacent roles outside the field, remote-only ($60k+)
const KNOWN_TRACKS = ["core", "anchorage", "bellingham", "boulder", "saltlake", "other"];
let currentTrack = "core";
// Legacy/unknown track values fall back to 'core'.
function trackOf(j) {
  return KNOWN_TRACKS.includes(j.track) ? j.track : "core";
}
const TRACK_BLURB = {
  core: "In-field & remote — climate, environmental, energy, policy, sustainability & data.",
  anchorage: "In-field roles based in Anchorage, AK (remote or in person) — $75k+ floor.",
  bellingham: "In-field roles based in Bellingham, WA (remote or in person) — $80k+ floor.",
  boulder: "In-field roles based in the Boulder, CO area (remote or in person) — $75k+ floor.",
  saltlake: "In-field roles based in the Salt Lake City, UT area (remote or in person) — $75k+ floor.",
  other: "Community outreach & engagement, and sustainability outreach/education roles that fit my skills — remote-only (Seattle hybrid OK)."
};
const TRACK_BADGE = {
  core:       `<span class="badge" style="background:var(--gold);color:var(--navy);">✨ Curated</span>`,
  anchorage:  `<span class="badge" style="background:#2a4d69;color:var(--white);">🏔️ Anchorage pick</span>`,
  bellingham: `<span class="badge" style="background:#2f5d3a;color:var(--white);">🌲 Bellingham pick</span>`,
  boulder:    `<span class="badge" style="background:#8a4b2f;color:var(--white);">⛰️ Boulder pick</span>`,
  saltlake:   `<span class="badge" style="background:#6b6f76;color:var(--white);">🧂 Salt Lake pick</span>`,
  other:      `<span class="badge" style="background:var(--navy-soft);color:var(--white);">🥕 Other pick</span>`
};
const TRACK_EMPTY = {
  core:       { h: "No curated picks yet", p: "Run <code>/discover-jobs</code> in Claude Code (from the project folder). New picks appear here automatically." },
  anchorage:  { h: "No Anchorage picks yet", p: "In-field roles you could do from Anchorage (remote or in person) show up here when <code>/discover-jobs</code> finds them." },
  bellingham: { h: "No Bellingham picks yet", p: "In-field roles you could do from Bellingham, WA (remote or in person) show up here when <code>/discover-jobs</code> finds them." },
  boulder:    { h: "No Boulder picks yet", p: "In-field roles you could do from the Boulder, CO area (remote or in person) show up here when <code>/discover-jobs</code> finds them." },
  saltlake:   { h: "No Salt Lake City picks yet", p: "In-field roles you could do from the Salt Lake City, UT area (remote or in person) show up here when <code>/discover-jobs</code> finds them." },
  other:      { h: "No other picks yet", p: "Out-of-field roles I'd still qualify for show up here when <code>/discover-jobs</code> finds them." }
};

const HIDDEN_KEY = "acHiddenJobs";
const APPLIED_KEY = "acAppliedJobs";

function getSet(key) {
  try { return new Set(JSON.parse(localStorage.getItem(key) || "[]")); }
  catch { return new Set(); }
}
function saveSet(key, s) { localStorage.setItem(key, JSON.stringify(Array.from(s))); }
function isHidden(id)  { return getSet(HIDDEN_KEY).has(id); }
function isApplied(id) { return getSet(APPLIED_KEY).has(id); }
function setHidden(id, on) {
  const s = getSet(HIDDEN_KEY);
  on ? s.add(id) : s.delete(id);
  saveSet(HIDDEN_KEY, s);
}
function setApplied(id, on) {
  const s = getSet(APPLIED_KEY);
  on ? s.add(id) : s.delete(id);
  saveSet(APPLIED_KEY, s);
}

let allJobs = [];
let rejectedKeys = new Set();   // company/role + url of applications marked Rejected

function todayYMD() { return new Date().toISOString().slice(0, 10); }

// Single source of truth for adding a job to the Applications table, used by BOTH
// the "Save to Applications" button and the "Applied" checkbox so they behave the
// same: a real row, marked Applied, dated today (so it shows like the old ones).
async function insertApplication({ company, role, url }) {
  return window.sb.from("applications").insert({
    company: company || null,
    role: role || null,
    url: url || null,
    status: "applied",
    date_applied: todayYMD()
  });
}

function jobKey(company, role) { return ((company || "") + "||" + (role || "")).toLowerCase().trim(); }

// Pull the applications I've rejected so their listings drop off this page.
async function fetchRejectedKeys() {
  if (!window.sb) return new Set();
  const { data, error } = await window.sb
    .from("applications").select("company, role, url").eq("status", "rejected");
  if (error) return new Set();
  const keys = new Set();
  (data || []).forEach(a => {
    keys.add(jobKey(a.company, a.role));
    if (a.url) keys.add("url::" + a.url.toLowerCase().trim());
  });
  return keys;
}
function isRejectedJob(j) {
  if (rejectedKeys.has(jobKey(j.company, j.title))) return true;
  if (j.url && rejectedKeys.has("url::" + j.url.toLowerCase().trim())) return true;
  return false;
}

// ---------- Source: Supabase `leads` ----------
async function fetchCurated() {
  if (!window.sb) return [];
  const { data, error } = await window.sb
    .from("leads")
    .select("*")
    .order("added", { ascending: false });
  if (error) throw new Error("Couldn't load curated picks: " + error.message);
  return (data || []).map(l => ({
    id: "cur-" + l.id,
    track: l.track || "core",
    stretch: l.stretch === true,   // fallback pick: shown but below the usual bar
    title: l.role,
    company: l.company,
    location: l.location || "Remote",
    url: l.apply_url,
    // Sort/NEW by when it was added; real posting date shown in the expander.
    posted: l.added || l.posted,
    posted_real: l.posted,
    verified_live: l.verified_live,
    description: l.summary || l.fit || "",
    tags: l.categories || [],
    salary_raw: l.comp || "",
    fit: l.fit || "",
    green_flags: l.green_flags || [],
    red_flags: l.red_flags || [],
    sources: l.sources || [],
    notes: l.notes || ""
  }));
}

// ---------- Helpers ----------
function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function postedTimestamp(job) {
  if (!job.posted) return 0;
  const t = new Date(job.posted).getTime();
  return isNaN(t) ? 0 : t;
}
function fmtDate(s) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "";
  const days = Math.round((Date.now() - d.getTime()) / DAY_MS);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return days + " days ago";
  if (days < 30) return Math.round(days / 7) + " wk ago";
  return d.toLocaleDateString();
}

// ---------- Render ----------
function renderJobs(jobs) {
  if (!jobs.length) {
    const empty = TRACK_EMPTY[currentTrack] || TRACK_EMPTY.core;
    $list.innerHTML = `
      <div class="empty-state">
        <h3>${empty.h}</h3>
        <p>${empty.p}</p>
      </div>`;
    return;
  }

  $list.innerHTML = jobs.map(j => {
    const isNew = postedTimestamp(j) >= Date.now() - DAY_MS;
    const applied = isApplied(j.id);
    const salaryTag = j.salary_raw
      ? `<span class="badge badge-remote">${escapeHtml(j.salary_raw)}</span>`
      : `<span class="badge" style="background:#f1ece4;color:var(--muted);">Salary not listed</span>`;
    const newTag = isNew
      ? `<span class="badge" style="background:var(--gold);color:var(--navy);">NEW</span>`
      : "";
    const stretchTag = j.stretch
      ? `<span class="badge stretch-badge" title="Fallback pick — surfaced because the strict search came up short. It misses my usual bar; see the red flags for why.">🔶 Stretch</span>`
      : "";
    const tags = (j.tags || []).map(t =>
      `<span class="badge badge-remote">${escapeHtml(t)}</span>`).join(" ");
    const flagList = (items) => (items && items.length)
      ? "<ul style='margin:4px 0 0;padding-left:18px;'>" + items.map(x => `<li style='font-size:13px;'>${escapeHtml(x)}</li>`).join("") + "</ul>"
      : "";
    const whyPick = `
        <details style="margin-top:8px;">
          <summary style="cursor:pointer;color:var(--navy);font-size:13px;font-weight:600;">Why this pick</summary>
          ${j.fit ? `<p style="font-size:13px;color:var(--ink);margin-top:6px;"><strong style="color:var(--navy);">Fit:</strong> ${escapeHtml(j.fit)}</p>` : ""}
          ${j.green_flags && j.green_flags.length ? `<div style="font-size:13px;color:var(--navy);font-weight:600;margin-top:4px;">Green flags</div>${flagList(j.green_flags)}` : ""}
          ${j.red_flags && j.red_flags.length ? `<div style="font-size:13px;color:#b91c1c;font-weight:600;margin-top:4px;">Red flags</div>${flagList(j.red_flags)}` : ""}
          ${j.notes ? `<p style="font-size:13px;color:var(--muted);margin-top:6px;">${escapeHtml(j.notes)}</p>` : ""}
          <p style="font-size:12px;color:var(--muted);margin-top:6px;">
            ${j.verified_live ? "Verified live " + escapeHtml(j.verified_live) : ""}${j.posted_real ? " · Posted " + escapeHtml(j.posted_real) : ""}
            ${(j.sources && j.sources.length) ? " · Sources: " + j.sources.map(s => `<a href="${escapeAttr(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.name)}</a>`).join(", ") : ""}
          </p>
        </details>`;

    const hidden = isHidden(j.id);
    return `
      <article class="card ${applied ? 'card-added' : ''} ${hidden ? 'card-dismissed' : ''} ${j.stretch ? 'card-stretch' : ''}">
        ${applied ? `<div class="added-banner">✓ Added to Applications</div>` : ""}
        <div class="card-header">
          <div>
            <div class="card-title">${escapeHtml(j.title)}</div>
            <div class="card-subtitle">${escapeHtml(j.company)} &middot; ${escapeHtml(j.location)}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            ${applied ? `<span class="badge badge-added">✓ Added</span>` : ""}
            ${stretchTag}
            ${newTag}
            <button class="hide-x" data-action="hide" data-id="${escapeAttr(j.id)}" title="${hidden ? 'Restore' : 'Dismiss'}">${hidden ? '↩' : '×'}</button>
          </div>
        </div>
        ${j.description ? `<p style="font-size:14px;color:var(--ink);margin-top:4px;">${escapeHtml(j.description)}</p>` : ""}
        ${whyPick}
        <div class="card-meta" style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;">
          ${TRACK_BADGE[trackOf(j)] || TRACK_BADGE.core}
          ${tags}
          ${salaryTag}
          <span>Added ${fmtDate(j.posted)}</span>
        </div>
        <div class="card-actions">
          ${j.url ? `<a class="btn btn-primary btn-sm" href="${escapeAttr(j.url)}" target="_blank" rel="noopener">View posting ↗</a>` : ""}
          ${applied
            ? `<button class="btn btn-ghost btn-sm" disabled>✓ Added</button>`
            : `<button class="btn btn-gold btn-sm" data-action="save" data-job-id="${escapeAttr(j.id)}" data-job='${escapeAttr(JSON.stringify({
                company: j.company, role: j.title, url: j.url
              }))}'>Save to Applications</button>`}
        </div>
      </article>`;
  }).join("");
}

// ---------- Tab counts ----------
function updateTabCounts() {
  const counts = { core: 0, anchorage: 0, bellingham: 0, other: 0 };
  allJobs.forEach(j => { if (isRejectedJob(j)) return; counts[trackOf(j)]++; });
  KNOWN_TRACKS.forEach(t => {
    const el = document.getElementById("count-" + t);
    if (el) el.textContent = counts[t];
  });
}

// ---------- Filters ----------
function applyFilters() {
  const q = $keyword.value.trim().toLowerCase();
  let filtered = allJobs.filter(j => {
    // Drop listings I've already rejected in Applications.
    if (isRejectedJob(j)) return false;
    // Each tab shows only its own track (legacy/unknown tracks fall under 'core').
    if (trackOf(j) !== currentTrack) return false;
    if (!q) return true;
    const hay = [j.title, j.company, j.description, (j.tags || []).join(" ")].join(" ").toLowerCase();
    return hay.includes(q);
  });
  // Blurb for the tab, plus a hint when fallback "stretch" picks are showing.
  if ($blurb) {
    const base = TRACK_BLURB[currentTrack] || "";
    const hasStretch = filtered.some(j => j.stretch);
    $blurb.textContent = base + (hasStretch
      ? "  🔶 Stretch = a fallback shown when the strict search came up short — below my usual bar (see red flags)."
      : "");
  }
  // Order: clean picks first, then 🔶 stretch fallbacks, then dismissed (X'd) — newest first within each group.
  filtered.sort((a, b) => {
    const aD = isHidden(a.id) ? 1 : 0;
    const bD = isHidden(b.id) ? 1 : 0;
    if (aD !== bD) return aD - bD;
    const aS = a.stretch ? 1 : 0;
    const bS = b.stretch ? 1 : 0;
    if (aS !== bS) return aS - bS;
    return postedTimestamp(b) - postedTimestamp(a);
  });
  renderJobs(filtered);
}

// ---------- Load ----------
async function loadAll() {
  $status.style.display = "block";
  $status.textContent = "Loading my curated picks";
  $list.innerHTML = "";
  try {
    [allJobs, rejectedKeys] = await Promise.all([fetchCurated(), fetchRejectedKeys()]);
  } catch (err) {
    $status.style.display = "none";
    $list.innerHTML = `<div class="banner banner-warn">${escapeHtml(err.message)}</div>`;
    return;
  }
  $status.style.display = "none";
  updateTabCounts();
  applyFilters();
}

// ---------- Event wiring ----------
$keyword.addEventListener("input", applyFilters);

$tabs.addEventListener("click", (e) => {
  const tab = e.target.closest(".job-tab");
  if (!tab) return;
  currentTrack = KNOWN_TRACKS.includes(tab.dataset.track) ? tab.dataset.track : "core";
  $tabs.querySelectorAll(".job-tab").forEach(t => {
    const on = t === tab;
    t.classList.toggle("active", on);
    t.setAttribute("aria-selected", on ? "true" : "false");
  });
  applyFilters();
});

$list.addEventListener("click", async (e) => {
  const hideBtn = e.target.closest('[data-action="hide"]');
  if (hideBtn) {
    setHidden(hideBtn.dataset.id, !isHidden(hideBtn.dataset.id));
    applyFilters();
    return;
  }

  const saveBtn = e.target.closest('[data-action="save"]');
  if (saveBtn) {
    if (!window.sb) { acShowError("Supabase not loaded — can't save yet."); return; }
    const payload = JSON.parse(saveBtn.dataset.job);
    const jobId = saveBtn.dataset.jobId;
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving…";
    const { error } = await insertApplication(payload);
    if (error) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save to Applications";
      acShowError("Couldn't save: " + error.message);
      return;
    }
    setApplied(jobId, true);
    applyFilters();
  }
});

(async () => {
  const session = await window.acAuth.requireAuth();
  if (!session) return;
  window.acAuth.paintNav(session);
  document.body.style.visibility = "visible";
  loadAll();
})();
