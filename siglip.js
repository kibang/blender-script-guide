/* 🤖 On-device image recognition: SigLIP base patch16-224 image encoder (Apache-2.0, 8-bit ONNX) + onnxruntime-web (MIT).
   Text side is precomputed (vendor/siglip/text_emb.bin). Config "C3": 127 classes, prompt ensemble, character-vs-object first;
   2 views (squash + pad-to-square) averaged. Model is lazy-loaded on request, with progress, and kept in the Cache API. */
(function(){
"use strict";
var D = window.APP_DATA, M = D.siglip;
var CACHE = "bsa-siglip-v1", OK_KEY = "bsa_siglip_ok";
var S = {state: "idle", got: 0, total: 0, err: "", sess: null, E: null, listeners: [], fromCache: false, ms: 0};
if(!M) S.state = "failed", S.err = "no model data";
function abs(p){ return new URL(p, location.href).href; }
function emit(){ S.listeners.forEach(function(f){ try { f(S); } catch(e){ if(window.console) console.warn(e); } }); }
function totalBytes(){ var z = M.sizes; return z.model + z.wasm + z.text + z.ort; }
function mb(n){ return Math.round(n / 1048576); }
function hasCache(){ try { return !!(window.caches && window.isSecureContext); } catch(e){ return false; } }
function isCached(){
  if(!M || !hasCache()) return Promise.resolve(false);
  return caches.open(CACHE).then(function(c){ return c.match(abs(M.files.model)); }).then(function(r){ return !!r; }).catch(function(){ return false; });
}
function fetchBin(path, onp){
  var u = abs(path), cache = null;
  var p = hasCache() ? caches.open(CACHE).then(function(c){ cache = c; return c.match(u); }).catch(function(){ return null; }) : Promise.resolve(null);
  return p.then(function(hit){
    if(hit) return hit.arrayBuffer().then(function(b){ S.fromCache = true; onp(b.byteLength, true); return b; });
    return fetch(u, {cache: "no-cache"}).then(function(r){
      if(!r.ok) throw new Error("HTTP " + r.status + " — " + path);
      var parts = [], n = 0;
      function done(){ var out = new Uint8Array(n), o = 0; parts.forEach(function(x){ out.set(x, o); o += x.length; });
        if(cache) cache.put(u, new Response(new Blob([out]), {headers: {"Content-Type": "application/octet-stream"}})).catch(function(){});
        return out.buffer; }
      if(!r.body || !r.body.getReader) return r.arrayBuffer().then(function(b){ parts = [new Uint8Array(b)]; n = b.byteLength; onp(n); return done(); });
      var rd = r.body.getReader();
      function pump(){ return rd.read().then(function(x){ if(x.done) return done(); parts.push(x.value); n += x.value.length; onp(n); return pump(); }); }
      return pump();
    });
  });
}
function loadScript(src){
  return new Promise(function(res, rej){ if(window.ort) return res();
    var s = document.createElement("script"); s.src = src; s.onload = function(){ window.ort ? res() : rej(new Error("onnxruntime did not start")); };
    s.onerror = function(){ rej(new Error("could not load " + src)); }; document.head.appendChild(s); });
}
var loading = null;
function load(){
  if(S.state === "ready") return Promise.resolve(S);
  if(loading) return loading;
  if(!M) return Promise.reject(new Error("no model data"));
  S.state = "loading"; S.err = ""; S.got = 0; S.total = totalBytes(); emit();
  try { localStorage.setItem(OK_KEY, "1"); } catch(e){}
  if(navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function(){});
  var got = {model: 0, wasm: 0, text: 0, ort: 0}, last = 0;
  function prog(k){ return function(n){ got[k] = n; S.got = got.model + got.wasm + got.text + got.ort; var now = Date.now(); if(now - last > 120 || S.got >= S.total){ last = now; emit(); } }; }
  var t0 = performance.now();
  loading = (location.protocol === "file:" ? Promise.reject(new Error("file://")) : Promise.resolve())
    .then(function(){ return loadScript(abs(M.files.ort)); }).then(function(){ got.ort = M.sizes.ort; return Promise.all([fetchBin(M.files.wasm, prog("wasm")), fetchBin(M.files.model, prog("model")), fetchBin(M.files.text, prog("text"))]); })
    .then(function(b){
      S.E = new Float32Array(b[2]);
      if(S.E.length !== (M.n + M.nsc + M.nso) * M.dim) throw new Error("text_emb.bin size mismatch");
      var ort = window.ort; ort.env.wasm.wasmPaths = abs(M.files.wasm.replace(/[^/]+$/, ""));
      ort.env.wasm.wasmBinary = b[0]; ort.env.wasm.numThreads = window.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1;
      return ort.InferenceSession.create(new Uint8Array(b[1]), {executionProviders: ["wasm"], graphOptimizationLevel: "all"});
    })
    .then(function(sess){ S.sess = sess; S.state = "ready"; S.ms = Math.round(performance.now() - t0); emit(); return S; })
    .catch(function(e){ S.state = "failed"; S.err = (e && e.message) || String(e); loading = null; emit(); throw e; });
  return loading;
}
/* --- preprocessing: region of an image → 2 views (squash 224², pad-to-square with mean colour) → CHW float, (x/255-0.5)/0.5 --- */
function views(img, box){
  var W = img.naturalWidth || img.width, H = img.naturalHeight || img.height, b = box || [0, 0, W, H];
  var sx = b[0], sy = b[1], sw = Math.max(1, b[2] - b[0]), sh = Math.max(1, b[3] - b[1]), N = 224;
  // two-stage downscale (≤ 2×224 then 224) approximates PIL bicubic better than one big jump
  function stage(w, h){ var k = Math.min(1, 2 * N / Math.max(w, h)), c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    var g = c.getContext("2d"); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high"; g.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height); return c; }
  var mid = stage(sw, sh);
  var a = document.createElement("canvas"); a.width = a.height = N; var ga = a.getContext("2d", {willReadFrequently: true}); ga.imageSmoothingEnabled = true; ga.imageSmoothingQuality = "high";
  ga.drawImage(mid, 0, 0, N, N);
  var dm = mid.getContext("2d").getImageData(0, 0, mid.width, mid.height).data, r = 0, g2 = 0, bl = 0, n = dm.length / 4;
  for(var i = 0; i < dm.length; i += 4){ r += dm[i]; g2 += dm[i + 1]; bl += dm[i + 2]; }
  var p = document.createElement("canvas"); p.width = p.height = N; var gp = p.getContext("2d", {willReadFrequently: true}); gp.imageSmoothingEnabled = true; gp.imageSmoothingQuality = "high";
  gp.fillStyle = "rgb(" + Math.floor(r / n) + "," + Math.floor(g2 / n) + "," + Math.floor(bl / n) + ")"; gp.fillRect(0, 0, N, N);
  var k = N / Math.max(mid.width, mid.height), w2 = mid.width * k, h2 = mid.height * k; gp.drawImage(mid, (N - w2) / 2, (N - h2) / 2, w2, h2);
  var out = new Float32Array(2 * 3 * N * N);
  [ga, gp].forEach(function(gx, vi){ var d = gx.getImageData(0, 0, N, N).data, o = vi * 3 * N * N;
    for(var j = 0, q = 0; j < N * N; j++, q += 4){ out[o + j] = d[q] / 127.5 - 1; out[o + N * N + j] = d[q + 1] / 127.5 - 1; out[o + 2 * N * N + j] = d[q + 2] / 127.5 - 1; } });
  return out;
}
function softmax(v, T){ var m = -1e9, i, s = 0, o = new Float64Array(v.length); for(i = 0; i < v.length; i++) m = Math.max(m, T * v[i]); for(i = 0; i < v.length; i++){ o[i] = Math.exp(T * v[i] - m); s += o[i]; } for(i = 0; i < v.length; i++) o[i] /= s; return o; }
var queue = Promise.resolve();
function classify(img, box){
  var job = queue.then(function(){ return load(); }).then(function(){
    var t0 = performance.now(), x = new window.ort.Tensor("float32", views(img, box), [2, 3, 224, 224]);
    return S.sess.run({pixel_values: x}).then(function(o){
      var e = (o.pooler_output || o.image_embeds).data, d = M.dim, v = new Float64Array(d), nn = 0, i, j;
      for(j = 0; j < 2; j++){ var s2 = 0; for(i = 0; i < d; i++) s2 += e[j * d + i] * e[j * d + i]; s2 = Math.sqrt(s2) || 1; for(i = 0; i < d; i++) v[i] += e[j * d + i] / s2; }
      for(i = 0; i < d; i++) nn += v[i] * v[i]; nn = Math.sqrt(nn) || 1;
      var R = M.n + M.nsc + M.nso, cos = new Float64Array(R);
      for(j = 0; j < R; j++){ var s = 0, off = j * d; for(i = 0; i < d; i++) s += S.E[off + i] * v[i]; cos[j] = s / nn; }
      var P = softmax(cos.subarray(0, M.n), M.T), SP = softmax(cos.subarray(M.n), M.T), pc = 0, sc = 0;
      M.classes.forEach(function(c, k){ if(c.ch) pc += P[k]; }); for(i = 0; i < M.nsc; i++) sc += SP[i];
      var pchar = 0.5 * pc + 0.5 * sc, isChar = pchar >= M.char_thr;
      var grp = [], tot = 0; M.classes.forEach(function(c, k){ if(!!c.ch === isChar){ grp.push(k); tot += P[k]; } });
      grp.sort(function(a, b){ return P[b] - P[a]; });
      var top = grp.slice(0, 3).map(function(k){ var c = M.classes[k]; return {k: c.k, ko: c.ko, en: c.en, ch: c.ch, score: P[k] / tot, p: P[k]}; });
      var all = M.classes.map(function(c, k){ return {k: c.k, p: P[k]}; }).sort(function(a, b){ return b.p - a.p; });
      var unsure = (top[0].score - top[1].score < M.unc_margin) || top[0].score < M.unc_top || Math.abs(pchar - 0.5) < 0.1;
      return {top: top, pchar: pchar, isChar: isChar, unsure: unsure, all: all, ms: Math.round(performance.now() - t0)};
    });
  });
  queue = job.catch(function(){});
  return job;
}
function wanted(){ try { return localStorage.getItem(OK_KEY) === "1"; } catch(e){ return false; } }
function cls(k){ return M.classes.filter(function(c){ return c.k === k; })[0]; }
window.SIGLIP = {S: S, M: M, load: load, classify: classify, isCached: isCached, wanted: wanted, cls: cls, mb: mb, totalBytes: totalBytes,
  on: function(f){ S.listeners.push(f); }, off: function(f){ S.listeners = S.listeners.filter(function(x){ return x !== f; }); }, _views: views};
})();
