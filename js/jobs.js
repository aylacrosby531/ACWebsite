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

// Which tab is showing. Two branches (both $55k+, env-leaning but open to any
// reputable early-career role I'd qualify for — not data-analyst/heavy-coding):
//   remote — fully-remote US roles
//   west   — hybrid (preferred) / in-person in the West (PNW + Mountain West +
//            Northern CA): SLC, Golden & Boulder CO, Olympia, Portland, Bend, etc.
//   programs — paid graduate / mentorship / rotational / fellowship / apprenticeship /
//            internship programs built for recent grads (remote OR West; "must be paid").
//   field    — early-career FIELD scientist roles in California (environmental & marine;
//            fieldwork is wanted here; field+office OK); $50k+ AND full-time benefits.
const KNOWN_TRACKS = ["remote", "west", "programs", "field"];
let currentTrack = "remote";
// Legacy/unknown track values fall back to 'remote'.
function trackOf(j) {
  return KNOWN_TRACKS.includes(j.track) ? j.track : "remote";
}
const TRACK_BLURB = {
  remote: "Fully-remote roles I'd qualify for — environmental-leaning but open to anything reputable. $55k+.",
  west: "Hybrid (preferred) or in-person in the West — SLC, Golden & Boulder CO, Olympia, Portland, Bend + similar PNW / Mountain-West / Northern-CA metros. $55k+.",
  programs: "Paid graduate / mentorship / rotational / fellowship / apprenticeship / internship programs built for recent grads — remote or West. Must be paid (rate flagged).",
  field: "Early-career field scientist roles in California — environmental & marine science, field + office OK (fieldwork welcome here). $50k+ AND with full-time benefits (health insurance, etc.)."
};
const TRACK_BADGE = {
  remote: `<span class="badge" style="background:var(--gold);color:var(--navy);">🌐 Remote</span>`,
  west:   `<span class="badge" style="background:#2a4d69;color:var(--white);">📍 Hybrid · West</span>`,
  programs: `<span class="badge" style="background:#5b3a86;color:var(--white);">🎓 Program</span>`,
  field:    `<span class="badge" style="background:#1f6f6b;color:var(--white);">🔬 CA Field</span>`
};
const TRACK_EMPTY = {
  remote: { h: "No remote picks yet", p: "Remote roles I'd qualify for ($55k+, env-leaning but flexible) show up here when <code>/discover-jobs</code> finds them." },
  west:   { h: "No Western picks yet", p: "Hybrid / in-person roles in the West (SLC, Golden, Boulder, Olympia, Portland, Bend + similar) show up here when <code>/discover-jobs</code> finds them." },
  programs: { h: "No programs yet", p: "Paid graduate / mentorship / rotational / fellowship / internship programs (remote or West) show up here when <code>/discover-jobs</code> finds them." },
  field: { h: "No CA field roles yet", p: "Early-career field scientist roles in California (environmental & marine, with full-time benefits) show up here when <code>/discover-jobs</code> finds them." }
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
    rawId: l.id,                   // unprefixed leads.id, for approve/deny writes
    track: l.track || "remote",
    stretch: l.stretch === true,   // fallback pick: shown but below the usual bar
    gated: l.gated === true,       // couldn't be auto-verified → show in the "you decide" strip
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

// ---------- Render: "you decide" strip (gated / couldn't-verify roles) ----------
const $gated = document.getElementById("gated-strip");
function renderGated(gatedJobs) {
  if (!$gated) return;
  if (!gatedJobs.length) { $gated.innerHTML = ""; return; }
  $gated.innerHTML = `
    <div class="gated-box">
      <div class="gated-head">🔒 Couldn't auto-verify — you decide
        <span class="gated-sub">these are strong fits behind a login/JS portal I can't read. Open each, then Approve (keep it) or Deny (remove it).</span>
      </div>
      ${gatedJobs.map(j => {
        const why = (j.red_flags && j.red_flags.length) ? j.red_flags[0] : (j.notes || "Couldn't verify the posting is currently open.");
        return `
        <div class="gated-row">
          <div class="gated-info">
            <div class="gated-title">${escapeHtml(j.title)}</div>
            <div class="gated-meta">${escapeHtml(j.company)} · ${escapeHtml(j.location)}${j.salary_raw ? " · " + escapeHtml(j.salary_raw) : ""}</div>
            <div class="gated-why">${escapeHtml(why)}</div>
          </div>
          <div class="gated-actions">
            ${j.url ? `<a class="btn btn-primary btn-sm" href="${escapeAttr(j.url)}" target="_blank" rel="noopener">Open ↗</a>` : ""}
            <button class="btn btn-gold btn-sm" data-action="approve" data-raw-id="${escapeAttr(j.rawId)}">✓ Approve</button>
            <button class="btn btn-ghost btn-sm" data-action="deny" data-raw-id="${escapeAttr(j.rawId)}">✕ Deny</button>
          </div>
        </div>`;
      }).join("")}
    </div>`;
}

// ---------- Render ----------
function renderJobs(jobs) {
  if (!jobs.length) {
    const empty = TRACK_EMPTY[currentTrack] || TRACK_EMPTY.remote;
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
          ${TRACK_BADGE[trackOf(j)] || TRACK_BADGE.remote}
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
  const counts = {};
  KNOWN_TRACKS.forEach(t => { counts[t] = 0; });
  allJobs.forEach(j => {
    if (isRejectedJob(j)) return;
    // X'd (dismissed) normal cards don't count; gated 🔒 items always count until denied.
    if (isHidden(j.id) && !j.gated) return;
    counts[trackOf(j)]++;
  });
  KNOWN_TRACKS.forEach(t => {
    const el = document.getElementById("count-" + t);
    if (el) el.textContent = counts[t];
  });
}

// ---------- Filters ----------
function applyFilters() {
  const q = $keyword.value.trim().toLowerCase();
  const matchesQ = (j) => {
    if (!q) return true;
    const hay = [j.title, j.company, j.description, (j.tags || []).join(" ")].join(" ").toLowerCase();
    return hay.includes(q);
  };
  // Gated "you decide" roles for this tab go in the top strip, not the main list.
  const gatedForTab = allJobs.filter(j =>
    j.gated && !isRejectedJob(j) && trackOf(j) === currentTrack && matchesQ(j));
  renderGated(gatedForTab);

  let filtered = allJobs.filter(j => {
    if (j.gated) return false;                 // shown in the strip above instead
    if (isRejectedJob(j)) return false;        // dropped if already rejected in Applications
    if (trackOf(j) !== currentTrack) return false;
    return matchesQ(j);
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

// Approve (keep — clears the gated flag) / Deny (remove) a gated role.
if ($gated) $gated.addEventListener("click", async (e) => {
  const btn = e.target.closest('[data-action="approve"], [data-action="deny"]');
  if (!btn) return;
  if (!window.sb) { acShowError("Supabase not loaded yet — try again in a moment."); return; }
  const rawId = btn.dataset.rawId;
  const approve = btn.dataset.action === "approve";
  btn.closest(".gated-row").querySelectorAll("button").forEach(b => { b.disabled = true; });
  btn.textContent = approve ? "Approving…" : "Removing…";
  const { error } = approve
    ? await window.sb.from("leads").update({ gated: false }).eq("id", rawId)
    : await window.sb.from("leads").delete().eq("id", rawId);
  if (error) { acShowError("Couldn't update: " + error.message); btn.textContent = approve ? "✓ Approve" : "✕ Deny"; return; }
  // Reflect locally without a full reload.
  if (approve) { const j = allJobs.find(x => x.rawId === rawId); if (j) j.gated = false; }
  else { allJobs = allJobs.filter(x => x.rawId !== rawId); }
  updateTabCounts();
  applyFilters();
});

$tabs.addEventListener("click", (e) => {
  const tab = e.target.closest(".job-tab");
  if (!tab) return;
  currentTrack = KNOWN_TRACKS.includes(tab.dataset.track) ? tab.dataset.track : "remote";
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
    updateTabCounts();   // X'ing / restoring updates the tab bubble live
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
