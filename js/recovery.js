// =============================================================
// Recovery garden
// A growing garden: each completed milestone sprouts a unique plant;
// the "web of achievements" below is what you tap to grow it. Therapy
// sessions release little critters. Data in Supabase: `milestones`,
// `therapy_sessions`.
// =============================================================

const NS = "http://www.w3.org/2000/svg";
const W = 900, H = 300, groundY = 244, MARGIN = 46;
const GREENS = ["#5f9e63","#74b06f","#4f8a55","#8cbf7e","#6aa86b","#3f7a48","#86c07a"];
const FLOWERS = ["#f4a6c0","#ef7fa6","#ffd1e0","#f08fb0","#c89bd6","#ad8ad6","#f3b24d","#f6d36b","#8fb7e8","#ef9a8a","#ffffff","#f7b9cf"];
const CENTERS = ["#f4c64f","#f6a33b","#fff3c4"];
const BFLY = ["#f0a33b","#ef7fa6","#8fb7e8","#ad8ad6","#f6d36b","#ef9a8a","#ffffff","#f4a6c0","#c89bd6","#9bd1a0"];
const BUG = ["#e23b3b","#ef5a8a","#f39a2d","#9b5fb0","#3f7fd6","#e0662e","#d6486a","#c43b5a"];
const CRIT = ["butterfly", "ladybug", "frog", "caterpillar", "bee", "snail"];
const EMO = { butterfly: "🦋", ladybug: "🐞", frog: "🐸", caterpillar: "🐛", bee: "🐝", snail: "🐌" };
const DEFAULT_PHASES = ["Surgery & PT", "Bike", "Crutches & weight-bearing", "Walking", "Running", "Future Goals"];
const WIDE_PHASE = "Future Goals";
const EXTRA_CATS_KEY = "ac_recovery_extra_cats";
const PHASE_ORDER_KEY = "ac_recovery_phase_order";

function strHash(s) { s = String(s); let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rnd(seed) {
  let t = (Math.imul((seed | 0) ^ 0x9e3779b9, 2654435761)) >>> 0;
  t ^= t >>> 15; t = Math.imul(t | 1, t ^ (t >>> 7)); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pt = (x, y, deg, len) => { const a = deg * Math.PI / 180; return { x: x + Math.sin(a) * len, y: y - Math.cos(a) * len }; };
function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

// ---- artistic primitives ----
function shade(hex, f) { if (typeof hex !== "string" || hex[0] !== "#" || hex.length < 7) return hex;
  const cl = v => Math.max(0, Math.min(255, Math.round(v)));
  return `rgb(${cl(parseInt(hex.slice(1,3),16)*f)},${cl(parseInt(hex.slice(3,5),16)*f)},${cl(parseInt(hex.slice(5,7),16)*f)})`; }
function tint(hex, f) { if (typeof hex !== "string" || hex[0] !== "#" || hex.length < 7) return hex;
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgb(${Math.round(r+(255-r)*f)},${Math.round(g+(255-g)*f)},${Math.round(b+(255-b)*f)})`; }
function petal(cx, cy, ang, L, W, fill, op) {
  const T = pt(cx, cy, ang, L), m1 = pt(cx, cy, ang, L * 0.4), m2 = pt(cx, cy, ang, L * 0.72);
  const a = pt(m1.x, m1.y, ang - 90, W / 2), b = pt(m2.x, m2.y, ang - 90, W * 0.32);
  const c = pt(m2.x, m2.y, ang + 90, W * 0.32), d = pt(m1.x, m1.y, ang + 90, W / 2);
  return `<path d="M${cx.toFixed(1)} ${cy.toFixed(1)} C ${a.x.toFixed(1)} ${a.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)} ${T.x.toFixed(1)} ${T.y.toFixed(1)} C ${c.x.toFixed(1)} ${c.y.toFixed(1)} ${d.x.toFixed(1)} ${d.y.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)} Z" fill="${fill}"${op != null ? ` opacity="${op}"` : ""}/>`;
}
function floret(cx, cy, sc, col, seed) {
  let f = `<g>`;
  for (let k = 0; k < 4; k++) f += petal(cx, cy, k * 90 + rnd(seed + k) * 30, sc * 2.4, sc * 2.2, shade(col, 0.85 + rnd(seed + k) * 0.25));
  return f + `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(sc * 0.7).toFixed(1)}" fill="#fff3c4"/></g>`;
}
function flower(cx, cy, sc, seed, colorOverride) {
  const base = colorOverride || FLOWERS[Math.floor(rnd(seed) * FLOWERS.length)];
  const styleP = Math.floor(rnd(seed + 5) * 4);
  const n = styleP === 0 ? 12 + Math.floor(rnd(seed + 2) * 7) : 5 + Math.floor(rnd(seed + 2) * 5);
  const rot = rnd(seed + 4) * 360, step = 360 / n;
  const baseL = (styleP === 0 ? 9.5 : 7) * sc, baseW = (styleP === 0 ? 2.3 : styleP === 2 ? 4.2 : 7.4) * sc;
  let f = `<g class="bloom">`;
  for (let k = 0; k < n; k++) { const s = seed + k * 7 + 11; const ang = rot + k * step + (rnd(s) - 0.5) * step * 0.55;
    f += petal(cx, cy, ang, baseL * 1.12 * (0.82 + rnd(s+1)*0.36), baseW * 1.05 * (0.78 + rnd(s+2)*0.44), shade(base, 0.66 + rnd(s+3)*0.2)); }
  for (let k = 0; k < n; k++) { const s = seed + k * 7 + 101; const ang = rot + (k + 0.5) * step + (rnd(s) - 0.5) * step * 0.55;
    f += petal(cx, cy, ang, baseL * (0.82 + rnd(s+1)*0.36), baseW * (0.78 + rnd(s+2)*0.46), shade(base, 0.9 + rnd(s+3)*0.22)); }
  if (styleP !== 0) for (let k = 0; k < n; k++) { const s = seed + k * 5 + 211; const ang = rot + (k + 0.5) * step + (rnd(s) - 0.5) * step * 0.4;
    f += petal(cx, cy, ang, baseL * (0.4 + rnd(s+1)*0.25), baseW * (0.45 + rnd(s+2)*0.28), tint(base, 0.3 + rnd(s+3)*0.35), 0.55 + rnd(s+4)*0.3); }
  const cc = CENTERS[Math.floor(rnd(seed + 9) * CENTERS.length)];
  f += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(2.5*sc*(0.85+rnd(seed+8)*0.4)).toFixed(1)}" fill="${cc}"/>`;
  for (let st = 0; st < 8; st++) { const a = st * 45 * Math.PI / 180, rr = (1.2 + rnd(seed+st)*1.1) * sc;
    f += `<circle cx="${(cx+Math.cos(a)*rr).toFixed(1)}" cy="${(cy+Math.sin(a)*rr).toFixed(1)}" r="${((0.5+rnd(seed+st+1)*0.5)*sc).toFixed(1)}" fill="${shade(cc, 0.66)}"/>`; }
  return f + `</g>`;
}
function frond(rx, ry, ang, len, seed, col) {
  ang += (rnd(seed + 1) - 0.5) * 16; len *= 0.85 + rnd(seed + 2) * 0.32;
  const tip = pt(rx, ry, ang, len), cp = pt(rx, ry, ang + (rnd(seed) - 0.5) * 30, len * 0.55);
  let g = `<path d="M${rx.toFixed(1)} ${ry.toFixed(1)} Q ${cp.x.toFixed(1)} ${cp.y.toFixed(1)}, ${tip.x.toFixed(1)} ${tip.y.toFixed(1)}" stroke="${shade(col, 0.85 + rnd(seed+3)*0.2)}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  const steps = Math.max(4, Math.round(len / 8));
  for (let k = 1; k <= steps; k++) {
    const t = k / steps, bx = (1-t)*(1-t)*rx + 2*(1-t)*t*cp.x + t*t*tip.x, by = (1-t)*(1-t)*ry + 2*(1-t)*t*cp.y + t*t*tip.y, ll = Math.max(2.2, (1 - t) * 6.5 + 2);
    for (const sd of [-1, 1]) { const s2 = seed + k * 13 + (sd + 1);
      const la = ang + sd * (44 + rnd(s2) * 22); const ll2 = ll * (0.7 + rnd(s2 + 1) * 0.8);
      g += petal(bx, by, la, ll2 * 2.3, ll2 * 1.05, shade(col, 0.76 + rnd(s2 + 2) * 0.36)); }
  }
  return g;
}
function broadLeaf(rx, ry, ang, len, seed, col) {
  seed = seed || 1;
  ang += (rnd(seed + 1) - 0.5) * 32; len *= 0.72 + rnd(seed + 2) * 0.6;
  const W = len * (0.36 + rnd(seed + 3) * 0.18);
  const c1 = shade(col, 0.8 + rnd(seed + 4) * 0.34), dark = shade(c1, 0.78), wl = rnd(seed + 5) * 0.18;
  const T = pt(rx, ry, ang, len), m1 = pt(rx, ry, ang, len*0.4), m2 = pt(rx, ry, ang, len*0.72);
  const lA = pt(m1.x, m1.y, ang-90, W*(0.5+wl)), lB = pt(m2.x, m2.y, ang-90, W*0.3);
  const rA = pt(m2.x, m2.y, ang+90, W*0.3), rB = pt(m1.x, m1.y, ang+90, W*(0.5-wl));
  const half = (cA, cB) => `M${rx.toFixed(1)} ${ry.toFixed(1)} C ${cA.x.toFixed(1)} ${cA.y.toFixed(1)} ${cB.x.toFixed(1)} ${cB.y.toFixed(1)} ${T.x.toFixed(1)} ${T.y.toFixed(1)} L ${rx.toFixed(1)} ${ry.toFixed(1)} Z`;
  let g = `<path d="${half(lA, lB)}" fill="${c1}"/>`;
  g += `<path d="${half(rA, rB)}" fill="${dark}"/>`;
  g += `<path d="M${rx.toFixed(1)} ${ry.toFixed(1)} L ${T.x.toFixed(1)} ${T.y.toFixed(1)}" stroke="${shade(c1,0.68)}" stroke-width="${Math.max(0.8,len*0.025).toFixed(1)}" fill="none" stroke-linecap="round"/>`;
  for (const t of [0.4, 0.62]) { const mp = pt(rx, ry, ang, len*t); for (const sd of [-1,1]) { const vp = pt(mp.x, mp.y, ang+sd*52, W*0.26); g += `<path d="M${mp.x.toFixed(1)} ${mp.y.toFixed(1)} L ${vp.x.toFixed(1)} ${vp.y.toFixed(1)}" stroke="${shade(c1,0.68)}" stroke-width="0.6" opacity="0.5"/>`; } }
  return g;
}
function palmFan(rx, ry, ang, len, seed, col) {
  const base = pt(rx, ry, ang, len * 0.42);
  let g = `<path d="M${rx.toFixed(1)} ${ry.toFixed(1)} L ${base.x.toFixed(1)} ${base.y.toFixed(1)}" stroke="${col}" stroke-width="2.4" stroke-linecap="round"/>`;
  const blades = 5 + Math.floor(rnd(seed) * 3);
  for (let b = 0; b < blades; b++) { const ba = ang + (b - (blades - 1) / 2) * (64 / blades); g += petal(base.x, base.y, ba, len * 0.62, len * 0.16, b % 2 ? col : shade(col, 0.86)); }
  return g;
}
const baseXof = (m) => MARGIN + rnd(strHash(m.id)) * (W - 2 * MARGIN);
function drawSeed(m) {
  const bx = baseXof(m), s = strHash(m.id);
  const sx = bx + (rnd(s + 1) - 0.5) * 10, sy = groundY + 8 + rnd(s + 2) * 7, rot = (rnd(s + 3) * 60 - 30).toFixed(0);
  return `<ellipse cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" rx="5.2" ry="3.5" fill="#6f5237" transform="rotate(${rot} ${sx.toFixed(1)} ${sy.toFixed(1)})"/>`
    + `<ellipse cx="${(sx-1).toFixed(1)}" cy="${(sy-1).toFixed(1)}" rx="1.6" ry="1" fill="#8a6a48"/>`;
}
function smoothPath(pts) {
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6, c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}
const cub = (p0, c1, c2, p1, t) => { const u = 1 - t; return {
  x: u*u*u*p0.x + 3*u*u*t*c1.x + 3*u*t*t*c2.x + t*t*t*p1.x,
  y: u*u*u*p0.y + 3*u*u*t*c1.y + 3*u*t*t*c2.y + t*t*t*p1.y }; };
