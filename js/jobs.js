// =============================================================
// Job Search landing page
// Pulls fresh listings from public job feeds (Remotive, RemoteOK)
// and renders them as cards. Filtered by Ayla's default keywords
// in config.js, narrowable in the UI.
// =============================================================

const $list = document.getElementById("job-list");
const $status = document.getElementById("job-status");
const $keyword = document.getElementById("filter-keyword");
const $source = document.getElementById("filter-source");
const $refresh = document.getElementById("btn-refresh");

const KEYWORDS = window.AC_CONFIG.JOB_KEYWORDS;

let allJobs = [];

async function fetchRemotive() {
  // Remotive returns a big list; we filter client-side by keyword.
  // No API key required.
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
    source: "Remotive"
  }));
}

async function fetchRemoteOK() {
  // RemoteOK feed. CORS-friendly via their API.
  const res = await fetch("https://remoteok.com/api");
  if (!res.ok) throw new Error("RemoteOK request failed");
  const data = await res.json();
  // First element is metadata; skip it.
  return data.slice(1).map(j => ({
    id: "rok-" + j.id,
    title: j.position || j.title,
    company: j.company,
    location: j.location || "Remote",
    url: j.url || ("https://remoteok.com/remote-jobs/" + j.id),
    posted: j.date,
    description: stripHtml(j.description || "").slice(0, 280),
    tags: j.tags || [],
    source: "RemoteOK"
  }));
}

function stripHtml(s) {
  const div = document.createElement("div");
  div.innerHTML = s;
  return (div.textContent || div.innerText || "").trim();
}

function matchesKeywords(job, extraKeyword) {
  const haystack = [
    job.title, job.company, job.description, (job.tags || []).join(" ")
  ].join(" ").toLowerCase();

  // Must hit at least one of the default keywords
  const defaultHit = KEYWORDS.some(k => haystack.includes(k.toLowerCase()));
  if (!defaultHit) return false;

  if (extraKeyword) {
    return haystack.includes(extraKeyword.toLowerCase());
  }
  return true;
}

function fitScore(job) {
  // Quick heuristic until we wire up real AI scoring.
  // Counts how many of Ayla's interest keywords appear; bumps for "senior" / "lead" titles down.
  const haystack = (job.title + " " + job.description + " " + (job.tags || []).join(" ")).toLowerCase();
  let score = 0;
  KEYWORDS.forEach(k => { if (haystack.includes(k.toLowerCase())) score += 1; });
  // Down-weight roles that look senior-only.
  if (/senior|principal|director|head of/.test(haystack)) score -= 1;
  if (score < 0) score = 0;
  return Math.min(5, score);
}

function fmtDate(s) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "";
  const days = Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return days + " days ago";
  if (days < 30) return Math.round(days / 7) + " wk ago";
  return d.toLocaleDateString();
}

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
    const score = fitScore(j);
    const stars = "★".repeat(score) + "☆".repeat(5 - score);
    const fitClass = score >= 3 ? "high" : "";
    return `
      <article class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${escapeHtml(j.title)}</div>
            <div class="card-subtitle">${escapeHtml(j.company)} &middot; ${escapeHtml(j.location)}</div>
          </div>
          <span class="fit-score ${fitClass}" title="Heuristic fit score">${stars}</span>
        </div>
        <p style="font-size:14px;color:var(--ink);margin-top:4px;">${escapeHtml(j.description)}…</p>
        <div class="card-meta">
          <span class="badge badge-remote">${escapeHtml(j.source)}</span>
          &nbsp;Posted ${fmtDate(j.posted)}
        </div>
        <div class="card-actions">
          <a class="btn btn-primary btn-sm" href="${escapeAttr(j.url)}" target="_blank" rel="noopener">View posting ↗</a>
          <button class="btn btn-gold btn-sm" data-action="save" data-job='${escapeAttr(JSON.stringify({
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
  let filtered = allJobs.filter(j => matchesKeywords(j, extra));
  if (src !== "all") {
    filtered = filtered.filter(j => j.source.toLowerCase() === src);
  }
  filtered.sort((a, b) => fitScore(b) - fitScore(a));
  renderJobs(filtered);
}

async function loadAll() {
  $status.style.display = "block";
  $status.textContent = "Loading jobs";
  $list.innerHTML = "";

  const results = await Promise.allSettled([fetchRemotive(), fetchRemoteOK()]);
  const errors = [];
  allJobs = [];
  results.forEach((r, i) => {
    const name = i === 0 ? "Remotive" : "RemoteOK";
    if (r.status === "fulfilled") {
      allJobs = allJobs.concat(r.value);
    } else {
      errors.push(name);
      console.warn(name + " failed:", r.reason);
    }
  });

  $status.style.display = "none";

  if (errors.length === 2) {
    $list.innerHTML = `
      <div class="banner banner-warn">
        Couldn't reach either job feed. Check your internet, or try again.
      </div>`;
    return;
  }
  if (errors.length) {
    const warn = document.createElement("div");
    warn.className = "banner banner-info";
    warn.textContent = `${errors[0]} didn't respond — showing results from the other source.`;
    $list.appendChild(warn);
  }
  applyFilters();
}

// --------- Event wiring ---------
$refresh.addEventListener("click", loadAll);
$keyword.addEventListener("input", applyFilters);
$source.addEventListener("change", applyFilters);

// Save-to-applications shortcut
$list.addEventListener("click", async (e) => {
  const btn = e.target.closest('[data-action="save"]');
  if (!btn) return;
  if (!window.sb) {
    acShowError("Supabase not loaded — can't save yet.");
    return;
  }
  const payload = JSON.parse(btn.dataset.job);
  btn.disabled = true;
  btn.textContent = "Saving…";
  const { error } = await window.sb.from("applications").insert({
    company: payload.company,
    role: payload.role,
    url: payload.url,
    status: "saved"
  });
  if (error) {
    btn.disabled = false;
    btn.textContent = "Save to Applications";
    acShowError("Couldn't save: " + error.message);
    return;
  }
  btn.textContent = "✓ Saved";
});

(async () => {
  const session = await window.acAuth.requireAuth();
  if (!session) return;
  window.acAuth.paintNav(session);
  document.body.style.visibility = "visible";
  loadAll();
})();
