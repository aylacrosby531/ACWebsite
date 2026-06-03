// =============================================================
// Goals page
// Goals (big rocks) own bite-size actions. Actions can be checked
// off, starred for "this week", or flagged as milestones.
// Tables: goals, actions.
// =============================================================

const $list = document.getElementById("goal-list");
const $status = document.getElementById("goal-status");
const $areaFilter = document.getElementById("filter-area");
const $showInactive = document.getElementById("show-inactive");
const $addBtn = document.getElementById("btn-add-goal");

const $modal = document.getElementById("modal-backdrop");
const $form = document.getElementById("goal-form");
const $modalTitle = document.getElementById("goal-modal-title");
const $cancel = document.getElementById("btn-cancel-goal");
const gf = {
  id: document.getElementById("goal-id"),
  area: document.getElementById("goal-area"),
  target: document.getElementById("goal-target"),
  title: document.getElementById("goal-title"),
  detail: document.getElementById("goal-detail"),
  status: document.getElementById("goal-status")
};

const AREA_LABEL = {
  career: "Career", skills: "Skills", health: "Health",
  money: "Money", adventure: "Adventure", other: "Other"
};

let goals = [];
let actions = [];

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(s) { return escapeHtml(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
function fmtDate(s) {
  if (!s) return "";
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// --------- Modal ---------
function openModal(goal) {
  $form.reset();
  gf.id.value = "";
  if (goal) {
    $modalTitle.textContent = "Edit Goal";
    gf.id.value = goal.id;
    gf.area.value = goal.area || "career";
    gf.target.value = goal.target_date || "";
    gf.title.value = goal.title || "";
    gf.detail.value = goal.detail || "";
    gf.status.value = goal.status || "active";
  } else {
    $modalTitle.textContent = "Add Goal";
    gf.area.value = $areaFilter.value !== "all" ? $areaFilter.value : "career";
    gf.status.value = "active";
  }
  $modal.classList.add("open");
}
function closeModal() { $modal.classList.remove("open"); }

async function saveGoal(e) {
  e.preventDefault();
  const payload = {
    area: gf.area.value,
    title: gf.title.value.trim(),
    detail: gf.detail.value.trim() || null,
    target_date: gf.target.value || null,
    status: gf.status.value
  };
  const id = gf.id.value;
  const res = id
    ? await window.sb.from("goals").update(payload).eq("id", id)
    : await window.sb.from("goals").insert(payload);
  if (res.error) { acShowError(res.error.message); return; }
  closeModal();
  load();
}

async function deleteGoal(id) {
  if (!confirm("Delete this goal and all its actions?")) return;
  const { error } = await window.sb.from("goals").delete().eq("id", id);
  if (error) { acShowError(error.message); return; }
  load();
}

// --------- Actions ---------
async function addAction(goalId, title) {
  const { error } = await window.sb.from("actions").insert({ goal_id: goalId, title });
  if (error) { acShowError(error.message); return; }
  load();
}
async function patchAction(id, patch) {
  const { error } = await window.sb.from("actions").update(patch).eq("id", id);
  if (error) { acShowError(error.message); return; }
  load();
}
async function deleteAction(id) {
  const { error } = await window.sb.from("actions").delete().eq("id", id);
  if (error) { acShowError(error.message); return; }
  load();
}

// --------- Render ---------
function actionRow(a) {
  const done = a.status === "done";
  return `
    <div class="task-row ${done ? 'task-done' : ''}">
      <label class="task-check">
        <input type="checkbox" data-act="toggle" data-id="${a.id}" ${done ? 'checked' : ''}>
        <span>${a.is_milestone ? "🏁 " : ""}${escapeHtml(a.title)}</span>
      </label>
      <div class="task-meta">
        <button class="icon-btn ${a.this_week ? 'on' : ''}" data-act="star" data-id="${a.id}" title="This week">⭐</button>
        <button class="icon-btn ${a.is_milestone ? 'on' : ''}" data-act="flag" data-id="${a.id}" title="Milestone">🏁</button>
        <button class="hide-x" data-act="del-action" data-id="${a.id}" title="Delete action">×</button>
      </div>
    </div>`;
}

function goalCard(g) {
  const mine = actions.filter(a => a.goal_id === g.id)
    .sort((a, b) => (a.status === "done" ? 1 : 0) - (b.status === "done" ? 1 : 0));
  const total = mine.length;
  const done = mine.filter(a => a.status === "done").length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return `
    <article class="card goal-card status-${g.status}" data-id="${g.id}">
      <div class="card-header">
        <div>
          <div class="card-title">
            <span class="badge badge-area area-${g.area}">${escapeHtml(AREA_LABEL[g.area] || g.area)}</span>
            ${escapeHtml(g.title)}
            ${g.status !== 'active' ? `<span class="badge" style="background:#e5e7eb;color:#374151;">${g.status}</span>` : ""}
          </div>
          ${g.target_date ? `<div class="card-subtitle">Target: ${fmtDate(g.target_date)}</div>` : ""}
        </div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-ghost btn-sm" data-act="edit-goal" data-id="${g.id}">Edit</button>
          <button class="btn btn-ghost btn-sm" data-act="del-goal" data-id="${g.id}" style="color:#b91c1c;border-color:#fca5a5;">Delete</button>
        </div>
      </div>
      ${g.detail ? `<p style="font-size:13px;color:var(--muted);margin:4px 0 8px;">${escapeHtml(g.detail)}</p>` : ""}
      <div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div>
      <div class="bar-caption">${done}/${total} actions ${total ? "· " + pct + "%" : ""}</div>
      <div class="task-list">${mine.map(actionRow).join("")}</div>
      <form class="add-action" data-goal="${g.id}">
        <input type="text" placeholder="+ add a bite-size action…" />
        <button type="submit" class="btn btn-ghost btn-sm">Add</button>
      </form>
    </article>`;
}

function render() {
  const area = $areaFilter.value;
  const showInactive = $showInactive.checked;
  let visible = goals.filter(g => (area === "all" || g.area === area) && (showInactive || g.status === "active"));
  // active first, then by created
  visible.sort((a, b) => (a.status === "active" ? 0 : 1) - (b.status === "active" ? 0 : 1));
  if (!visible.length) {
    $list.innerHTML = `<div class="empty-state"><h3>No goals yet</h3><p>Hit <strong>+ Add Goal</strong> to start. Health, career, skills, adventure — whatever you're working toward.</p></div>`;
    return;
  }
  $list.innerHTML = visible.map(goalCard).join("");
}

// --------- Load ---------
async function load() {
  $status.style.display = "block";
  const [gRes, aRes] = await Promise.all([
    window.sb.from("goals").select("*").order("created_at", { ascending: true }),
    window.sb.from("actions").select("*").order("created_at", { ascending: true })
  ]);
  $status.style.display = "none";
  if (gRes.error || aRes.error) {
    $list.innerHTML = `<div class="banner banner-warn">Couldn't load goals: ${escapeHtml((gRes.error || aRes.error).message)}. Have you run the latest schema.sql in Supabase?</div>`;
    return;
  }
  goals = gRes.data || [];
  actions = aRes.data || [];
  render();
}

// --------- Events ---------
$addBtn.addEventListener("click", () => openModal());
$cancel.addEventListener("click", closeModal);
$modal.addEventListener("click", (e) => { if (e.target === $modal) closeModal(); });
$form.addEventListener("submit", saveGoal);
$areaFilter.addEventListener("change", render);
$showInactive.addEventListener("change", render);

$list.addEventListener("click", (e) => {
  const t = e.target.closest("[data-act]");
  if (!t) return;
  const id = t.dataset.id;
  switch (t.dataset.act) {
    case "edit-goal": openModal(goals.find(g => g.id === id)); break;
    case "del-goal": deleteGoal(id); break;
    case "del-action": deleteAction(id); break;
    case "star": {
      const a = actions.find(x => x.id === id);
      patchAction(id, { this_week: !(a && a.this_week) });
      break;
    }
    case "flag": {
      const a = actions.find(x => x.id === id);
      patchAction(id, { is_milestone: !(a && a.is_milestone) });
      break;
    }
  }
});

$list.addEventListener("change", (e) => {
  const cb = e.target.closest('input[data-act="toggle"]');
  if (!cb) return;
  const checked = cb.checked;
  patchAction(cb.dataset.id, { status: checked ? "done" : "todo", done_at: checked ? new Date().toISOString() : null });
});

$list.addEventListener("submit", (e) => {
  const f = e.target.closest("form.add-action");
  if (!f) return;
  e.preventDefault();
  const input = f.querySelector("input");
  const title = input.value.trim();
  if (title) addAction(f.dataset.goal, title);
});

(async () => {
  const session = await window.acAuth.requireAuth();
  if (!session) return;
  window.acAuth.paintNav(session);
  document.body.style.visibility = "visible";
  load();
})();
