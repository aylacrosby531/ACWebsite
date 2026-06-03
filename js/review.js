// =============================================================
// Daily Log page
// One entry per day: 📷 photo, 🌸 three wins, ☀️ looking forward,
// 🐌 one hard/slow thing. The form edits one day (today by default,
// or ?date=YYYY-MM-DD when opened from the Home collage). Past days
// list below. Photo goes to the `photos` bucket + daily_logs.photo_path.
// =============================================================

const $form = document.getElementById("log-form");
const $id = document.getElementById("log-id");
const $date = document.getElementById("log-date");
const $dayLabel = document.getElementById("log-day-label");
const $wins = document.getElementById("log-wins");
const $forward = document.getElementById("log-forward");
const $hard = document.getElementById("log-hard");
const $photo = document.getElementById("log-photo");
const $photoCurrent = document.getElementById("log-photo-current");
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
function qsDate() {
  const m = new URLSearchParams(location.search).get("date");
  return m && /^\d{4}-\d{2}-\d{2}$/.test(m) ? m : todayStr();
}

let logs = [];
let selectedDay = qsDate();

async function showThumb(path) {
  $photoCurrent.innerHTML = "";
  if (!path) return;
  const { data } = await window.sb.storage.from("photos").createSignedUrl(path, 3600);
  if (data && data.signedUrl) {
    $photoCurrent.innerHTML = `<img src="${data.signedUrl}" alt="photo" style="max-width:160px;border-radius:8px;border:1px solid var(--border);" /> <span style="font-size:12px;color:var(--muted);">current — choose a file to replace</span>`;
  }
}

function prefillForDay(day) {
  const existing = logs.find(r => r.log_date === day);
  $id.value = existing ? existing.id : "";
  $date.value = day;
  $wins.value = existing ? (existing.wins || "") : "";
  $forward.value = existing ? (existing.looking_forward || "") : "";
  $hard.value = existing ? (existing.reflection || "") : "";
  $photo.value = "";
  showThumb(existing ? existing.photo_path : null);
  $dayLabel.textContent = (day === todayStr() ? "Today · " : "") + fmtDay(day) + (existing ? " (editing)" : " (new)");
}

async function uploadPhoto(file, day) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${day}_${Date.now()}.${ext}`;
  const { error } = await window.sb.storage.from("photos").upload(path, file, { upsert: true });
  if (error) throw new Error("Photo upload failed: " + error.message);
  return path;
}

async function saveLog(e) {
  e.preventDefault();
  const btn = $form.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = "Saving…";
  try {
    const day = $date.value || todayStr();
    const payload = {
      log_date: day,
      wins: $wins.value.trim() || null,
      looking_forward: $forward.value.trim() || null,
      reflection: $hard.value.trim() || null
    };
    if ($photo.files[0]) payload.photo_path = await uploadPhoto($photo.files[0], day);

    const id = $id.value;
    const res = id
      ? await window.sb.from("daily_logs").update(payload).eq("id", id)
      : await window.sb.from("daily_logs").insert(payload);
    if (res.error) throw new Error(res.error.message);

    selectedDay = day;
    $saved.textContent = "Saved ✓ — " + (day === todayStr() ? "today's entry" : fmtDay(day));
    setTimeout(() => { $saved.textContent = ""; }, 2500);
    await load();
  } catch (err) {
    acShowError(err.message || "Save failed");
  } finally {
    btn.disabled = false; btn.textContent = "Save";
  }
}

async function deleteLog(id) {
  if (!confirm("Delete this day's log?")) return;
  const { error } = await window.sb.from("daily_logs").delete().eq("id", id);
  if (error) { acShowError(error.message); return; }
  await load();
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
        <div class="card-title">${escapeHtml(fmtDay(r.log_date))}${r.photo_path ? " 📷" : ""}</div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-ghost btn-sm" data-act="edit" data-date="${escapeHtml(r.log_date)}">Open</button>
          <button class="btn btn-ghost btn-sm" data-act="del" data-id="${r.id}" style="color:#b91c1c;border-color:#fca5a5;">Delete</button>
        </div>
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
    $history.innerHTML = `<div class="banner banner-warn">Couldn't load daily logs: ${escapeHtml(error.message)}. Have you run the latest schema.sql (daily_logs with photo_path) in Supabase?</div>`;
    return;
  }
  logs = data || [];
  prefillForDay(selectedDay);
  renderHistory(selectedDay);
}

$form.addEventListener("submit", saveLog);
$date.addEventListener("change", () => { selectedDay = $date.value || todayStr(); prefillForDay(selectedDay); renderHistory(selectedDay); });
$history.addEventListener("click", (e) => {
  const del = e.target.closest('[data-act="del"]');
  if (del) { deleteLog(del.dataset.id); return; }
  const edit = e.target.closest('[data-act="edit"]');
  if (edit) {
    selectedDay = edit.dataset.date;
    prefillForDay(selectedDay);
    renderHistory(selectedDay);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

(async () => {
  const session = await window.acAuth.requireAuth();
  if (!session) return;
  window.acAuth.paintNav(session);
  document.body.style.visibility = "visible";
  load();
})();