function vine(rx, ry, ang, len, seed, col) {
  const tip = pt(rx, ry, ang, len), c1 = pt(rx, ry, ang - 34, len * 0.45), c2 = pt(rx, ry, ang + 34, len * 0.8);
  let g = `<path d="M${rx.toFixed(1)} ${ry.toFixed(1)} C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)}, ${c2.x.toFixed(1)} ${c2.y.toFixed(1)}, ${tip.x.toFixed(1)} ${tip.y.toFixed(1)}" stroke="${col}" stroke-width="1.7" fill="none" stroke-linecap="round"/>`;
  for (let k = 1; k <= 4; k++) { const b = cub({x:rx,y:ry}, c1, c2, tip, k/5), la = ang + (k%2 ? 62 : -62), lp = pt(b.x, b.y, la, 7), mx = (b.x+lp.x)/2, my = (b.y+lp.y)/2;
    g += `<ellipse cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" rx="4.4" ry="2.1" fill="${col}" transform="rotate(${la.toFixed(0)} ${mx.toFixed(1)} ${my.toFixed(1)})"/>`; }
  return g + `<circle cx="${tip.x.toFixed(1)}" cy="${tip.y.toFixed(1)}" r="2.4" fill="none" stroke="${col}" stroke-width="1.4"/>`;
}
const stem = (pts, w, col) => `<path d="${smoothPath(pts)}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
function wanderPts(bx, gy, H, nSeg, amp, lean, seed) {
  const pts = [{ x: bx, y: gy }];
  for (let i = 1; i <= nSeg; i++) { const t = i / nSeg; const y = gy - H * t; const x = bx + Math.sin(t * Math.PI * (0.5 + rnd(seed) * 1.5)) * amp + lean * t + (rnd(seed + i) - 0.5) * 6; pts.push({ x, y }); }
  return pts;
}

// ---- species ----
function archSpike(c) {
  const { h, bx, gy, green, green2, fcol } = c;
  const H = (95 + rnd(h+11) * 55) * c.scale, nSeg = Math.max(7, Math.round(H/12)), lean = (rnd(h+12)-0.5) * 46;
  const pts = wanderPts(bx, gy, H, nSeg, 12 + rnd(h+13)*14, lean, h+1);
  let g = stem(pts, 3.2, green);
  for (let j = 0; j < 2 + Math.floor(rnd(h+2)*2); j++) { const dir = j%2?1:-1; g += broadLeaf(bx+(rnd(h+j)-0.5)*8, gy, dir*(35+rnd(h+j)*20), 34+rnd(h+j)*22, h+j, green2); }
  const start = Math.floor(nSeg*0.28);
  for (let i = start; i <= nSeg; i++) { const p = pts[i], t = (i-start)/(nSeg-start), sc = 0.95-0.5*t;
    for (const sd of [-1,1]) if (rnd(h+i*7+sd+3) < 0.85) { const o = pt(p.x, p.y, sd*(55+rnd(h+i)*30), 3+rnd(h+i+sd)*6); g += flower(o.x, o.y, sc*(0.7+rnd(h+i)*0.4), h+i*13+sd, fcol(h+i*5+sd)); } }
  return g + flower(pts[nSeg].x, pts[nSeg].y, 0.7, h+99, fcol(h+101));
}
function archBush(c) {
  const { h, bx, gy, green, green2, fcol } = c;
  const H = (50+rnd(h+12)*40)*c.scale, n = 7 + Math.floor(rnd(h+13)*7);
  let g = "";
  for (let i = 0; i < n; i++) { const frac = n===1?0.5:i/(n-1), ang = -72+frac*144+(rnd(h+i)-0.5)*18, dome = 1-Math.abs(frac-0.5)*2, len = (H*0.7+rnd(h+i*3)*H*0.7)*(0.6+dome*0.6), tip = pt(bx, gy, ang, len);
    g += `<path d="M${bx.toFixed(1)} ${gy} Q ${(bx+Math.sin(ang*Math.PI/180)*len*0.5).toFixed(1)} ${(gy-len*0.4).toFixed(1)}, ${tip.x.toFixed(1)} ${tip.y.toFixed(1)}" stroke="${i%2?green:green2}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    g += rnd(h+i+1) < 0.6 ? flower(tip.x, tip.y, 0.7+rnd(h+i)*0.5, h+i*7, fcol(h+i*9)) : broadLeaf(tip.x, tip.y, ang, 12+rnd(h+i)*10, h+i, i%2?green:green2); }
  for (let f = 0; f < 5+Math.floor(rnd(h+5)*6); f++) { const ang = -70+rnd(h+f*3)*140, len = rnd(h+f*5)*H*0.85, o = pt(bx, gy, ang, len); g += flower(o.x, o.y, 0.7+rnd(h+f)*0.5, h+f*11, fcol(h+f*4)); }
  return g;
}
function archFern(c) {
  const { h, bx, gy, green, green2, fcol } = c;
  const n = 5 + Math.floor(rnd(h+11)*5);
  let g = "";
  for (let i = 0; i < n; i++) { const frac = n===1?0.5:i/(n-1), ang = -62+frac*124+(rnd(h+i)-0.5)*12, len = ((60+rnd(h+i*3)*55)*(0.75+(1-Math.abs(frac-0.5)*2)*0.4))*c.scale; g += frond(bx+(rnd(h+i)-0.5)*10, gy, ang, len, h+i*7, i%2?green:green2); }
  if (rnd(h+3) < 0.5) for (let f = 0; f < 3; f++) { const o = pt(bx, gy, -30+f*30, 8+rnd(h+f)*6); g += flower(o.x, o.y, 0.6, h+f, fcol(h+f*5)); }
  return g;
}
function archDaisy(c) {
  const { h, bx, gy, green } = c;
  const n = 5 + Math.floor(rnd(h+11)*6), H = (45+rnd(h+12)*45)*c.scale;
  let g = "";
  for (let j = 0; j < 3; j++) g += broadLeaf(bx+(rnd(h+j)-0.5)*14, gy, (j-1)*34, 18+rnd(h+j)*12, h+j, green);
  for (let i = 0; i < n; i++) { const ang = (i-(n-1)/2)*(54/n)+(rnd(h+i)-0.5)*16, len = H*(0.6+rnd(h+i*3)*0.7), rx = bx+(rnd(h+i)-0.5)*16, tip = pt(rx, gy, ang, len);
    g += `<path d="M${rx.toFixed(1)} ${gy} Q ${((rx+tip.x)/2).toFixed(1)} ${((gy+tip.y)/2).toFixed(1)}, ${tip.x.toFixed(1)} ${tip.y.toFixed(1)}" stroke="${green}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
    g += flower(tip.x, tip.y, 0.8+rnd(h+i)*0.5, h+i*13, FLOWERS[Math.floor(rnd(h+i*5)*FLOWERS.length)]); }
  return g;
}
function archPalm(c) {
  const { h, bx, gy, green, green2, fcol } = c;
  const H = (90+rnd(h+11)*55)*c.scale, nSeg = Math.max(5,Math.round(H/16)), lean = (rnd(h+12)-0.5)*30;
  const pts = wanderPts(bx, gy, H, nSeg, 8, lean, h+1);
  let g = stem(pts, 4, green);
  const top = pts[nSeg], n = 6 + Math.floor(rnd(h+13)*4);
  for (let i = 0; i < n; i++) { const ang = -90+(i/(n-1))*180, len = 40+rnd(h+i*3)*30; g += (i%2?frond:palmFan)(top.x, top.y, ang, len, h+i*7, i%2?green:green2); }
  if (rnd(h+5) < 0.6) for (let f = 0; f < 3; f++) { const o = pt(top.x, top.y, -20+f*20, 6); g += flower(o.x, o.y, 0.7, h+f, fcol(h+f*5)); }
  return g;
}
function archVine(c) {
  const { h, bx, gy, green, green2, green3, fcol } = c;
  const n = 2 + Math.floor(rnd(h+11)*3);
  let g = "";
  for (let i = 0; i < n; i++) { const ang = -50+(n===1?50:i/(n-1)*100)+(rnd(h+i)-0.5)*20, len = (70+rnd(h+i*3)*70)*c.scale; g += vine(bx+(rnd(h+i)-0.5)*16, gy, ang, len, h+i*9, i%2?green:green3);
    for (let f = 0; f < 3; f++) { const tip = pt(bx, gy, ang, len*(0.4+f*0.25)); g += flower(tip.x+(rnd(h+i+f)-0.5)*10, tip.y, 0.6+rnd(h+f)*0.4, h+i*7+f, fcol(h+i+f*5)); } }
  for (let j = 0; j < 3; j++) g += broadLeaf(bx+(rnd(h+j)-0.5)*12, gy, (j-1)*30, 16+rnd(h+j)*10, h+j, green2);
  return g;
}
function archRosette(c) {
  const { h, bx, gy, green, green2, fcol } = c;
  const n = 6 + Math.floor(rnd(h+11)*5);
  let g = "";
  for (let i = 0; i < n; i++) { const ang = -85+(i/(n-1))*170, len = (20+rnd(h+i*3)*16)*c.scale; g += broadLeaf(bx, gy, ang, len, h+i*7, i%2?green:green2); }
  if (rnd(h+5) < 0.75) { const H = (30+rnd(h+6)*40)*c.scale, tip = pt(bx, gy, (rnd(h+7)-0.5)*16, H);
    g += `<path d="M${bx.toFixed(1)} ${gy} L ${tip.x.toFixed(1)} ${tip.y.toFixed(1)}" stroke="${green}" stroke-width="2" stroke-linecap="round"/>`;
    g += flower(tip.x, tip.y, 1+rnd(h+8)*0.6, h+9, fcol(h+10));
    for (let f = 0; f < 3; f++) { const o = pt(bx, gy, (f-1)*14, H*(0.55+f*0.13)); g += flower(o.x, o.y, 0.7, h+f+11, fcol(h+f*3+12)); } }
  return g;
}
function archTree(c) {
  const { h, bx, gy, green, fcol } = c, wood = "#8a6a4a";
  const H = (70+rnd(h+11)*45)*c.scale, top = { x: bx+(rnd(h+12)-0.5)*20, y: gy-H };
  const pts = [{ x: bx, y: gy }, { x: bx+(rnd(h+13)-0.5)*10, y: gy-H*0.5 }, top];
  let g = stem(pts, 4.5, wood);
  const nb = 3 + Math.floor(rnd(h+14)*3);
  for (let i = 0; i < nb; i++) { const base = pts[rnd(h+i)<0.5?1:2], ang = (rnd(h+i+1)-0.5)*120, len = 24+rnd(h+i*3)*26, bt = pt(base.x, base.y, ang, len);
    g += `<path d="M${base.x.toFixed(1)} ${base.y.toFixed(1)} Q ${(base.x+Math.sin(ang*Math.PI/180)*len*0.4).toFixed(1)} ${(base.y-len*0.3).toFixed(1)}, ${bt.x.toFixed(1)} ${bt.y.toFixed(1)}" stroke="${wood}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    for (let f = 0; f < 3+Math.floor(rnd(h+i)*3); f++) { const o = pt(bt.x, bt.y, (rnd(h+i+f)-0.5)*180, 4+rnd(h+i+f)*8); g += flower(o.x, o.y, 0.6+rnd(h+i+f)*0.5, h+i*7+f, fcol(h+i+f*3)); }
    g += broadLeaf(bt.x, bt.y, ang, 12, h+i, green); }
  for (let f = 0; f < 4; f++) { const o = pt(top.x, top.y, (f-1.5)*30, 5+f*4); g += flower(o.x, o.y, 0.7, h+f+20, fcol(h+f*3+21)); }
  return g;
}
function archCactus(c) {
  const { h, bx, gy, green, fcol } = c, H = (60+rnd(h+11)*60)*c.scale, w = 10+rnd(h+12)*6;
  let g = `<rect x="${(bx-w/2).toFixed(1)}" y="${(gy-H).toFixed(1)}" width="${w.toFixed(1)}" height="${H.toFixed(1)}" rx="${(w/2).toFixed(1)}" fill="${green}"/>`;
  const arms = Math.floor(rnd(h+13)*3);
  for (let a = 0; a < arms; a++) { const side = a%2?1:-1, ay = gy-H*(0.4+rnd(h+a)*0.3), aw = w*0.7;
    g += `<path d="M${bx.toFixed(1)} ${ay.toFixed(1)} h ${(side*16).toFixed(1)}" stroke="${green}" stroke-width="${aw.toFixed(1)}" fill="none" stroke-linecap="round"/>`;
    g += `<rect x="${(bx+side*16-aw/2).toFixed(1)}" y="${(ay-24).toFixed(1)}" width="${aw.toFixed(1)}" height="28" rx="${(aw/2).toFixed(1)}" fill="${green}"/>`; }
  for (let f = 0; f < 2+Math.floor(rnd(h+5)*3); f++) { const o = pt(bx, gy-H, (f-1)*22, 4); g += flower(o.x, o.y, 0.55+rnd(h+f)*0.4, h+f, fcol(h+f*3)); }
  return g;
}
function archGrass(c) {
  const { h, bx, gy, green, green2 } = c, n = 9 + Math.floor(rnd(h+11)*9);
  let g = "";
  for (let i = 0; i < n; i++) {
    const s = h + i * 17, ang = (rnd(s) - 0.5) * 120, len = (32 + rnd(s + 1) * 70) * c.scale, rx = bx + (rnd(s + 2) - 0.5) * 26, tip = pt(rx, gy, ang, len), bend = (rnd(s + 3) - 0.5) * len * 0.35, mp = pt(rx, gy, ang, len * 0.5), col = shade(rnd(s + 5) < 0.5 ? green : green2, 0.78 + rnd(s + 4) * 0.4);
    g += `<path d="M${rx.toFixed(1)} ${gy} Q ${(mp.x + bend).toFixed(1)} ${mp.y.toFixed(1)}, ${tip.x.toFixed(1)} ${tip.y.toFixed(1)}" stroke="${col}" stroke-width="${(1.4 + rnd(s+6)*1.4).toFixed(1)}" fill="none" stroke-linecap="round"/>`;
    if (rnd(s + 7) < 0.3) g += `<ellipse cx="${tip.x.toFixed(1)}" cy="${tip.y.toFixed(1)}" rx="2.4" ry="${(5+rnd(s)*3).toFixed(1)}" fill="#d8c08a" transform="rotate(${ang.toFixed(0)} ${tip.x.toFixed(1)} ${tip.y.toFixed(1)})"/>`;
  }
  return g;
}
function archBells(c) {
  const { h, bx, gy, green, fcol } = c, n = 3+Math.floor(rnd(h+11)*3);
  let g = "";
  for (let i = 0; i < n; i++) { const dir = i%2?1:-1, H = (60+rnd(h+i*3)*50)*c.scale, top = pt(bx, gy, dir*(20+rnd(h+i)*20), H), col = fcol(h+i*7);
    g += `<path d="M${bx.toFixed(1)} ${gy} Q ${(bx+dir*10).toFixed(1)} ${(gy-H*0.7).toFixed(1)}, ${top.x.toFixed(1)} ${top.y.toFixed(1)}" stroke="${green}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    for (let b = 0; b < 3+Math.floor(rnd(h+i)*3); b++) { const t = 0.5+b*0.14, p = { x: bx+(top.x-bx)*t, y: gy+(top.y-gy)*t };
      g += `<path d="M${(p.x-3).toFixed(1)} ${p.y.toFixed(1)} L ${(p.x+3).toFixed(1)} ${p.y.toFixed(1)} L ${(p.x+2).toFixed(1)} ${(p.y+7).toFixed(1)} Q ${p.x.toFixed(1)} ${(p.y+9).toFixed(1)} ${(p.x-2).toFixed(1)} ${(p.y+7).toFixed(1)} Z" fill="${col}"/>`; } }
  return g;
}
function archMushrooms(c) {
  const { h, bx, gy, green } = c, n = 3+Math.floor(rnd(h+11)*4), CAPS = ["#ef7f7f","#e0907a","#c98a90","#d9a05b","#e8d2a0","#b07f9e"];
  let g = "";
  for (let i = 0; i < n; i++) { const mx = bx+(i-(n-1)/2)*14+(rnd(h+i)-0.5)*6, hgt = (10+rnd(h+i*3)*22)*c.scale, cw = 8+rnd(h+i)*10, cap = CAPS[Math.floor(rnd(h+i+1)*CAPS.length)];
    g += `<rect x="${(mx-cw*0.18).toFixed(1)}" y="${(gy-hgt).toFixed(1)}" width="${(cw*0.36).toFixed(1)}" height="${hgt.toFixed(1)}" rx="2" fill="#efe6d2"/>`;
    g += `<path d="M${(mx-cw/2).toFixed(1)} ${(gy-hgt).toFixed(1)} a ${(cw/2).toFixed(1)} ${(cw*0.5).toFixed(1)} 0 0 1 ${cw.toFixed(1)} 0 z" fill="${cap}"/>`;
    for (let s = 0; s < 3; s++) g += `<circle cx="${(mx-cw/4+rnd(h+i+s)*cw/2).toFixed(1)}" cy="${(gy-hgt-cw*0.16).toFixed(1)}" r="1.4" fill="#fff3e0"/>`; }
  for (let j = 0; j < 4; j++) { const rx = bx+(rnd(h+j)-0.5)*34, o = pt(rx, gy, (j-1.5)*16, 12+rnd(h+j)*8); g += `<path d="M${rx.toFixed(1)} ${gy} L ${o.x.toFixed(1)} ${o.y.toFixed(1)}" stroke="${green}" stroke-width="1.6" stroke-linecap="round"/>`; }
  return g;
}
function archSunflower(c) {
  const { h, bx, gy, green } = c, H = (80+rnd(h+11)*55)*c.scale, nSeg = Math.max(5, Math.round(H/16));
  const pts = wanderPts(bx, gy, H, nSeg, 6, (rnd(h+12)-0.5)*16, h+1);
  let g = stem(pts, 4, green);
  for (let j = 0; j < 2; j++) { const p = pts[Math.floor(nSeg*(0.4+j*0.2))]; g += broadLeaf(p.x, p.y, (j%2?1:-1)*55, 30+rnd(h+j)*16, h+j, green); }
  const top = pts[nSeg], petals = 14, sc = 1.1+rnd(h+13)*0.4;
  let f = "<g>";
  for (let k = 0; k < petals; k++) { const a = k*360/petals*Math.PI/180, px = top.x+Math.cos(a)*8*sc, py = top.y+Math.sin(a)*8*sc;
    f += `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="${(5*sc).toFixed(1)}" ry="${(2.4*sc).toFixed(1)}" fill="#f3b24d" transform="rotate(${(k*360/petals).toFixed(0)} ${px.toFixed(1)} ${py.toFixed(1)})"/>`; }
  return g + f + `<circle cx="${top.x.toFixed(1)}" cy="${top.y.toFixed(1)}" r="${(6*sc).toFixed(1)}" fill="#7a5230"/></g>`;
}
function archLavender(c) {
  const { h, bx, gy, green } = c, n = 5+Math.floor(rnd(h+11)*5), PUR = ["#ad8ad6","#c89bd6","#9a7fc4","#b58ad9"];
  let g = "";
  for (let i = 0; i < n; i++) { const ang = (i-(n-1)/2)*(52/n)+(rnd(h+i)-0.5)*10, len = (45+rnd(h+i*3)*40)*c.scale, rx = bx+(rnd(h+i)-0.5)*16, tip = pt(rx, gy, ang, len), pc = PUR[Math.floor(rnd(h+i)*PUR.length)];
    g += `<path d="M${rx.toFixed(1)} ${gy} L ${tip.x.toFixed(1)} ${tip.y.toFixed(1)}" stroke="${green}" stroke-width="1.6" stroke-linecap="round"/>`;
    for (let d = 0; d < 6; d++) { const t = 0.58+d*0.07, p = { x: rx+(tip.x-rx)*t, y: gy+(tip.y-gy)*t }; g += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2" fill="${pc}"/>`; } }
  return g;
}
function archDandelion(c) {
  const { h, bx, gy, green } = c, n = 3+Math.floor(rnd(h+11)*3);
  let g = "";
  for (let j = 0; j < 3; j++) g += broadLeaf(bx+(rnd(h+j)-0.5)*12, gy, (j-1)*36, 16+rnd(h+j)*10, h+j, green);
  for (let i = 0; i < n; i++) { const rx = bx+(rnd(h+i)-0.5)*16, H = (40+rnd(h+i*3)*35)*c.scale, top = { x: rx+(rnd(h+i)-0.5)*6, y: gy-H };
    g += `<path d="M${rx.toFixed(1)} ${gy} L ${top.x.toFixed(1)} ${top.y.toFixed(1)}" stroke="${green}" stroke-width="1.6" stroke-linecap="round"/>`;
    if (rnd(h+i) < 0.5) { for (let k = 0; k < 14; k++) { const a = k*360/14*Math.PI/180, ex = top.x+Math.cos(a)*7, ey = top.y+Math.sin(a)*7;
      g += `<line x1="${top.x.toFixed(1)}" y1="${top.y.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="#e6e6e6" stroke-width="0.8"/><circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="1" fill="#fff"/>`; } }
    else g += flower(top.x, top.y, 1+rnd(h+i)*0.4, h+i, "#f6d36b"); }
  return g;
}
function archHydrangea(c) {
  const { h, bx, gy, green, fcol } = c, H = (38 + rnd(h+11)*28) * c.scale;
  let g = "";
  for (let s = 0; s < 2; s++) { const sx = bx + (s - 0.5) * 16; g += `<path d="M${sx.toFixed(1)} ${gy} L ${(sx+(rnd(h+s)-0.5)*8).toFixed(1)} ${(gy-H).toFixed(1)}" stroke="${green}" stroke-width="3" stroke-linecap="round"/>`; }
  for (let j = 0; j < 3; j++) g += broadLeaf(bx+(rnd(h+j)-0.5)*18, gy, (j-1)*42, 30+rnd(h+j)*18, h+j, green);
  const cyc = gy - H, R = (24 + rnd(h+12)*16) * c.scale, n = 20 + Math.floor(rnd(h+13)*18);
  for (let i = 0; i < n; i++) { const a = rnd(h+i*3)*Math.PI*2, r = Math.sqrt(rnd(h+i*5))*R, fx = bx + Math.cos(a)*r, fy = cyc - Math.abs(Math.sin(a))*r*0.7 - (rnd(h+i)-0.5)*4;
    g += floret(fx, fy, 2.1 + rnd(h+i)*1.4, fcol(h+i*7), h+i*11); }
  return g;
}
function archPoppy(c) {
  const { h, bx, gy, green, fcol } = c, n = 2 + Math.floor(rnd(h+11)*3);
  let g = "";
  for (let j = 0; j < 3; j++) g += broadLeaf(bx+(rnd(h+j)-0.5)*20, gy, (j-1)*38, 26+rnd(h+j)*16, h+j, green);
  for (let i = 0; i < n; i++) { const H = (62+rnd(h+i*3)*55)*c.scale, rx = bx+(i-(n-1)/2)*18+(rnd(h+i)-0.5)*8, top = pt(rx, gy, (rnd(h+i)-0.5)*22, H), col = fcol(h+i*7), sc = 1.9+rnd(h+i)*0.9;
    g += `<path d="M${rx.toFixed(1)} ${gy} Q ${(rx+(rnd(h+i)-0.5)*14).toFixed(1)} ${(gy-H*0.6).toFixed(1)}, ${top.x.toFixed(1)} ${top.y.toFixed(1)}" stroke="${green}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    const pn = 5 + Math.floor(rnd(h+i)*2); let f = `<g class="bloom">`; const rot = rnd(h+i)*360;
    for (let k = 0; k < pn; k++) { const s = h+i*9+k; const ang = rot + k*360/pn + (rnd(s)-0.5)*24; f += petal(top.x, top.y, ang, sc*6.5*(0.85+rnd(s+1)*0.3), sc*8.5*(0.8+rnd(s+2)*0.4), shade(col, 0.82+rnd(s+3)*0.26)); }
    f += `<circle cx="${top.x.toFixed(1)}" cy="${top.y.toFixed(1)}" r="${(sc*2.3).toFixed(1)}" fill="#3a2f2f"/>`;
    for (let d = 0; d < 9; d++) { const a = d*40*Math.PI/180; f += `<circle cx="${(top.x+Math.cos(a)*sc*2.1).toFixed(1)}" cy="${(top.y+Math.sin(a)*sc*2.1).toFixed(1)}" r="${(sc*0.5).toFixed(1)}" fill="#5a4a30"/>`; }
    g += f + `</g>`; }
  return g;
}
function archCosmos(c) {
  const { h, bx, gy, green } = c, n = 4 + Math.floor(rnd(h+11)*4);
  let g = "";
  for (let j = 0; j < 4; j++) g += frond(bx+(rnd(h+j)-0.5)*24, gy, (j-1.5)*22, 28+rnd(h+j)*20, h+j*3, green);
  for (let i = 0; i < n; i++) { const H = (62+rnd(h+i*3)*60)*c.scale, rx = bx+(rnd(h+i*2)-0.5)*48, top = pt(rx, gy, (rnd(h+i)-0.5)*26, H);
    g += `<path d="M${rx.toFixed(1)} ${gy} Q ${(rx+(rnd(h+i)-0.5)*18).toFixed(1)} ${(gy-H*0.55).toFixed(1)}, ${top.x.toFixed(1)} ${top.y.toFixed(1)}" stroke="${green}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    g += flower(top.x, top.y, 1+rnd(h+i)*0.5, h+i*7, FLOWERS[Math.floor(rnd(h+i*5)*FLOWERS.length)]); }
  return g;
}
function archWisteria(c) {
  const { h, bx, gy, green } = c, n = 2 + Math.floor(rnd(h+11)*3), PUR = ["#ad8ad6","#c89bd6","#b58ad9","#9a7fc4","#ef9ac0","#f4a6c0"];
  let g = "";
  for (let i = 0; i < n; i++) { const dir = i%2?1:-1, H = (60+rnd(h+i*3)*45)*c.scale, top = pt(bx, gy, dir*(15+rnd(h+i)*20), H), col = PUR[Math.floor(rnd(h+i)*PUR.length)];
    g += `<path d="M${bx.toFixed(1)} ${gy} Q ${(bx+dir*14).toFixed(1)} ${(gy-H*0.7).toFixed(1)}, ${top.x.toFixed(1)} ${top.y.toFixed(1)}" stroke="${green}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    const len = (26+rnd(h+i)*22)*c.scale;
    for (let d = 0; d < 9; d++) { const t = d/9, fx = top.x+(rnd(h+i+d)-0.5)*9, fy = top.y+t*len, sc = (1-t*0.5)*(0.8+rnd(h+i+d)*0.5);
      g += `<ellipse cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" rx="${(2.4*sc).toFixed(1)}" ry="${(3.4*sc).toFixed(1)}" fill="${shade(col, 0.8+rnd(h+i+d)*0.3)}"/>`; } }
  for (let j = 0; j < 3; j++) g += broadLeaf(bx+(rnd(h+j)-0.5)*16, gy, (j-1)*34, 22+rnd(h+j)*12, h+j, green);
  return g;
}
function archToadstools(c) {
  const { h, bx, gy, green } = c, n = 4 + Math.floor(rnd(h+11)*4), CAPS = ["#e8554e","#ef7fa6","#f3b24d","#ad8ad6","#8fb7e8","#e0907a","#f0a33b"];
  let g = "";
  for (let j = 0; j < 5; j++) { const rx = bx+(rnd(h+j*2)-0.5)*46, o = pt(rx, gy, (rnd(h+j)-0.5)*44, 10+rnd(h+j)*10); g += `<path d="M${rx.toFixed(1)} ${gy} L ${o.x.toFixed(1)} ${o.y.toFixed(1)}" stroke="${shade(green,0.9)}" stroke-width="1.6" stroke-linecap="round"/>`; }
  for (let i = 0; i < n; i++) { const mx = bx+(i-(n-1)/2)*18+(rnd(h+i*2)-0.5)*10, hgt = (16+rnd(h+i*3)*30)*c.scale, cw = (12+rnd(h+i)*16)*c.scale, cap = CAPS[Math.floor(rnd(h+i+1)*CAPS.length)];
    g += `<path d="M${mx.toFixed(1)} ${gy} q ${((rnd(h+i)-0.5)*7).toFixed(1)} ${(-hgt*0.5).toFixed(1)}, 0 ${(-hgt).toFixed(1)}" stroke="#efe6d2" stroke-width="${(cw*0.34).toFixed(1)}" fill="none" stroke-linecap="round"/>`;
    g += `<path d="M${(mx-cw/2).toFixed(1)} ${(gy-hgt).toFixed(1)} a ${(cw/2).toFixed(1)} ${(cw*0.62).toFixed(1)} 0 0 1 ${cw.toFixed(1)} 0 z" fill="${cap}"/>`;
    g += `<path d="M${(mx-cw/2).toFixed(1)} ${(gy-hgt).toFixed(1)} a ${(cw/2).toFixed(1)} ${(cw*0.62).toFixed(1)} 0 0 1 ${cw.toFixed(1)} 0" fill="${shade(cap,0.78)}" opacity="0.35"/>`;
    for (let s = 0; s < 4; s++) g += `<circle cx="${(mx-cw/3+rnd(h+i+s)*cw*0.66).toFixed(1)}" cy="${(gy-hgt-cw*0.18+rnd(h+i+s)*4).toFixed(1)}" r="${(1.2+rnd(h+i+s)*1.3).toFixed(1)}" fill="#fff3e0"/>`; }
  return g;
}
const SPECIES = [archSpike, archBush, archFern, archDaisy, archPalm, archVine, archRosette, archTree,
  archCactus, archGrass, archBells, archMushrooms, archSunflower, archLavender, archDandelion,
  archHydrangea, archPoppy, archCosmos, archWisteria, archToadstools];
function richPlant(m) {
  const h = strHash(m.id), bx = baseXof(m), gy = groundY + 2;
  const green = GREENS[Math.floor(rnd(h+1) * GREENS.length)], green2 = GREENS[Math.floor(rnd(h+2) * GREENS.length)], green3 = GREENS[Math.floor(rnd(h+6) * GREENS.length)];
  const primary = FLOWERS[Math.floor(rnd(h+3) * FLOWERS.length)], secondary = FLOWERS[Math.floor(rnd(h+4) * FLOWERS.length)];
  const multicolor = rnd(h+5) < 0.55;
  const fcol = (seed) => multicolor ? FLOWERS[Math.floor(rnd(seed) * FLOWERS.length)] : (rnd(seed) < 0.78 ? primary : secondary);
  const ctx = { h, bx, gy, green, green2, green3, fcol, scale: 1.05 + rnd(h+7) * 0.7 };
  return SPECIES[Math.floor(rnd(h+9) * SPECIES.length)](ctx);
}

// ---- critters ----
function cButterfly(seed) {
  const c1 = BFLY[Math.floor(rnd(seed)*BFLY.length)], c2 = BFLY[Math.floor(rnd(seed+1)*BFLY.length)];
  const sc = 0.7 + rnd(seed+2)*0.8, spots = rnd(seed+4) < 0.55, st = Math.floor(rnd(seed+5)*3);
  const uw = st === 0 ? {rx:5,ry:6} : st === 1 ? {rx:6,ry:5} : {rx:4.5,ry:7};
  const wing = (dx,dy,rx,ry,rot) => `<ellipse cx="${(dx*sc).toFixed(1)}" cy="${(dy*sc).toFixed(1)}" rx="${(rx*sc).toFixed(1)}" ry="${(ry*sc).toFixed(1)}" fill="${c1}" stroke="${c2}" stroke-width="${(0.6*sc).toFixed(1)}" transform="rotate(${rot} ${(dx*sc).toFixed(1)} ${(dy*sc).toFixed(1)})"/>`
    + (spots ? `<circle cx="${(dx*sc).toFixed(1)}" cy="${(dy*sc).toFixed(1)}" r="${(1.4*sc).toFixed(1)}" fill="${c2}"/>` : "");
  return `<g class="bfly-wings" style="animation-duration:${(0.28+rnd(seed+6)*0.25).toFixed(2)}s">`
    + wing(-4,-2,uw.rx,uw.ry,-22) + wing(4,-2,uw.rx,uw.ry,22) + wing(-3.4,3.5,uw.rx*0.8,uw.ry*0.7,22) + wing(3.4,3.5,uw.rx*0.8,uw.ry*0.7,-22) + `</g>`
    + `<ellipse cx="0" cy="0" rx="${(1.3*sc).toFixed(1)}" ry="${(6*sc).toFixed(1)}" fill="#3a2f2f"/><circle cx="0" cy="${(-6*sc).toFixed(1)}" r="${(1.5*sc).toFixed(1)}" fill="#3a2f2f"/>`
    + `<path d="M0 ${(-7*sc).toFixed(1)} q ${(-3*sc).toFixed(1)} ${(-3*sc).toFixed(1)}, ${(-4*sc).toFixed(1)} ${(-6*sc).toFixed(1)}" stroke="#3a2f2f" stroke-width="0.5" fill="none"/><path d="M0 ${(-7*sc).toFixed(1)} q ${(3*sc).toFixed(1)} ${(-3*sc).toFixed(1)}, ${(4*sc).toFixed(1)} ${(-6*sc).toFixed(1)}" stroke="#3a2f2f" stroke-width="0.5" fill="none"/>`;
}
function cLadybug(seed) {
  const col = BUG[Math.floor(rnd(seed)*BUG.length)], sc = 0.8 + rnd(seed+2)*0.7, dk = "#2f2a28";
  let g = `<ellipse cx="0" cy="1" rx="${(6*sc).toFixed(1)}" ry="${(7*sc).toFixed(1)}" fill="${col}"/>`;
  g += `<line x1="0" y1="${(-5*sc).toFixed(1)}" x2="0" y2="${(8*sc).toFixed(1)}" stroke="${dk}" stroke-width="${(0.7*sc).toFixed(1)}"/>`;
  g += `<ellipse cx="0" cy="${(-6*sc).toFixed(1)}" rx="${(3.4*sc).toFixed(1)}" ry="${(3*sc).toFixed(1)}" fill="${dk}"/>`;
  for (let s = 0; s < 5; s++) { const a = rnd(seed+s*3)*Math.PI*2, r = rnd(seed+s*5)*4.5*sc; g += `<circle cx="${(Math.cos(a)*r).toFixed(1)}" cy="${(1+Math.sin(a)*r).toFixed(1)}" r="${(1+rnd(seed+s)*0.8).toFixed(1)}" fill="${dk}"/>`; }
  for (const sd of [-1,1]) for (let l = 0; l < 3; l++) g += `<line x1="0" y1="${((-2+l*4)*sc).toFixed(1)}" x2="${(sd*8*sc).toFixed(1)}" y2="${((-4+l*4)*sc).toFixed(1)}" stroke="${dk}" stroke-width="${(0.6*sc).toFixed(1)}"/>`;
  return g;
}
function cFrog(seed) {
  const FR = ["#6aa86b","#74b06f","#8cbf7e","#5f9e63","#86c07a","#9bd1a0","#5fa37e","#b6c96a","#4f8f6a"];
  const col = FR[Math.floor(rnd(seed)*FR.length)], dk = shade(col, 0.74), belly = tint(col, 0.52), sc = 0.85 + rnd(seed+2)*0.7;
  let g = "";
  for (const sd of [-1,1]) g += `<ellipse cx="${(sd*7.6*sc).toFixed(1)}" cy="${(3.5*sc).toFixed(1)}" rx="${(4.3*sc).toFixed(1)}" ry="${(3.2*sc).toFixed(1)}" fill="${dk}" transform="rotate(${sd*18} ${(sd*7.6*sc).toFixed(1)} ${(3.5*sc).toFixed(1)})"/>`;
  for (const sd of [-1,1]) g += `<ellipse cx="${(sd*4.6*sc).toFixed(1)}" cy="${(8.6*sc).toFixed(1)}" rx="${(2.7*sc).toFixed(1)}" ry="${(1.5*sc).toFixed(1)}" fill="${dk}"/>`;
  g += `<ellipse cx="0" cy="${(2*sc).toFixed(1)}" rx="${(8*sc).toFixed(1)}" ry="${(6.6*sc).toFixed(1)}" fill="${col}"/>`;
  g += `<ellipse cx="0" cy="${(5*sc).toFixed(1)}" rx="${(5*sc).toFixed(1)}" ry="${(3.6*sc).toFixed(1)}" fill="${belly}"/>`;
  if (rnd(seed+5) < 0.55) for (let s = 0; s < 3; s++) g += `<circle cx="${((rnd(seed+s)-0.5)*9*sc).toFixed(1)}" cy="${((-1+rnd(seed+s+1)*3)*sc).toFixed(1)}" r="${(1+rnd(seed+s)*0.9).toFixed(1)}" fill="${dk}"/>`;
  for (const sd of [-1,1]) { const ex = sd*3.6*sc, ey = -4.6*sc; g += `<circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="${(2.9*sc).toFixed(1)}" fill="${col}"/><circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="${(1.7*sc).toFixed(1)}" fill="#fff"/><circle cx="${(ex+sd*0.3).toFixed(1)}" cy="${ey.toFixed(1)}" r="${(0.9*sc).toFixed(1)}" fill="#2f2a28"/>`; }
  g += `<path d="M${(-3.6*sc).toFixed(1)} ${(2.4*sc).toFixed(1)} Q 0 ${(5.6*sc).toFixed(1)} ${(3.6*sc).toFixed(1)} ${(2.4*sc).toFixed(1)}" stroke="${dk}" stroke-width="${(0.9*sc).toFixed(1)}" fill="none" stroke-linecap="round"/>`;
  return g;
}
function cCaterpillar(seed) {
  const base = ["#7ec46f","#f6d04a","#f39a2d","#ef5a8a","#9b5fb0","#5fa3c4","#e0662e"][Math.floor(rnd(seed)*7)];
  const sc = 0.8 + rnd(seed+2)*0.6, n = 5 + Math.floor(rnd(seed+3)*3);
  let g = "";
  for (let i = n - 1; i >= 0; i--) { const x = (i-(n-1)/2)*4.2*sc, y = -Math.sin(i/(n-1)*Math.PI)*2*sc, r = (3 - (i===n-1?0:0.2))*sc*(0.9+rnd(seed+i)*0.25);
    g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${shade(base, 0.8+rnd(seed+i)*0.3)}"/>`; }
  const hx = (-(n-1)/2)*4.2*sc - 1*sc;
  g += `<circle cx="${hx.toFixed(1)}" cy="${(-1*sc).toFixed(1)}" r="${(1*sc).toFixed(1)}" fill="#2f2a28"/>`;
  g += `<line x1="${hx.toFixed(1)}" y1="${(-3*sc).toFixed(1)}" x2="${(hx-2*sc).toFixed(1)}" y2="${(-6*sc).toFixed(1)}" stroke="#2f2a28" stroke-width="0.6"/>`;
  return g;
}
function cBee(seed) {
  const sc = 0.8 + rnd(seed+2)*0.6;
  let g = `<g class="bfly-wings" style="animation-duration:${(0.2+rnd(seed+6)*0.16).toFixed(2)}s">`
    + `<ellipse cx="${(-2.6*sc).toFixed(1)}" cy="${(-3*sc).toFixed(1)}" rx="${(3.6*sc).toFixed(1)}" ry="${(5*sc).toFixed(1)}" fill="#ffffff" opacity="0.55" stroke="#d8d8d8" stroke-width="0.4" transform="rotate(-22 ${(-2.6*sc).toFixed(1)} ${(-3*sc).toFixed(1)})"/>`
    + `<ellipse cx="${(2.6*sc).toFixed(1)}" cy="${(-3*sc).toFixed(1)}" rx="${(3.6*sc).toFixed(1)}" ry="${(5*sc).toFixed(1)}" fill="#ffffff" opacity="0.55" stroke="#d8d8d8" stroke-width="0.4" transform="rotate(22 ${(2.6*sc).toFixed(1)} ${(-3*sc).toFixed(1)})"/>` + `</g>`;
  g += `<ellipse cx="0" cy="2" rx="${(4.6*sc).toFixed(1)}" ry="${(6.2*sc).toFixed(1)}" fill="#f6c544"/>`;
  g += `<ellipse cx="0" cy="${(-0.6*sc).toFixed(1)}" rx="${(4.4*sc).toFixed(1)}" ry="${(1.3*sc).toFixed(1)}" fill="#2f2a28"/><ellipse cx="0" cy="${(3.4*sc).toFixed(1)}" rx="${(3.5*sc).toFixed(1)}" ry="${(1.2*sc).toFixed(1)}" fill="#2f2a28"/>`;
  g += `<circle cx="0" cy="${(-5.4*sc).toFixed(1)}" r="${(2.4*sc).toFixed(1)}" fill="#2f2a28"/>`;
  g += `<line x1="0" y1="${(-7*sc).toFixed(1)}" x2="${(-1.8*sc).toFixed(1)}" y2="${(-9.4*sc).toFixed(1)}" stroke="#2f2a28" stroke-width="0.5"/><line x1="0" y1="${(-7*sc).toFixed(1)}" x2="${(1.8*sc).toFixed(1)}" y2="${(-9.4*sc).toFixed(1)}" stroke="#2f2a28" stroke-width="0.5"/>`;
  return g;
}
function cSnail(seed) {
  const sc = 0.8 + rnd(seed+2)*0.6, shellc = ["#e0907a","#f3b24d","#ef7fa6","#c98a90","#d9a05b","#ad8ad6"][Math.floor(rnd(seed)*6)], bodyc = "#dcc9ad";
  let g = `<ellipse cx="0" cy="${(6*sc).toFixed(1)}" rx="${(9*sc).toFixed(1)}" ry="${(3*sc).toFixed(1)}" fill="${bodyc}"/>`;
  g += `<path d="M${(5*sc).toFixed(1)} ${(6*sc).toFixed(1)} Q ${(9.5*sc).toFixed(1)} ${(6*sc).toFixed(1)} ${(9.5*sc).toFixed(1)} ${(0.5*sc).toFixed(1)}" stroke="${bodyc}" stroke-width="${(3*sc).toFixed(1)}" fill="none" stroke-linecap="round"/>`;
  g += `<circle cx="${(9.5*sc).toFixed(1)}" cy="0" r="${(2.2*sc).toFixed(1)}" fill="${bodyc}"/>`;
  g += `<line x1="${(9.5*sc).toFixed(1)}" y1="${(-1.6*sc).toFixed(1)}" x2="${(11*sc).toFixed(1)}" y2="${(-4.5*sc).toFixed(1)}" stroke="${bodyc}" stroke-width="0.8"/><circle cx="${(11*sc).toFixed(1)}" cy="${(-4.5*sc).toFixed(1)}" r="0.9" fill="#2f2a28"/>`;
  g += `<line x1="${(8*sc).toFixed(1)}" y1="${(-1.6*sc).toFixed(1)}" x2="${(7*sc).toFixed(1)}" y2="${(-4.5*sc).toFixed(1)}" stroke="${bodyc}" stroke-width="0.8"/><circle cx="${(7*sc).toFixed(1)}" cy="${(-4.5*sc).toFixed(1)}" r="0.9" fill="#2f2a28"/>`;
  g += `<circle cx="${(-1*sc).toFixed(1)}" cy="${(1*sc).toFixed(1)}" r="${(5.6*sc).toFixed(1)}" fill="${shellc}"/>`;
  g += `<circle cx="${(-1*sc).toFixed(1)}" cy="${(1*sc).toFixed(1)}" r="${(3.6*sc).toFixed(1)}" fill="none" stroke="${shade(shellc,0.74)}" stroke-width="1"/><circle cx="${(-1*sc).toFixed(1)}" cy="${(1*sc).toFixed(1)}" r="${(1.8*sc).toFixed(1)}" fill="none" stroke="${shade(shellc,0.74)}" stroke-width="1"/>`;
  return g;
}
function critterSVG(seed, type) {
  const inner = type === "ladybug" ? cLadybug(seed) : type === "frog" ? cFrog(seed) : type === "caterpillar" ? cCaterpillar(seed)
    : type === "bee" ? cBee(seed) : type === "snail" ? cSnail(seed) : cButterfly(seed);
  return `<g class="bfly-enter"><g class="bfly-flit" style="animation-duration:${(2.6 + rnd(seed+7)*2.6).toFixed(2)}s">${inner}</g></g>`;
}

// =============================================================
// Data + rendering (Supabase-backed)
// =============================================================
let items = [], sessions = [], phases = [];

function extraCats() { try { return JSON.parse(localStorage.getItem(EXTRA_CATS_KEY) || "[]"); } catch { return []; } }
function saveExtraCats(arr) { localStorage.setItem(EXTRA_CATS_KEY, JSON.stringify(arr)); }
function phaseOrder() { try { return JSON.parse(localStorage.getItem(PHASE_ORDER_KEY) || "[]"); } catch { return []; } }
function savePhaseOrder(arr) { localStorage.setItem(PHASE_ORDER_KEY, JSON.stringify(arr)); }
function derivePhases() {
  const present = new Set(items.map(m => m.phase).filter(Boolean));
  const all = [...DEFAULT_PHASES];
  extraCats().forEach(p => { if (!all.includes(p)) all.push(p); });
  [...present].forEach(p => { if (!all.includes(p)) all.push(p); });
  // apply the user's saved drag order; anything new sticks to the end
  const saved = phaseOrder().filter(p => all.includes(p));
  const rest = all.filter(p => !saved.includes(p));
  return [...saved, ...rest];
}
function doneList() { return items.filter(m => m.done); }

function initScenery() {
  document.getElementById("scenery").innerHTML =
    `<g opacity="0.7"><circle cx="58" cy="46" r="19" fill="#f6d98a"/></g>`
    + `<rect x="0" y="${groundY}" width="${W}" height="${H - groundY}" fill="#caa97f"/>`
    + `<rect x="0" y="${groundY}" width="${W}" height="8" fill="#b8966c"/>`;
}

function syncGarden() {
  const dl = doneList(), doneIds = new Set(dl.map(m => m.id));
  const seeds = items.filter(m => !m.done);
  const plantsG = document.getElementById("plants"), seedsG = document.getElementById("seeds");
  [...plantsG.children].forEach(c => { if (!doneIds.has(c.dataset.id)) c.remove(); });
  dl.forEach(m => {
    let g = plantsG.querySelector(`g[data-id="${m.id}"]`);
    if (!g) {
      g = document.createElementNS(NS, "g"); g.setAttribute("class", "plant-sway"); g.dataset.id = m.id; g.dataset.title = m.title;
      g.style.animationDelay = (rnd(strHash(m.id)) * 3).toFixed(2) + "s";
      g.innerHTML = `<g class="pop-in">${richPlant(m)}</g>`;
      plantsG.appendChild(g);
    } else { g.dataset.title = m.title; }
  });
  const seedIds = new Set(seeds.map(m => m.id));
  [...seedsG.children].forEach(c => { if (!seedIds.has(c.dataset.id)) c.remove(); });
  seeds.forEach(m => { let g = seedsG.querySelector(`g[data-id="${m.id}"]`);
    if (!g) { g = document.createElementNS(NS, "g"); g.dataset.id = m.id; g.innerHTML = drawSeed(m); seedsG.appendChild(g); }
    g.dataset.title = m.title; });
}

const CLUSTER_COLORS = ["cl-rose", "cl-peach", "cl-lavender", "cl-mint", "cl-butter", "cl-sky", "cl-blush", "cl-sage"];
function renderWeb() {
  phases = derivePhases();
  const groups = {}; items.forEach(m => { (groups[m.phase] = groups[m.phase] || []).push(m); });
  const clusterHtml = (phase, colorClass, wide) => {
    const ms = groups[phase] || [], done = ms.filter(m => m.done).length;
    // completed milestones sink to the bottom of the cluster
    const sorted = ms.slice().sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0));
    const bubbles = sorted.map(m => `<button class="bubble ${m.done ? 'lit' : ''}" data-ms="${m.id}">${esc(m.title)}<span class="bubble-x" data-rm="${m.id}">×</span></button>`).join("");
    return `<div class="cluster ${colorClass}${wide ? ' cluster-wide' : ''}" data-phase="${esc(phase)}">
      <div class="cluster-title">${wide ? '' : '<span class="cluster-grip" title="Drag to reorder" aria-hidden="true">⠿</span>'}${esc(phase)} <small>${done}/${ms.length}</small></div>
      <div class="cluster-bubbles">${bubbles}</div>
      <form class="add-milestone-form" data-phase="${esc(phase)}"><input type="text" placeholder="+ add a step, then Enter" aria-label="Add a step to ${esc(phase)}" /></form>
    </div>`;
  };
  const normal = phases.filter(p => p !== WIDE_PHASE);
  const groupsHtml = normal.map((phase, i) => clusterHtml(phase, CLUSTER_COLORS[i % CLUSTER_COLORS.length], false)).join("");
  const addCat = `<div class="cluster cluster-add"><button class="hub-add" id="add-cat" type="button">＋ category</button></div>`;
  const wideHtml = phases.includes(WIDE_PHASE) ? clusterHtml(WIDE_PHASE, "cl-lavender", true) : "";
  document.getElementById("web").innerHTML = `<div class="web-canvas">${groupsHtml}${addCat}${wideHtml}</div>`;
}
function renderCritters() {
  const g = document.getElementById("butterflies");
  const ids = new Set(sessions.map(s => s.id));
  [...g.children].forEach(c => { if (!ids.has(c.dataset.id)) c.remove(); });
  const dl = doneList();
  sessions.forEach(sess => {
    if (g.querySelector(`g[data-id="${sess.id}"]`)) return;
    const seed = strHash(sess.id);
    const type = (sess.critter && CRIT.includes(sess.critter)) ? sess.critter : CRIT[Math.floor(rnd(seed + 20) * CRIT.length)];
    const flying = type === "butterfly" || type === "bee";
    let x, y, rot;
    if (type === "ladybug" && dl.length) {
      const m2 = dl[Math.floor(rnd(seed + 21) * dl.length)];
      x = baseXof(m2) + (rnd(seed) - 0.5) * 30; y = groundY - (22 + rnd(seed + 1) * 72); rot = ((rnd(seed + 8) - 0.5) * 46).toFixed(1);
    } else if (flying) {
      x = MARGIN + rnd(seed) * (W - 2 * MARGIN); y = 60 + rnd(seed + 1) * (groundY - 118); rot = ((rnd(seed + 8) - 0.5) * 130).toFixed(1);
    } else {
      x = MARGIN + rnd(seed) * (W - 2 * MARGIN); y = groundY - 6 - rnd(seed + 1) * 30; rot = ((rnd(seed + 8) - 0.5) * 18).toFixed(1);
    }
    const flip = rnd(seed + 9) < 0.5 ? -1 : 1;
    const node = document.createElementNS(NS, "g");
    node.setAttribute("class", "bfly"); node.dataset.id = sess.id; node.dataset.title = EMO[type] + " " + sess.note;
    node.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot}) scale(${flip} 1)`);
    node.innerHTML = critterSVG(seed, type);
    g.appendChild(node);
  });
}

// ---- Supabase ops ----
async function loadAll() {
  const [mRes, sRes] = await Promise.all([
    window.sb.from("milestones").select("*").order("sort", { ascending: true }),
    window.sb.from("therapy_sessions").select("*").order("created_at", { ascending: true })
  ]);
  document.getElementById("web-status").style.display = "none";
  if (mRes.error) { document.getElementById("web").innerHTML = `<div class="banner banner-warn">Couldn't load milestones: ${esc(mRes.error.message)}. Have you run schema.sql?</div>`; return; }
  items = mRes.data || [];
  sessions = sRes.error ? [] : (sRes.data || []);
  initScenery(); syncGarden(); renderCritters(); renderWeb();
}
async function toggleMilestone(id) {
  const m = items.find(x => x.id === id); if (!m) return;
  const done = !m.done;
  const { error } = await window.sb.from("milestones").update({ done, done_on: done ? new Date().toISOString().slice(0,10) : null }).eq("id", id);
  if (error) { acShowError(error.message); return; }
  m.done = done; m.done_on = done ? new Date().toISOString().slice(0,10) : null;
  syncGarden(); renderWeb();
}
async function addMilestone(phase, title) {
  const { data, error } = await window.sb.from("milestones").insert({ title, phase, done: false }).select().single();
  if (error) { acShowError(error.message); return; }
  items.push(data); syncGarden(); renderWeb();
}
async function deleteMilestone(id) {
  if (!confirm("Delete this milestone?")) return;
  const { error } = await window.sb.from("milestones").delete().eq("id", id);
  if (error) { acShowError(error.message); return; }
  items = items.filter(m => m.id !== id); syncGarden(); renderWeb();
}
function addCategory(name) {
  name = name.trim(); if (!name) return;
  const cats = extraCats(); if (!derivePhases().includes(name)) { cats.push(name); saveExtraCats(cats); renderWeb(); }
}
async function addSession(note, critter) {
  const payload = critter ? { note, critter } : { note };
  let { data, error } = await window.sb.from("therapy_sessions").insert(payload).select().single();
  // Graceful fallback if the `critter` column hasn't been added in Supabase yet.
  if (error && critter && /critter/i.test(error.message)) {
    ({ data, error } = await window.sb.from("therapy_sessions").insert({ note }).select().single());
    if (!error) acShowError("Saved — but run the critter column SQL in Supabase to remember which critter you picked.");
  }
  if (error) { acShowError(error.message); return; }
  sessions.push(data); renderCritters();
}

// ---- events ----
document.getElementById("web").addEventListener("click", e => {
  if (e.target.closest("#add-cat")) { const name = prompt("New category name:"); if (name) addCategory(name); return; }
  const rm = e.target.closest("[data-rm]");
  if (rm) { e.stopPropagation(); deleteMilestone(rm.dataset.rm); return; }
  const b = e.target.closest("[data-ms]");
  if (b) toggleMilestone(b.dataset.ms);
});
document.getElementById("web").addEventListener("submit", e => {
  const f = e.target.closest(".add-milestone-form"); if (!f) return;
  e.preventDefault(); const i = f.querySelector("input");
  if (i.value.trim()) { addMilestone(f.dataset.phase, i.value.trim()); i.value = ""; }
});

// ---- drag to reorder category tiles ----
let dragSrc = null;
const webEl = document.getElementById("web");
// only let a drag start from the grip handle (keeps bubbles tappable)
webEl.addEventListener("mousedown", e => {
  const grip = e.target.closest(".cluster-grip");
  if (grip) { const c = grip.closest(".cluster"); if (c) c.setAttribute("draggable", "true"); }
});
const clearDraggable = () => webEl.querySelectorAll('.cluster[draggable="true"]').forEach(c => c.removeAttribute("draggable"));
webEl.addEventListener("mouseup", clearDraggable);
webEl.addEventListener("dragstart", e => {
  const c = e.target.closest('.cluster[draggable="true"]');
  if (!c || c.classList.contains("cluster-wide") || c.classList.contains("cluster-add")) { e.preventDefault(); return; }
  dragSrc = c; c.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  try { e.dataTransfer.setData("text/plain", c.dataset.phase || ""); } catch {}
});
webEl.addEventListener("dragover", e => {
  if (!dragSrc) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  const over = e.target.closest(".cluster[data-phase]");
  if (!over || over === dragSrc || over.classList.contains("cluster-wide") || over.classList.contains("cluster-add")) return;
  const rect = over.getBoundingClientRect();
  const after = (e.clientY - rect.top) / rect.height > 0.5;
  over.parentNode.insertBefore(dragSrc, after ? over.nextSibling : over);
});
webEl.addEventListener("drop", e => { if (dragSrc) e.preventDefault(); });
webEl.addEventListener("dragend", () => {
  if (!dragSrc) return;
  dragSrc.classList.remove("dragging");
  const canvas = dragSrc.parentNode;
  // persist the new left-to-right order, ignoring the +category and wide tiles
  const order = [...canvas.querySelectorAll(".cluster[data-phase]")]
    .filter(c => !c.classList.contains("cluster-wide"))
    .map(c => c.dataset.phase);
  savePhaseOrder(order);
  clearDraggable();
  dragSrc = null;
});

// therapy modal
const tmodal = document.getElementById("therapy-modal");

// Critter picker: a fresh random variant of each type to choose from.
let chosenCritter = CRIT[0];
function buildCritterPicker() {
  const wrap = document.getElementById("critter-picker");
  if (!wrap) return;
  const base = Math.floor(Math.random() * 1e9);
  const order = CRIT.map((t, i) => ({ t, r: rnd(base + i * 31) })).sort((a, b) => a.r - b.r).map(o => o.t);
  wrap.innerHTML = order.map((t, i) =>
    `<button type="button" class="critter-opt${i === 0 ? " sel" : ""}" data-type="${t}" title="${t}"><svg viewBox="-22 -22 44 44" xmlns="http://www.w3.org/2000/svg">${critterSVG(base + i * 101 + 7, t)}</svg></button>`
  ).join("");
  chosenCritter = order[0];
}
document.getElementById("critter-picker").addEventListener("click", e => {
  const opt = e.target.closest(".critter-opt"); if (!opt) return;
  chosenCritter = opt.dataset.type;
  document.querySelectorAll("#critter-picker .critter-opt").forEach(o => o.classList.toggle("sel", o === opt));
});

document.getElementById("therapy").addEventListener("click", () => { document.getElementById("therapy-note").value = ""; buildCritterPicker(); tmodal.classList.add("open"); setTimeout(() => document.getElementById("therapy-note").focus(), 50); });
document.getElementById("therapy-cancel").addEventListener("click", () => tmodal.classList.remove("open"));
tmodal.addEventListener("click", e => { if (e.target === tmodal) tmodal.classList.remove("open"); });
document.getElementById("therapy-form").addEventListener("submit", e => {
  e.preventDefault(); const n = document.getElementById("therapy-note").value.trim(); if (!n) return;
  tmodal.classList.remove("open"); addSession(n, chosenCritter);
});

// tooltip
const tip = document.getElementById("tip"), gardenEl = document.getElementById("garden");
gardenEl.addEventListener("mousemove", e => {
  const host = e.target.closest("[data-title]");
  if (host) { tip.textContent = host.dataset.title; tip.style.display = "block"; tip.style.left = (e.clientX + 14) + "px"; tip.style.top = (e.clientY + 14) + "px"; }
  else tip.style.display = "none";
});
gardenEl.addEventListener("mouseleave", () => { tip.style.display = "none"; });

(async () => {
  const session = await window.acAuth.requireAuth();
  if (!session) return;
  window.acAuth.paintNav(session);
  document.body.style.visibility = "visible";
  initScenery();
  loadAll();
})();
