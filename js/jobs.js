// =============================================================
// Job Search landing page
// Pulls fresh listings from public job feeds (Remotive, RemoteOK),
// filters for early-career / remote / $65k+, sorts newest first.
// =============================================================

const $list = document.getElementById("job-list");
const $status = document.getElementById("job-status");
const $keyword = document.getElementById("filter-keyword");
const $source = document.getElementById("filter-source");
const $refresh = document.getElementById("btn-refresh");

const KEYWORDS = window.AC_CONFIG.JOB_KEYWORDS;
const EXCLUDES = window.AC_CONFIG.EXCLUDE_TITLE_TERMS;
const MIN_SALARY = window.AC_CONFIG.MIN_SALARY;
const DAY_MS = 24 * 60 * 60 * 1000;

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

// ---------- Source fetchers ----------
async function fetchRemotive() {
  const res = await fetch("https://remotive.com/api/remote-jobs?limit=200");
  if (!res.ok) throw new Error("Remotive request failed");
  const data = await res.json();
  return (data.jobs || []).map(j => ({
    id: "rmv-" + j.id,
    title: j.title,
    company: j.company_name,
    location: j.candidate_required_location || "Remote",
    url: j.url,
    posted: j.publication_date,
    description: stripHtml(j.description || "").slice(0, 280),
    tags: j.tags || [],
    salary_raw: j.salary || "",
    salary_min: parseSalary(j.salary || ""),
    source: "Remotive"
  }));
}

async function fetchRemoteOK() {
  const res = await fetch("https://remoteok.com/api");
  if (!res.ok) throw new Error("RemoteOK request failed");
  const data = await res.json();
  return data.slice(1).map(j => ({
    id: "rok-" + j.id,
    title: j.position || j.title,
    company: j.company,
    location: j.location || "Remote",
    url: j.url || ("https://remoteok.com/remote-jobs/" + j.id),
    posted: j.date,
    description: stripHtml(j.description || "").slice(0, 280),
    tags: j.tags || [],
    salary_raw: (j.salary_min && j.salary_max) ? `$${formatK(j.salary_min)}–$${formatK(j.salary_max)}` : "",
    salary_min: typeof j.salary_min === "number" ? j.salary_min : null,
    source: "RemoteOK"
  }));
}

async function fetchArbeitnow() {
  const res = await fetch("https://www.arbeitnow.com/api/job-board-api");
  if (!res.ok) throw new Error("Arbeitnow request failed");
  const data = await res.json();
  return (data.data || [])
    .filter(j => j.remote || (j.location || "").toLowerCase().includes("remote"))
    .map(j => ({
      id: "arb-" + j.slug,
      title: j.title,
      company: j.company_name,
      location: j.location || "Remote",
      url: j.url,
      posted: j.created_at ? new Date(j.created_at * 1000).toISOString() : null,
      description: stripHtml(j.description || "").slice(0, 280),
      tags: j.tags || [],
      salary_raw: "",
      salary_min: null,
      source: "Arbeitnow"
    }));
}

async function fetchJobicy() {
  const res = await fetch("https://jobicy.com/api/v2/remote-jobs?count=100");
  if (!res.ok) throw new Error("Jobicy request failed");
  const data = await res.json();
  return (data.jobs || []).map(j => {
    const min = Number(j.annualSalaryMin) || null;
    const max = Number(j.annualSalaryMax) || null;
    return {
      id: "jcy-" + j.id,
      title: j.jobTitle,
      company: j.companyName,
      location: j.jobGeo || "Remote",
      url: j.url,
      posted: j.pubDate,
      description: stripHtml(j.jobExcerpt || j.jobDescription || "").slice(0, 280),
      tags: [].concat(j.jobIndustry || [], j.jobType || []),
      salary_raw: (min && max) ? `$${formatK(min)}–$${formatK(max)}` : (min ? `$${formatK(min)}+` : ""),
      salary_min: min,
      source: "Jobicy",
      level: (j.jobLevel || "").toLowerCase()  // entry, mid, senior — used by passesEarlyCareer
    };
  });
}

async function fetchTheMuse() {
  // The Muse exposes a public, no-key API. We pull a few pages, filtered to remote + entry-level.
  const pages = [1, 2, 3];
  const all = [];
  for (const page of pages) {
    const url = `https://www.themuse.com/api/public/jobs?page=${page}&level=Entry%20Level&level=Mid%20Level&location=Flexible%20%2F%20Remote`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("The Muse request failed");
    const data = await res.json();
    (data.results || []).forEach(j => {
      const cats = (j.categories || []).map(c => c.name).join(" ").toLowerCase();
      const locs = (j.locations || []).map(l => l.name).join(", ");
      all.push({
        id: "tms-" + j.id,
        title: j.name,
        company: (j.company && j.company.name) || "",
        location: locs || "Remote",
        url: j.refs && j.refs.landing_page,
        posted: j.publication_date,
        description: stripHtml(j.contents || "").slice(0, 280),
        tags: (j.categories || []).map(c => c.name),
        salary_raw: "",
        salary_min: null,
        source: "The Muse",
        level: (j.levels && j.levels[0] && j.levels[0].name || "").toLowerCase()
      });
    });
  }
  return all;
}

// ---------- Helpers ----------
function stripHtml(s) {
  const div = document.createElement("div");
  div.innerHTML = s;
  return (div.textContent || div.innerText || "").trim();
}

