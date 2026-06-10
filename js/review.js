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
const $missedBtn = document.getElementById("btn-missed-entry");
const $formWrap = document.getElementById("entry-form-wrap");
const $cancelBtn = document.getElementById("btn-cancel-entry");

const MAX_PHOTOS = 3;

// A little seed-to-flower bloom, shown on the Save button when an entry saves.
// Same hand-drawn flower as the Recovery garden; the CSS animates it open.
const SAVE_BLOOM_SVG = `
<svg class="bloom-svg" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path class="bs-stem" d="M16 37 C 14.5 28, 17.5 22, 16 14" stroke="#6aa86b" stroke-width="2.4" stroke-linecap="round"/>
  <path class="bs-leaf bs-leaf-l" d="M16 27 C 10 26, 7 22, 6 18 C 11 19, 14 22, 16 27 Z" fill="#74b06f"/>
  <path class="bs-leaf bs-leaf-r" d="M16 23 C 22 22, 25 19, 26 15 C 21 16, 18 18, 16 23 Z" fill="#5f9e63"/>
  <g transform="translate(16 11)"><g class="bs-bloom">
    <g transform="rotate(0)"><ellipse cy="-4.6" rx="2.7" ry="4.6" fill="#ef7fa6"/></g>
    <g transform="rotate(60)"><ellipse cy="-4.6" rx="2.7" ry="4.6" fill="#f08fb0"/></g>
    <g transform="rotate(120)"><ellipse cy="-4.6" rx="2.7" ry="4.6" fill="#f4a6c0"/></g>
    <g transform="rotate(180)"><ellipse cy="-4.6" rx="2.7" ry="4.6" fill="#ef7fa6"/></g>
    <g transform="rotate(240)"><ellipse cy="-4.6" rx="2.7" ry="4.6" fill="#f08fb0"/></g>
    <g transform="rotate(300)"><ellipse cy="-4.6" rx="2.7" ry="4.6" fill="#f4a6c0"/></g>
    <circle r="2.6" fill="#f4c64f"/>
  </g></g>
</svg>`;

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
function ymd(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return ymd(d);
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
let keptPhotos = [];   // existing photo paths to keep for the edited day
let pendingURLs = [];  // object URLs for just-picked (unsaved) photos, tracked so we can free them

// Build instant previews for photos the user just picked (before they're uploaded).
// On a phone this is what makes the photo show the moment you choose it.
function renderPendingPreviews() {
  pendingURLs.forEach(u => URL.revokeObjectURL(u));
  pendingURLs = [];
  const files = Array.from($photo.files || []);
  return files.map(f => {
    const u = URL.createObjectURL(f);
    pendingURLs.push(u);
    return `<span class="photo-thumb photo-thumb-new">
      <img src="${u}" alt="new photo" />
      <span class="thumb-badge">new</span>
    </span>`;
  }).join("");
}

async function renderThumbs() {
  const pendingCount = ($photo.files || []).length;
  let keptHtml = "";
  if (keptPhotos.length) {
    const { data } = await window.sb.storage.from("photos").createSignedUrls(keptPhotos, 3600);
    const urlByPath = {};
    (data || []).forEach(s => { if (s.signedUrl && !s.error) urlByPath[s.path] = s.signedUrl; });
    keptHtml = keptPhotos.map(p => `
      <span class="photo-thumb">
        <img src="${urlByPath[p] || ""}" alt="photo" />
        <button type="button" class="thumb-x" data-rm="${escapeAttr(p)}" title="Remove">×</button>
      </span>`).join("");
  }
  const pendingHtml = renderPendingPreviews();
  const total = keptPhotos.length + pendingCount;
  if (!total) {
    $thumbs.innerHTML = `<span style="font-size:12px;color:var(--muted);">No photos yet — add up to ${MAX_PHOTOS}.</span>`;
    return;
  }
  const note = `<div style="font-size:12px;color:var(--muted);margin-top:4px;">${total}/${MAX_PHOTOS}` +
    `${pendingCount ? " — new photos save with this entry" : ""}` +
    `${total >= MAX_PHOTOS ? " — that's the max" : ""}</div>`;
  $thumbs.innerHTML = keptHtml + pendingHtml + note;
}

// ----- Auto-save drafts (so closing the page never loses what you typed) -----
const DRAFT_PREFIX = "ac_log_draft_";
function draftKey(day) { return DRAFT_PREFIX + day; }
function saveDraft() {
  if ($formWrap.hidden) return;           // only while the form is actually open
  const day = $date.value || todayStr();
  const draft = { wins: $wins.value, forward: $forward.value, hard: $hard.value };
  const empty = !draft.wins.trim() && !draft.forward.trim() && !draft.hard.trim();
  try {
    if (empty) localStorage.removeItem(draftKey(day));
    else localStorage.setItem(draftKey(day), JSON.stringify(draft));
  } catch (_) {}
}
function loadDraft(day) {
  try { return JSON.parse(localStorage.getItem(draftKey(day)) || "null"); } catch (_) { return null; }
}
function clearDraft(day) { try { localStorage.removeItem(draftKey(day)); } catch (_) {} }

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

  // If there's an unsaved draft for this day, restore it over the saved values.
  const draft = loadDraft(day);
  if (draft) {
    $wins.value = draft.wins || "";
    $forward.value = draft.forward || "";
    $hard.value = draft.hard || "";
    $saved.textContent = "Restored your unsaved notes ✓";
    setTimeout(() => { if ($saved.textContent.startsWith("Restored")) $saved.textContent = ""; }, 2800);
  }
}

