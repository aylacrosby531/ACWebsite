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

  // Reshuffle the order every visit so the scatter looks different each time.
  for (let i = shown.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shown[i], shown[j]] = [shown[j], shown[i]];
  }

  $collage.innerHTML = shown.map(it => {
    const e = it.entry;
    const seed = hashStr(it.path);
    const w = Math.round(150 + rnd(seed) * 90);            // 150–240px (size stays stable per photo)
    const h = Math.round(w * (0.82 + rnd(seed + 7) * 0.5)); // varied aspect
    const rot = (Math.random() * 16 - 8).toFixed(1);        // fresh -8°…+8° tilt each load
    const z = 1 + Math.floor(Math.random() * 40);           // random stacking
    // stable random factors for this render (so a window resize repacks without reshuffling)
    const jx = Math.random().toFixed(3), jy = Math.random().toFixed(3), pk = Math.random().toFixed(3);
    const wins = (e.wins || "").trim();
    const bubble = wins
      ? `<span class="collage-bubble"><strong>🌸 ${escapeHtml(fmtDay(e.log_date))}</strong><br>${nl2br(wins)}</span>`
      : `<span class="collage-bubble"><strong>🌸 ${escapeHtml(fmtDay(e.log_date))}</strong></span>`;
    return `
      <a class="collage-item" href="review.html?date=${encodeURIComponent(e.log_date)}"
         data-jx="${jx}" data-jy="${jy}" data-pk="${pk}"
         style="width:${w}px;height:${h}px;transform:rotate(${rot}deg);z-index:${z};">
        <img src="${urlByPath[it.path]}" alt="${escapeHtml(fmtDay(e.log_date))}" loading="lazy" />
        ${bubble}
      </a>`;
  }).join("");
  relayoutCollage();
}

// Desktop: pack the photos into an organic round/oval cluster (sunflower /
// phyllotaxis spiral) — no rows or columns. Each photo gets jitter + rotation
// + overlap so it reads like a pile of prints, not a grid.
// Mobile: a clean stacked list (handled by CSS).
function relayoutCollage() {
  const els = Array.from($collage.querySelectorAll(".collage-item"));
  if (!els.length) { $collage.style.height = ""; return; }
  const desktop = window.matchMedia("(min-width: 700px)").matches;
  if (!desktop) {
    $collage.style.height = "";
    els.forEach(el => { el.style.position = ""; el.style.left = ""; el.style.top = ""; });
    return;
  }
  const W = $collage.clientWidth || 800;
  const n = els.length;

  // typical + widest photo (for spacing and to keep edges inside the canvas)
  let avg = 0, maxIw = 0;
  els.forEach(el => { avg += (el.offsetWidth + el.offsetHeight) / 2; maxIw = Math.max(maxIw, el.offsetWidth); });
  avg = avg / n || 200;

  const GOLDEN = Math.PI * (3 - Math.sqrt(5));   // ~137.5° — the sunflower angle
  const pitch = avg * 0.58;                       // center-to-center spacing; smaller = more overlap
  const ovalRatio = 0.74;                         // <1 → cluster is wider than tall (oval, not a circle)
  const margin = 14;

  // Cluster radius grows with the photo count; cap it so the widest edge photo
  // still fits inside the canvas (keeps the silhouette round, never clipped).
  let R = pitch * Math.sqrt(n);
  let Rx = R, Ry = R * ovalRatio;
  const maxRx = Math.max(60, W / 2 - margin - maxIw / 2);
  if (Rx > maxRx) { const s = maxRx / Rx; Rx = maxRx; Ry *= s; }

  const cx = W / 2;
  const placed = els.map((el, i) => {
    const iw = el.offsetWidth, ih = el.offsetHeight;
    const jx = parseFloat(el.dataset.jx) || 0.5;
    const jy = parseFloat(el.dataset.jy) || 0.5;
    const pk = parseFloat(el.dataset.pk) || 0.5;
    const rr = Math.sqrt((i + 0.5) / n);          // sqrt → even areal density across the disk
    const ang = i * GOLDEN + (pk - 0.5) * 0.6;     // golden-angle spiral + a little angular jitter
    const dx = Math.cos(ang) * rr;
    const dy = Math.sin(ang) * rr;
    const jX = (jx - 0.5) * pitch * 0.55;          // positional jitter so the spiral never reads as a pattern
    const jY = (jy - 0.5) * pitch * 0.55;
    const x = cx + dx * Rx + jX - iw / 2;
    const y = dy * Ry + jY - ih / 2;               // center-relative; normalized below
    return { el, x, y, iw, ih };
  });

  // Normalize vertically so the top of the cluster sits ~16px from the top.
  let minTop = Infinity, maxBot = -Infinity;
  placed.forEach(p => { minTop = Math.min(minTop, p.y); maxBot = Math.max(maxBot, p.y + p.ih); });
  const shift = 16 - minTop;
  placed.forEach(p => {
    const left = Math.max(-8, Math.min(W - p.iw + 8, p.x));
    p.el.style.position = "absolute";
    p.el.style.left = left.toFixed(0) + "px";
    p.el.style.top = (p.y + shift).toFixed(0) + "px";
  });
  $collage.style.height = (maxBot - minTop + 32) + "px";
}

let _collageResizeT;
window.addEventListener("resize", () => {
  clearTimeout(_collageResizeT);
  _collageResizeT = setTimeout(relayoutCollage, 150);
});

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
