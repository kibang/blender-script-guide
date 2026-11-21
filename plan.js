/* 📷 Image → modeling plan (offline shape matching + optional AI) */
(function(){
"use strict";
var D = window.APP_DATA, I = window.I18N, t = I.t, L = I.L, pick = I.pick, SF = window.ShapeFeat;
var esc = function(s){ return window.BSA.esc(s); };
var st = {img: null, box: null, res: null, ai: null, aiBusy: false, scene: null, crops: [], cur: -1, cx: null, cropMode: false, name: ""};
var MAXS = 256, PV = 640;   // analysis size (same as the accuracy tests) / preview size

function render(S){
  var h = '<section class="intro"><h1>' + esc(t("sub_plan")) + "</h1><p>" + esc(pick("물체 사진 한 장을 넣으면 어떤 기본 도형에서 시작해 어떻게 만들지, 기본 모델링과 모디파이어 두 가지 방법으로 계획을 보여 줘요.",
    "Give one photo of an object and get a plan — which primitive to start from and how to build it, both with basic modeling and with modifiers.")) + "</p></section>";
  h += '<div class="plan"><div class="pleft"><div class="drop" id="drop"><p>' + esc(t("drop")) + ' <label class="linkbtn">' + esc(t("open")) + '<input type="file" id="file" accept="image/*" hidden></label></p><canvas id="pc" width="10" height="10"></canvas><div class="pctl" id="pctl"></div><p class="mut small" id="boxhint">' +
    esc(pick("물체가 잘 안 잡히면 사진 위를 드래그(휴대폰은 ‘✂️ 영역 고르기’를 켜고 손가락으로)해서 물체를 네모로 지정하세요. 단색 배경 사진이 가장 정확해요. 여러 물체가 있는 그림은 ‘🧩 장면 모드’.",
      "If the object isn't picked up, drag a box around it (on phones turn on ‘✂️ Pick a region’ and drag with a finger). Plain-background photos work best. Pictures with many objects: ‘🧩 Scene mode’.")) + "</p></div>";
  if(D.samples && D.samples.length) h += '<div class="samples"><b>' + esc(t("samples")) + "</b><div>" + D.samples.map(function(s, i){ return '<img src="' + s.src + '" data-i="' + i + '" title="' + esc(pick(s.ko, s.en)) + '" alt="' + esc(s.en) + '">'; }).join("") + "</div></div>";
  h += accuracyBox() + "</div><div class='pright' id='pres'>" + emptyRes() + "</div></div>";
  h += '<section class="aibox" id="aibox"></section>';
  S.innerHTML = h;
  var drop = document.getElementById("drop");
  document.getElementById("file").onchange = function(){ if(this.files[0]) loadFile(this.files[0]); };
  drop.ondragover = function(e){ e.preventDefault(); drop.classList.add("over"); };
  drop.ondragleave = function(){ drop.classList.remove("over"); };
  drop.ondrop = function(e){ e.preventDefault(); drop.classList.remove("over"); var f = e.dataTransfer.files[0]; if(f) loadFile(f); };
  document.onpaste = function(e){ if(!document.getElementById("drop")) return; var it = Array.prototype.filter.call((e.clipboardData || {}).items || [], function(x){ return x.type.indexOf("image") === 0; })[0]; if(it) loadFile(it.getAsFile()); };
  S.querySelectorAll(".samples img").forEach(function(im){ im.onclick = function(){ var sm = D.samples[+im.getAttribute("data-i")]; loadURL(sm.data || sm.src); }; });
  boxDrag(document.getElementById("pc"));
  renderCtl();
  if(st.img) analyse(); renderAI();
}
function emptyRes(){ return '<div class="placeholder">' + esc(pick("← 사진을 넣으면 여기에 계획이 나와요.", "← Your plan appears here.")) + "</div>"; }
function accuracyBox(){
  var A = D.accuracy; if(!A) return "";
  return '<details class="acc"><summary>📏 ' + esc(t("acc_title")) + ": top-1 " + A.top1 + "% · top-3 " + A.top3 + "% (" + A.n + (L === "en" ? " photos" : "장") + ")</summary><p>" +
    esc(pick("인터넷 공개 사진(위키미디어 공용, 출처 기록) " + A.n + "장으로 측정했어요. ‘정답’은 사진 속 물체와 같은 예제가 1등(top-1) 또는 3등 안(top-3)에 나온 비율이에요. 배경이 복잡하거나 물체가 잘린 사진에서는 많이 틀려요. 모양만 보는 방식이라 색·재질은 구분하지 못해요. 우연히 맞힐 확률은 top-1 " + A.chance1 + "%, top-3 " + A.chance3 + "%예요.",
      "Measured on " + A.n + " public photos (Wikimedia Commons, sources recorded). Correct = the matching example ranked 1st (top-1) or within the first 3 (top-3). It often fails on busy backgrounds or cropped objects, and it only looks at outline shape, not colour or material. Chance level: top-1 " + A.chance1 + "%, top-3 " + A.chance3 + "%.")) +
    (A.test ? "<br>" + esc(pick("설정값은 홀수 번 사진(" + A.dev.n + "장)으로만 맞추고, 짝수 번 사진(" + A.test.n + "장, 시험용)으로 따로 쟀어요 → 시험용: top-1 " + A.test.top1 + "% · top-3 " + A.test.top3 + "% · top-5 " + A.test.top5 + "%.",
      "Settings were tuned only on odd-numbered photos (" + A.dev.n + "); even-numbered photos (" + A.test.n + ", held out) give: top-1 " + A.test.top1 + "% · top-3 " + A.test.top3 + "% · top-5 " + A.test.top5 + "%.")) : "") +
    (A.compare ? "<br>" + esc(pick("이번 개선(배경 분리 보강) 전후, 같은 시험용 사진: top-1 " + A.compare.before_polish.test.top1 + "% → " + A.compare.after_polish.test.top1 + "%, top-3 " + A.compare.before_polish.test.top3 + "% → " + A.compare.after_polish.test.top3 + "%, top-5 " + A.compare.before_polish.test.top5 + "% → " + A.compare.after_polish.test.top5 + "% (top-5는 오히려 내려갔어요).",
      "Before → after this round (better background removal), same held-out photos: top-1 " + A.compare.before_polish.test.top1 + "% → " + A.compare.after_polish.test.top1 + "%, top-3 " + A.compare.before_polish.test.top3 + "% → " + A.compare.after_polish.test.top3 + "%, top-5 " + A.compare.before_polish.test.top5 + "% → " + A.compare.after_polish.test.top5 + "% (top-5 actually went down).")) : "") +
    (A.hint_acc != null ? "<br>" + esc(pick("모양 힌트(회전체·구멍·반복) 판정 정확도 " + (A.test || A).hint_acc + "% — 하지만 ‘항상 아니오’라고만 해도 " + hb(A.test || A) + "%라서, 힌트는 참고용일 뿐 믿을 만하지 않아요.",
      "Shape-hint (lathe / holes / repetition) accuracy " + (A.test || A).hint_acc + "% — but always answering ‘no’ already scores " + hb(A.test || A) + "%, so treat hints as suggestions only.")) : "") + "</p></details>";
}
function hb(a){ var b = a.hint_baseline_always_no || {}, k = Object.keys(b); return k.length ? Math.round(k.reduce(function(s, x){ return s + b[x]; }, 0) / k.length * 10) / 10 : "?";
}
var LIM = {bytes: 40 * 1024 * 1024, px: 50e6};
function loadFile(f){
  if(f.type && f.type.indexOf("image/") !== 0){ showErr(pick("이미지 파일이 아니에요 (" + f.type + ").", "Not an image file (" + f.type + ").")); return; }
  if(f.size > LIM.bytes){ showErr(pick("파일이 너무 커요 (40MB까지).", "File too large (max 40 MB).")); return; }
  st.name = f.name || ""; loadURL(URL.createObjectURL(f));
}
function showErr(msg){ var p = document.getElementById("pres"); if(p) p.innerHTML = '<div class="placeholder bad">⚠ ' + esc(msg) + "</div>"; }
function loadURL(u){
  var im = new Image();
  im.onload = function(){
    if(!im.naturalWidth || !im.naturalHeight){ showErr(pick("이미지를 읽지 못했어요.", "Could not read the image.")); return; }
    if(im.naturalWidth * im.naturalHeight > LIM.px){ showErr(pick("이미지가 너무 커요 (5천만 화소까지).", "Image too large (max 50 megapixels).")); return; }
    st.img = im; st.box = null; st.ai = null; st.scene = null; st.crops = []; st.cur = -1; st.cx = null; analyse(); renderAI(); renderCtl();
  };
  im.onerror = function(){ showErr(pick("이 형식은 브라우저가 열 수 없어요 (PNG·JPG·WebP·GIF는 돼요). HEIC는 JPG로 바꿔 주세요.", "Your browser can't open this format (PNG/JPG/WebP/GIF work). Convert HEIC to JPG.")); };
  im.src = u;
}
function toCanvas(src){  // src = [x0,y0,x1,y1] in natural pixels (optional crop)
  var im = st.img, sx = src ? src[0] : 0, sy = src ? src[1] : 0, sw = src ? src[2] - src[0] : im.naturalWidth, sh = src ? src[3] - src[1] : im.naturalHeight;
  var s = Math.min(1, MAXS / Math.max(sw, sh)), W = Math.max(1, Math.round(sw * s)), H = Math.max(1, Math.round(sh * s));
  var c = document.createElement("canvas"); c.width = W; c.height = H; var g = c.getContext("2d"); g.drawImage(im, sx, sy, sw, sh, 0, 0, W, H);
  return {W: W, H: H, data: g.getImageData(0, 0, W, H).data, canvas: c};
}
/* analyse one region (natural coords) at full analysis resolution: crop with an 8% margin, segment inside the box */
function analyseRegion(b){
  var im = st.img, mw = (b[2] - b[0]) * 0.08, mh = (b[3] - b[1]) * 0.08;
  var src = [Math.max(0, Math.round(b[0] - mw)), Math.max(0, Math.round(b[1] - mh)), Math.min(im.naturalWidth, Math.round(b[2] + mw)), Math.min(im.naturalHeight, Math.round(b[3] + mh))];
  var r = toCanvas(src), k = r.W / (src[2] - src[0]);
  var box = [Math.max(0, Math.round((b[0] - src[0]) * k)), Math.max(0, Math.round((b[1] - src[1]) * k)), Math.min(r.W - 1, Math.round((b[2] - src[0]) * k)), Math.min(r.H - 1, Math.round((b[3] - src[1]) * k))];
  var m = SF.segment(r.data, r.W, r.H, box), f = SF.features(m, r.W, r.H);
  var th = document.createElement("canvas"), ts = 96 / Math.max(r.W, r.H); th.width = Math.round(r.W * ts); th.height = Math.round(r.H * ts);
  var tg = th.getContext("2d"); tg.drawImage(r.canvas, 0, 0, th.width, th.height);
  return {f: f, top: f ? SF.match(f, D.shape_lib, 5) : [], hints: f ? SF.hints(f) : [], thumb: th.toDataURL("image/jpeg", 0.8), box: b};
}
function sim(r){ return Math.max(0, Math.round((1 - r.d / 0.6) * 100)); }
function drawPreview(mask, mW, mH){
  var pc = document.getElementById("pc"); if(!pc || !st.img) return;
  var im = st.img, s = Math.min(1, PV / Math.max(im.naturalWidth, im.naturalHeight));
  pc.width = Math.round(im.naturalWidth * s); pc.height = Math.round(im.naturalHeight * s); pc.style.width = ""; pc.style.maxWidth = "100%";
  var g = pc.getContext("2d"); g.drawImage(im, 0, 0, pc.width, pc.height);
  if(mask){
    var mc = document.createElement("canvas"); mc.width = mW; mc.height = mH; var mg = mc.getContext("2d"), id = mg.createImageData(mW, mH);
    for(var i = 0; i < mW * mH; i++){ if(!mask[i]){ id.data[i * 4] = 0; id.data[i * 4 + 1] = 0; id.data[i * 4 + 2] = 40; id.data[i * 4 + 3] = 165; } }
    mg.putImageData(id, 0, 0); g.imageSmoothingEnabled = false; g.drawImage(mc, 0, 0, pc.width, pc.height);
  }
  var k = pc.width / im.naturalWidth;
  function rect(b, col, label){ g.strokeStyle = col; g.lineWidth = 3; g.strokeRect(b[0] * k, b[1] * k, (b[2] - b[0]) * k, (b[3] - b[1]) * k);
    if(label){ g.fillStyle = col; g.fillRect(b[0] * k, b[1] * k, 22, 20); g.fillStyle = "#000"; g.font = "bold 14px sans-serif"; g.fillText(label, b[0] * k + 6, b[1] * k + 15); } }
  if(st.scene) st.crops.forEach(function(c, i){ rect(c.box, i === st.cur ? "#ffb000" : "#4fc3f7", String(i + 1)); });
  else if(st.box) rect(st.box, "#ffb000");
}
function analyse(){
  if(!st.img) return;
  var pres = document.getElementById("pres"); if(!pres) return;
  try {
    if(!st.scene){
      if(st.box){ var rr = analyseRegion(st.box); st.res = rr.f ? rr : null; drawPreview(null); }
      else {
        var r = toCanvas(), m = SF.segment(r.data, r.W, r.H, null), f = SF.features(m, r.W, r.H);
        st.cx = SF.complexity(r.data, r.W, r.H, m);
        st.res = f ? {f: f, top: SF.match(f, D.shape_lib, 5), hints: SF.hints(f)} : null; drawPreview(m, r.W, r.H);
      }
      pres.innerHTML = (st.res ? (!st.box && st.cx && st.cx.likely && st.scene === null ? sceneAsk() : (st.res.top[0] && sim(st.res.top[0]) < 45 ? lowConf(st.res.top[0]) : "")) + resultHtml(st.res)
        : '<div class="placeholder bad">' + esc(pick("물체를 찾지 못했어요. 영역을 드래그로 지정하거나 ‘🧩 장면 모드’를 써 보세요.", "Could not find an object. Drag a box around it, or try ‘🧩 Scene mode’.")) + "</div>");
    } else {
      if(!st.res){ var r0 = toCanvas(), m0 = SF.segment(r0.data, r0.W, r0.H, null), f0 = SF.features(m0, r0.W, r0.H); st.res = f0 ? {f: f0, top: SF.match(f0, D.shape_lib, 5), hints: SF.hints(f0)} : null; }
      drawPreview(null); pres.innerHTML = sceneHtml();
    }
  } catch(e){
    pres.innerHTML = '<div class="placeholder bad">⚠ ' + esc(pick("분석 중 오류: ", "Analysis error: ") + (e && e.message || e)) + "</div>";
    if(window.console) console.warn(e);
  }
  window.BSA.bindLB(pres); bindPlan(); renderCtl();
}
function sceneAsk(){
  return '<div class="scenewarn"><b>🧩 ' + esc(pick("여러 물체가 있는 장면(그림)일 수 있어요", "This may be a scene (picture) with many objects")) + "</b><p>" +
    esc(pick("배경이 단색이 아니고 색 영역이 많아요(" + st.cx.regions + "개). 모양 매칭은 물체 하나의 외곽선만 비교하므로, 그림 전체로는 아래 결과가 거의 의미가 없어요. 오프라인 분석은 그림 속 물체를 알아보지 못해요.",
      "The border isn't plain and there are many colour patches (" + st.cx.regions + "). Shape matching compares the outline of ONE object, so for a whole picture the result below means little. Offline analysis cannot recognise objects in a picture.")) +
    '</p><div class="btns"><button class="copybtn" id="goscene">🧩 ' + esc(pick("장면 모드: 물체별로 나눠 보기", "Scene mode: break it into objects")) + '</button> <button class="btn2" id="single">' + esc(pick("아니요, 물체 하나예요", "No, it's one object")) + "</button></div></div>";
}
function lowConf(top){
  return '<div class="warn small">' + esc(pick("닮은 정도가 낮아요(" + sim(top) + "%). 아래 예제는 참고만 하세요 — 물체를 네모로 지정하면 나아질 수 있어요.", "Low similarity (" + sim(top) + "%). Treat the examples below as loose suggestions — boxing the object may help.")) + "</div>";
}
function boxDrag(c){
  var p0 = null, cur = null, id = null;
  function pt(e){ var r = c.getBoundingClientRect(), k = st.img.naturalWidth / r.width; return [Math.round((e.clientX - r.left) * k), Math.round((e.clientY - r.top) * k)]; }
  function norm(a, b){ var W = st.img.naturalWidth, H = st.img.naturalHeight; return [Math.max(0, Math.min(a[0], b[0])), Math.max(0, Math.min(a[1], b[1])), Math.min(W, Math.max(a[0], b[0])), Math.min(H, Math.max(a[1], b[1]))]; }
  c.onpointerdown = function(e){ if(!st.img) return; if(e.pointerType !== "mouse" && !st.cropMode) return; p0 = pt(e); id = e.pointerId; try { c.setPointerCapture(id); } catch(x){} e.preventDefault(); };
  c.onpointermove = function(e){ if(!p0 || e.pointerId !== id) return; cur = norm(p0, pt(e)); drawPreview(null);
    var g = c.getContext("2d"), k = c.width / st.img.naturalWidth; g.setLineDash([6, 4]); g.strokeStyle = "#ffb000"; g.lineWidth = 2; g.strokeRect(cur[0] * k, cur[1] * k, (cur[2] - cur[0]) * k, (cur[3] - cur[1]) * k); g.setLineDash([]); };
  c.onpointerup = c.onpointercancel = function(e){
    if(!p0 || e.pointerId !== id) return; var b = norm(p0, pt(e)); p0 = null; cur = null;
    var minS = Math.max(8, 0.02 * Math.max(st.img.naturalWidth, st.img.naturalHeight)), ok = b[2] - b[0] > minS && b[3] - b[1] > minS;
    if(st.scene){ if(ok){ st.crops.push(analyseRegion(b)); if(st.crops.length > 8) st.crops.shift(); st.cur = st.crops.length - 1; } }
    else st.box = ok ? b : null;
    analyse();
  };
}
function renderCtl(){
  var el = document.getElementById("pctl"), pc = document.getElementById("pc"); if(!el) return;
  if(pc) pc.classList.toggle("cropping", !!st.cropMode);
  if(!st.img){ el.innerHTML = ""; return; }
  el.innerHTML = '<button class="btn2' + (st.cropMode ? " on" : "") + '" id="cropbtn">✂️ ' + esc(st.cropMode ? pick("영역 고르기 켜짐 (끄면 스크롤)", "Pick a region: ON (off to scroll)") : pick("영역 고르기 (손가락/마우스로 드래그)", "Pick a region (drag with finger/mouse)")) + "</button> " +
    '<button class="btn2' + (st.scene ? " on" : "") + '" id="scenebtn">🧩 ' + esc(st.scene ? pick("장면 모드 끄기", "Leave scene mode") : pick("장면 모드", "Scene mode")) + "</button>" +
    (st.box && !st.scene ? ' <button class="btn2" id="clrbox">✕ ' + esc(pick("네모 지우기", "Clear box")) + "</button>" : "");
  document.getElementById("cropbtn").onclick = function(){ st.cropMode = !st.cropMode; renderCtl(); };
  document.getElementById("scenebtn").onclick = function(){ setScene(!st.scene); };
  var cb = document.getElementById("clrbox"); if(cb) cb.onclick = function(){ st.box = null; analyse(); };
}
function setScene(on){ st.scene = on; if(on){ st.cropMode = true; st.box = null; } else { st.crops = []; st.cur = -1; } analyse(); renderAI(); }
/* ---------- scene mode ---------- */
function sceneHtml(){
  var h = '<h2>🧩 ' + esc(pick("장면 모드 — 물체별로 계획하기", "Scene mode — plan object by object")) + "</h2>";
  h += '<div class="scenewarn"><p>' + esc(pick("이 앱의 오프라인 분석은 그림 속 물체를 스스로 찾지 못해요(모양 매칭은 물체 하나용). 그래서 두 가지 방법을 드려요: ① 그림에서 물체 하나를 네모로 고르면 그 부분만 잘라 예제와 비교해요. ② 아래 ‘장면에 자주 나오는 물체’ 목록에서 그림에 있는 것을 골라 계획을 보세요. 실제로 그림 속 물체 목록이 필요하면 아래 AI 모드(내 API 키)를 쓰세요.",
    "The offline analysis cannot find objects in a picture by itself (shape matching is for one object). So: ① box one object in the picture and only that crop is compared with the examples; ② pick what's in your picture from ‘Objects common in scenes’ below to see a plan. For a real list of what's in the picture, use AI mode below (your API key).")) + "</p></div>";
  h += '<h3>① ' + esc(pick("고른 영역", "Picked regions")) + " (" + st.crops.length + "/8)</h3>";
  if(!st.crops.length) h += '<p class="placeholder">' + esc(pick("← 왼쪽 그림에서 물체 하나(예: 머그컵, 둥근 창문, 랜턴)를 드래그해서 네모로 감싸세요. 휴대폰은 ‘✂️ 영역 고르기’가 켜진 상태에서 손가락으로 드래그.", "← Drag a box around one object in the picture (e.g. the mug, the round window, the lantern). On phones keep ‘✂️ Pick a region’ on and drag with a finger.")) + "</p>";
  else {
    h += '<div class="crops">' + st.crops.map(function(c, i){
      var t1 = c.top[0], m = t1 && model(t1.id);
      return '<button class="crop' + (i === st.cur ? " on" : "") + '" data-i="' + i + '"><span class="rk">' + (i + 1) + '</span><img src="' + c.thumb + '" alt=""><span class="nm">' + (m ? esc(pick(m.ko, m.en)) + "<small>" + sim(t1) + "%" + (sim(t1) < 50 ? " · " + esc(pick("낮음", "low")) : "") + "</small>" : esc(pick("물체 못 찾음", "no object"))) + '</span><span class="x" data-x="' + i + '" title="remove">✕</span></button>';
    }).join("") + "</div>";
    var c = st.crops[st.cur];
    if(c && c.f) h += '<div class="cropres">' + (c.top[0] && sim(c.top[0]) < 50 ? lowConf(c.top[0]) : "") + resultHtml(c) + "</div>";
    else if(c) h += '<div class="placeholder bad">' + esc(pick("이 영역에서 물체 모양을 찾지 못했어요. 물체에 더 딱 맞게 다시 골라 보세요.", "No object outline found in this region. Try a tighter box.")) + "</div>";
  }
  h += '<h3>② ' + esc(pick("장면에 자주 나오는 물체 — 그림에 있는 것을 골라 보세요", "Objects common in scenes — pick what's in your picture")) + "</h3>";
  h += '<p class="mut small">' + esc(pick("일반적인 목록이에요(이 그림에서 찾아낸 것이 아님). ★ = 난이도. 캐릭터(사람·동물)는 고급 작업이라 따로 표시했어요.", "A generic list (not detected in your picture). ★ = difficulty. Characters (people/animals) are advanced and marked.")) + "</p>";
  h += '<div class="sobjs">' + (D.scene_objects || []).map(function(o){
    var m = o.ex && model(o.ex);
    return '<details class="sobj' + (o.kind === "character" ? " char" : "") + '"><summary><b>' + esc(pick(o.ko, o.en)) + '</b> <span class="chip">' + esc(o.prim) + '</span> <span class="mut small">' + "★".repeat(o.diff) + "</span>" + (o.kind === "character" ? ' <span class="badge bad">' + esc(pick("캐릭터 = 고급(스컬프팅)", "Character = advanced (sculpting)")) + "</span>" : "") + "</summary>" +
      '<p>🔧 <b>' + esc(t("basic")) + ":</b> " + esc(pick(o.basic[0], o.basic[1])) + "</p><p>🧱 <b>" + esc(t("modifier")) + ":</b> " + esc(pick(o.mod[0], o.mod[1])) + '</p><div class="hhow">⌨️ ' + window.BSA.kbd(pick(o.how[0], o.how[1])) + "</div>" +
      (m ? '<a class="linkbtn small" href="#model/ex/' + m.id + '">' + esc(pick("검증된 예제(단계 이미지): ", "Verified example (step images): ") + pick(m.ko, m.en)) + " →</a>" : "") +
      (o.st || []).map(function(sid){ var x = (D.starts || []).filter(function(e){ return e.id === sid; })[0]; return x ? ' <a class="linkbtn small" href="#model/st/' + x.id + '">' + esc(pick("비슷한 시작 타입 예제: ", "Related start-type example: ") + pick(x.ko, x.en)) + " →</a>" : ""; }).join("") + "</details>";
  }).join("") + "</div>";
  if(st.res) h += '<details class="mut"><summary>' + esc(pick("참고: 그림 전체를 물체 하나로 봤을 때의 결과 (장면에서는 거의 의미 없음)", "For reference: the whole picture treated as one object (mostly meaningless for scenes)")) + "</summary>" + resultHtml(st.res) + "</details>";
  return h;
}
function model(id){ return D.models.filter(function(m){ return m.id === id; })[0]; }
function featChips(f){
  var c = [];
  c.push(pick("세로/가로 ", "height/width ") + Math.exp(f.aspect).toFixed(2));
  c.push(pick("좌우 대칭 ", "L-R symmetry ") + Math.round(f.symLR * 100) + "%");
  c.push(pick("볼록함 ", "convexity ") + Math.round(f.convex * 100) + "%");
  c.push(pick("채움 ", "fill ") + Math.round(f.fill * 100) + "%");
  c.push(pick("구멍 ", "holes ") + f.holes);
  if(f.rep > 0.9) c.push(pick("반복 무늬 있음", "repetition"));
  return c.map(function(x){ return '<span class="chip">' + esc(x) + "</span>"; }).join("");
}
function resultHtml(R){
  var top = R.top; if(!top || !top.length) return ""; var best = model(top[0].id);
  var h = '<h2>' + esc(t("plan_title")) + "</h2>";
  h += '<div class="shape"><b>' + esc(t("shape")) + "</b> " + featChips(R.f) + "</div>";
  if(R.hints.length){
    h += '<h3>' + esc(t("hints")) + '</h3><table class="hints"><thead><tr><th></th><th>🔧 ' + esc(t("basic")) + "</th><th>🧱 " + esc(t("modifier")) + "</th></tr></thead><tbody>";
    R.hints.forEach(function(x){
      var mt = pick(x.mod_ko, x.mod_en), paths = [];
      ["Subdivision Surface", "Bevel", "Cast", "Screw", "Solidify", "Mirror", "Boolean", "Array", "Simple Deform", "Remesh", "Displace"].forEach(function(n){ if(mt.indexOf(n) >= 0 || (n === "Subdivision Surface" && /Subdivision(?! Surface)/.test(mt))){ var p = window.BSA.modPath(n); if(p && paths.indexOf(p) < 0) paths.push(p); } });
      h += "<tr><td><b>" + esc(pick(x.ko, x.en)) + "</b></td><td>" + esc(pick(x.basic_ko, x.basic_en)) + (x.how_ko ? '<div class="hhow">⌨️ ' + window.BSA.kbd(pick(x.how_ko, x.how_en)) + "</div>" : "") + "</td><td>" + esc(mt) + (paths.length ? '<div class="hhow">🔧 ' + paths.map(window.BSA.kbd).join("<br>") + "</div>" : "") + "</td></tr>"; });
    h += "</tbody></table>";
  }
  h += "<h3>" + esc(t("matches")) + '</h3><div class="mlist">' + top.map(function(r, i){
    var m = model(r.id); if(!m) return ""; var a = window.BSA.exRender(m, "basic"), b = window.BSA.exRender(m, "modifier");
    var sm = sim(r);
    return '<button class="mitem' + (i === 0 ? " on" : "") + '" data-id="' + m.id + '"><span class="rk">' + (i + 1) + '</span>' + (a ? '<img src="' + a.th + '" alt="">' : "") + '<span class="nm">' + esc(pick(m.ko, m.en)) + '<small>' + esc(pick("닮은 정도 ", "similarity ")) + sm + "%</small></span></button>";
  }).join("") + "</div>";
  h += '<div id="pbest">' + bestHtml(best) + "</div>";
  return h;
}
function bestHtml(m){
  return '<div class="bestbox"><div class="bhead"><h3>' + esc(pick(m.ko, m.en)) + ' — ' + esc(t("prims")) + ": " + m.prims.map(esc).join(", ") + '</h3><a class="linkbtn" href="#model/ex/' + m.id + '">' + esc(t("open_example")) + "</a></div>" +
    '<div class="which ' + m.better + '"><b>💡 ' + esc(t("which")) + "</b> " + esc(pick(m.note_ko, m.note_en)) + "</div>" +
    '<div class="mcols view-both compact">' + window.BSA.methodCol(m, "basic", true) + window.BSA.methodCol(m, "modifier", true) + "</div></div>";
}
function bindPlan(){
  var gs = document.getElementById("goscene"); if(gs) gs.onclick = function(){ setScene(true); };
  var sg = document.getElementById("single"); if(sg) sg.onclick = function(){ st.scene = false; analyse(); };
  document.querySelectorAll(".crop").forEach(function(b){ b.onclick = function(e){ var x = e.target.getAttribute("data-x"); if(x != null){ st.crops.splice(+x, 1); st.cur = Math.min(st.cur, st.crops.length - 1); } else st.cur = +b.getAttribute("data-i"); analyse(); }; });
  document.querySelectorAll(".mitem").forEach(function(b){ b.onclick = function(){ document.querySelectorAll(".mitem").forEach(function(x){ x.classList.toggle("on", x === b); }); document.getElementById("pbest").innerHTML = bestHtml(model(b.getAttribute("data-id"))); window.BSA.bindLB(document.getElementById("pbest")); }; });
}

/* ---------------- AI mode ---------------- */
function renderAI(){
  var box = document.getElementById("aibox"); if(!box) return;
  box.innerHTML = window.AIPLAN.ui(st);
  window.AIPLAN.bind(st, function(){ return st.img ? jpegData() : null; }, renderAI);
}
function jpegData(){
  var im = st.img, s = Math.min(1, 768 / Math.max(im.naturalWidth, im.naturalHeight));
  var c = document.createElement("canvas"); c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s);
  var g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
  var bb = st.scene ? (st.crops[st.cur] && st.crops[st.cur].box) : st.box;
  if(bb){ var k = c.width / im.naturalWidth; g.strokeStyle = "#ff0000"; g.lineWidth = 3; g.strokeRect(bb[0] * k, bb[1] * k, (bb[2] - bb[0]) * k, (bb[3] - bb[1]) * k); }
  return c.toDataURL("image/jpeg", 0.85);
}
window.PLAN = {render: render, _st: st};
})();