// Show the entry form (for a given day), hide the "Add" button.
function openForm(day) {
  selectedDay = day;
  $date.max = todayStr();   // can't log a day that hasn't happened yet
  prefillForDay(day);
  $formWrap.hidden = false;
  if ($newBtn) $newBtn.hidden = true;
  if ($missedBtn) $missedBtn.hidden = true;
  $formWrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// Hide the form, show the "Add" button again.
function closeForm() {
  $formWrap.hidden = true;
  $saved.textContent = "";
  if ($newBtn) $newBtn.hidden = false;
  if ($missedBtn) $missedBtn.hidden = false;
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

function removeKept(path) {
  keptPhotos = keptPhotos.filter(p => p !== path);
  // best-effort delete from storage (orphan cleanup)
  window.sb.storage.from("photos").remove([path]);
  renderThumbs();
}

async function saveLog(e) {
  e.preventDefault();
  const btn = $form.querySelector('button[type="submit"]');
  let ok = false;
  btn.disabled = true; btn.textContent = "Saving…";
  btn.classList.remove("is-saved");
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
    clearDraft(day);   // saved for real now — drop the local draft
    await load();
    ok = true;
    // Cute confirmation: a flower blooms right on the button.
    btn.innerHTML = SAVE_BLOOM_SVG + "<span>Saved!</span>";
    btn.classList.add("is-saved");
    $saved.textContent = "Your entry is saved 🌸";
    setTimeout(() => { closeForm(); btn.classList.remove("is-saved"); btn.textContent = "Save"; }, 2000);
  } catch (err) {
    acShowError(err.message || "Save failed");
  } finally {
    // On success the button keeps its "Saved ✓" state (reset by the timeout above);
    // only restore it right away if the save failed.
    btn.disabled = false;
    if (!ok) btn.textContent = "Save";
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
    const photoStrip = n ? `<div class="log-preview-photos">${photos.map(p =>
      `<img class="log-thumb" src="${urlByPath[p] || ""}" data-full="${escapeAttr(urlByPath[p] || "")}" data-act="photo" alt="photo" loading="lazy" />`
    ).join("")}</div>` : "";
    const isToday = r.log_date === todayStr();
    return `
    <article class="log-entry${isToday ? " is-today" : ""}" data-id="${r.id}">
      <div class="log-entry-top" data-act="toggle">
        <div class="log-entry-main">
          <div class="log-entry-date">🌷 ${escapeHtml(fmtDay(r.log_date))}${isToday ? `<span class="today-badge">Today</span>` : ""}</div>
          <div class="log-preview-text">
            ${r.wins
              ? `<strong>🌸 Wins</strong><br>${nl2br(r.wins)}`
              : `<span class="muted">No wins noted — tap to open</span>`}
          </div>
        </div>
        ${photoStrip}
      </div>
      <div class="log-entry-body" hidden>
        ${r.looking_forward ? `<div class="log-block"><strong>☀️ Looking forward:</strong><br>${nl2br(r.looking_forward)}</div>` : ""}
        ${r.reflection ? `<div class="log-block"><strong>🐌 Hard thing:</strong><br>${nl2br(r.reflection)}</div>` : ""}
        <div class="log-entry-actions">
          <button class="btn btn-ghost btn-sm" data-act="edit" data-date="${escapeAttr(r.log_date)}">Open to edit</button>
          <button class="btn btn-ghost btn-sm" data-act="del" data-id="${r.id}" style="color:#b91c1c;border-color:#fca5a5;">Delete</button>
        </div>
      </div>
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

// ----- Photo lightbox (popup) -----
const $lightbox = document.getElementById("lightbox");
const $lightboxImg = document.getElementById("lightbox-img");
function openLightbox(url) {
  if (!url || !$lightbox) return;
  $lightboxImg.src = url;
  $lightbox.hidden = false;
}
function closeLightbox() {
  if (!$lightbox) return;
  $lightbox.hidden = true;
  $lightboxImg.src = "";
}
if ($lightbox) {
  $lightbox.addEventListener("click", (e) => {
    if (e.target === $lightbox || e.target.closest("[data-close]")) closeLightbox();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });
}

// Open a past day in the read-only list: expand it and scroll it into view.
// Used when you tap a photo on the Home collage — it lands you on that day's
// entry to *read*, not on the edit form.
function expandDayInHistory(day) {
  const r = logs.find(x => x.log_date === day);
  if (!r) return;
  const entry = $history.querySelector(`.log-entry[data-id="${r.id}"]`);
  if (!entry) return;
  entry.classList.add("open");
  const body = entry.querySelector(".log-entry-body");
  if (body) body.hidden = false;
  entry.scrollIntoView({ behavior: "smooth", block: "center" });
  entry.classList.add("flash");
  setTimeout(() => entry.classList.remove("flash"), 1800);
}

$form.addEventListener("submit", saveLog);
$date.addEventListener("change", () => { selectedDay = $date.value || todayStr(); prefillForDay(selectedDay); });
$photo.addEventListener("change", renderThumbs);             // instant preview of just-picked photos
[$wins, $forward, $hard].forEach(el => el.addEventListener("input", saveDraft));  // auto-save as you type
if ($newBtn) $newBtn.addEventListener("click", () => openForm(todayStr()));
// "Add a missed day" — opens the form on yesterday; she can pick any past date.
if ($missedBtn) $missedBtn.addEventListener("click", () => {
  openForm(yesterdayStr());
  $saved.textContent = "Pick the day you're logging ⤴";
  setTimeout(() => { if ($saved.textContent.startsWith("Pick the day")) $saved.textContent = ""; }, 3000);
  try { $date.focus(); if ($date.showPicker) $date.showPicker(); } catch (_) {}
});
if ($cancelBtn) $cancelBtn.addEventListener("click", () => { clearDraft($date.value || todayStr()); closeForm(); });
$thumbs.addEventListener("click", (e) => {
  const rm = e.target.closest("[data-rm]");
  if (rm) removeKept(rm.dataset.rm);
});
$history.addEventListener("click", (e) => {
  const del = e.target.closest('[data-act="del"]');
  if (del) { deleteLog(del.dataset.id); return; }
  const edit = e.target.closest('[data-act="edit"]');
  if (edit) { openForm(edit.dataset.date); return; }
  // Clicking a photo opens the lightbox — don't toggle the entry.
  const photo = e.target.closest('[data-act="photo"]');
  if (photo) { openLightbox(photo.dataset.full); return; }
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
  // If we arrived from the Home collage with ?date=, open that day in the
  // read-only list (expanded + scrolled to) — not the edit form.
  const dateParam = new URLSearchParams(location.search).get("date");
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) expandDayInHistory(dateParam);
})();
