/* Immersive-exhibition models (Modeling tab › '#model/immersive', detail '#model/im/<id>').
   Data: immersive_data.js (window.IMM_DATA), kept separate from data.js. Every example is an
   'inspired recreation / 추정 재현' — not an official asset; images are this guide's own Blender renders. */
(function(){
"use strict";
var D = window.IMM_DATA, I = window.I18N, L = I.L, pick = I.pick;
if(!D) return;
var SD = "https://kibang.github.io/blender-shader-dictionary/#/r/";
var K = {
 ko: {tab: "🎆 이머시브 전시 모델", h: "이머시브 전시 모델", lead: "국내 몰입형 미디어아트 전시에서 선보인 장면의 '형태'를 블렌더 파이썬 스크립트로 다시 만들어 봐요. 스크립트 하나가 모델 전체를 절차적으로(bmesh·Geometry Nodes·커브) 만들고, 어울리는 재질까지 입혀요.",
      warn: "모든 예제는 공개 자료를 참고한 '추정 재현(inspired recreation)'이에요. 공식 에셋이나 실제 제작 파일이 아니고, 각 운영사·작가와 관계없어요. 그림은 모두 이 가이드가 Blender 5.3으로 직접 렌더한 것이며 전시장 사진은 쓰지 않았어요.",
      where: "원작 전시 · 장소 · 연도", whereT: "출처에 날짜가 나온 것만 적었어요. 공간(존) 구성은 바뀔 수 있어요.", badge: "추정 재현", facts: "출처 있는 사실", est: "추정 / 재현 방법", estT: "공개 자료에 없는 부분은 추정이에요. 실제 작품과 모양·크기·제작 방법이 다를 수 있어요.",
      shaders: "어울리는 셰이더 (셰이더 사전)", src: "출처 (2026-11-25 확인)", ver: "Blender 5.3 · 4.5에서 실행·검사 통과", back: "← 이머시브 전시 모델", open: "예제 열기 →",
      safe: "실행하면 'IMM_…' 컬렉션 하나만 새로 만들어요. 다시 실행하면 그 컬렉션만 지우고 새로 만들고, 다른 오브젝트는 건드리지 않아요.",
      howto: "Scripting 탭 → Text Editor에서 + New → 붙여넣기(Ctrl+V) → ▶ Run Script(Alt+P). 빈 장면이 아니어도 돼요. 빛나는 재질은 렌더 미리보기(Z → Rendered)에서 보여요.",
      addon: "🧩 애드온 지원은 준비 중이에요. 지금은 위 방법으로 Scripting 탭에 붙여넣어 실행하세요.", n: "개", tags: "쓰는 기술", lvl: "난이도", tris: "삼각형", note: "전시관·작품 이름은 각 운영사·작가의 것이에요. 이 페이지는 학습용 설명이에요."},
 en: {tab: "🎆 Immersive exhibition models", h: "Immersive exhibition models", lead: "Rebuild the forms of scenes shown at Korean immersive media-art venues as Blender Python scripts. Each script builds the whole model procedurally (bmesh, Geometry Nodes, curves) and adds a matching material.",
      warn: "Every example is an inspired recreation (추정 재현) based on public sources. They are not official assets or production files and are not affiliated with any venue or artist. All images are this guide's own Blender 5.3 renders; no venue photos are used.",
      where: "Original exhibition · venue · year", whereT: "Only dates printed in the sources are shown. Zones may have changed since.", badge: "Inspired recreation", facts: "Sourced facts", est: "Estimate / how it is recreated", estT: "Anything not in public sources is a guess; the real work may differ in shape, size and method.",
      shaders: "Matching shaders (Shader Dictionary)", src: "Sources (checked 2026-11-25)", ver: "Run & checked in Blender 5.3 and 4.5", back: "← Immersive exhibition models", open: "Open example →",
      safe: "Running it creates a single 'IMM_…' collection. Re-running removes and rebuilds only that collection; your other objects are never touched.",
      howto: "Scripting tab → Text Editor → + New → paste (Ctrl+V) → ▶ Run Script (Alt+P). The scene does not have to be empty. Glowing materials show in rendered preview (Z → Rendered).",
      addon: "🧩 Add-on support is coming. For now paste into the Scripting tab as above.", n: " examples", tags: "Techniques", lvl: "Difficulty", tris: "triangles", note: "Venue and artwork names belong to their operators and artists. This page is an educational explanation."}
};
function k(){ return K[L] || K.ko; }
function B(){ return window.BSA; }
function esc(s){ return B().esc(s); }
function lab(o){ return L === "en" ? o.en : o.ko; }
function refs(ns){ return " " + ns.map(function(n){ return '<a class="ref" href="#model/immersive/src" data-src="' + n + '">[' + n + "]</a>"; }).join(""); }
function cover(x){ return x.imgs.filter(function(i){ return i.kind === "render"; })[0]; }
function verBadge(x){
  var ok = x.verify && x.verify["53"] === "pass" && x.verify["45"] === "pass";
  return ok ? '<span class="badge ok">✓ 5.3 · 4.5</span>' : '<span class="badge bad">' + esc(pick("검사 실패", "check failed")) + "</span>";
}
function whereCard(x){ return x.shows && x.shows.length ? '<ul class="imm-where">' + x.shows.map(function(w){ return "<li>📍 " + esc(lab(w)) + "</li>"; }).join("") + "</ul>" : ""; }
function whereBox(x){ var c = k(); return x.shows && x.shows.length ? '<div class="imm-box imm-wherebox"><h3>📍 ' + esc(c.where) + '</h3><ul>' + x.shows.map(function(w){ return "<li>" + esc(lab(w)) + refs(w.src) + "</li>"; }).join("") + '</ul><p class="mut">' + esc(c.whereT) + "</p></div>" : ""; }
function srcList(nums){
  var used = nums || D.src.map(function(_, i){ return i + 1; });
  return '<ol class="imm-src">' + D.src.map(function(s, i){ return used.indexOf(i + 1) < 0 ? "" : '<li value="' + (i + 1) + '" id="imsrc' + (i + 1) + '"><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(lab(s)) + " ↗</a></li>"; }).join("") + "</ol>";
}
function list(S){
  var c = k(), h = '<section class="intro"><h1>' + esc(c.h) + " <small>" + D.items.length + esc(c.n) + "</small></h1><p>" + esc(c.lead) + "</p>";
  h += '<div class="imm-warn"><span class="badge est">' + esc(c.badge) + "</span> " + esc(c.warn) + "</div></section>";
  h += '<div class="cards ex imm-cards">' + D.items.map(function(x){
    var r = cover(x);
    return '<a class="card" href="#model/im/' + x.id + '"><div class="th">' + (r ? '<img loading="lazy" src="' + r.th + '" alt="' + esc(pick(x.ko, x.en)) + '">' : "") + '</div><div class="cb"><div class="meta"><span class="num">' + x.id + '</span><span class="badge est">' + esc(c.badge) + "</span>" + verBadge(x) + "</div><h3>" + esc(pick(x.ko, x.en)) + "</h3>" + whereCard(x) + "<p>" + esc(pick(x.dko, x.den)) + "</p></div></a>";
  }).join("") + "</div>";
  h += '<section class="imm-sec"><h2>' + esc(c.src) + "</h2>" + srcList() + '<p class="mut">' + esc(c.note) + "</p></section>";
  S.innerHTML = h;
}
function detail(S, id){
  var i = D.items.findIndex(function(x){ return x.id === id; }); if(i < 0){ location.hash = "#model/immersive"; return; }
  var x = D.items[i], prev = D.items[i - 1], next = D.items[i + 1], c = k(), A = B();
  var h = '<div class="crumbs"><a href="#model/immersive">' + esc(c.back) + '</a><span class="nav">' + (prev ? '<a href="#model/im/' + prev.id + '">‹ ' + prev.id + "</a>" : "") + (next ? '<a href="#model/im/' + next.id + '">' + next.id + " ›</a>" : "") + "</span></div>";
  h += '<article class="detail imm-detail"><div class="meta big"><span class="num">' + x.id + '</span><span class="badge est">' + esc(c.badge) + '</span><span class="lv">' + A.stars(x.lvl) + " " + esc(I.lvl(x.lvl)) + "</span>" + verBadge(x) + '<span class="cat">' + esc(x.tags.join(" · ")) + "</span></div>";
  h += "<h1>" + esc(pick(x.ko, x.en)) + '</h1><p class="sub">' + esc(pick(x.en, x.ko)) + '</p><p class="lead">' + esc(pick(x.dko, x.den)) + "</p>";
  h += '<div class="imm-warn"><span class="badge est">' + esc(c.badge) + "</span> " + esc(c.warn) + "</div>";
  h += whereBox(x);
  h += '<div class="imm-facts"><div class="imm-box"><h3>' + esc(c.facts) + "</h3><ul>" + x.fact.map(function(f){ return "<li>" + esc(lab(f)) + refs(f.src) + "</li>"; }).join("") + "</ul></div>";
  h += '<div class="imm-box estbox"><h3><span class="badge est">' + esc(c.est) + "</span></h3><p>" + esc(lab(x.est)) + '</p><p class="mut">' + esc(c.estT) + "</p></div></div>";
  h += '<div class="two"><div class="codecol"><div class="codehead"><b>' + esc(I.t("code")) + '</b><button class="copybtn" id="cp">📋 ' + esc(I.t("copy")) + "</button></div>";
  h += '<p class="imm-safe">🛡️ ' + esc(c.safe) + "</p>" + (D.addon_bundled && window.BSA_ADDON_HINT ? window.BSA_ADDON_HINT() : '<p class="addon-hint">' + esc(c.addon) + "</p>");
  h += '<pre class="code numbered"><code>' + A.hlLines(x.code) + "</code></pre>" + A.explainHTML(x);
  h += '<details class="howto" open><summary>▶ ' + esc(I.t("howto")) + "</summary><p>" + esc(c.howto) + "</p></details></div>";
  h += '<div class="imgcol"><h2>' + esc(I.t("result")) + '</h2><div class="shots imm-shots">' + x.imgs.map(function(im){ return A.fig(im, "im"); }).join("") + "</div>";
  h += '<p class="mut imm-stat">' + esc(c.ver) + (x.tris ? " · " + x.tris.toLocaleString() + " " + esc(c.tris) : "") + "</p>";
  h += '<h3 class="stage-h">' + esc(c.shaders) + '</h3><ul class="imm-shd">' + x.shaders.map(function(r){ return '<li><a href="' + SD + r + '" target="_blank" rel="noopener">R' + r + " ↗</a></li>"; }).join("") + "</ul>";
  h += '<h3 class="stage-h">' + esc(c.src) + "</h3>" + srcList(x.src) + "</div></div></article>";
  S.innerHTML = h;
  document.getElementById("cp").onclick = function(){ A.copy(x.code, this); };
  A.bindExplain(S);
  Array.prototype.forEach.call(S.querySelectorAll("a.ref"), function(a){ a.onclick = function(e){ e.preventDefault(); var t = document.getElementById("imsrc" + a.getAttribute("data-src")); if(t){ t.scrollIntoView({block: "center"}); t.classList.add("flash"); setTimeout(function(){ t.classList.remove("flash"); }, 1200); } }; });
}
window.BSA_IMM = {label: function(){ return k().tab; }, list: list, detail: detail};
})();
