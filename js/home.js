// =============================================================
// Home dashboard — action-first.
// Shows: this week's actions (with quick-add), goal progress, and a
// snapshot row (last review, job picks, applications, cities).
// =============================================================

const $weekList = document.getElementById("week-list");
const $weekStatus = document.getElementById("week-status");
const $quickForm = document.getElementById("quick-add");
const $quickInput = document.getElementById("quick-add-input");
const $goalsSummary = document.getElementById("goals-summary");

const AREA_LABEL = {
  career: "Career", skills: "Skills", health: "Health",
  money: "Money", adventure: "Adventure", other: "Other"
};

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function fmtDate(s) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "—";
  const days = Math.round((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return days + "d ago";
  return d.toLocaleDateString();
}

let goalsById = {};

function renderWeek(actions) {
  if (!actions.length) {
    $weekList.innerHTML = `<div class="empty-inline">Nothing flagged for this week yet. Add one above, or star actions on the <a href="goals.html">Goals</a> page.</div>`;
    return;
  }
  // not-done first, then done
  actions.sort((a, b) => (a.status === "done" ? 1 : 0) - (b.status === "done" ? 1 : 0));
  $weekList.innerHTML = actions.map(a => {
    const goal = a.goal_id ? goalsById[a.goal_id] : null;
    const tag = goal
      ? `<span class="badge badge-area area-${goal.area}">${escapeHtml(AREA_LABEL[goal.area] || goal.area)}</span>`
      : "";
    const done = a.status === "done";
    return `
      <div class="task-row ${done ? 'task-done' : ''}">
        <label class="task-check">
          <input type="checkbox" data-action="toggle" data-id="${a.id}" ${done ? 'checked' : ''}>
          <span>${a.is_milestone ? "🏁 " : ""}${escapeHtml(a.title)}</span>
        </label>
        <div class="task-meta">
          ${tag}
          <button class="hide-x" data-action="unstar" data-id="${a.id}" title="Remove from this week">×</button>
        </div>
      </div>`;
  }).join("");
}

function renderGoals(goals, actions) {
  const active = goals.filter(g => g.status === "active");
  if (!active.length) {
    $goalsSummary.innerHTML = `<div class="empty-inline">No active goals yet. <a href="goals.html">Add your first goal →</a></div>`;
    return;
  }
  $goalsSummary.innerHTML = active.map(g => {
    const mine = actions.filter(a => a.goal_id === g.id);
    const total = mine.length;
    const done = mine.filter(a => a.status === "done").length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return `
      <a class="goal-progress" href="goals.html">
        <div class="goal-progress-top">
          <span><span class="badge badge-area area-${g.area}">${escapeHtml(AREA_LABEL[g.area] || g.area)}</span> ${escapeHtml(g.title)}</span>
          <span class="goal-progress-count">${done}/${total}</span>
        </div>
        <div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div>
      </a>`;
  }).join("");
}

async function toggleAction(id, checked) {
  const { error } = await window.sb.from("actions")
    .update({ status: checked ? "done" : "todo", done_at: checked ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) { acShowError(error.message); return; }
  load();
}

async function unstarAction(id) {
  const { error } = await window.sb.from("actions").update({ this_week: false }).eq("id", id);
  if (error) { acShowError(error.message); return; }
  load();
}

async function quickAdd(e) {
  e.preventDefault();
  const title = $quickInput.value.trim();
  if (!title) return;
  const { error } = await window.sb.from("actions").insert({ title, this_week: true });
  if (error) { acShowError(error.message); return; }
  $quickInput.value = "";
  load();
}

async function load() {
  $weekStatus.style.display = "block";
  const [goalsRes, actionsRes, reviewRes, leadsRes, appsRes, citiesRes, milesRes] = await Promise.all([
    window.sb.from("goals").select("id,title,area,status"),
    window.sb.from("actions").select("id,title,this_week,is_milestone,status,goal_id"),
    window.sb.from("reviews").select("week_start").order("week_start", { ascending: false }).limit(1),
    window.sb.from("leads").select("id"),
    window.sb.from("applications").select("id,status"),
    window.sb.from("cities").select("id"),
    window.sb.from("milestones").select("done")
  ]);
  $weekStatus.style.display = "none";

  const firstErr = [goalsRes, actionsRes].find(r => r.error);
  if (firstErr) {
    $weekList.innerHTML = `<div class="banner banner-warn">Couldn't load goals/actions: ${escapeHtml(firstErr.error.message)}. Have you run the latest schema.sql in Supabase?</div>`;
    return;
  }

  const goals = goalsRes.data || [];
  const actions = actionsRes.data || [];
  goalsById = Object.fromEntries(goals.map(g => [g.id, g]));

  renderWeek(actions.filter(a => a.this_week));
  renderGoals(goals, actions);

  // Recovery progress card (only if she has milestones)
  if (!milesRes.error && (milesRes.data || []).length) {
    const m = milesRes.data;
    const mDone = m.filter(x => x.done).length;
    const mPct = Math.round((mDone / m.length) * 100);
    document.getElementById("recovery-card").style.display = "";
    document.getElementById("home-recovery-bar").style.width = mPct + "%";
    document.getElementById("home-recovery-caption").textContent =
      `${mDone} of ${m.length} milestones · ${mPct}% — back to running & the mountains`;
  }

  // Snapshot stats
  const lastReview = (reviewRes.data && reviewRes.data[0]) ? reviewRes.data[0].week_start : null;
  document.getElementById("stat-review").textContent = lastReview ? fmtDate(lastReview) : "none yet";
  document.getElementById("stat-leads").textContent = leadsRes.error ? "—" : (leadsRes.data || []).length;
  const apps = appsRes.error ? [] : (appsRes.data || []);
  const inProgress = apps.filter(a => a.status !== "rejected").length;
  document.getElementById("stat-apps").textContent = inProgress;
  document.getElementById("stat-cities").textContent = citiesRes.error ? "—" : (citiesRes.data || []).length;
}

// --------- Events ---------
$quickForm.addEventListener("submit", quickAdd);
$weekList.addEventListener("change", (e) => {
  const cb = e.target.closest('input[data-action="toggle"]');
  if (cb) toggleAction(cb.dataset.id, cb.checked);
});
$weekList.addEventListener("click", (e) => {
  const x = e.target.closest('[data-action="unstar"]');
  if (x) unstarAction(x.dataset.id);
});

(async () => {
  const session = await window.acAuth.requireAuth();
  if (!session) return;
  window.acAuth.paintNav(session);
  document.body.style.visibility = "visible";
  load();
})();
