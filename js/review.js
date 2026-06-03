// =============================================================
// Daily Log page
// One entry per day: 🌸 three wins, ☀️ looking forward to tomorrow,
// 🐌 one hard/slow thing. Form edits today; past days list below.
// Table: daily_logs.
// =============================================================

const $form = document.getElementById("log-form");
const $id = document.getElementById("log-id");
const $date = document.getElementById("log-date");
const $dayLabel = document.getElementById("log-day-label");
const $wins = document.getElementById("log-wins");
const $forward = document.getElementById("log-forward");
const $hard = document.getElementById("log-hard");
const $saved = document.getElementById("log-saved");
const $history = document.getElementById("log-history");
const $status = document.getElementById("log-status");

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function nl2br(s) { return escapeHtml(s).replace(/\n/g, "<br>"); }

function todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function fmtDay(s) {
  if (!s) return "";
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? s : d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" });
}

let logs = [];

function prefillForDay(day) {
  const existing = logs.find(r => r.log_date === day);
  $id.value = existing ? existing.id : "";
  $date.value = day;
  $wins.value = existing ? (existing.wins || "") : "";
  $forward.value = existing ? (existing.looking_forward || "") : "";
  $hard.value = existing ? (existing.reflection || "") : "";
  $dayLabel.textContent = (day === todayStr() ? "Today · " : "") + fmtDay(day) + (existing ? " (editing)" : "");
}

async function saveLog(e) {
  e.preventDefault();
  const payload = {
    log_date: $date.value || todayStr(),
    wins: $wins.value.trim() || null,
    looking_forward: $forward.value.trim() || null,
    reflection: $hard.value.trim() || null
  };
  const id = $id.value;
  const res = id
    ? await window.sb.from("daily_logs").update(payload).eq("id", id)
    : await window.sb.from("daily_logs").insert(payload);
  if (res.error) { acShowError(res.error.message); return; }
  $saved.textContent = "Saved ✓";
  setTimeout(() => { $saved.textContent = ""; }, 1500);
  load();
}

async function deleteLog(id) {
  if (!confirm("Delete this day's log?")) return;
  const { error } = await window.sb.from("daily_logs").delete().eq("id", id);
  if (error) { acShowError(error.message); return; }
  load();
}

function renderHistory(currentDay) {
  const past = logs.filter(r => r.log_date !== currentDay);
  if (!past.length) {
    $history.innerHTML = `<div class="empty-inline">No past entries yet.</div>`;
    return;
  }
  $history.innerHTML = past.map(r => `
    <article class="card" data-id="${r.id}">
      <div class="card-header">
        <div class="card-title">${escapeHtml(fmtDay(r.log_date))}</div>
        <button class="btn btn-ghost btn-sm" data-act="del" data-id="${r.id}" style="color:#b91c1c;border-color:#fca5a5;">Delete</button>
      </div>
      ${r.wins ? `<p style="font-size:13px;margin-top:6px;"><strong style="color:var(--navy);">🌸 Wins:</strong><br>${nl2br(r.wins)}</p>` : ""}
      ${r.looking_forward ? `<p style="font-size:13px;margin-top:6px;"><strong style="color:var(--navy);">☀️ Looking forward:</strong><br>${nl2br(r.looking_forward)}</p>` : ""}
      ${r.reflection ? `<p style="font-size:13px;margin-top:6px;"><strong style="color:var(--navy);">🐌 Hard thing:</strong><br>${nl2br(r.reflection)}</p>` : ""}
    </article>`).join("");
}

async function load() {
  $status.style.display = "block";
  const { data, error } = await window.sb.from("daily_logs").select("*").order("log_date", { ascending: false });
  $status.style.display = "none";
  if (error) {
    $history.innerHTML = `<div class="banner banner-warn">Couldn't load daily logs: ${escapeHtml(error.message)}. Have you run the latest schema.sql (the daily_logs table) in Supabase?</div>`;
    return;
  }
  logs = data || [];
  const today = todayStr();
  prefillForDay(today);
  renderHistory(today);
}

$form.addEventListener("submit", saveLog);
$date.addEventListener("change", () => prefillForDay($date.value || todayStr()));
$history.addEventListener("click", (e) => {
  const t = e.target.closest('[data-act="del"]');
  if (t) deleteLog(t.dataset.id);
});

(async () => {
  const session = await window.acAuth.requireAuth();
  if (!session) return;
  window.acAuth.paintNav(session);
  document.body.style.visibility = "visible";
  load();
})();
