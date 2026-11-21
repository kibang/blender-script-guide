/* Blender Script & Modeling Helper — main UI (no framework, works from file:// and GitHub Pages) */
(function(){
"use strict";
var D = window.APP_DATA, I = window.I18N, t = I.t, L = I.L, pick = I.pick;
var $ = function(s, r){ return (r || document).querySelector(s); };
function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]; }); }
function lab(pair){ return Array.isArray(pair) ? pick(pair[0], pair[1]) : pair; }
document.documentElement.lang = L;
document.title = t("title") + " (Blender 5.3)";
$("#t-title").textContent = t("title");
$("#tab-scripts").textContent = t("tab_scripts"); $("#tab-model").textContent = t("tab_model");
$("#lang-" + L).classList.add("on");
// keep the hash when switching language
["ko", "en"].forEach(function(l){ var a = $("#lang-" + l); a.onclick = function(e){ e.preventDefault(); try { localStorage.setItem("bsa.lang", l); } catch(x){} location.href = "?lang=" + l + location.hash; }; });

/* ---------- code highlighting (tiny, python) ---------- */
var KW = /\b(import|from|as|def|return|for|in|if|elif|else|while|with|try|except|finally|raise|class|lambda|and|or|not|is|None|True|False|pass|break|continue|global|yield|assert|del)\b/g;
function hl(code){
  var out = "", re = /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(\b\d+(?:\.\d+)?\b)/g, last = 0, m;
  while((m = re.exec(code))){
    out += kw(esc(code.slice(last, m.index)));
    if(m[1]) out += '<span class="c">' + esc(m[1]) + "</span>"; else if(m[2]) out += '<span class="s">' + esc(m[2]) + "</span>"; else out += '<span class="n">' + esc(m[3]) + "</span>";
    last = re.lastIndex;
  }
  return out + kw(esc(code.slice(last)));
  function kw(s){ return s.replace(KW, '<span class="k">$1</span>').replace(/\b(bpy|bmesh|mathutils)\b/g, '<span class="b">$1</span>'); }
}
/* code with line numbers: every line is its own block element (spans that cross lines are closed and reopened) */
function hlLines(code){
  var lines = hl(code.replace(/\n+$/, "")).split("\n"), open = null;
  return lines.map(function(l, i){
    var st = open ? [open] : [], re = /<span class="(\w+)">|<\/span>/g, m;
    while((m = re.exec(l))){ if(m[1]) st.push(m[1]); else st.pop(); }
    var html = (open ? '<span class="' + open + '">' : "") + l + new Array(st.length + 1).join("</span>");
    open = st.length ? st[st.length - 1] : null;
    return '<span class="cl" data-ln="' + (i + 1) + '">' + (html || " ") + "</span>";
  }).join("");
}
function rng(s){ var p = String(s).split("-"); return [+p[0], +(p[1] || p[0])]; }
function explainHTML(s){
  var x = s.ex; if(!x) return "";
  var K = L === "en" ? "en" : "ko", li = function(arr, f){ return arr.map(f).join(""); };
  var chip = function(r){ var a = rng(r); return (a[0] === a[1] ? t("ex_line") + " " + a[0] : t("ex_lines") + " " + a[0] + "–" + a[1]); };
  var h = '<section class="explain" id="explain"><h2>💡 ' + esc(t("ex_title")) + '</h2>';
  h += '<p class="ex-sum"><b>' + esc(t("ex_sum")) + ':</b> ' + esc(L === "en" ? x.sen : x.sko) + "</p>";
  h += '<h3>' + esc(t("ex_blocks")) + '</h3><p class="ex-hint">' + esc(t("ex_hint")) + '</p><ol class="ex-blocks">' + li(x.blocks, function(b, i){
    return '<li data-r="' + b.lines + '" data-i="' + i + '"><button class="ln-chip" type="button" data-r="' + b.lines + '">' + esc(chip(b.lines)) + "</button><span>" + esc(b[K]) + "</span></li>"; }) + "</ol>";
  if(x.apis.length) h += '<h3>' + esc(t("ex_apis")) + '</h3><dl class="ex-apis">' + li(x.apis, function(a){ return "<dt><code>" + esc(a.name) + "</code></dt><dd>" + esc(a[K]) + "</dd>"; }) + "</dl>";
  if(x.tweak.length) h += '<h3>' + esc(t("ex_tweak")) + '</h3><ul class="ex-tweak">' + li(x.tweak, function(a){ return "<li>" + esc(a[K]) + "</li>"; }) + "</ul>";
  if(x.pit.length) h += '<h3>' + esc(t("ex_pit")) + '</h3><ul class="ex-pit">' + li(x.pit, function(a){ return "<li>" + esc(a[K]) + "</li>"; }) + "</ul>";
  return h + "</section>";
}
function bindExplain(root){
  var pre = root.querySelector("pre.code"), ex = root.querySelector("#explain"); if(!pre || !ex) return;
  var lines = pre.querySelectorAll(".cl"), items = ex.querySelectorAll(".ex-blocks li");
  function mark(r, scroll){
    var a = rng(r); Array.prototype.forEach.call(lines, function(el, i){ el.classList.toggle("hit", i + 1 >= a[0] && i + 1 <= a[1]); });
    Array.prototype.forEach.call(items, function(li){ li.classList.toggle("on", li.getAttribute("data-r") === r); });
    var first = lines[a[0] - 1];
    if(scroll && first){ pre.scrollTop = Math.max(0, first.offsetTop - pre.clientTop - 24); var rc = pre.getBoundingClientRect(); if(rc.top < 60 || rc.top > window.innerHeight - 120) pre.scrollIntoView({block: "start", behavior: "smooth"}); }
  }
  ex.addEventListener("click", function(e){ var li = e.target.closest(".ex-blocks li"); if(li) mark(li.getAttribute("data-r"), true); });
  ex.addEventListener("mouseover", function(e){ var li = e.target.closest(".ex-blocks li"); if(li && window.matchMedia("(hover: hover)").matches) mark(li.getAttribute("data-r"), false); });
  pre.addEventListener("click", function(e){
    var cl = e.target.closest(".cl"); if(!cl || (window.getSelection && String(window.getSelection()))) return;
    var n = +cl.getAttribute("data-ln");
    for(var i = 0; i < items.length; i++){ var a = rng(items[i].getAttribute("data-r")); if(n >= a[0] && n <= a[1]){ mark(items[i].getAttribute("data-r"), false); var rc = items[i].getBoundingClientRect(); if(rc.top < 60 || rc.bottom > window.innerHeight) items[i].scrollIntoView({block: "center", behavior: "smooth"}); return; } }
  });
}
function copy(text, btn){
  function ok(){ if(btn){ var o = btn.textContent; btn.textContent = "✓ " + t("copied"); btn.classList.add("ok"); setTimeout(function(){ btn.textContent = o; btn.classList.remove("ok"); }, 1400); } }
  if(navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, fallback); else fallback();
  function fallback(){ var ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); ok(); } catch(e){} document.body.removeChild(ta); }
}
window.BSA = {esc: esc, copy: copy, hl: hl};

