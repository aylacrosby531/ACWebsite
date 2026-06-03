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

function render(entries, urlByPath) {
  const withPhotos = entries.filter(e => e.photo_path && urlByPath[e.photo_path]);
  if (!withPhotos.length) {
    $collage.innerHTML = `
      <div class="empty-state">
        <h3>No good days yet 🌸</h3>
        <p>Add a photo with today's entry on the <a href="review.html">Daily Log</a> and it'll show up here.</p>
      </div>`;
    return;
  }

  $collage.innerHTML = withPhotos.map(e => {
    const seed = hashStr(e.id || e.log_date);
    const w = Math.round(150 + rnd(seed) * 90);            // 150–240px
    const h = Math.round(w * (0.82 + rnd(seed + 7) * 0.5)); // varied aspect
    const rot = (rnd(seed + 2) * 14 - 7).toFixed(1);        // -7°…+7°
    const mx = Math.round(rnd(seed + 3) * 16 - 4);          // slight horizontal overlap
    const my = Math.round(rnd(seed + 4) * 10);
    const wins = (e.wins || "").trim();
    const bubble = wins
      ? `<span class="collage-bubble"><strong>🌸 ${escapeHtml(fmtDay(e.log_date))}</strong><br>${nl2br(wins)}</span>`
      : `<span class="collage-bubble"><strong>🌸 ${escapeHtml(fmtDay(e.log_date))}</strong></span>`;
    return `
      <a class="collage-item" href="review.html?date=${encodeURIComponent(e.log_date)}"
         style="width:${w}px;height:${h}px;transform:rotate(${rot}deg);margin:${my + 8}px ${mx}px;">
        <img src="${urlByPath[e.photo_path]}" alt="${escapeHtml(fmtDay(e.log_date))}" loading="lazy" />
        ${bubble}
      </a>`;
  }).join("");
}

async function load() {
  $status.style.display = "block";
  const { data, error } = await window.sb
    .from("daily_logs")
    .select("id, log_date, wins, photo_path")
    .not("photo_path", "is", null)
    .order("log_date", { ascending: false });
  if (error) {
    $status.style.display = "none";
    $collage.innerHTML = `<div class="banner banner-warn">Couldn't load photos: ${escapeHtml(error.message)}. Have you run the latest schema.sql + created the <code>photos</code> bucket?</div>`;
    return;
  }
  const entries = data || [];
  const paths = entries.map(e => e.photo_path).filter(Boolean);
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
  render(entries, urlByPath);
}

(async () => {
  const session = await window.acAuth.requireAuth();
  if (!session) return;
  window.acAuth.paintNav(session);
  document.body.style.visibility = "visible";
  load();
})();
