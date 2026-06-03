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
const $newBtn = document.getElementById("btn-new-entry");
const $formWrap = document.getElementById("entry-form-wrap");
const $cancelBtn = document.getElementById("btn-cancel-entry");

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

// Show the entry form (for a given day), hide the "Add" button.
function openForm(day) {
  selectedDay = day;
  prefillForDay(day);
  $formWrap.hidden = false;
  if ($newBtn) $newBtn.hidden = true;
  $formWrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// Hide the form, show the "Add" button again.
function closeForm() {
  $formWrap.hidden = true;
  $saved.textContent = "";
  if ($newBtn) $newBtn.hidden = false;
}

// "Add today's entry" vs "Edit today's entry" depending on whether today is logged.
function refreshNewBtn() {
  if (!$newBtn) return;
  const hasToday = logs.some(r => r.log_date === todayStr());
  $newBtn.textContent = hasToday ? "✎ Edit today's entry" : "🌸 Add today's entry";
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
    await load();
    $saved.textContent = "Saved ✓";
    setTimeout(() => { closeForm(); }, 1100);
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

async function renderHistory() {
  const past = logs.slice();  // all entries, newest first (today included)
  if (!past.length) {
    $history.innerHTML = `<div class="empty-inline">No entries yet — add today's above. 🌷</div>`;
    return;
  }

  // Batch-fetch signed URLs for every photo across all entries.
  const allPaths = [...new Set(past.flatMap(pathsOf))];
  const urlByPath = {};
  if (allPaths.length) {
    const { data } = await window.sb.storage.from("photos").createSignedUrls(allPaths, 3600);
    (data || []).forEach(s => { if (s.signedUrl && !s.error) urlByPath[s.path] = s.signedUrl; });
  }

  $history.innerHTML = past.map(r => {
    const photos = pathsOf(r);
    const n = photos.length;
    const gallery = n ? `<div class="log-gallery">${photos.map(p =>
      `<a href="${urlByPath[p] || "#"}" target="_blank" rel="noopener"><img src="${urlByPath[p] || ""}" alt="photo" loading="lazy" /></a>`
    ).join("")}</div>` : "";
    const hasBody = r.looking_forward || r.reflection || n;
    const isToday = r.log_date === todayStr();
    return `
    <article class="log-entry${isToday ? " is-today" : ""}" data-id="${r.id}">
      <button type="button" class="log-entry-head" data-act="toggle">
        <span class="log-entry-date">🌷 ${escapeHtml(fmtDay(r.log_date))}${isToday ? `<span class="today-badge">Today</span>` : ""}</span>
        <span class="log-entry-meta">${n ? "📷 " + (n > 1 ? "×" + n : "1") : ""}<span class="chev">▾</span></span>
      </button>
      <div class="log-entry-wins">
        ${r.wins
          ? `<strong>🌸 Wins</strong><br>${nl2br(r.wins)}`
          : `<span class="muted">No wins noted — tap to view</span>`}
      </div>
      ${hasBody ? `<div class="log-entry-body" hidden>
        ${r.looking_forward ? `<div class="log-block"><strong>☀️ Looking forward:</strong><br>${nl2br(r.looking_forward)}</div>` : ""}
        ${r.reflection ? `<div class="log-block"><strong>🐌 Hard thing:</strong><br>${nl2br(r.reflection)}</div>` : ""}
        ${gallery}
        <div class="log-entry-actions">
          <button class="btn btn-ghost btn-sm" data-act="edit" data-date="${escapeAttr(r.log_date)}">Open to edit</button>
          <button class="btn btn-ghost btn-sm" data-act="del" data-id="${r.id}" style="color:#b91c1c;border-color:#fca5a5;">Delete</button>
        </div>
      </div>` : ""}
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
  refreshNewBtn();
  await renderHistory();
}

$form.addEventListener("submit", saveLog);
$date.addEventListener("change", () => { selectedDay = $date.value || todayStr(); prefillForDay(selectedDay); });
if ($newBtn) $newBtn.addEventListener("click", () => openForm(todayStr()));
if ($cancelBtn) $cancelBtn.addEventListener("click", () => closeForm());
$thumbs.addEventListener("click", (e) => {
  const rm = e.target.closest("[data-rm]");
  if (rm) removeKept(rm.dataset.rm);
});
$history.addEventListener("click", (e) => {
  const del = e.target.closest('[data-act="del"]');
  if (del) { deleteLog(del.dataset.id); return; }
  const edit = e.target.closest('[data-act="edit"]');
  if (edit) { openForm(edit.dataset.date); return; }
  const toggle = e.target.closest('[data-act="toggle"]');
  if (toggle) {
    const entry = toggle.closest(".log-entry");
    const body = entry.querySelector(".log-entry-body");
    entry.classList.toggle("open");
    if (body) body.hidden = !entry.classList.contains("open");
  }
});

(async () => {
  const session = await window.acAuth.requireAuth();
  if (!session) return;
  window.acAuth.paintNav(session);
  document.body.style.visibility = "visible";
  await load();
  // If we arrived from the Home collage with ?date=, open that day to edit.
  const dateParam = new URLSearchParams(location.search).get("date");
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) openForm(dateParam);
})();
