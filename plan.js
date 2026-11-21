/* 📷 Image → modeling plan (offline shape matching + optional AI) */
(function(){
"use strict";
var D = window.APP_DATA, I = window.I18N, t = I.t, L = I.L, pick = I.pick, SF = window.ShapeFeat;
var esc = function(s){ return window.BSA.esc(s); };
var st = {img: null, box: null, res: null, ai: null, aiBusy: false};
var MAXS = 256;

function render(S){
  var h = '<section class="intro"><h1>' + esc(t("sub_plan")) + "</h1><p>" + esc(pick("물체 사진 한 장을 넣으면 어떤 기본 도형에서 시작해 어떻게 만들지, 기본 모델링과 모디파이어 두 가지 방법으로 계획을 보여 줘요.",
    "Give one photo of an object and get a plan — which primitive to start from and how to build it, both with basic modeling and with modifiers.")) + "</p></section>";
  h += '<div class="plan"><div class="pleft"><div class="drop" id="drop"><p>' + esc(t("drop")) + ' <label class="linkbtn">' + esc(t("open")) + '<input type="file" id="file" accept="image/*" hidden></label></p><canvas id="pc" width="10" height="10"></canvas><p class="mut small" id="boxhint">' +
    esc(pick("물체가 잘 안 잡히면 사진 위를 드래그해서 물체 영역을 네모로 지정하세요. 단색 배경 사진이 가장 정확해요.", "If the object is not picked up well, drag a box around it on the photo. Plain-background photos work best.")) + "</p></div>";
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
function loadFile(f){ var u = URL.createObjectURL(f); loadURL(u); }
function loadURL(u){ var im = new Image(); im.onload = function(){ st.img = im; st.box = null; st.ai = null; analyse(); renderAI(); }; im.src = u; }
function toCanvas(){
  var im = st.img, s = Math.min(1, MAXS / Math.max(im.naturalWidth, im.naturalHeight));
  var W = Math.max(1, Math.round(im.naturalWidth * s)), H = Math.max(1, Math.round(im.naturalHeight * s));
  var c = document.createElement("canvas"); c.width = W; c.height = H; var g = c.getContext("2d"); g.drawImage(im, 0, 0, W, H);
  return {W: W, H: H, data: g.getImageData(0, 0, W, H).data, canvas: c};
}
function analyse(){
  var r = toCanvas(), m = SF.segment(r.data, r.W, r.H, st.box), f = SF.features(m, r.W, r.H);
  // draw preview with mask overlay
  var pc = document.getElementById("pc"); if(!pc) return;
  var sc = Math.min(1, 420 / r.W) * 1; pc.width = r.W; pc.height = r.H; pc.style.width = Math.round(r.W * Math.min(420 / r.W, 2)) + "px";
  var g = pc.getContext("2d"); g.drawImage(r.canvas, 0, 0);
  var id = g.getImageData(0, 0, r.W, r.H);
  for(var i = 0; i < r.W * r.H; i++){ if(!m[i]){ id.data[i * 4] *= 0.35; id.data[i * 4 + 1] *= 0.35; id.data[i * 4 + 2] = id.data[i * 4 + 2] * 0.35 + 60; } }
  g.putImageData(id, 0, 0);
  if(st.box){ g.strokeStyle = "#ffb000"; g.lineWidth = 2; g.strokeRect(st.box[0], st.box[1], st.box[2] - st.box[0], st.box[3] - st.box[1]); }
  st.res = f ? {f: f, top: SF.match(f, D.shape_lib, 5), hints: SF.hints(f)} : null;
  document.getElementById("pres").innerHTML = st.res ? resultHtml(st.res) : '<div class="placeholder bad">' + esc(pick("물체를 찾지 못했어요. 영역을 드래그로 지정해 보세요.", "Could not find an object. Drag a box around it.")) + "</div>";
  window.BSA.bindLB(document.getElementById("pres"));
  bindPlan();
}
function boxDrag(c){
  var p0 = null;
  function pt(e){ var r = c.getBoundingClientRect(); return [Math.round((e.clientX - r.left) / r.width * c.width), Math.round((e.clientY - r.top) / r.height * c.height)]; }
  c.onmousedown = function(e){ if(!st.img) return; p0 = pt(e); };
  c.onmouseup = function(e){ if(!p0) return; var p1 = pt(e); var b = [Math.max(0, Math.min(p0[0], p1[0])), Math.max(0, Math.min(p0[1], p1[1])), Math.min(c.width - 1, Math.max(p0[0], p1[0])), Math.min(c.height - 1, Math.max(p0[1], p1[1]))]; p0 = null; st.box = (b[2] - b[0] > 10 && b[3] - b[1] > 10) ? b : null; analyse(); };
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
  var top = R.top, best = model(top[0].id);
  var h = '<h2>' + esc(t("plan_title")) + "</h2>";
  h += '<div class="shape"><b>' + esc(t("shape")) + "</b> " + featChips(R.f) + "</div>";
  if(R.hints.length){
    h += '<h3>' + esc(t("hints")) + '</h3><table class="hints"><thead><tr><th></th><th>🔧 ' + esc(t("basic")) + "</th><th>🧱 " + esc(t("modifier")) + "</th></tr></thead><tbody>";
    R.hints.forEach(function(x){ h += "<tr><td><b>" + esc(pick(x.ko, x.en)) + "</b></td><td>" + esc(pick(x.basic_ko, x.basic_en)) + "</td><td>" + esc(pick(x.mod_ko, x.mod_en)) + "</td></tr>"; });
    h += "</tbody></table>";
  }
  h += "<h3>" + esc(t("matches")) + '</h3><div class="mlist">' + top.map(function(r, i){
    var m = model(r.id); if(!m) return ""; var a = window.BSA.exRender(m, "basic"), b = window.BSA.exRender(m, "modifier");
    var sim = Math.max(0, Math.round((1 - r.d / 0.6) * 100));
    return '<button class="mitem' + (i === 0 ? " on" : "") + '" data-id="' + m.id + '"><span class="rk">' + (i + 1) + '</span>' + (a ? '<img src="' + a.th + '" alt="">' : "") + '<span class="nm">' + esc(pick(m.ko, m.en)) + '<small>' + esc(pick("닮은 정도 ", "similarity ")) + sim + "%</small></span></button>";
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
  if(st.box){ var k = c.width / document.getElementById("pc").width; g.strokeStyle = "#ff0000"; g.lineWidth = 3; g.strokeRect(st.box[0] * k, st.box[1] * k, (st.box[2] - st.box[0]) * k, (st.box[3] - st.box[1]) * k); }
  return c.toDataURL("image/jpeg", 0.85);
}
window.PLAN = {render: render, _st: st};
})();