/* ---------- lightbox ---------- */
var LB = {list: [], i: 0};
function openLB(list, i){ LB.list = list; LB.i = i; showLB(); $("#lightbox").hidden = false; }
function showLB(){ var it = LB.list[LB.i]; $("#lightbox img").src = it.src; $("#lightbox .lb-cap").textContent = (LB.i + 1) + " / " + LB.list.length + "  ·  " + it.cap; }
$("#lightbox .lb-x").onclick = function(){ $("#lightbox").hidden = true; };
$("#lightbox").onclick = function(e){ if(e.target === this) this.hidden = true; };
$("#lightbox .lb-prev").onclick = function(){ LB.i = (LB.i + LB.list.length - 1) % LB.list.length; showLB(); };
$("#lightbox .lb-next").onclick = function(){ LB.i = (LB.i + 1) % LB.list.length; showLB(); };
document.addEventListener("keydown", function(e){ if($("#lightbox").hidden) return; if(e.key === "Escape") $("#lightbox").hidden = true; if(e.key === "ArrowRight") $("#lightbox .lb-next").click(); if(e.key === "ArrowLeft") $("#lightbox .lb-prev").click(); });
function bindLB(root){
  var figs = root.querySelectorAll("[data-lb]"), groups = {};
  Array.prototype.forEach.call(figs, function(f){ var g = f.getAttribute("data-lb"); (groups[g] = groups[g] || []).push(f); });
  Object.keys(groups).forEach(function(g){
    var list = groups[g].map(function(f){ return {src: f.getAttribute("data-src"), cap: f.getAttribute("data-cap")}; });
    groups[g].forEach(function(f, i){ f.onclick = function(){ openLB(list, i); }; });
  });
}

