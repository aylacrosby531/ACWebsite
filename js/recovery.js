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
const $plant = document.getElementById("plant");
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
  if ($plant) $plant.innerHTML = drawPlant(total ? done / total : 0);
  if (!total) $cheer.textContent = "";
  else if (pct === 100) $cheer.textContent = "🏔️ Full bloom — I made it back. Every bubble was real.";
  else if (done === 0) $cheer.textContent = "Just a seed for now. Light up my first one. 🌱";
  else $cheer.textContent = `${total - done} to go — keep it growing.`;
}

// Build an SVG plant that grows with progress p (0..1):
// seed in dirt → sprout → tall leafy stem → a bouquet of flowers.
function drawPlant(p) {
  p = Math.max(0, Math.min(1, p));
  const soilY = 178, maxGrow = 128;
  const PINKS = ["#f0b9c4", "#e79bb0", "#f3d1d9", "#e8a7c1", "#f2c2cf"];
  let s = "";

  // sun (brightens as the plant grows)
  const sunOp = (0.22 + p * 0.6).toFixed(2);
  s += `<g opacity="${sunOp}"><circle cx="164" cy="34" r="15" fill="#f6d98a"/>`;
  for (let r = 0; r < 8; r++) {
    const a = (r * 45) * Math.PI / 180;
    s += `<line x1="${164 + Math.cos(a) * 20}" y1="${34 + Math.sin(a) * 20}" x2="${164 + Math.cos(a) * 26}" y2="${34 + Math.sin(a) * 26}" stroke="#f6d98a" stroke-width="2" stroke-linecap="round"/>`;
  }
  s += `</g>`;

  // dirt
  s += `<rect x="34" y="${soilY}" width="132" height="26" rx="6" fill="#9c7a5c"/>`;
  s += `<ellipse cx="100" cy="${soilY}" rx="66" ry="11" fill="#b08a66"/>`;

  if (p <= 0.06) {
    // seed nestled in the dirt
    s += `<ellipse cx="100" cy="${soilY - 2}" rx="7" ry="5" fill="#6f5237" transform="rotate(18 100 ${soilY - 2})"/>`;
    return s;
  }

  const baseY = soilY - 6;
  const topY = baseY - p * maxGrow;
  const flower = (cx, cy, sc, color) => {
    let f = `<g class="bloom">`;
    for (let k = 0; k < 5; k++) {
      const a = (k * 72) * Math.PI / 180;
      f += `<circle cx="${(cx + Math.cos(a) * 5 * sc).toFixed(1)}" cy="${(cy + Math.sin(a) * 5 * sc).toFixed(1)}" r="${(4 * sc).toFixed(1)}" fill="${color}"/>`;
    }
    f += `<circle cx="${cx}" cy="${cy}" r="${(3 * sc).toFixed(1)}" fill="#f4c64f"/></g>`;
    return f;
  };
  const leaf = (cx, cy, dir) => `<ellipse cx="${cx + dir * 13}" cy="${cy}" rx="14" ry="7" fill="#7faa78" transform="rotate(${dir * -22} ${cx + dir * 13} ${cy})"/>`;

  s += `<g class="plant-grow">`;
  // stem (gentle curve)
  const midY = (baseY + topY) / 2;
  s += `<path d="M100 ${baseY} C 92 ${midY}, 108 ${midY}, 100 ${topY}" stroke="#6f9e6f" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  // leaves appear as it grows
  if (p > 0.12) { const y = baseY - p * maxGrow * 0.4; s += leaf(100, y, -1) + leaf(100, y, 1); }
  if (p > 0.5)  { const y = baseY - p * maxGrow * 0.7; s += leaf(100, y, 1) + leaf(100, y, -1); }
  // flowers bloom toward the end — more of them the closer to 100%
  if (p >= 0.45) {
    const n = Math.max(1, Math.round(((p - 0.45) / 0.55) * 8));
    for (let i = 0; i < n; i++) {
      const ang = i * 137.5 * Math.PI / 180;
      const rad = 5 + i * 3.4;
      const fx = 100 + Math.cos(ang) * rad * 0.95;
      const fy = topY - 2 - Math.abs(Math.sin(ang)) * rad * 0.6;
      const sc = 0.85 + ((i * 37) % 5) / 14;
      s += flower(+fx.toFixed(1), +fy.toFixed(1), +sc.toFixed(2), PINKS[i % PINKS.length]);
    }
  } else {
    // tiny bud at the tip before blooming
    s += `<circle cx="100" cy="${topY - 1}" r="4" fill="#cfe0b8"/>`;
  }
  s += `</g>`;
  return s;
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

  const groupsHtml = phases.map(phase => {
    const ms = groups[phase];
    const done = ms.filter(m => m.done).length;
    return `
      <div class="cluster-group">
        <button class="hub" type="button" tabindex="-1">${escapeHtml(phase)} <small>${done}/${ms.length}</small></button>
        <div class="cluster-bubbles">${ms.map(bubble).join("")}</div>
      </div>`;
  }).join("");

  $list.innerHTML = `<div class="web-canvas"><svg class="web-lines"></svg>${groupsHtml}</div>`;
  renderProgress();
  // draw connecting lines once the bubbles have laid out
  requestAnimationFrame(drawLines);
  setTimeout(drawLines, 200); // fonts/layout settle
}

// Draw the constellation: hub → each of its bubbles, and hub → next hub.
function drawLines() {
  const canvas = document.querySelector(".web-canvas");
  if (!canvas) return;
  const svg = canvas.querySelector(".web-lines");
  if (!svg) return;
  const base = canvas.getBoundingClientRect();
  const center = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2 };
  };
  const w = canvas.clientWidth, h = canvas.scrollHeight;
  svg.setAttribute("width", w);
  svg.setAttribute("height", h);
  svg.style.width = w + "px";
  svg.style.height = h + "px";

  const hubs = Array.from(canvas.querySelectorAll(".hub"));
  let lines = "";
  hubs.forEach(hub => {
    const c = center(hub);
    hub.parentElement.querySelectorAll(".bubble").forEach(b => {
      const cb = center(b);
      const lit = b.classList.contains("lit");
      lines += `<line x1="${c.x}" y1="${c.y}" x2="${cb.x}" y2="${cb.y}" class="wl ${lit ? 'wl-lit' : ''}"/>`;
    });
  });
  for (let i = 0; i < hubs.length - 1; i++) {
    const a = center(hubs[i]), b = center(hubs[i + 1]);
    lines += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="wl wl-spine"/>`;
  }
  svg.innerHTML = lines;
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

let resizeT;
window.addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(drawLines, 150); });

(async () => {
  const session = await window.acAuth.requireAuth();
  if (!session) return;
  window.acAuth.paintNav(session);
  document.body.style.visibility = "visible";
  load();
})();
