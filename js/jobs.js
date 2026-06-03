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

// Which tab is showing: 'core' (in-field) or 'other' (adjacent, outside the field).
let currentTrack = "core";
const TRACK_BLURB = {
  core: "In-field roles — climate, environmental, energy, policy, sustainability & data.",
  other: "Outside the environmental field but a fit for my resume & skills — same remote-only and salary bar."
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
    const otherEmpty = currentTrack === "other";
    $list.innerHTML = `
      <div class="empty-state">
        <h3>${otherEmpty ? "No other picks yet" : "No curated picks yet"}</h3>
        <p>${otherEmpty
            ? "Out-of-field roles I'd still qualify for show up here when <code>/discover-jobs</code> finds them."
            : "Run <code>/discover-jobs</code> in Claude Code (from the project folder). New picks appear here automatically."}</p>
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
      <article class="card ${applied ? 'card-added' : ''} ${hidden ? 'card-dismissed' : ''}">
        ${applied ? `<div class="added-banner">✓ Added to Applications</div>` : ""}
        <div class="card-header">
          <div>
            <div class="card-title">${escapeHtml(j.title)}</div>
            <div class="card-subtitle">${escapeHtml(j.company)} &middot; ${escapeHtml(j.location)}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            ${newTag}
            <label class="applied-check" title="Mark as already applied">
              <input type="checkbox" data-action="toggle-applied" data-id="${escapeAttr(j.id)}" ${applied ? 'checked' : ''}>
              Applied
            </label>
            <button class="hide-x" data-action="hide" data-id="${escapeAttr(j.id)}" title="${hidden ? 'Restore' : 'Dismiss'}">${hidden ? '↩' : '×'}</button>
          </div>
        </div>
        ${j.description ? `<p style="font-size:14px;color:var(--ink);margin-top:4px;">${escapeHtml(j.description)}</p>` : ""}
        ${whyPick}
        <div class="card-meta" style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;">
          ${j.track === "other"
            ? `<span class="badge" style="background:var(--navy-soft);color:var(--white);">🥕 Other pick</span>`
            : `<span class="badge" style="background:var(--gold);color:var(--navy);">✨ Curated</span>`}
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
  const core = allJobs.filter(j => j.track !== "other").length;
  const other = allJobs.filter(j => j.track === "other").length;
  const $core = document.getElementById("count-core");
  const $other = document.getElementById("count-other");
  if ($core) $core.textContent = core;
  if ($other) $other.textContent = other;
}

// ---------- Filters ----------
function applyFilters() {
  const q = $keyword.value.trim().toLowerCase();
  if ($blurb) $blurb.textContent = TRACK_BLURB[currentTrack] || "";
  let filtered = allJobs.filter(j => {
    // The 'other' tab shows only other-track picks; 'core' shows everything else.
    if (currentTrack === "other" ? j.track !== "other" : j.track === "other") return false;
    if (!q) return true;
    const hay = [j.title, j.company, j.description, (j.tags || []).join(" ")].join(" ").toLowerCase();
    return hay.includes(q);
  });
  // Newest first; dismissed (X'd) cards sink to the bottom but stay visible.
  filtered.sort((a, b) => {
    const aD = isHidden(a.id) ? 1 : 0;
    const bD = isHidden(b.id) ? 1 : 0;
    if (aD !== bD) return aD - bD;
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
    allJobs = await fetchCurated();
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
  currentTrack = tab.dataset.track === "other" ? "other" : "core";
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
    const { error } = await window.sb.from("applications").insert({
      company: payload.company,
      role: payload.role,
      url: payload.url,
      status: "saved"
    });
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

$list.addEventListener("change", (e) => {
  const cb = e.target.closest('input[data-action="toggle-applied"]');
  if (!cb) return;
  setApplied(cb.dataset.id, cb.checked);
  applyFilters();
});

(async () => {
  const session = await window.acAuth.requireAuth();
  if (!session) return;
  window.acAuth.paintNav(session);
  document.body.style.visibility = "visible";
  loadAll();
})();