/* ---------- routing ---------- */
function route(){
  var h = location.hash.replace(/^#\/?/, "") || "scripts", p = h.split("/");
  document.querySelectorAll("#tabs a").forEach(function(a){ a.classList.toggle("on", a.getAttribute("data-tab") === (p[0] === "model" ? "model" : "scripts")); });
  var M = $("#main"); window.scrollTo(0, 0);
  if(p[0] === "model") renderModel(M, p[1] || "plan", p[2]);
  else if(p[1]) renderScript(M, p[1]); else renderScripts(M);
  bindLB(M);
}
window.addEventListener("hashchange", route);

/* ================= Scripts tab ================= */
var SS = {q: "", cat: "", lvl: 0};
function renderScripts(M){
  var cats = []; D.scripts.forEach(function(s){ if(cats.indexOf(s.cat) < 0) cats.push(s.cat); });
  var nPass = D.scripts.filter(function(s){ return s.verify === "pass" && s.capture === "pass"; }).length;
  var h = '<section class="intro"><h1>' + esc(t("tab_scripts")) + ' <small>' + D.scripts.length + (L === "en" ? " scripts" : "개") + '</small></h1><p>' +
    esc(pick("실무에서 바로 쓰는 bpy 스크립트 100개를 쉬운 것부터 어려운 순서로 모았어요. 모든 스크립트는 Blender 5.3의 Scripting 탭(Text Editor → Run Script)으로 실제 실행해서 결과를 검사했고, 실행 전·중간·후 화면을 그대로 찍었어요.",
    "100 practical bpy scripts from simple to advanced. Every script was actually run in Blender 5.3 through the Scripting tab (Text Editor → Run Script), checked automatically, and captured before / during / after.")) +
    ' <span class="badge ok">✓ ' + nPass + "/" + D.scripts.length + " " + esc(t("verified")) + "</span></p></section>";
  h += '<div class="filters"><input id="q" type="search" placeholder="' + esc(t("search")) + '" value="' + esc(SS.q) + '">';
  h += '<div class="chips" id="cats"><b>' + esc(t("category")) + '</b><button data-c="" class="' + (SS.cat ? "" : "on") + '">' + esc(t("all")) + "</button>" +
    cats.map(function(c){ return '<button data-c="' + c + '" class="' + (SS.cat === c ? "on" : "") + '">' + esc(I.cat(c)) + "</button>"; }).join("") + "</div>";
  h += '<div class="chips" id="lvls"><b>' + esc(t("level")) + '</b><button data-l="0" class="' + (SS.lvl ? "" : "on") + '">' + esc(t("all")) + "</button>" +
    [1, 2, 3, 4, 5].map(function(n){ return '<button data-l="' + n + '" class="' + (SS.lvl === n ? "on" : "") + '">' + stars(n) + " " + esc(I.lvl(n)) + "</button>"; }).join("") + "</div></div>";
  h += '<div id="count" class="count"></div><div class="cards" id="cards"></div>';
  M.innerHTML = h;
  $("#q").oninput = function(){ SS.q = this.value; list(); };
  $("#cats").onclick = function(e){ var b = e.target.closest("button"); if(!b) return; SS.cat = b.getAttribute("data-c"); this.querySelectorAll("button").forEach(function(x){ x.classList.toggle("on", x === b); }); list(); };
  $("#lvls").onclick = function(e){ var b = e.target.closest("button"); if(!b) return; SS.lvl = +b.getAttribute("data-l"); this.querySelectorAll("button").forEach(function(x){ x.classList.toggle("on", x === b); }); list(); };
  list();
  function list(){
    var q = SS.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    var r = D.scripts.filter(function(s){
      if(SS.cat && s.cat !== SS.cat) return false; if(SS.lvl && s.lvl !== SS.lvl) return false;
      if(!q.length) return true;
      var hay = (s.id + " " + s.ko + " " + s.en + " " + s.dko + " " + s.den + " " + I.cat(s.cat) + " " + s.code + (s.ex ? " " + s.ex.sko + " " + s.ex.sen : "")).toLowerCase();
      return q.every(function(w){ return hay.indexOf(w) >= 0; });
    });
    $("#count").textContent = r.length + " " + t("results");
    $("#cards").innerHTML = r.map(function(s){
      var aft = s.imgs.filter(function(x){ return x.stage === "after"; });
      var im = aft.filter(function(x){ return x.kind === "render"; })[0] || aft.filter(function(x){ return x.kind === "view"; })[0] || aft[0] || s.imgs[s.imgs.length - 1];
      return '<a class="card" href="#scripts/' + s.id + '"><div class="th">' + (im ? '<img loading="lazy" class="' + (im.kind === "view" || im.kind === "render" ? "" : "fit") + '" src="' + im.th + '" alt="">' : "") + '</div><div class="cb"><div class="meta"><span class="num">' + s.id.slice(1) + '</span><span class="cat">' + esc(I.cat(s.cat)) + '</span><span class="lv" title="' + esc(I.lvl(s.lvl)) + '">' + stars(s.lvl) + '</span>' + (s.verify === "pass" ? '<span class="vok" title="' + esc(t("verified")) + '">✓</span>' : "") + "</div><h3>" + esc(pick(s.ko, s.en)) + "</h3><p>" + esc(pick(s.dko, s.den)) + "</p></div></a>";
    }).join("") || '<p class="empty">' + esc(pick("찾는 스크립트가 없어요. 다른 낱말로 검색해 보세요.", "No scripts found. Try another word.")) + "</p>";
  }
}
function stars(n){ return "●●●●●".slice(0, n) + '<span class="dim">' + "●●●●●".slice(n) + "</span>"; }
function howto(){
  var st = L === "en" ? ["Open the <b>Scripting</b> workspace tab at the top of Blender.", "In the Text Editor click <b>+ New</b>.", "Paste the code (<kbd>Ctrl</kbd>+<kbd>V</kbd>).", "Prepare the scene like the <b>Before</b> picture (e.g. select the objects).", "Press <b>▶ Run Script</b> (or <kbd>Alt</kbd>+<kbd>P</kbd> over the editor). Messages from <code>print()</code> appear in Window → Toggle System Console (Windows) or the terminal."]
    : ["Blender 위쪽 작업공간 탭에서 <b>Scripting</b>을 누릅니다.", "가운데 Text Editor에서 <b>+ New(새로 만들기)</b>를 누릅니다.", "코드를 붙여넣습니다 (<kbd>Ctrl</kbd>+<kbd>V</kbd>).", "<b>실행 전</b> 그림처럼 장면을 준비합니다 (예: 오브젝트 선택).", "<b>▶ Run Script</b>를 누릅니다 (편집기 위에서 <kbd>Alt</kbd>+<kbd>P</kbd>). <code>print()</code> 메시지는 Window → Toggle System Console(윈도우) 또는 터미널에 나와요."];
  var hs = D.howto || [], img = hs.filter(function(h){ return h.indexOf("_" + L + ".") > 0; })[0] || hs[0];
  return '<details class="howto" open><summary>▶ ' + esc(t("howto")) + '</summary><ol>' + st.map(function(s){ return "<li>" + s + "</li>"; }).join("") + "</ol>" +
    (img ? '<figure class="howimg" data-lb="how" data-src="' + img + '" data-cap="Scripting"><img loading="lazy" src="' + img + '" alt="Scripting workspace"><figcaption>' + esc(pick("실제 Blender 5.3 Scripting 화면 (빨간 표시 = 누를 곳)", "The real Blender 5.3 Scripting workspace (red marks = what to click)")) + "</figcaption></figure>" : "") + "</details>";
}
function fig(im, group, extra){
  var cap = lab(im.label) + (im.kind === "render" ? " · " + pick("렌더", "render") : im.kind === "view" ? "" : " · " + im.kind);
  return '<figure class="shot ' + (extra || "") + '" data-lb="' + group + '" data-src="' + im.src + '" data-cap="' + esc(cap) + '"><img loading="lazy" src="' + im.th + '" alt="' + esc(cap) + '"><figcaption><span class="stg ' + im.stage.replace(/\d+/, "") + '">' + esc(stageName(im.stage)) + "</span> " + esc(lab(im.label)) + (im.kind === "render" ? ' <i>(' + esc(pick("렌더", "render")) + ")</i>" : im.kind !== "view" ? " <i>(" + esc(im.kind) + ")</i>" : "") + "</figcaption></figure>";
}
function stageName(s){ if(s === "before") return t("before"); if(s === "after") return t("after"); if(/^(result|output)/.test(s)) return pick("결과 파일", "Output"); if(/^frame/.test(s)) return pick("프레임 ", "Frame ") + parseInt(s.replace(/\D/g, ""), 10); var n = s.replace(/\D/g, ""); return t("step") + " " + n; }
function renderScript(M, id){
  var i = D.scripts.findIndex(function(s){ return s.id === id; }); if(i < 0){ location.hash = "#scripts"; return; }
  var s = D.scripts[i], prev = D.scripts[i - 1], next = D.scripts[i + 1];
  var order = function(im){ return im.stage === "before" ? 0 : im.stage === "after" ? 2 : /^(result|output)/.test(im.stage) ? 3 : 1; };
  var imgs = s.imgs.slice().sort(function(a, b){ return order(a) - order(b) || (parseInt(a.stage.replace(/\D/g, "") || 0) - parseInt(b.stage.replace(/\D/g, "") || 0)); });
  var h = '<div class="crumbs"><a href="#scripts">' + esc(t("back")) + '</a><span class="nav">' + (prev ? '<a href="#scripts/' + prev.id + '">‹ ' + prev.id + "</a>" : "") + (next ? '<a href="#scripts/' + next.id + '">' + next.id + " ›</a>" : "") + "</span></div>";
  h += '<article class="detail"><div class="meta big"><span class="num">' + s.id + '</span><span class="cat">' + esc(I.cat(s.cat)) + '</span><span class="lv">' + stars(s.lvl) + " " + esc(I.lvl(s.lvl)) + "</span>" + (s.verify === "pass" ? '<span class="badge ok">✓ ' + esc(t("verified")) + (s.check === "passed" ? " · " + esc(pick("결과 자동 검사 통과", "automatic result check passed")) : "") + "</span>" : '<span class="badge bad">' + esc(t("notdone")) + "</span>") + "</div>";
  h += "<h1>" + esc(pick(s.ko, s.en)) + '</h1><p class="sub">' + esc(pick(s.en, s.ko)) + "</p>";
  h += '<p class="lead">' + esc(pick(s.dko, s.den)) + "</p>";
  h += '<div class="two"><div class="codecol"><div class="codehead"><b>' + esc(t("code")) + '</b><button class="copybtn" id="cp">📋 ' + esc(t("copy")) + '</button></div><pre class="code numbered"><code>' + hlLines(s.code) + "</code></pre>" + explainHTML(s) + howto() + "</div>";
  h += '<div class="imgcol"><h2>' + esc(t("result")) + "</h2>";
  var bef = imgs.filter(function(x){ return x.stage === "before"; }), mid = imgs.filter(function(x){ return /^(step|frame)/.test(x.stage); }), aft = imgs.filter(function(x){ return x.stage === "after"; });
  if(bef.length) h += '<h3 class="stage-h">① ' + esc(t("before")) + '</h3><div class="shots">' + bef.map(function(x){ return fig(x, "s"); }).join("") + "</div>";
  if(mid.length) h += '<h3 class="stage-h">② ' + esc(t("steps")) + '</h3><div class="shots">' + mid.map(function(x){ return fig(x, "s"); }).join("") + "</div>";
  var outs = imgs.filter(function(x){ return /^(result|output)/.test(x.stage); }), num = ["①", "②", "③", "④"], ni = 1 + (mid.length ? 1 : 0);
  if(aft.length) h += '<h3 class="stage-h">' + num[ni] + " " + esc(t("after")) + '</h3><div class="shots">' + aft.map(function(x){ return fig(x, "s"); }).join("") + "</div>";
  if(outs.length) h += '<h3 class="stage-h">' + num[ni + (aft.length ? 1 : 0)] + " " + esc(pick("만들어진 파일 확인", "Checking the produced files")) + '</h3><div class="shots">' + outs.map(function(x){ return fig(x, "s"); }).join("") + "</div>";
  h += "</div></div></article>";
  M.innerHTML = h;
  $("#cp").onclick = function(){ copy(s.code, this); };
  bindExplain(M);
}

/* ================= Modeling tab ================= */
function renderModel(M, sub, arg){
  var h = '<div class="subtabs">' + [["plan", "sub_plan"], ["examples", "sub_examples"], ["gallery", "sub_gallery"]].map(function(x){ return '<a href="#model/' + x[0] + '" class="' + (sub === x[0] || (sub === "ex" && x[0] === "examples") ? "on" : "") + '">' + esc(t(x[1])) + "</a>"; }).join("") + "</div><div id='msub'></div>";
  M.innerHTML = h; var S = $("#msub");
  if(sub === "gallery") renderGallery(S); else if(sub === "examples") renderExamples(S); else if(sub === "ex") renderExample(S, arg); else window.PLAN.render(S);
}
function exRender(m, meth){ var x = m.methods[meth]; if(!x) return null; return x.imgs.filter(function(i){ return i.kind === "render"; })[0]; }
function renderExamples(S){
  var h = '<section class="intro"><h1>' + esc(t("sub_examples")) + " <small>" + D.models.length + (L === "en" ? " objects" : "개") + "</small></h1><p>" +
    esc(pick("물체마다 두 가지 방법을 나란히 보여 줘요. 왼쪽은 모디파이어 없이 Edit Mode 도구(Extrude, Inset, Loop Cut, Bevel, Spin…)만 쓰는 기본 모델링, 오른쪽은 모디파이어(Mirror, Array, Solidify, Screw…)를 쓰는 방법이에요. 모든 단계 이미지는 Blender 5.3에서 실제 스크립트를 실행하며 찍었어요.",
    "Every object is built two ways, side by side: basic modeling with Edit-Mode tools only (extrude, inset, loop cut, bevel, spin…, no modifiers) and a modifier workflow (Mirror, Array, Solidify, Screw…). Every step image comes from actually running the script in Blender 5.3.")) + "</p></section>";
  h += '<div class="cards ex">' + D.models.map(function(m){
    var a = exRender(m, "basic"), b = exRender(m, "modifier");
    return '<a class="card" href="#model/ex/' + m.id + '"><div class="th pair">' + (a ? '<img loading="lazy" src="' + a.th + '" alt="">' : "") + (b ? '<img loading="lazy" src="' + b.th + '" alt="">' : "") + '<span class="pl l">' + esc(t("basic")) + '</span><span class="pl r">' + esc(t("modifier")) + '</span></div><div class="cb"><div class="meta"><span class="cat">' + esc(I.cat(m.cat)) + '</span><span class="rec">' + esc(t("better")) + ": " + esc(t(m.better)) + "</span></div><h3>" + esc(pick(m.ko, m.en)) + "</h3><p>" + esc(pick(m.dko, m.den)) + "</p></div></a>";
  }).join("") + "</div>";
  S.innerHTML = h;
}
function methodCol(m, meth, compact){
  var x = m.methods[meth]; if(!x) return "";
  var views = x.imgs.filter(function(i){ return i.kind === "view"; }), rend = x.imgs.filter(function(i){ return i.kind === "render"; })[0];
  var stepImg = {}; views.forEach(function(v){ stepImg[v.stage] = v; });
  var lastAfter = views.filter(function(v){ return v.stage === "after"; })[0];
  var h = '<div class="mcol ' + meth + (m.better === meth ? " best" : "") + '"><div class="mhead"><h2>' + (meth === "basic" ? "🔧 " : "🧱 ") + esc(t(meth)) + (m.better === meth ? ' <span class="badge ok">★ ' + esc(t("better")) + "</span>" : "") + '</h2><p class="mut">' + esc(t(meth + "_sub")) + "</p></div>";
  h += '<ol class="steps">' + x.steps.map(function(s, i){
    var im = i < x.steps.length - 1 ? stepImg["step" + (i + 1)] : lastAfter;
    return '<li><div class="stxt"><b>' + (i + 1) + ".</b> " + esc(lab(s)) + "</div>" + (im ? '<figure class="shot" data-lb="' + m.id + meth + '" data-src="' + im.src + '" data-cap="' + esc((i + 1) + ". " + lab(s)) + '"><img loading="lazy" src="' + im.th + '" alt=""></figure>' : "") + "</li>";
  }).join("") + "</ol>";
  if(rend) h += '<figure class="shot final" data-lb="' + m.id + meth + '" data-src="' + rend.src + '" data-cap="' + esc(t("final")) + '"><img loading="lazy" src="' + rend.th + '" alt=""><figcaption>' + esc(t("final")) + " (Cycles)</figcaption></figure>";
  if(!compact){
    h += '<div class="codehead"><b>' + esc(t("code")) + '</b><button class="copybtn" data-copy="' + meth + '">📋 ' + esc(t("full_code")) + '</button></div><pre class="code small"><code>' + hl(x.code) + "</code></pre>";
  }
  return h + "</div>";
}
function renderExample(S, id){
  var m = D.models.filter(function(x){ return x.id === id; })[0]; if(!m){ location.hash = "#model/examples"; return; }
  var view = (function(){ try { return localStorage.getItem("bsa.exview") || "both"; } catch(e){ return "both"; } })();
  var h = '<div class="crumbs"><a href="#model/examples">' + esc(t("back")) + "</a></div>";
  h += '<article class="detail"><h1>' + esc(pick(m.ko, m.en)) + ' <small class="sub">' + esc(pick(m.en, m.ko)) + '</small></h1><p class="lead">' + esc(pick(m.dko, m.den)) + "</p>";
  h += '<div class="which ' + m.better + '"><b>💡 ' + esc(t("which")) + "</b> " + esc(pick(m.note_ko, m.note_en)) + "</div>";
  h += '<div class="toggle" id="mtog">' + ["both", "basic", "modifier"].map(function(v){ return '<button data-v="' + v + '" class="' + (view === v ? "on" : "") + '">' + esc(t(v)) + "</button>"; }).join("") + "</div>";
  h += '<p class="mut small">' + esc(t("helper_note")) + "</p>";
  h += '<div class="mcols view-' + view + '" id="mcols">' + methodCol(m, "basic") + methodCol(m, "modifier") + "</div></article>";
  S.innerHTML = h;
  $("#mtog").onclick = function(e){ var b = e.target.closest("button"); if(!b) return; var v = b.getAttribute("data-v"); try { localStorage.setItem("bsa.exview", v); } catch(x){} this.querySelectorAll("button").forEach(function(x){ x.classList.toggle("on", x === b); }); $("#mcols").className = "mcols view-" + v; };
  S.querySelectorAll("[data-copy]").forEach(function(b){ b.onclick = function(){ copy(D.prelude + "\nD2R = 0.0174533\n" + m.methods[b.getAttribute("data-copy")].code, b); }; });
}
window.BSA.methodCol = methodCol; window.BSA.bindLB = bindLB; window.BSA.exRender = exRender; window.BSA.lab = lab;

/* ---------- gallery ---------- */
function renderGallery(S){
  var G = D.gallery;
  if(!G){ S.innerHTML = "<p>…</p>"; return; }
  var groups = []; G.items.forEach(function(it){ if(groups.indexOf(it.group) < 0) groups.push(it.group); });
  var ok = G.items.filter(function(i){ return i.status === "pass"; }).length;
  var h = '<section class="intro"><h1>' + esc(t("sub_gallery")) + " <small>" + ok + "/" + G.items.length + '</small></h1><p>' + esc(t("gallery_intro")) + "</p></section>";
  h += '<div class="gnav">' + groups.map(function(g){ return '<a href="#" data-g="' + esc(g) + '">' + esc(g) + "</a>"; }).join("") + "</div>";
  if(G.menus && G.menus.length) h += '<details class="menus"><summary>' + esc(t("menu_shots")) + '</summary><div class="shots">' + G.menus.map(function(src, i){ return '<figure class="shot" data-lb="menu" data-src="' + src + '" data-cap="Shift+A"><img loading="lazy" src="' + src + '" alt=""></figure>'; }).join("") + "</div></details>";
  groups.forEach(function(g){
    var gd = G.groups[g];
    h += '<section class="ggroup" id="g-' + g.replace(/\W/g, "") + '"><h2>' + esc(g) + "</h2>" + (gd ? '<p class="mut">' + esc(pick(gd[0], gd[1])) + "</p>" : "") + '<div class="gcards">';
    G.items.filter(function(i){ return i.group === g; }).forEach(function(it){
      h += '<div class="gcard">' + (it.th ? '<figure class="shot" data-lb="gal" data-src="' + it.src + '" data-cap="' + esc(g + " › " + it.label) + '"><img loading="lazy" src="' + it.th + '" alt=""></figure>' : '<div class="noimg">' + esc(pick("이미지 없음", "no image")) + "</div>") +
        '<div class="gb"><h3>' + esc(it.label) + (it.verts ? ' <small>' + it.verts + " v · " + it.faces + " f</small>" : "") + "</h3><p>" + esc(pick(it.ko, it.en)) + "</p>" +
        '<code class="op" title="' + esc(pick("Python으로 추가하기", "Add it with Python")) + '">' + esc(it.code.split(";").slice(-1)[0].trim()) + "</code>" + (it.status !== "pass" ? '<p class="bad">' + esc(it.error && it.error[0] || "fail") + "</p>" : "") + "</div></div>";
    });
    h += "</div></section>";
  });
  S.innerHTML = h;
  S.querySelectorAll(".gnav a").forEach(function(a){ a.onclick = function(e){ e.preventDefault(); var el = document.getElementById("g-" + a.getAttribute("data-g").replace(/\W/g, "")); if(el) el.scrollIntoView({behavior: "smooth"}); }; });
  bindLB(S);
}

$("#foot").innerHTML = esc(pick("모든 이미지는 Blender 5.3.0(factory settings)에서 스크립트를 실제로 실행해 찍었습니다. 이 페이지는 아무 데이터도 서버로 보내지 않아요 (AI 모드를 직접 켰을 때만 선택한 회사로 전송).",
  "All images were captured by actually running the scripts in Blender 5.3.0 (factory settings). This page sends nothing anywhere (only the optional AI mode, when you use it, sends to the provider you choose).")) + " · " + D.scripts.length + " scripts · " + D.models.length + " examples";
route();
})();
