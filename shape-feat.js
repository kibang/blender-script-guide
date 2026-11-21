/* 이미지 → 모델링 계획: 실루엣(외곽 모양) 특징 추출 + 유사도.
   브라우저와 node(빌드·테스트)가 같은 코드를 사용합니다. Shape features shared by browser and node. */
(function(root){
"use strict";
var G = 64;            // normalized grid
var NP = 16;           // profile bins
var NR = 32;           // radial bins

/* ---------- segmentation ---------- */
// rgba: W*H*4 bytes. Returns Uint8Array mask (1 = object).
// alpha channel wins if the image has real transparency; otherwise background = border colour.
function segment(rgba, W, H, box){
  var n = W * H, m = new Uint8Array(n), i, x, y;
  var transp = 0;
  for(i = 0; i < n; i++) if(rgba[i * 4 + 3] < 200) transp++;
  if(transp > 0.05 * n){
    for(i = 0; i < n; i++) m[i] = rgba[i * 4 + 3] >= 128 ? 1 : 0;
  } else {
    // border colour statistics (Lab-ish via simple RGB distance, robust median)
    var bx0 = box ? box[0] : 0, by0 = box ? box[1] : 0, bx1 = box ? box[2] : W - 1, by1 = box ? box[3] : H - 1;
    var bord = [];
    for(x = bx0; x <= bx1; x++){ bord.push(idx(x, by0)); bord.push(idx(x, by1)); }
    for(y = by0; y <= by1; y++){ bord.push(idx(bx0, y)); bord.push(idx(bx1, y)); }
    function idx(xx, yy){ return (yy * W + xx) * 4; }
    // k=2 clustering of border colours handles two-tone backgrounds (wall + floor)
    var cols = bord.map(function(p){ return [rgba[p], rgba[p + 1], rgba[p + 2]]; });
    var cents = kmeans(cols, 3);
    var d = new Float32Array(n), dmax = 0;
    for(y = 0; y < H; y++) for(x = 0; x < W; x++){
      i = y * W + x;
      if(box && (x < bx0 || x > bx1 || y < by0 || y > by1)){ d[i] = 0; continue; }
      var p = i * 4, best = 1e9;
      for(var c = 0; c < cents.length; c++){
        var dr = rgba[p] - cents[c][0], dg = rgba[p + 1] - cents[c][1], db = rgba[p + 2] - cents[c][2];
        var dd = Math.sqrt(dr * dr * 0.8 + dg * dg + db * db * 0.7);
        if(dd < best) best = dd;
      }
      d[i] = best; if(best > dmax) dmax = best;
    }
    var th = Math.max(28, otsu(d, dmax) * 0.85);
    for(i = 0; i < n; i++) m[i] = d[i] > th ? 1 : 0;
    m = morph(m, W, H, 1, true); m = morph(m, W, H, 1, false);   // close small gaps
  }
  m = largest(m, W, H);
  if(transp <= 0.05 * n && REFINE.on) m = refine(rgba, W, H, m, box);
  return m;
}
/* GrabCut-lite: re-estimate object / background colour histograms from the first mask, add a soft
   "object is near the middle" prior and a little spatial smoothing, and re-label; a few rounds.
   Helps busy or two-tone backgrounds (floor + wall, sky + ground). */
var REFINE = {on: true, iters: 4, prior: 1.2, smooth: 3, band: 0.06};   // chosen on the dev photo split (tools/exp_seg.js)
function refine(rgba, W, H, m0, box){
  var n = W * H, i, x, y, it, m = m0, Q = 16, NB = Q * Q * Q;
  var area0 = 0; for(i = 0; i < n; i++) area0 += m[i];
  if(area0 < 0.01 * n) return m0;
  var bin = new Uint16Array(n);
  for(i = 0; i < n; i++) bin[i] = ((rgba[i * 4] >> 4) * Q + (rgba[i * 4 + 1] >> 4)) * Q + (rgba[i * 4 + 2] >> 4);
  var bx0 = box ? box[0] : 0, by0 = box ? box[1] : 0, bx1 = box ? box[2] : W - 1, by1 = box ? box[3] : H - 1;
  var bw = bx1 - bx0 + 1, bh = by1 - by0 + 1, bandW = Math.max(2, Math.round(Math.min(bw, bh) * REFINE.band));
  for(it = 0; it < REFINE.iters; it++){
    var er = morph(m, W, H, 2, false), di = morph(morph(m, W, H, 2, true), W, H, 2, true);
    var hf = new Float32Array(NB), hb = new Float32Array(NB), nf = 0, nb = 0;
    for(y = by0; y <= by1; y++) for(x = bx0; x <= bx1; x++){
      i = y * W + x;
      var inBand = x - bx0 < bandW || bx1 - x < bandW || y - by0 < bandW || by1 - y < bandW;
      if(er[i]){ hf[bin[i]]++; nf++; }
      else if(!di[i] || inBand){ hb[bin[i]] += inBand ? 2 : 1; nb += inBand ? 2 : 1; }
    }
    if(nf < 50 || nb < 50) return m;
    // smooth histograms a little (neighbouring colour bins)
    hf = blur3(hf, Q); hb = blur3(hb, Q);
    var llr = new Float32Array(n), cxm = (bx0 + bx1) / 2, cym = (by0 + by1) / 2;
    for(y = 0; y < H; y++) for(x = 0; x < W; x++){
      i = y * W + x;
      if(x < bx0 || x > bx1 || y < by0 || y > by1){ llr[i] = -9; continue; }
      var pf = (hf[bin[i]] + 0.5) / (nf + NB * 0.5), pb = (hb[bin[i]] + 0.5) / (nb + NB * 0.5);
      var dx = (x - cxm) / (bw / 2), dy = (y - cym) / (bh / 2), r2 = dx * dx + dy * dy;
      llr[i] = Math.log(pf / pb) + REFINE.prior * (0.6 - r2);
    }
    llr = boxBlur(llr, W, H, REFINE.smooth);
    var mm = new Uint8Array(n); for(i = 0; i < n; i++) mm[i] = llr[i] > 0 ? 1 : 0;
    mm = morph(mm, W, H, 1, true); mm = morph(mm, W, H, 1, false);
    mm = largest(mm, W, H);
    var a = 0; for(i = 0; i < n; i++) a += mm[i];
    if(a < 0.2 * area0 || a < 0.01 * n) return m;      // refinement collapsed → keep the previous mask
    m = mm;
  }
  return m;
}
function blur3(h, Q){
  var o = new Float32Array(h.length);
  for(var r = 0; r < Q; r++) for(var g = 0; g < Q; g++) for(var b = 0; b < Q; b++){
    var s = 0;
    for(var dr = -1; dr <= 1; dr++) for(var dg = -1; dg <= 1; dg++) for(var db = -1; db <= 1; db++){
      var rr = r + dr, gg = g + dg, bb = b + db; if(rr < 0 || gg < 0 || bb < 0 || rr >= Q || gg >= Q || bb >= Q) continue;
      s += h[(rr * Q + gg) * Q + bb] * (dr || dg || db ? 0.35 : 1);
    }
    o[(r * Q + g) * Q + b] = s;
  }
  return o;
}
function boxBlur(a, W, H, r){
  if(r <= 0) return a;
  var t = new Float32Array(a.length), o = new Float32Array(a.length), x, y, k;
  for(y = 0; y < H; y++) for(x = 0; x < W; x++){ var s = 0, c = 0; for(k = -r; k <= r; k++){ var xx = x + k; if(xx >= 0 && xx < W){ s += a[y * W + xx]; c++; } } t[y * W + x] = s / c; }
  for(y = 0; y < H; y++) for(x = 0; x < W; x++){ var s2 = 0, c2 = 0; for(k = -r; k <= r; k++){ var yy = y + k; if(yy >= 0 && yy < H){ s2 += t[yy * W + x]; c2++; } } o[y * W + x] = s2 / c2; }
  return o;
}
function kmeans(pts, k){
  var c = [], i, j, it;
  pts = pts.slice().sort(function(a, b){ return (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]); });
  for(i = 0; i < k; i++) c.push(pts[Math.floor((i + 0.5) / k * pts.length)].slice());
  for(it = 0; it < 8; it++){
    var s = c.map(function(){ return [0, 0, 0, 0]; });
    for(i = 0; i < pts.length; i++){
      var b = 0, bd = 1e9;
      for(j = 0; j < k; j++){ var dd = Math.abs(pts[i][0] - c[j][0]) + Math.abs(pts[i][1] - c[j][1]) + Math.abs(pts[i][2] - c[j][2]); if(dd < bd){ bd = dd; b = j; } }
      s[b][0] += pts[i][0]; s[b][1] += pts[i][1]; s[b][2] += pts[i][2]; s[b][3]++;
    }
    for(j = 0; j < k; j++) if(s[j][3]) c[j] = [s[j][0] / s[j][3], s[j][1] / s[j][3], s[j][2] / s[j][3]];
  }
  // drop tiny clusters (likely object touching the border)
  return c;
}
function otsu(d, dmax){
  var B = 64, h = new Float64Array(B), n = d.length, i;
  for(i = 0; i < n; i++) h[Math.min(B - 1, Math.floor(d[i] / (dmax + 1e-6) * B))]++;
  var sum = 0; for(i = 0; i < B; i++) sum += i * h[i];
  var wB = 0, sB = 0, best = 0, bi = 0;
  for(i = 0; i < B; i++){
    wB += h[i]; if(!wB) continue; var wF = n - wB; if(!wF) break;
    sB += i * h[i]; var mB = sB / wB, mF = (sum - sB) / wF, v = wB * wF * (mB - mF) * (mB - mF);
    if(v > best){ best = v; bi = i; }
  }
  return (bi + 0.5) / B * dmax;
}
function morph(m, W, H, r, dilate){
  var o = new Uint8Array(m.length);
  for(var y = 0; y < H; y++) for(var x = 0; x < W; x++){
    var v = dilate ? 0 : 1;
    for(var dy = -r; dy <= r; dy++) for(var dx = -r; dx <= r; dx++){
      var xx = x + dx, yy = y + dy;
      var q = (xx < 0 || yy < 0 || xx >= W || yy >= H) ? 0 : m[yy * W + xx];
      if(dilate && q){ v = 1; } if(!dilate && !q){ v = 0; }
    }
    o[y * W + x] = v;
  }
  return o;
}
function components(m, W, H, val){
  var lab = new Int32Array(m.length).fill(-1), sizes = [], touches = [], st = [];
  for(var s = 0; s < m.length; s++){
    if(m[s] !== val || lab[s] >= 0) continue;
    var id = sizes.length, cnt = 0, tb = false; st.push(s); lab[s] = id;
    while(st.length){
      var p = st.pop(), x = p % W, y = (p - x) / W; cnt++;
      if(x === 0 || y === 0 || x === W - 1 || y === H - 1) tb = true;
      var nb = [p - 1, p + 1, p - W, p + W];
      for(var k = 0; k < 4; k++){
        var q = nb[k]; if(q < 0 || q >= m.length) continue;
        if((k === 0 && x === 0) || (k === 1 && x === W - 1)) continue;
        if(m[q] === val && lab[q] < 0){ lab[q] = id; st.push(q); }
      }
    }
    sizes.push(cnt); touches.push(tb);
  }
  return {lab: lab, sizes: sizes, touches: touches};
}
function largest(m, W, H){
  var c = components(m, W, H, 1); if(!c.sizes.length) return m;
  var b = 0; for(var i = 1; i < c.sizes.length; i++) if(c.sizes[i] > c.sizes[b]) b = i;
  var o = new Uint8Array(m.length); for(i = 0; i < m.length; i++) o[i] = c.lab[i] === b ? 1 : 0;
  return o;
}

/* ---------- features ---------- */
function features(m, W, H){
  var x0 = W, y0 = H, x1 = -1, y1 = -1, area = 0, x, y, i;
  for(y = 0; y < H; y++) for(x = 0; x < W; x++) if(m[y * W + x]){ area++; if(x < x0) x0 = x; if(x > x1) x1 = x; if(y < y0) y0 = y; if(y > y1) y1 = y; }
  if(area < 30) return null;
  var bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  // holes = background components fully inside the bbox that do not touch the image border
  var sub = new Uint8Array(bw * bh);
  for(y = 0; y < bh; y++) for(x = 0; x < bw; x++) sub[y * bw + x] = m[(y + y0) * W + x + x0];
  var bg = components(sub, bw, bh, 0), holeArea = 0, holes = 0;
  for(i = 0; i < bg.sizes.length; i++) if(!bg.touches[i] && bg.sizes[i] > area * 0.015){ holes++; holeArea += bg.sizes[i]; }
  // resample to G x G (non-uniform: aspect is a separate feature)
  var g = new Float32Array(G * G);
  for(y = 0; y < G; y++) for(x = 0; x < G; x++){
    var sx0 = Math.floor(x * bw / G), sx1 = Math.max(sx0 + 1, Math.floor((x + 1) * bw / G));
    var sy0 = Math.floor(y * bh / G), sy1 = Math.max(sy0 + 1, Math.floor((y + 1) * bh / G));
    var s = 0, c = 0;
    for(var yy = sy0; yy < sy1; yy++) for(var xx = sx0; xx < sx1; xx++){ s += sub[yy * bw + xx]; c++; }
    g[y * G + x] = s / c;
  }
  // width profile (rows) and height profile (cols)
  var wp = new Array(NP).fill(0), hp = new Array(NP).fill(0);
  for(y = 0; y < G; y++){ var r = 0; for(x = 0; x < G; x++) r += g[y * G + x]; wp[Math.floor(y * NP / G)] += r / G / (G / NP); }
  for(x = 0; x < G; x++){ var cc = 0; for(y = 0; y < G; y++) cc += g[y * G + x]; hp[Math.floor(x * NP / G)] += cc / G / (G / NP); }
  // symmetry left-right and top-bottom (IoU with mirror)
  var iLR = 0, uLR = 0, iTB = 0, uTB = 0;
  for(y = 0; y < G; y++) for(x = 0; x < G; x++){
    var a = g[y * G + x], b = g[y * G + (G - 1 - x)], c2 = g[(G - 1 - y) * G + x];
    iLR += Math.min(a, b); uLR += Math.max(a, b); iTB += Math.min(a, c2); uTB += Math.max(a, c2);
  }
  // convexity: area / convex hull area (on original pixels, using row extents → monotone chain)
  var pts = [];
  for(y = y0; y <= y1; y++){ var l = -1, rr = -1; for(x = x0; x <= x1; x++) if(m[y * W + x]){ if(l < 0) l = x; rr = x; } if(l >= 0){ pts.push([l, y]); pts.push([rr + 1, y]); pts.push([l, y + 1]); pts.push([rr + 1, y + 1]); } }
  var hullA = hullArea(pts);
  // radial signature from centroid in normalized square space
  var cx = 0, cy = 0, sw = 0;
  for(y = 0; y < G; y++) for(x = 0; x < G; x++){ var v = g[y * G + x]; cx += v * x; cy += v * y; sw += v; }
  cx /= sw; cy /= sw;
  var rad = new Array(NR).fill(0);
  for(y = 0; y < G; y++) for(x = 0; x < G; x++) if(g[y * G + x] > 0.5){
    var ang = Math.atan2(y - cy, x - cx), d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
    var k = Math.floor(((ang + Math.PI) / (2 * Math.PI)) * NR) % NR; if(d > rad[k]) rad[k] = d;
  }
  var rmax = Math.max.apply(null, rad) || 1; rad = rad.map(function(v){ return v / rmax; });
  // edge complexity: perimeter^2 / area (on grid)
  var per = 0;
  for(y = 0; y < G; y++) for(x = 0; x < G; x++) if(g[y * G + x] > 0.5){
    if(x === 0 || g[y * G + x - 1] <= 0.5) per++; if(x === G - 1 || g[y * G + x + 1] <= 0.5) per++;
    if(y === 0 || g[(y - 1) * G + x] <= 0.5) per++; if(y === G - 1 || g[(y + 1) * G + x] <= 0.5) per++;
  }
  var fillG = sw / (G * G);
  // periodicity of the width profile (repeated parts → Array)
  var rep = periodicity(g);
  var taper = (wp[0] + wp[1] + wp[2] + wp[3] + 1e-3) / (wp[12] + wp[13] + wp[14] + wp[15] + 1e-3);
  return {
    aspect: r3(Math.log(bh / bw)), fill: r3(area / (bw * bh)), convex: r3(Math.min(1, area / Math.max(hullA, 1))),
    symLR: r3(iLR / uLR), symTB: r3(iTB / uTB), holes: holes, holeFrac: r3(holeArea / (area + holeArea)),
    wp: wp.map(r3), hp: hp.map(r3), rad: rad.map(r3), complex: r3(per / Math.sqrt(sw) / 4), taper: r3(Math.log(taper)), rep: r3(rep),
    grid: packGrid(g)
  };
}
function periodicity(g){
  // max autocorrelation of column-occupancy along x and row-occupancy along y at lags 3..20
  function ac(arr){
    var n = arr.length, mean = arr.reduce(function(a, b){ return a + b; }, 0) / n, v = 0, i;
    for(i = 0; i < n; i++) v += (arr[i] - mean) * (arr[i] - mean);
    if(v < 1e-6) return 0;
    var best = 0;
    for(var lag = 4; lag <= 20; lag++){ var s = 0; for(i = 0; i + lag < n; i++) s += (arr[i] - mean) * (arr[i + lag] - mean); s /= v; if(s > best) best = s; }
    return best;
  }
  // use the middle rows/cols (where repetition like pickets, rungs, slats shows)
  var colOcc = [], rowOcc = [], x, y;
  for(x = 0; x < G; x++){ var s = 0; for(y = G * 0.3 | 0; y < G * 0.7; y++) s += g[y * G + x]; colOcc.push(s); }
  for(y = 0; y < G; y++){ var t = 0; for(x = G * 0.3 | 0; x < G * 0.7; x++) t += g[y * G + x]; rowOcc.push(t); }
  return Math.max(ac(colOcc), ac(rowOcc));
}
function hullArea(p){
  p.sort(function(a, b){ return a[0] - b[0] || a[1] - b[1]; });
  function cr(o, a, b){ return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }
  var lo = [], up = [], i;
  for(i = 0; i < p.length; i++){ while(lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p[i]) <= 0) lo.pop(); lo.push(p[i]); }
  for(i = p.length - 1; i >= 0; i--){ while(up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p[i]) <= 0) up.pop(); up.push(p[i]); }
  var h = lo.slice(0, -1).concat(up.slice(0, -1)), a = 0;
  for(i = 0; i < h.length; i++){ var j = (i + 1) % h.length; a += h[i][0] * h[j][1] - h[j][0] * h[i][1]; }
  return Math.abs(a) / 2;
}
function packGrid(g){ // 16x16 coarse occupancy for IoU
  var o = [], s = G / 16;
  for(var y = 0; y < 16; y++) for(var x = 0; x < 16; x++){ var t = 0; for(var yy = 0; yy < s; yy++) for(var xx = 0; xx < s; xx++) t += g[(y * s + yy) * G + x * s + xx]; o.push(Math.round(t / (s * s) * 100) / 100); }
  return o;
}
function r3(x){ return Math.round(x * 1000) / 1000; }

