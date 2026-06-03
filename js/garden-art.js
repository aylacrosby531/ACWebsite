// =============================================================
// Banner garden art — a little flower plant + mushrooms, drawn in
// the same hand-made SVG style as the Recovery page, tuned to the
// soft-pink palette. Exposes window.bannerGarden() and auto-injects
// into #banner-garden if present.
// =============================================================
(function () {
  const FLOWERS = ["#f4a6c0", "#ef7fa6", "#f08fb0", "#c89bd6", "#ad8ad6", "#f7b9cf", "#ffd1e0", "#ffffff"];
  const CENTERS = ["#f4c64f", "#f6a33b", "#fff3c4"];
  const CAPS = ["#ef7fa6", "#f08fb0", "#e0907a", "#d9a05b", "#e8d2a0", "#c89bd6"];

  function rnd(seed) {
    let t = (Math.imul((seed | 0) ^ 0x9e3779b9, 2654435761)) >>> 0;
    t ^= t >>> 15; t = Math.imul(t | 1, t ^ (t >>> 7)); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const pt = (x, y, deg, len) => { const a = deg * Math.PI / 180; return { x: x + Math.sin(a) * len, y: y - Math.cos(a) * len }; };
  function shade(hex, f) {
    if (typeof hex !== "string" || hex[0] !== "#" || hex.length < 7) return hex;
    const cl = v => Math.max(0, Math.min(255, Math.round(v)));
    return `rgb(${cl(parseInt(hex.slice(1, 3), 16) * f)},${cl(parseInt(hex.slice(3, 5), 16) * f)},${cl(parseInt(hex.slice(5, 7), 16) * f)})`;
  }
  function petal(cx, cy, ang, L, W, fill, op) {
    const T = pt(cx, cy, ang, L), m1 = pt(cx, cy, ang, L * 0.4), m2 = pt(cx, cy, ang, L * 0.72);
    const a = pt(m1.x, m1.y, ang - 90, W / 2), b = pt(m2.x, m2.y, ang - 90, W * 0.32);
    const c = pt(m2.x, m2.y, ang + 90, W * 0.32), d = pt(m1.x, m1.y, ang + 90, W / 2);
    return `<path d="M${cx.toFixed(1)} ${cy.toFixed(1)} C ${a.x.toFixed(1)} ${a.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)} ${T.x.toFixed(1)} ${T.y.toFixed(1)} C ${c.x.toFixed(1)} ${c.y.toFixed(1)} ${d.x.toFixed(1)} ${d.y.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)} Z" fill="${fill}"${op != null ? ` opacity="${op}"` : ""}/>`;
  }
  function flower(cx, cy, sc, seed) {
    const base = FLOWERS[Math.floor(rnd(seed) * FLOWERS.length)];
    const n = 6 + Math.floor(rnd(seed + 2) * 4), rot = rnd(seed + 4) * 360, step = 360 / n, baseL = 7 * sc, baseW = 7 * sc;
    let f = `<g>`;
    for (let k = 0; k < n; k++) {
      const s = seed + k * 7 + 11, ang = rot + k * step + (rnd(s) - 0.5) * step * 0.5;
      f += petal(cx, cy, ang, baseL * (0.85 + rnd(s + 1) * 0.3), baseW * (0.8 + rnd(s + 2) * 0.4), shade(base, 0.8 + rnd(s + 3) * 0.2));
    }
    const cc = CENTERS[Math.floor(rnd(seed + 9) * CENTERS.length)];
    f += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(2.4 * sc).toFixed(1)}" fill="${cc}"/>`;
    return f + `</g>`;
  }
  function leaf(rx, ry, ang, len, col) {
    const T = pt(rx, ry, ang, len), m = pt(rx, ry, ang, len * 0.5);
    const a = pt(m.x, m.y, ang - 90, len * 0.3), b = pt(m.x, m.y, ang + 90, len * 0.3);
    return `<path d="M${rx.toFixed(1)} ${ry.toFixed(1)} Q ${a.x.toFixed(1)} ${a.y.toFixed(1)} ${T.x.toFixed(1)} ${T.y.toFixed(1)} Q ${b.x.toFixed(1)} ${b.y.toFixed(1)} ${rx.toFixed(1)} ${ry.toFixed(1)} Z" fill="${col}"/>`;
  }
  function stalk(rx, ry, ang, len, seed, col) {
    const tip = pt(rx, ry, ang, len), cp = pt(rx, ry, ang + (rnd(seed) - 0.5) * 20, len * 0.6);
    return `<path d="M${rx.toFixed(1)} ${ry.toFixed(1)} Q ${cp.x.toFixed(1)} ${cp.y.toFixed(1)}, ${tip.x.toFixed(1)} ${tip.y.toFixed(1)}" stroke="${col}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
      + flower(tip.x, tip.y, 0.9 + rnd(seed + 3) * 0.5, seed * 3 + 1);
  }
  function mushroom(mx, gy, seed) {
    const hgt = 15 + rnd(seed) * 16, cw = 13 + rnd(seed + 1) * 11, cap = CAPS[Math.floor(rnd(seed + 2) * CAPS.length)];
    let g = `<rect x="${(mx - cw * 0.16).toFixed(1)}" y="${(gy - hgt).toFixed(1)}" width="${(cw * 0.32).toFixed(1)}" height="${hgt.toFixed(1)}" rx="2.5" fill="#f3ece0"/>`;
    g += `<path d="M${(mx - cw / 2).toFixed(1)} ${(gy - hgt).toFixed(1)} a ${(cw / 2).toFixed(1)} ${(cw * 0.55).toFixed(1)} 0 0 1 ${cw.toFixed(1)} 0 z" fill="${cap}"/>`;
    for (let s = 0; s < 3; s++) g += `<circle cx="${(mx - cw / 4 + rnd(seed + s + 3) * cw / 2).toFixed(1)}" cy="${(gy - hgt - cw * 0.1).toFixed(1)}" r="1.5" fill="#fff6ec"/>`;
    return g;
  }

  window.bannerGarden = function (seed) {
    seed = seed || 7;
    const Wd = 240, Ht = 150, gy = 130, green = "#7bb37a", green2 = "#5f9e63";
    let g = `<ellipse cx="120" cy="${gy + 5}" rx="104" ry="9" fill="rgba(138,100,112,0.08)"/>`;
    // flowering plant
    const bx = 78;
    g += leaf(bx, gy, -52, 28, green2);
    g += leaf(bx, gy, 46, 25, green);
    g += stalk(bx, gy, 14, 52, seed + 9, green);
    g += stalk(bx, gy, -24, 58, seed + 5, green2);
    g += stalk(bx, gy, -4, 74, seed + 1, green);
    // mushroom cluster
    g += mushroom(136, gy, seed + 11);
    g += mushroom(152, gy, seed + 2);
    g += mushroom(170, gy, seed + 6);
    // a few grass blades between them
    for (let i = 0; i < 5; i++) {
      const rx = 116 + (i - 2) * 20, o = pt(rx, gy, (i - 2) * 11, 9 + rnd(seed + i) * 8);
      g += `<path d="M${rx} ${gy} L ${o.x.toFixed(1)} ${o.y.toFixed(1)}" stroke="${green2}" stroke-width="1.5" stroke-linecap="round"/>`;
    }
    return `<svg viewBox="0 0 ${Wd} ${Ht}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${g}</svg>`;
  };

  const el = document.getElementById("banner-garden");
  if (el) el.innerHTML = window.bannerGarden();
})();
