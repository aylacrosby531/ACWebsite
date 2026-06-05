// =============================================================
// Home — "Good Days" collage.
// One photo per daily-log entry, scattered scrapbook-style (random
// size + rotation + slight overlap). Hover shows that day's wins;
// click opens the full entry (review.html?date=YYYY-MM-DD).
// Photos live in the `photos` storage bucket; metadata in daily_logs.
// =============================================================

const $collage = document.getElementById("collage");
const $status = document.getElementById("collage-status");

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function nl2br(s) { return escapeHtml(s).replace(/\n/g, "<br>"); }

// stable pseudo-random per photo so the layout doesn't jump each load
function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rnd(seed) {
  let t = (seed + 0x6D2B79F5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function fmtDay(s) {
  if (!s) return "";
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? s : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// an entry may have up to 3 photos (legacy single photo_path supported)
function pathsOf(entry) {
  if (entry.photo_paths && entry.photo_paths.length) return entry.photo_paths;
  return entry.photo_path ? [entry.photo_path] : [];
}

function render(items, urlByPath) {
  const shown = items.filter(it => urlByPath[it.path]);
  if (!shown.length) {
    $collage.innerHTML = `
      <div class="empty-state">
        <h3>No good days yet 🌸</h3>
        <p>Add photos with today's entry on the <a href="review.html">Daily Log</a> and they'll show up here.</p>
      </div>`;
    return;
  }

  $collage.innerHTML = shown.map(it => {
    const e = it.entry;
    const seed = hashStr(it.path);
    const w = Math.round(150 + rnd(seed) * 90);            // 150–240px
    const h = Math.round(w * (0.82 + rnd(seed + 7) * 0.5)); // varied aspect
    // fan the angles within a day's group so each photo tilts differently
    const baseRot = rnd(seed + 2) * 8 - 4;                  // -4°…+4° jitter
    const fan = (it.gi - (it.count - 1) / 2) * 5;           // spread around the group's center
    const rot = (baseRot + fan).toFixed(1);
    const my = Math.round(rnd(seed + 4) * 10) + 8;
    let margin, z;
    if (it.gi === 0) {                                       // first photo of the day
      const mx = Math.round(rnd(seed + 3) * 16 - 4);
      margin = `${my}px ${mx}px`;
      z = 1;
    } else {                                                 // later photos sit just beside the previous one
      const overlap = -Math.round(8 + rnd(seed + 5) * 8);    // gentle tuck (~8–16px), not a big stack
      const mr = Math.round(rnd(seed + 3) * 8 - 2);
      margin = `${my}px ${mr}px ${my}px ${overlap}px`;
      z = 1 + it.gi;
    }
    const wins = (e.wins || "").trim();
    const bubble = wins
      ? `<span class="collage-bubble"><strong>🌸 ${escapeHtml(fmtDay(e.log_date))}</strong><br>${nl2br(wins)}</span>`
      : `<span class="collage-bubble"><strong>🌸 ${escapeHtml(fmtDay(e.log_date))}</strong></span>`;
    return `
      <a class="collage-item" href="review.html?date=${encodeURIComponent(e.log_date)}"
         style="width:${w}px;height:${h}px;transform:rotate(${rot}deg);margin:${margin};z-index:${z};">
        <img src="${urlByPath[it.path]}" alt="${escapeHtml(fmtDay(e.log_date))}" loading="lazy" />
        ${bubble}
      </a>`;
  }).join("");
}

// On touch screens (no hover): first tap a photo to reveal its bubble,
// then tap the bubble to open that day's log. Desktop keeps hover + click.
const isTouch = window.matchMedia("(hover: none)").matches;
if (isTouch) {
  $collage.addEventListener("click", e => {
    const item = e.target.closest(".collage-item");
    if (!item) return;
    // a tap on the open bubble follows the link as normal
    if (e.target.closest(".collage-bubble")) return;
    // a tap on the photo just reveals its bubble (first time)
    if (!item.classList.contains("show-bubble")) {
      e.preventDefault();
      $collage.querySelectorAll(".collage-item.show-bubble").forEach(el => el.classList.remove("show-bubble"));
      item.classList.add("show-bubble");
    }
  });
  // tapping anywhere else closes the open bubble
  document.addEventListener("click", e => {
    if (!e.target.closest(".collage-item")) {
      $collage.querySelectorAll(".collage-item.show-bubble").forEach(el => el.classList.remove("show-bubble"));
    }
  });
}

async function load() {
  $status.style.display = "block";
  const { data, error } = await window.sb
    .from("daily_logs")
    .select("id, log_date, wins, photo_paths, photo_path")
    .order("log_date", { ascending: false });
  if (error) {
    $status.style.display = "none";
    $collage.innerHTML = `<div class="banner banner-warn">Couldn't load photos: ${escapeHtml(error.message)}. Have you run the latest schema.sql + created the <code>photos</code> bucket?</div>`;
    return;
  }
  // flatten to one collage item per photo, tracking position within each day
  const items = [];
  (data || []).forEach(e => { const ps = pathsOf(e); ps.forEach((path, gi) => items.push({ entry: e, path, gi, count: ps.length })); });
  const paths = items.map(it => it.path);
  let urlByPath = {};
  if (paths.length) {
    const { data: signed, error: sErr } = await window.sb.storage.from("photos").createSignedUrls(paths, 3600);
    if (sErr) {
      $status.style.display = "none";
      $collage.innerHTML = `<div class="banner banner-warn">Couldn't open photos: ${escapeHtml(sErr.message)}</div>`;
      return;
    }
    (signed || []).forEach(s => { if (s.signedUrl && !s.error) urlByPath[s.path] = s.signedUrl; });
  }
  $status.style.display = "none";
  render(items, urlByPath);
}

(async () => {
  const session = await window.acAuth.requireAuth();
  if (!session) return;
  window.acAuth.paintNav(session);
  document.body.style.visibility = "visible";
  load();
})();