/* ---------- distance ---------- */
var W8 = {aspect: 1.2, fill: 1.0, convex: 1.4, symLR: 0.8, holes: 0.9, wp: 1.6, hp: 0.9, rad: 1.2, grid: 1.6, complex: 0.4, taper: 0.5, rep: 0.3};
function l1(a, b){ var s = 0; for(var i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length; }
function wpDist(a, b){ // allow the mirror (object upside down is rare, but left-right profile is fine)
  return l1(a, b);
}
function distance(a, b, w){
  w = w || W8;
  var p = {
    aspect: Math.min(1, Math.abs(a.aspect - b.aspect) / 1.2),
    fill: Math.abs(a.fill - b.fill) * 2,
    convex: Math.abs(a.convex - b.convex) * 2.5,
    symLR: Math.abs(a.symLR - b.symLR) * 2,
    holes: Math.min(1, Math.abs(Math.min(a.holes, 3) - Math.min(b.holes, 3)) / 2) * 0.5 + Math.min(1, Math.abs(a.holeFrac - b.holeFrac) * 4) * 0.5,
    wp: Math.min(l1(a.wp, b.wp), l1(a.wp, b.wp.slice().reverse()) + 0.08) * 2.5,
    hp: Math.min(l1(a.hp, b.hp), l1(a.hp, b.hp.slice().reverse())) * 2.5,
    rad: Math.min(l1(a.rad, b.rad), l1(a.rad, mirrorRad(b.rad))) * 3,
    grid: 1 - Math.max(iou(a.grid, b.grid), iou(a.grid, mirrorGrid(b.grid))),
    complex: Math.min(1, Math.abs(a.complex - b.complex) / 2),
    taper: Math.min(1, Math.abs(a.taper - b.taper) / 1.5),
    rep: Math.abs(a.rep - b.rep)
  };
  var s = 0, t = 0; for(var k in w){ s += w[k] * p[k]; t += w[k]; }
  return {d: s / t, parts: p};
}
function iou(a, b){ var i = 0, u = 0; for(var k = 0; k < a.length; k++){ i += Math.min(a[k], b[k]); u += Math.max(a[k], b[k]); } return u ? i / u : 0; }
function mirrorGrid(g){ var o = []; for(var y = 0; y < 16; y++) for(var x = 0; x < 16; x++) o.push(g[y * 16 + 15 - x]); return o; }
function mirrorRad(r){ // mirror x: angle θ → π-θ
  var n = r.length, o = new Array(n);
  for(var k = 0; k < n; k++){ var ang = (k + 0.5) / n * 2 * Math.PI - Math.PI, m = Math.PI - ang; if(m > Math.PI) m -= 2 * Math.PI; var j = Math.floor((m + Math.PI) / (2 * Math.PI) * n) % n; o[j] = r[k]; }
  return o;
}

/* ---------- matching + hints ---------- */
// lib: [{id, view, method, f}] ; returns ranked example ids with best view
function match(f, lib, topN){
  var best = {};
  for(var i = 0; i < lib.length; i++){
    var e = lib[i], r = distance(f, e.f);
    if(!best[e.id] || r.d < best[e.id].d) best[e.id] = {id: e.id, d: r.d, view: e.view, method: e.method, parts: r.parts};
  }
  var arr = Object.keys(best).map(function(k){ return best[k]; }).sort(function(a, b){ return a.d - b.d; });
  return arr.slice(0, topN || 5);
}
// generic primitive/method hints from shape alone (both workflows)
function hints(f){
  var H = [];
  var lathe = f.symLR > 0.92 && f.convex > 0.6 && Math.abs(f.aspect) > 0.15;  // thresholds tuned on the dev photo split (tools/tune.js)
  if(f.fill > 0.9 && f.convex > 0.95) H.push({k: "box", how_ko: "Object Mode Shift+A › Mesh › Cube → Tab → A → S → X/Y/Z → 값 → Enter → 2(선 모드) 모서리 선택 → Ctrl+B (Edge › Bevel Edges)", how_en: "Object Mode Shift+A › Mesh › Cube → Tab → A → S → X/Y/Z → value → Enter → 2 (edge mode) select edges → Ctrl+B (Edge › Bevel Edges)", ko: "네모난 상자형 → Cube에서 시작", en: "Boxy → start from a Cube",
    basic_ko: "Cube → Edit Mode에서 S로 비율 맞추기 → Ctrl+B 모서리", basic_en: "Cube → scale (S) in Edit Mode → Ctrl+B edges",
    mod_ko: "Cube + Bevel 모디파이어 (+ Subdivision으로 부드럽게)", mod_en: "Cube + Bevel modifier (+ Subdivision for softness)"});
  if(Math.abs(f.aspect) < 0.2 && f.fill > 0.72 && f.fill < 0.84 && f.convex > 0.93) H.push({k: "round", how_ko: "Shift+A › Mesh › UV Sphere → Tab → 1(점 모드) → Alt+클릭으로 한 줄 선택 → S → Shift+Z → 값", how_en: "Shift+A › Mesh › UV Sphere → Tab → 1 (vertex mode) → Alt+click a ring → S → Shift+Z → value", ko: "둥근 덩어리 → UV/Quad Sphere", en: "Round → UV / Quad Sphere",
    basic_ko: "UV Sphere → 점 그룹 Scale로 눌러 모양 잡기", basic_en: "UV Sphere → scale vertex groups to squash",
    mod_ko: "Quad Sphere(저해상도) + Subdivision Surface(Ctrl+2) + Cast(Shape Sphere)", mod_en: "Low-res Quad Sphere + Subdivision Surface (Ctrl+2) + Cast (Shape Sphere)"});
  if(lathe) H.push({k: "lathe", how_ko: "Shift+A › Mesh › Plane → Tab → A → M › At Center → 1 → E → X/Z 값으로 단면 그리기 → A → Alt+E › Spin → F9 Steps 32, Angle 360°, Axis (0,0,1) → M › By Distance", how_en: "Shift+A › Mesh › Plane → Tab → A → M › At Center → 1 → E with X/Z values to draw the profile → A → Alt+E › Spin → F9 Steps 32, Angle 360°, Axis (0,0,1) → M › By Distance", ko: "좌우 대칭 회전체 → 단면 + 회전", en: "Symmetric lathe shape → profile + revolve",
    basic_ko: "점 하나에서 E로 단면 그리기 → Spin 도구 360°", basic_en: "Draw the profile from one vertex with E → Spin tool 360°",
    mod_ko: "단면 선 + Screw 모디파이어 + Solidify", mod_en: "Profile curve + Screw modifier + Solidify"});
  if(f.symLR > 0.85 && !lathe) H.push({k: "mirror", how_ko: "Edit Mode에서 반쪽 지우기(X › Vertices) → 반쪽 완성 → A → Shift+D → 우클릭 → Ctrl+M → X (피벗: . › 3D Cursor, 커서는 월드 중심) → M › By Distance", how_en: "In Edit Mode delete one half (X › Vertices) → finish the half → A → Shift+D → right-click → Ctrl+M → X (피벗: . › 3D Cursor, 커서는 월드 중심) → M › By Distance", ko: "좌우 대칭 → 반만 만들기", en: "Mirror symmetric → model half",
    basic_ko: "반쪽 완성 후 Shift+D 복제 → Mirror(Ctrl+M) → 점 Merge", basic_en: "Finish one half, Shift+D, mirror (Ctrl+M) and merge verts",
    mod_ko: "반쪽 + Mirror 모디파이어(Clipping 켜기)", mod_en: "Half + Mirror modifier (Clipping on)"});
  if(f.holes > 0 && f.holeFrac > 0.19) H.push({k: "hole", how_ko: "3(면 모드) 구멍 낼 면 선택 → I(Face › Inset Faces) → X › Faces → 앞뒤 고리 선택 → Edge › Bridge Edge Loops", how_en: "3 (face mode) select the face → I (Face › Inset Faces) → X › Faces → select both loops → Edge › Bridge Edge Loops", ko: "구멍이 있음 (" + f.holes + "개)", en: "Has holes (" + f.holes + ")",
    basic_ko: "면 Inset(I) → 구멍 면 삭제 → Bridge Edge Loops로 벽 잇기", basic_en: "Inset (I) → delete the hole face → Bridge Edge Loops",
    mod_ko: "커터 오브젝트 + Boolean(Difference), 고리 모양이면 Torus", mod_en: "Cutter object + Boolean (Difference); ring-like → Torus"});
  if(f.rep > 0.9) H.push({k: "repeat", how_ko: "Object Mode에서 부품 선택 → Shift+D → X/Y/Z → 간격 → Enter → Shift+R로 반복", how_en: "Object Mode select the part → Shift+D → X/Y/Z → spacing → Enter → Shift+R to repeat", ko: "같은 부품이 반복됨", en: "Repeating parts",
    basic_ko: "하나 만들고 Shift+D 반복 (Shift+R로 마지막 동작 반복)", basic_en: "Make one, Shift+D repeatedly (Shift+R repeats last)",
    mod_ko: "하나 + Array 모디파이어 (개수·간격을 숫자로)", mod_en: "One piece + Array modifier (count/spacing as numbers)"});
  if(Math.abs(f.taper) > 0.5) H.push({k: "taper", how_ko: "3(면 모드) 윗면 선택 → E → 값 → Enter → S → 값 → Enter (반복)", how_en: "3 (face mode) select the top face → E → value → Enter → S → value → Enter (repeat)", ko: f.taper > 0 ? "위가 넓고 아래가 좁음" : "아래가 넓고 위가 좁음", en: f.taper > 0 ? "Wider at the top" : "Wider at the bottom",
    basic_ko: "윗(아랫)면 선택 → Extrude + Scale 반복", basic_en: "Select the top (bottom) face → extrude + scale repeatedly",
    mod_ko: "Simple Deform(Taper) 모디파이어", mod_en: "Simple Deform (Taper) modifier"});
  if(f.convex < 0.7 && f.holes === 0) H.push({k: "parts", how_ko: "Ctrl+R로 자리 만들기 → 3(면 모드) 옆면 선택 → E → 값 → Enter (가지마다)", how_en: "Ctrl+R for placement loops → 3 (face mode) select side faces → E → value → Enter (per limb)", ko: "튀어나온 부분이 많음 (팔·다리·가지)", en: "Many protrusions (arms, legs, branches)",
    basic_ko: "몸통에서 옆면 골라 Extrude로 뽑아내기 (+ Loop Cut으로 자리 만들기)", basic_en: "Extrude limbs from side faces (+ loop cuts for placement)",
    mod_ko: "부품을 따로 만들고 Mirror/Array, 부드럽게는 Subdivision", mod_en: "Separate parts with Mirror/Array, Subdivision for softness"});
  if(f.complex > 3.2) H.push({k: "detail", how_ko: "큰 덩어리를 Cube로 → Tab → K(Knife)로 선 긋기 → Enter → E/I로 디테일", how_en: "Block out with Cubes → Tab → K (Knife) to cut lines → Enter → E/I for details", ko: "외곽이 복잡함 → 큰 덩어리부터", en: "Complex outline → block out big masses first",
    basic_ko: "큰 덩어리만 먼저(박스 모델링) → Knife(K)로 디테일", basic_en: "Block out big masses first, then Knife (K) for details",
    mod_ko: "덩어리 + Remesh/Displace, 세부는 따로", mod_en: "Masses + Remesh/Displace, details separately"});
  return H;
}
/* ---------- "is this a busy scene?" cue (offline, honest: a cue, not object detection) ----------
   regions = colour patches (3-bit/channel, 4-connected) bigger than 0.1% of the image; bsd = spread of the border colours;
   area = object-mask share of the frame. Busy, many-patch pictures with a non-plain border and a small single mask are
   flagged. On the 105 single-object test photos this flags 3 (cactus_2, ladder_1, snowman_2) — so it only *asks* the user. */
function complexity(rgba, W, H, mask){
  var n = W * H, q = new Int16Array(n), lab = new Int32Array(n), i, x, y;
  for(i = 0; i < n; i++){ q[i] = (rgba[i * 4] >> 5) * 64 + (rgba[i * 4 + 1] >> 5) * 8 + (rgba[i * 4 + 2] >> 5); lab[i] = -1; }
  var stack = new Int32Array(n), regions = 0, nc = 0;
  for(i = 0; i < n; i++){
    if(lab[i] >= 0) continue; var sp = 0, a = 0; stack[sp++] = i; lab[i] = nc;
    while(sp){ var j = stack[--sp]; a++; var jx = j % W, jy = (j / W) | 0;
      if(jx > 0 && lab[j - 1] < 0 && q[j - 1] === q[j]){ lab[j - 1] = nc; stack[sp++] = j - 1; }
      if(jx < W - 1 && lab[j + 1] < 0 && q[j + 1] === q[j]){ lab[j + 1] = nc; stack[sp++] = j + 1; }
      if(jy > 0 && lab[j - W] < 0 && q[j - W] === q[j]){ lab[j - W] = nc; stack[sp++] = j - W; }
      if(jy < H - 1 && lab[j + W] < 0 && q[j + W] === q[j]){ lab[j + W] = nc; stack[sp++] = j + W; } }
    if(a > 0.001 * n) regions++; nc++;
  }
  var br = []; for(x = 0; x < W; x++){ br.push(x, (H - 1) * W + x); } for(y = 0; y < H; y++){ br.push(y * W, y * W + W - 1); }
  var mu = [0, 0, 0]; br.forEach(function(k){ for(var c = 0; c < 3; c++) mu[c] += rgba[k * 4 + c]; }); mu = mu.map(function(v){ return v / br.length; });
  var sd = 0; br.forEach(function(k){ for(var c = 0; c < 3; c++) sd += Math.pow(rgba[k * 4 + c] - mu[c], 2); }); sd = Math.sqrt(sd / br.length / 3);
  var area = 0; if(mask) for(i = 0; i < n; i++) area += mask[i]; area /= n;
  return {regions: regions, bsd: Math.round(sd * 10) / 10, area: Math.round(area * 100) / 100, likely: regions >= 80 && sd >= 30 && area <= 0.2};
}
var API = {complexity: complexity, REFINE: REFINE, segment: segment, features: features, distance: distance, match: match, hints: hints, G: G, W8: W8};
if(typeof module !== "undefined" && module.exports) module.exports = API; else root.ShapeFeat = API;
})(typeof window !== "undefined" ? window : this);
