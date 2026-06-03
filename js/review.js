// =============================================================
// Weekly Review page
// One review per week (keyed by Monday's date). The form edits the
// current week; past reviews list below. Table: reviews.
// =============================================================

const $form = document.getElementById("review-form");
const $id = document.getElementById("review-id");
const $week = document.getElementById("review-week");
const $weekLabel = document.getElementById("review-week-label");
const $wins = document.getElementById("review-wins");
const $stuck = document.getElementById("review-stuck");
const $top3 = document.getElementById("review-top3");
const $saved = document.getElementById("review-saved");
const $history = document.getElementById("review-history");
const $status = document.getElementById("review-status");

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function nl2br(s) { return escapeHtml(s).replace(/\n/g, "<br>"); }

// Monday of the current week, as YYYY-MM-DD (local).
function mondayOf(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function fmtWeek(s) {
  if (!s) return "";
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? s : "Week of " + d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

let reviews = [];

function prefillForWeek(weekStart) {
  const existing = reviews.find(r => r.week_start === weekStart);
  $id.value = existing ? existing.id : "";
  $week.value = weekStart;
  $wins.value = existing ? (existing.wins || "") : "";
  $stuck.value = existing ? (existing.stuck || "") : "";
  $top3.value = existing ? (existing.top3 || "") : "";
  $weekLabel.textContent = fmtWeek(weekStart) + (existing ? " (editing)" : " (new)");
}

async function saveReview(e) {
  e.preventDefault();
  const payload = {
    week_start: $week.value || mondayOf(new Date()),
    wins: $wins.value.trim() || null,
    stuck: $stuck.value.trim() || null,
    top3: $top3.value.trim() || null
  };
  const id = $id.value;
  const res = id
    ? await window.sb.from("reviews").update(payload).eq("id", id)
    : await window.sb.from("reviews").insert(payload);
  if (res.error) { acShowError(res.error.message); return; }
  $saved.textContent = "Saved ✓";
  setTimeout(() => { $saved.textContent = ""; }, 1500);
  load();
}

async function deleteReview(id) {
  if (!confirm("Delete this review?")) return;
  const { error } = await window.sb.from("reviews").delete().eq("id", id);
  if (error) { acShowError(error.message); return; }
  load();
}

function renderHistory(currentWeek) {
  const past = reviews.filter(r => r.week_start !== currentWeek);
  if (!past.length) {
    $history.innerHTML = `<div class="empty-inline">No past reviews yet.</div>`;
    return;
  }
  $history.innerHTML = past.map(r => `
    <article class="card" data-id="${r.id}">
      <div class="card-header">
        <div class="card-title">${escapeHtml(fmtWeek(r.week_start))}</div>
        <button class="btn btn-ghost btn-sm" data-act="del" data-id="${r.id}" style="color:#b91c1c;border-color:#fca5a5;">Delete</button>
      </div>
      ${r.wins ? `<p style="font-size:13px;margin-top:6px;"><strong style="color:var(--navy);">✅ Wins:</strong><br>${nl2br(r.wins)}</p>` : ""}
      ${r.stuck ? `<p style="font-size:13px;margin-top:6px;"><strong style="color:var(--navy);">⚠️ Stuck:</strong><br>${nl2br(r.stuck)}</p>` : ""}
      ${r.top3 ? `<p style="font-size:13px;margin-top:6px;"><strong style="color:var(--navy);">🎯 Top 3:</strong><br>${nl2br(r.top3)}</p>` : ""}
    </article>`).join("");
}

async function load() {
  $status.style.display = "block";
  const { data, error } = await window.sb.from("reviews").select("*").order("week_start", { ascending: false });
  $status.style.display = "none";
  if (error) {
    $history.innerHTML = `<div class="banner banner-warn">Couldn't load reviews: ${escapeHtml(error.message)}. Have you run the latest schema.sql in Supabase?</div>`;
    return;
  }
  reviews = data || [];
  const thisWeek = mondayOf(new Date());
  prefillForWeek(thisWeek);
  renderHistory(thisWeek);
}

$form.addEventListener("submit", saveReview);
$week.addEventListener("change", () => prefillForWeek($week.value || mondayOf(new Date())));
$history.addEventListener("click", (e) => {
  const t = e.target.closest('[data-act="del"]');
  if (t) deleteReview(t.dataset.id);
});

(async () => {
  const session = await window.acAuth.requireAuth();
  if (!session) return;
  window.acAuth.paintNav(session);
  document.body.style.visibility = "visible";
  load();
})();
