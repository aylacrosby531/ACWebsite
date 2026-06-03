// =============================================================
// Recovery page — a "progress web": all milestones visible as
// tappable bubbles, grouped into loose clusters (no strict order,
// nothing hidden). Tap to light up; double-click to rename; × to
// delete. Table: milestones.
// =============================================================

const $list = document.getElementById("milestone-list");
const $status = document.getElementById("milestone-status");
const $addForm = document.getElementById("add-milestone");
const $addInput = document.getElementById("add-milestone-input");
const $addPhase = document.getElementById("add-milestone-phase");
const $count = document.getElementById("recovery-count");
const $pct = document.getElementById("recovery-pct");
const $bar = document.getElementById("recovery-bar");
const $cheer = document.getElementById("recovery-cheer");

// Cluster order for display.
const PHASE_ORDER = ["Surgery & PT", "Bike", "Crutches & weight-bearing", "Walking", "Running", "Goal", "Other"];

// Ayla's roadmap for the one-click seed (order within a cluster doesn't matter).
const SEED = [
  ["Pre-op complete", "Surgery & PT"],
  ["Surgery complete", "Surgery & PT"],
  ["First PT", "Surgery & PT"],
  ["Post-op check", "Surgery & PT"],
  ["First spin bike", "Bike"],
  ["Spin bike 5 min", "Bike"],
  ["Spin bike 10 min", "Bike"],
  ["Spin bike 15 min", "Bike"],
  ["Foot on ground with crutches", "Crutches & weight-bearing"],
  ["Leg can take some weight on crutches", "Crutches & weight-bearing"],
  ["First steps", "Crutches & weight-bearing"],
  ["Weaning off crutches", "Crutches & weight-bearing"],
  ["Crutches only as needed", "Crutches & weight-bearing"],
  ["First step up stairs", "Crutches & weight-bearing"],
  ["Standing on one leg", "Crutches & weight-bearing"],
  ["Quarter-mile walk (¼ mi)", "Walking"],
  ["Half-mile walk (½ mi)", "Walking"],
  ["One-mile walk", "Walking"],
  ["Jog 2 min", "Running"],
  ["Jog 10 min", "Running"],
  ["Jog 20 min", "Running"],
  ["🏔️ Back on the trails", "Goal"]
];

let items = [];

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(s) { return escapeHtml(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
function todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function renderProgress() {
  const total = items.length;
  const done = items.filter(m => m.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  $count.textContent = `${done} of ${total} milestones`;
  $pct.textContent = pct + "%";
  $bar.style.width = pct + "%";
  if (!total) $cheer.textContent = "";
  else if (pct === 100) $cheer.textContent = "🏔️ You made it back. Every bubble was real.";
  else if (done === 0) $cheer.textContent = "Light up your first one. You've got this.";
  else $cheer.textContent = `${total - done} to go — keep lighting them up.`;
}

function bubble(m) {
  return `<button class="bubble ${m.done ? 'lit' : ''}" data-id="${m.id}" title="${m.done && m.done_on ? 'Done ' + m.done_on : 'Tap to mark done'}">
      <span class="bubble-text">${escapeHtml(m.title)}</span>
      <span class="bubble-x" data-act="del" data-id="${m.id}" title="Delete">×</span>
    </button>`;
}

function render() {
  if (!items.length) {
    $list.innerHTML = `
      <div class="empty-state">
        <h3>No milestones yet</h3>
        <p>Load your recovery roadmap to start — then tweak, rename, or add your own.</p>
        <button class="btn btn-gold" id="seed-btn">✨ Load my recovery roadmap</button>
      </div>`;
    renderProgress();
    return;
  }

  // group by phase
  const groups = {};
  items.forEach(m => { (groups[m.phase || "Other"] = groups[m.phase || "Other"] || []).push(m); });
  const phases = Object.keys(groups).sort((a, b) => {
    const ia = PHASE_ORDER.indexOf(a), ib = PHASE_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  $list.innerHTML = phases.map(phase => {
    const ms = groups[phase];
    const done = ms.filter(m => m.done).length;
    return `
      <section class="cluster">
        <div class="cluster-head">
          <span class="cluster-name">${escapeHtml(phase)}</span>
          <span class="cluster-count">${done}/${ms.length}</span>
        </div>
        <div class="cluster-bubbles">${ms.map(bubble).join("")}</div>
      </section>`;
  }).join("");
  renderProgress();
}

// --------- Data ops ---------
async function toggle(id) {
  const m = items.find(x => x.id === id);
  if (!m) return;
  const done = !m.done;
  const { error } = await window.sb.from("milestones")
    .update({ done, done_on: done ? (m.done_on || todayStr()) : null }).eq("id", id);
  if (error) { acShowError(error.message); return; }
  load();
}
async function rename(id) {
  const m = items.find(x => x.id === id);
  if (!m) return;
  const val = prompt("Rename milestone:", m.title);
  if (val == null) return;
  const title = val.trim();
  if (!title || title === m.title) return;
  const { error } = await window.sb.from("milestones").update({ title }).eq("id", id);
  if (error) { acShowError(error.message); return; }
  load();
}
async function remove(id) {
  if (!confirm("Delete this milestone?")) return;
  const { error } = await window.sb.from("milestones").delete().eq("id", id);
  if (error) { acShowError(error.message); return; }
  load();
}
async function addMilestone(title, phase) {
  const { error } = await window.sb.from("milestones").insert({ title, phase });
  if (error) { acShowError(error.message); return; }
  load();
}
async function seedRoadmap() {
  const rows = SEED.map(([title, phase], i) => ({ title, phase, sort: i }));
  const { error } = await window.sb.from("milestones").insert(rows);
  if (error) { acShowError(error.message); return; }
  load();
}

async function load() {
  $status.style.display = "block";
  const { data, error } = await window.sb.from("milestones").select("*").order("sort", { ascending: true });
  $status.style.display = "none";
  if (error) {
    $list.innerHTML = `<div class="banner banner-warn">Couldn't load milestones: ${escapeHtml(error.message)}. Have you run the latest schema.sql in Supabase?</div>`;
    return;
  }
  items = data || [];
  render();
}

// --------- Events ---------
$addForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const t = $addInput.value.trim();
  if (t) { $addInput.value = ""; addMilestone(t, $addPhase.value); }
});

$list.addEventListener("click", (e) => {
  if (e.target.id === "seed-btn") { seedRoadmap(); return; }
  const x = e.target.closest('[data-act="del"]');
  if (x) { e.stopPropagation(); remove(x.dataset.id); return; }
  const b = e.target.closest(".bubble");
  if (b) toggle(b.dataset.id);
});
$list.addEventListener("dblclick", (e) => {
  const b = e.target.closest(".bubble");
  if (b) rename(b.dataset.id);
});

(async () => {
  const session = await window.acAuth.requireAuth();
  if (!session) return;
  window.acAuth.paintNav(session);
  document.body.style.visibility = "visible";
  load();
})();
