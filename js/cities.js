// =============================================================
// Where to Live page
// Score cities 1-5 across criteria; total = sum, sorted high → low.
// Score selects auto-save; text fields save on blur. Table: cities.
// =============================================================

const $list = document.getElementById("city-list");
const $status = document.getElementById("city-status");
const $addBtn = document.getElementById("btn-add-city");
const $modal = document.getElementById("modal-backdrop");
const $form = document.getElementById("city-form");
const $name = document.getElementById("city-name");
const $cancel = document.getElementById("btn-cancel-city");

const CRITERIA = [
  ["cost", "Affordability"],
  ["outdoors", "Outdoors"],
  ["job_market", "Job market"],
  ["climate", "Climate"],
  ["community", "People / proximity"]
];

let cities = [];

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(s) { return escapeHtml(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
function total(c) { return CRITERIA.reduce((sum, [k]) => sum + (Number(c[k]) || 0), 0); }

function scoreSelect(cityId, key, val) {
  const opts = [1, 2, 3, 4, 5].map(n =>
    `<option value="${n}" ${Number(val) === n ? "selected" : ""}>${n}</option>`).join("");
  return `<select class="score-select" data-city="${cityId}" data-key="${key}">${opts}</select>`;
}

function cityCard(c) {
  const t = total(c);
  return `
    <article class="card" data-id="${c.id}">
      <div class="card-header">
        <div class="card-title">${escapeHtml(c.name)}</div>
        <div style="display:flex;gap:8px;align-items:center;">
          <span class="badge" style="background:var(--navy);color:var(--gold);font-size:14px;">${t}/25</span>
          <button class="hide-x" data-act="del" data-id="${c.id}" title="Delete city">×</button>
        </div>
      </div>
      <div class="score-grid">
        ${CRITERIA.map(([k, label]) => `
          <div class="score-cell">
            <span>${label}</span>
            ${scoreSelect(c.id, k, c[k])}
          </div>`).join("")}
      </div>
      <div class="form-row" style="margin-top:10px;">
        <div class="form-group">
          <label>Pros</label>
          <textarea class="city-text" data-city="${c.id}" data-key="pros" rows="2">${escapeHtml(c.pros || "")}</textarea>
        </div>
        <div class="form-group">
          <label>Cons</label>
          <textarea class="city-text" data-city="${c.id}" data-key="cons" rows="2">${escapeHtml(c.cons || "")}</textarea>
        </div>
      </div>
      <div class="form-group">
        <label>Notes</label>
        <textarea class="city-text" data-city="${c.id}" data-key="notes" rows="2">${escapeHtml(c.notes || "")}</textarea>
      </div>
    </article>`;
}

function render() {
  if (!cities.length) {
    $list.innerHTML = `<div class="empty-state"><h3>No cities yet</h3><p>Add a couple you're weighing (Seattle, Anchorage, …) and score them.</p></div>`;
    return;
  }
  const sorted = cities.slice().sort((a, b) => total(b) - total(a));
  $list.innerHTML = sorted.map(cityCard).join("");
}

async function patchCity(id, patch) {
  const { error } = await window.sb.from("cities").update(patch).eq("id", id);
  if (error) { acShowError(error.message); return false; }
  // update local copy without full reload (keeps focus / avoids flicker for text)
  const c = cities.find(x => x.id === id);
  if (c) Object.assign(c, patch);
  return true;
}

async function addCity(e) {
  e.preventDefault();
  const name = $name.value.trim();
  if (!name) return;
  const { error } = await window.sb.from("cities").insert({ name });
  if (error) { acShowError(error.message); return; }
  $modal.classList.remove("open");
  $form.reset();
  load();
}

async function deleteCity(id) {
  if (!confirm("Delete this city?")) return;
  const { error } = await window.sb.from("cities").delete().eq("id", id);
  if (error) { acShowError(error.message); return; }
  load();
}

async function load() {
  $status.style.display = "block";
  const { data, error } = await window.sb.from("cities").select("*");
  $status.style.display = "none";
  if (error) {
    $list.innerHTML = `<div class="banner banner-warn">Couldn't load cities: ${escapeHtml(error.message)}. Have you run the latest schema.sql in Supabase?</div>`;
    return;
  }
  cities = data || [];
  render();
}

// --------- Events ---------
$addBtn.addEventListener("click", () => $modal.classList.add("open"));
$cancel.addEventListener("click", () => $modal.classList.remove("open"));
$modal.addEventListener("click", (e) => { if (e.target === $modal) $modal.classList.remove("open"); });
$form.addEventListener("submit", addCity);

// Score change → save + re-sort (totals change ordering)
$list.addEventListener("change", async (e) => {
  const sel = e.target.closest(".score-select");
  if (!sel) return;
  const ok = await patchCity(sel.dataset.city, { [sel.dataset.key]: Number(sel.value) });
  if (ok) render();
});

// Text fields → save on blur (no re-render, to keep it smooth)
$list.addEventListener("blur", (e) => {
  const ta = e.target.closest(".city-text");
  if (!ta) return;
  patchCity(ta.dataset.city, { [ta.dataset.key]: ta.value.trim() || null });
}, true);

$list.addEventListener("click", (e) => {
  const t = e.target.closest('[data-act="del"]');
  if (t) deleteCity(t.dataset.id);
});

(async () => {
  const session = await window.acAuth.requireAuth();
  if (!session) return;
  window.acAuth.paintNav(session);
  document.body.style.visibility = "visible";
  load();
})();