function parseSalary(text) {
  if (!text) return null;
  // Look for numbers like $65,000 / $65k / 65000.
  const t = text.toLowerCase().replace(/,/g, "");
  const kMatch = t.match(/\$?\s*(\d{2,3})\s*k/);
  if (kMatch) return parseInt(kMatch[1], 10) * 1000;
  const wholeMatch = t.match(/\$?\s*(\d{5,7})/);
  if (wholeMatch) return parseInt(wholeMatch[1], 10);
  return null;
}

function formatK(n) {
  if (n >= 1000) return Math.round(n / 1000) + "k";
  return String(n);
}

function matchesKeywords(job, extraKeyword) {
  const haystack = [job.title, job.company, job.description, (job.tags || []).join(" ")]
    .join(" ").toLowerCase();
  const defaultHit = KEYWORDS.some(k => haystack.includes(k.toLowerCase()));
  if (!defaultHit) return false;
  if (extraKeyword) return haystack.includes(extraKeyword.toLowerCase());
  return true;
}

function passesEarlyCareer(job) {
  const t = (job.title || "").toLowerCase();
  if (EXCLUDES.some(term => t.includes(term))) return false;
  // If the source provided an explicit level, honor it
  if (job.level && /senior|principal|director|head|chief|staff|lead/.test(job.level)) return false;
  return true;
}

function passesSalary(job) {
  if (job.salary_min == null) return true;            // unknown → keep
  return job.salary_min >= MIN_SALARY;
}

// Safety check on top of source-level remote filtering: reject anything
// that explicitly says hybrid / onsite / in-office.
function isRemote(job) {
  const hay = ((job.location || "") + " " + (job.title || "")).toLowerCase();
  if (/(hybrid|on-site|onsite|in-office|in office)/.test(hay)) return false;
  return true;
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
    $list.innerHTML = `
      <div class="empty-state">
        <h3>No jobs match yet</h3>
        <p>Try a broader keyword or refresh.</p>
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

    return `
      <article class="card ${applied ? 'job-applied' : ''}">
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
            <button class="hide-x" data-action="hide" data-id="${escapeAttr(j.id)}" title="Hide this job">×</button>
          </div>
        </div>
        <p style="font-size:14px;color:var(--ink);margin-top:4px;">${escapeHtml(j.description)}…</p>
        <div class="card-meta" style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;">
          <span class="badge badge-remote">${escapeHtml(j.source)}</span>
          ${salaryTag}
          <span>Posted ${fmtDate(j.posted)}</span>
        </div>
        <div class="card-actions">
          <a class="btn btn-primary btn-sm" href="${escapeAttr(j.url)}" target="_blank" rel="noopener">View posting ↗</a>
          <button class="btn btn-gold btn-sm" data-action="save" data-job-id="${escapeAttr(j.id)}" data-job='${escapeAttr(JSON.stringify({
            company: j.company, role: j.title, url: j.url
          }))}'>Save to Applications</button>
        </div>
      </article>`;
  }).join("");
}

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

function applyFilters() {
  const extra = $keyword.value.trim();
  const src = $source.value;
  let filtered = allJobs.filter(j =>
    !isHidden(j.id) &&
    matchesKeywords(j, extra) &&
    passesEarlyCareer(j) &&
    passesSalary(j) &&
    isRemote(j)
  );
  if (src !== "all") {
    filtered = filtered.filter(j => j.source.toLowerCase() === src);
  }
  // Newest first, but push already-applied to the bottom
  filtered.sort((a, b) => {
    const aApp = isApplied(a.id) ? 1 : 0;
    const bApp = isApplied(b.id) ? 1 : 0;
    if (aApp !== bApp) return aApp - bApp;
    return postedTimestamp(b) - postedTimestamp(a);
  });
  renderJobs(filtered);
}

async function loadAll() {
  $status.style.display = "block";
  $status.textContent = "Loading jobs from 5 sources";
  $list.innerHTML = "";

  const sources = [
    ["Remotive",   fetchRemotive],
    ["RemoteOK",   fetchRemoteOK],
    ["Arbeitnow",  fetchArbeitnow],
    ["Jobicy",     fetchJobicy],
    ["The Muse",   fetchTheMuse]
  ];

  const results = await Promise.allSettled(sources.map(([_, fn]) => fn()));
  const errors = [];
  allJobs = [];
  results.forEach((r, i) => {
    const name = sources[i][0];
    if (r.status === "fulfilled") {
      allJobs = allJobs.concat(r.value);
    } else {
      errors.push(name);
      console.warn(name + " failed:", r.reason);
    }
  });

  $status.style.display = "none";

  if (allJobs.length === 0) {
    $list.innerHTML = `<div class="banner banner-warn">Couldn't reach any job feeds. Check your internet and try again.</div>`;
    return;
  }
  if (errors.length) {
    const warn = document.createElement("div");
    warn.className = "banner banner-info";
    warn.textContent = `${errors.join(", ")} didn't respond — showing results from the other sources.`;
    $list.appendChild(warn);
  }
  applyFilters();
}

// ---------- Event wiring ----------
$refresh.addEventListener("click", loadAll);
$keyword.addEventListener("input", applyFilters);
$source.addEventListener("change", applyFilters);

$list.addEventListener("click", async (e) => {
  const hideBtn = e.target.closest('[data-action="hide"]');
  if (hideBtn) {
    setHidden(hideBtn.dataset.id, true);
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
