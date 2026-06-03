// =============================================================
// Daily Log page
// One entry per day: 📷 up to 3 photos, 🌸 three wins, ☀️ looking
// forward, 🐌 one hard/slow thing. The form edits one day (today by
// default, or ?date=YYYY-MM-DD from the Home collage). Photos go to
// the `photos` bucket; paths stored in daily_logs.photo_paths[].
// =============================================================

const $form = document.getElementById("log-form");
const $id = document.getElementById("log-id");
const $date = document.getElementById("log-date");
const $dayLabel = document.getElementById("log-day-label");
const $wins = document.getElementById("log-wins");
const $forward = document.getElementById("log-forward");
const $hard = document.getElementById("log-hard");
const $photo = document.getElementById("log-photo");
const $thumbs = document.getElementById("log-photo-current");
const $saved = document.getElementById("log-saved");
const $history = document.getElementById("log-history");
const $status = document.getElementById("log-status");

const MAX_PHOTOS = 3;

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(s) { return escapeHtml(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
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
// back-compat: entries may have legacy single photo_path
function pathsOf(entry) {
  if (!entry) return [];
  if (entry.photo_paths && entry.photo_paths.length) return entry.photo_paths.slice();
  return entry.photo_path ? [entry.photo_path] : [];
}

let logs = [];
let selectedDay = qsDate();
let keptPhotos = [];  // existing photo paths to keep for the edited day

async function renderThumbs() {
  if (!keptPhotos.length) {
    $thumbs.innerHTML = `<span style="font-size:12px;color:var(--muted);">No photos yet — add up to ${MAX_PHOTOS}.</span>`;
    return;
  }
  const { data } = await window.sb.storage.from("photos").createSignedUrls(keptPhotos, 3600);
  const urlByPath = {};
  (data || []).forEach(s => { if (s.signedUrl && !s.error) urlByPath[s.path] = s.signedUrl; });
  $thumbs.innerHTML = keptPhotos.map(p => `
    <span class="photo-thumb">
      <img src="${urlByPath[p] || ""}" alt="photo" />
      <button type="button" class="thumb-x" data-rm="${escapeAttr(p)}" title="Remove">×</button>
    </span>`).join("") +
    `<div style="font-size:12px;color:var(--muted);margin-top:4px;">${keptPhotos.length}/${MAX_PHOTOS}${keptPhotos.length >= MAX_PHOTOS ? " — remove one to add another" : ""}</div>`;
}

function prefillForDay(day) {
  const existing = logs.find(r => r.log_date === day);
  $id.value = existing ? existing.id : "";
  $date.value = day;
  $wins.value = existing ? (existing.wins || "") : "";
  $forward.value = existing ? (existing.looking_forward || "") : "";
  $hard.value = existing ? (existing.reflection || "") : "";
  $photo.value = "";
  keptPhotos = pathsOf(existing);
  renderThumbs();
  $dayLabel.textContent = (day === todayStr() ? "Today · " : "") + fmtDay(day) + (existing ? " (editing)" : " (new)");
}

async function uploadPhoto(file, day) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${day}_${Date.now()}_${Math.round(Math.random() * 1e6)}.${ext}`;
  const { error } = await window.sb.storage.from("photos").upload(path, file, { upsert: true });
  if (error) throw new Error("Photo upload failed: " + error.message);
  return path;
}

async function removeKept(path) {
  keptPhotos = keptPhotos.filter(p => p !== path);
  // best-effort delete from storage (orphan cleanup)
  window.sb.storage.from("photos").remove([path]);
  renderThumbs();
}

async function saveLog(e) {
  e.preventDefault();
  const btn = $form.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = "Saving…";
  try {
    const day = $date.value || todayStr();
    const room = MAX_PHOTOS - keptPhotos.length;
    const files = Array.from($photo.files);
    if (files.length > room) acShowError(`Only ${MAX_PHOTOS} photos per day — keeping the first ${Math.max(0, room)} new one(s).`);
    const toUpload = files.slice(0, Math.max(0, room));
    const uploaded = [];
    for (const f of toUpload) uploaded.push(await uploadPhoto(f, day));

    const payload = {
      log_date: day,
      wins: $wins.value.trim() || null,
      looking_forward: $forward.value.trim() || null,
      reflection: $hard.value.trim() || null,
      photo_paths: [...keptPhotos, ...uploaded]
    };

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
  $history.innerHTML = past.map(r => {
    const n = pathsOf(r).length;
    return `
    <article class="card" data-id="${r.id}">
      <div class="card-header">
        <div class="card-title">${escapeHtml(fmtDay(r.log_date))}${n ? " 📷" + (n > 1 ? "×" + n : "") : ""}</div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-ghost btn-sm" data-act="edit" data-date="${escapeAttr(r.log_date)}">Open</button>
          <button class="btn btn-ghost btn-sm" data-act="del" data-id="${r.id}" style="color:#b91c1c;border-color:#fca5a5;">Delete</button>
        </div>
      </div>
      ${r.wins ? `<p style="font-size:13px;margin-top:6px;"><strong style="color:var(--navy);">🌸 Wins:</strong><br>${nl2br(r.wins)}</p>` : ""}
      ${r.looking_forward ? `<p style="font-size:13px;margin-top:6px;"><strong style="color:var(--navy);">☀️ Looking forward:</strong><br>${nl2br(r.looking_forward)}</p>` : ""}
      ${r.reflection ? `<p style="font-size:13px;margin-top:6px;"><strong style="color:var(--navy);">🐌 Hard thing:</strong><br>${nl2br(r.reflection)}</p>` : ""}
    </article>`;
  }).join("");
}

async function load() {
  $status.style.display = "block";
  const { data, error } = await window.sb.from("daily_logs").select("*").order("log_date", { ascending: false });
  $status.style.display = "none";
  if (error) {
    $history.innerHTML = `<div class="banner banner-warn">Couldn't load daily logs: ${escapeHtml(error.message)}. Have you run the latest schema.sql (daily_logs with photo_paths) in Supabase?</div>`;
    return;
  }
  logs = data || [];
  prefillForDay(selectedDay);
  renderHistory(selectedDay);
}

$form.addEventListener("submit", saveLog);
$date.addEventListener("change", () => { selectedDay = $date.value || todayStr(); prefillForDay(selectedDay); renderHistory(selectedDay); });
$thumbs.addEventListener("click", (e) => {
  const rm = e.target.closest("[data-rm]");
  if (rm) removeKept(rm.dataset.rm);
});
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
