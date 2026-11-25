/* Blender default shortcut search (all keymap items extracted from Blender 5.3; data: keymap.js, loaded on demand) */
(function(){
"use strict";
var I = window.I18N, L = I.L, pick = I.pick;
function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]; }); }
var K = null, loading = null, IDX = null;
var st = {q: "", g: "", km: "", inp: "kbm", os: null, modal: true, d45: false, shown: 120};
try { st.os = localStorage.getItem("bsa.keyos"); } catch(e){}
if(st.os !== "mac" && st.os !== "win") st.os = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "") ? "mac" : "win";

function load(cb){
  if(window.BKEYS){ K = window.BKEYS; return cb(); }
  if(!loading){ loading = []; var s = document.createElement("script"); s.src = "keymap.js"; s.onload = function(){ K = window.BKEYS; var l = loading; loading = null; l.forEach(function(f){ f(); }); }; s.onerror = function(){ var l = loading; loading = null; l.forEach(function(f){ f(true); }); }; document.head.appendChild(s); }
  loading.push(cb);
}
/* ---------- key names ---------- */
var KN = {LEFTMOUSE: ["왼쪽 클릭", "Left Click"], RIGHTMOUSE: ["오른쪽 클릭", "Right Click"], MIDDLEMOUSE: ["휠 클릭(가운데 버튼)", "Middle Mouse"], WHEELUPMOUSE: ["휠 위로", "Wheel Up"], WHEELDOWNMOUSE: ["휠 아래로", "Wheel Down"],
  WHEELINMOUSE: ["휠 안쪽", "Wheel In"], WHEELOUTMOUSE: ["휠 바깥쪽", "Wheel Out"], WHEELLEFTMOUSE: ["휠 왼쪽", "Wheel Left"], WHEELRIGHTMOUSE: ["휠 오른쪽", "Wheel Right"], MOUSEMOVE: ["마우스 이동", "Mouse Move"],
  BUTTON4MOUSE: ["마우스 4번 버튼", "Mouse Button 4"], BUTTON5MOUSE: ["마우스 5번 버튼", "Mouse Button 5"], TRACKPADPAN: ["트랙패드 두 손가락 스크롤", "Trackpad Pan"], TRACKPADZOOM: ["트랙패드 핀치", "Trackpad Zoom"],
  MOUSEROTATE: ["트랙패드 회전", "Trackpad Rotate"], MOUSESMARTZOOM: ["트랙패드 스마트 줌", "Trackpad Smart Zoom"], SPACE: ["Space", "Space"], RET: ["Enter", "Enter"], NUMPAD_ENTER: ["숫자패드 Enter", "Numpad Enter"],
  ESC: ["Esc", "Esc"], TAB: ["Tab", "Tab"], BACK_SPACE: ["Backspace", "Backspace"], DEL: ["Delete", "Delete"], INSERT: ["Insert", "Insert"], HOME: ["Home", "Home"], END: ["End", "End"], PAGE_UP: ["Page Up", "Page Up"], PAGE_DOWN: ["Page Down", "Page Down"],
  UP_ARROW: ["↑", "↑"], DOWN_ARROW: ["↓", "↓"], LEFT_ARROW: ["←", "←"], RIGHT_ARROW: ["→", "→"], ACCENT_GRAVE: ["`", "`"], MINUS: ["-", "-"], EQUAL: ["=", "="], LEFT_BRACKET: ["[", "["], RIGHT_BRACKET: ["]", "]"],
  COMMA: [",", ","], PERIOD: [".", "."], SLASH: ["/", "/"], BACK_SLASH: ["\\", "\\"], SEMI_COLON: [";", ";"], QUOTE: ["'", "'"], LEFT_SHIFT: ["왼쪽 Shift", "Left Shift"], RIGHT_SHIFT: ["오른쪽 Shift", "Right Shift"],
  LEFT_CTRL: ["왼쪽 Ctrl", "Left Ctrl"], RIGHT_CTRL: ["오른쪽 Ctrl", "Right Ctrl"], LEFT_ALT: ["왼쪽 Alt", "Left Alt"], RIGHT_ALT: ["오른쪽 Alt", "Right Alt"], OSKEY: ["OS 키", "OS Key"], TEXTINPUT: ["글자 입력", "Text Input"],
  MEDIA_PLAY: ["미디어 재생/일시정지", "Media Play/Pause"], MEDIA_STOP: ["미디어 정지", "Media Stop"], MEDIA_FIRST: ["미디어 처음", "Media First"], MEDIA_LAST: ["미디어 끝", "Media Last"], APP: ["메뉴 키", "Menu Key"]};
var NUMW = {ZERO: "0", ONE: "1", TWO: "2", THREE: "3", FOUR: "4", FIVE: "5", SIX: "6", SEVEN: "7", EIGHT: "8", NINE: "9"};
var NUMP = {NUMPAD_PERIOD: ".", NUMPAD_SLASH: "/", NUMPAD_ASTERIX: "*", NUMPAD_MINUS: "-", NUMPAD_PLUS: "+"};
var MACK = {RET: "Return ↩", BACK_SPACE: "Delete ⌫", DEL: "Fn+Delete ⌦", ESC: "esc", TAB: "⇥ Tab", LEFT_ALT: "왼쪽 ⌥", RIGHT_ALT: "오른쪽 ⌥", LEFT_CTRL: "왼쪽 ⌃", RIGHT_CTRL: "오른쪽 ⌃", LEFT_SHIFT: "왼쪽 ⇧", RIGHT_SHIFT: "오른쪽 ⇧", OSKEY: "⌘"};
function keyName(ty, mac){
  if(mac && MACK[ty]) return L === "en" ? MACK[ty].replace("왼쪽 ", "Left ").replace("오른쪽 ", "Right ") : MACK[ty];
  if(KN[ty]) return pick(KN[ty][0], KN[ty][1]);
  if(NUMW[ty]) return NUMW[ty];
  if(/^NUMPAD_\d$/.test(ty)) return pick("숫자패드 ", "Numpad ") + ty.slice(7);
  if(NUMP[ty]) return pick("숫자패드 ", "Numpad ") + NUMP[ty];
  if(/^[A-Z]$|^F\d+$/.test(ty)) return ty;
  var T = K.types[ty]; return T ? (L === "ko" && T[1] ? T[1] : T[0]) : ty;
}
var VAL = {RELEASE: ["떼면", "release"], CLICK: ["클릭", "click"], DOUBLE_CLICK: ["더블클릭", "double-click"], CLICK_DRAG: ["드래그", "drag"], ANY: ["누르기·떼기 모두", "press or release"], NOTHING: ["", ""], SOUTH: ["아래", "down"], NORTH: ["위", "up"], EAST: ["오른쪽", "right"], WEST: ["왼쪽", "left"],
  NORTH_EAST: ["오른쪽 위", "up-right"], NORTH_WEST: ["왼쪽 위", "up-left"], SOUTH_EAST: ["오른쪽 아래", "down-right"], SOUTH_WEST: ["왼쪽 아래", "down-left"]};
function macCmd(it){ // macOS adds a Cmd version for Ctrl shortcuts (bl_keymap_utils.platform_helpers), with a few exceptions
  if(it[8] !== 1) return false;
  var ty = it[5], X = K.mac_ctrl_only;
  if(X.single.indexOf(ty) >= 0 && it[9] !== 1 && it[7] !== 1) return false;
  if(X.ctrl_alt.indexOf(ty) >= 0 && it[9] === 1 && it[7] !== 1) return false;
  return true;
}
/* parts of one combo: list of labels */
function parts(it, mac, useCmd){
  var p = [];
  if(it[12] === 1 || false){}
  if(mac){
    if(it[8] === 1 && !useCmd) p.push("⌃ Control"); if(it[9] === 1) p.push("⌥ Option"); if(it[7] === 1) p.push("⇧ Shift"); if(it[10] === 1 || useCmd) p.push("⌘ Cmd");
  } else {
    if(it[8] === 1) p.push("Ctrl"); if(it[9] === 1) p.push("Alt"); if(it[7] === 1) p.push("Shift"); if(it[10] === 1) p.push("Win/Super");
  }
  if(it[11] === 1) p.push("Hyper");
  if(it[12]) p.push(keyName(it[12], mac) + pick(" 누른 채", " held"));
  p.push(keyName(it[5], mac));
  return p;
}
function comboHTML(it){
  var mac = st.os === "mac", cmd = mac && macCmd(it);
  var h = parts(it, mac, cmd).map(function(x){ return "<kbd>" + esc(x) + "</kbd>"; }).join('<span class="kp">+</span>');
  var v = it[6], extra = [];
  if(it[7] === -1 && it[8] === -1) extra.push(pick("수식키 상관없음", "any modifiers"));
  if(v !== "PRESS" && VAL[v] && VAL[v][0]) extra.push(pick(VAL[v][0], VAL[v][1]) + (it[14] && VAL[it[14]] ? " " + pick(VAL[it[14]][0], VAL[it[14]][1]) : ""));
  if(it[13]) extra.push(pick("누르고 있으면 반복", "repeats"));
  if(extra.length) h += ' <span class="kv">' + esc(extra.join(" · ")) + "</span>";
  if(cmd) h += '<div class="kalt">' + esc(pick("⌃ Control로도 돼요", "⌃ Control works too")) + "</div>";
  return h;
}
/* ---------- search index ---------- */
function norm(s){ return String(s || "").toLowerCase().replace(/\s+/g, " ").trim(); }
function build(){
  IDX = K.items.map(function(it, i){
    var km = K.kms[it[0]], op = it[1] >= 0 ? K.ops[it[1]] : null;
    var nameKo = it[3] || it[2], opKo = op ? (op[2] || op[1]) : "";
    var hay = norm([it[2], nameKo, op ? op[0] : "", op ? op[1] : "", opKo, it[17], it[15]].join(" | "));
    var hay2 = norm([km[0], km[1], op ? op[3] : "", op ? op[4] : ""].join(" | "));
    return {i: i, n: norm(it[2]), nk: norm(nameKo).replace(/ /g, ""), nkr: norm(nameKo), hay: hay, hay2: hay2, hayk: hay.replace(/ /g, "")};
  });
}
var MODW = {ctrl: "c", control: "c", "컨트롤": "c", "⌃": "c", shift: "s", "시프트": "s", "⇧": "s", alt: "a", option: "a", opt: "a", "⌥": "a", "알트": "a", cmd: "o", command: "o", "⌘": "o", win: "o", super: "o", os: "o", oskey: "o", hyper: "h"};
var KEYW = {space: "SPACE", "스페이스": "SPACE", spacebar: "SPACE", enter: "RET", return: "RET", "엔터": "RET", esc: "ESC", escape: "ESC", tab: "TAB", "탭": "TAB", backspace: "BACK_SPACE", del: "DEL", delete: "DEL", ins: "INSERT", insert: "INSERT",
  home: "HOME", end: "END", pageup: "PAGE_UP", pagedown: "PAGE_DOWN", pgup: "PAGE_UP", pgdn: "PAGE_DOWN", up: "UP_ARROW", down: "DOWN_ARROW", left: "LEFT_ARROW", right: "RIGHT_ARROW", "↑": "UP_ARROW", "↓": "DOWN_ARROW", "←": "LEFT_ARROW", "→": "RIGHT_ARROW",
  lmb: "LEFTMOUSE", rmb: "RIGHTMOUSE", mmb: "MIDDLEMOUSE", "좌클릭": "LEFTMOUSE", "우클릭": "RIGHTMOUSE", "휠클릭": "MIDDLEMOUSE", click: "LEFTMOUSE", "클릭": "LEFTMOUSE", wheelup: "WHEELUPMOUSE", wheeldown: "WHEELDOWNMOUSE", "휠업": "WHEELUPMOUSE", "휠다운": "WHEELDOWNMOUSE",
  "`": "ACCENT_GRAVE", "~": "ACCENT_GRAVE", "-": "MINUS", "=": "EQUAL", "[": "LEFT_BRACKET", "]": "RIGHT_BRACKET", ",": "COMMA", ".": "PERIOD", "/": "SLASH", "\\": "BACK_SLASH", ";": "SEMI_COLON", "'": "QUOTE"};
var DIG = ["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"];
function keyTok(w){
  if(KEYW[w]) return [KEYW[w]];
  if(/^[a-z]$/.test(w)) return [w.toUpperCase()];
  if(/^f([1-9]|1[0-9]|2[0-4])$/.test(w)) return [w.toUpperCase()];
  if(/^[0-9]$/.test(w)) return [DIG[+w], "NUMPAD_" + w];
  var m = /^(?:numpad|num|np|숫자패드|넘패드)([0-9]|\.|\/|\*|-|\+|enter)$/.exec(w);
  if(m){ var x = m[1]; return /\d/.test(x) ? ["NUMPAD_" + x] : [{".": "NUMPAD_PERIOD", "/": "NUMPAD_SLASH", "*": "NUMPAD_ASTERIX", "-": "NUMPAD_MINUS", "+": "NUMPAD_PLUS", enter: "NUMPAD_ENTER"}[x]]; }
  return null;
}
/* returns {mods:{c,s,a,o,h}, keys:[types]|null} if q is a key combo, else null */
function parseCombo(q){
  var raw = q.toLowerCase().replace(/(numpad|num|np|숫자패드|넘패드)\s+/g, "$1").replace(/page\s+(up|down)/g, "page$1").replace(/wheel\s+(up|down)/g, "wheel$1").trim();
  if(!raw) return null;
  var toks = raw === "+" ? ["+"] : raw.split(/\s*\+\s*|\s+/).filter(Boolean);
  if(/\+\s*\+$/.test(raw)) toks.push("+");
  var mods = {c: 0, s: 0, a: 0, o: 0, h: 0}, keys = null, nm = 0;
  for(var i = 0; i < toks.length; i++){
    var w = toks[i];
    if(MODW[w]){ mods[MODW[w]] = 1; nm++; continue; }
    var k = w === "+" ? null : keyTok(w);
    if(!k || keys) return null;
    keys = k;
  }
  if(!keys && !nm) return null;
  return {mods: mods, keys: keys, nmods: nm};
}
function comboMatch(it, c){
  if(c.keys && c.keys.indexOf(it[5]) < 0) return false;
  var mac = st.os === "mac", cmd = mac && macCmd(it);
  var have = {c: it[8] === 1, s: it[7] === 1, a: it[9] === 1, o: it[10] === 1, h: it[11] === 1};
  if(c.nmods === 0 && c.keys){ return true; } // bare key: every combo using that key (no-modifier first)
  function eq(h){ return ["c", "s", "a", "o", "h"].every(function(m){ return !!h[m] === !!c.mods[m]; }); }
  if(eq(have)) return true;
  if(cmd){ var h2 = {c: false, s: have.s, a: have.a, o: true, h: have.h}; if(eq(h2)) return true; }
  if(!c.keys){ return ["c", "s", "a", "o", "h"].every(function(m){ return !c.mods[m] || have[m] || (m === "o" && cmd) || (m === "c" && false); }); }
  return false;
}
function nmods(it){ return (it[7] === 1) + (it[8] === 1) + (it[9] === 1) + (it[10] === 1) + (it[11] === 1); }
var INTERNAL = {TIMER: 1, TEXTINPUT: 1};
function inpOK(it){
  var mt = it[19], ty = it[5];
  if(st.inp === "all") return true;
  if(INTERNAL[mt] || /^(TIMER|EVT_TWEAK|ACTIONZONE|WINDOW_DEACTIVATE|MOUSEMOVE$)/.test(ty)) return false;
  if(st.inp === "kbm") return mt === "KEYBOARD" || mt === "MOUSE";
  if(st.inp === "kb") return mt === "KEYBOARD";
  if(st.inp === "mouse") return mt === "MOUSE";
  if(st.inp === "ndof") return mt === "NDOF";
  return true;
}
/* tie-break: 3D Viewport and global keys first, modal / tool keymaps later (group ids from keymap.js order) */
var POP = {"Window": 1, "Screen": 1, "3D View": 1, "3D View Generic": 1, "Object Mode": 1, "Object Non-modal": 1, "Mesh": 1, "Node Editor": 1, "Node Generic": 1, "Frames": 1, "Transform Modal Map": 1};
var GRANK = [1, 0, 2, 2, 3, 3, 4, 4, 4, 3, 3, 4, 4, 5, 4, 5, 5, 6];
/* Korean-friendly word match: "잘라내기" also matches "잘라내고" (drop one trailing syllable for words of 3+ syllables) */
function hasWord(x, w){
  if(x.hay.indexOf(w) >= 0 || x.hay2.indexOf(w) >= 0) return true;
  if(/[\uac00-\ud7a3]$/.test(w) && w.length >= 3){ var s = w.slice(0, -1); return x.hay.indexOf(s) >= 0; }
  return false;
}
function search(){
  var q = st.q.trim(), c = parseCombo(q), nq = norm(q), nqk = nq.replace(/ /g, ""), res = [];
  var words = nq.split(" ").filter(Boolean);
  for(var j = 0; j < IDX.length; j++){
    var x = IDX[j], it = K.items[x.i], km = K.kms[it[0]];
    if(st.g !== "" && km[7] !== +st.g) continue;
    if(st.km !== "" && it[0] !== +st.km && km[9] !== K.kms[+st.km][0]) continue;
    if(!st.modal && km[4]) continue;
    if(st.d45 && it[16] === 0) continue;
    if(!inpOK(it)) continue;
    var sc = 0;
    if(!q) sc = 1;
    else if(c){ if(comboMatch(it, c)) sc = 1000 - nmods(it) * 10 - (it[6] === "PRESS" ? 0 : 5); }
    else {
      if(x.n === nq || x.nkr === nq) sc = 900;
      else if(x.n.indexOf(nq) === 0 || x.nk.indexOf(nqk) === 0) sc = 700;
      else if(x.hay.indexOf(nq) >= 0 || x.hayk.indexOf(nqk) >= 0) sc = 500;
      else if(words.length && words.every(function(w){ return hasWord(x, w); })) sc = 300;
      else if(nq.length >= 3 && x.hay2.indexOf(nq) >= 0) sc = 100;
      if(sc) sc -= Math.min(nmods(it), 3);
    }
    if(sc) res.push([sc + (POP[km[0]] ? 2 : 0) - (GRANK[km[7]] == null ? 4 : GRANK[km[7]]) * 0.2 - km[4] * 1.5 - km[5] * 0.5, j]);
  }
  res.sort(function(a, b){ return b[0] - a[0] || a[1] - b[1]; });
  return res.map(function(r){ return r[1]; });
}
/* ---------- render ---------- */
function kmLabel(km){ return L === "ko" && km[1] ? km[1] : km[0]; }
function row(j){
  var it = K.items[j], km = K.kms[it[0]], op = it[1] >= 0 ? K.ops[it[1]] : null;
  var nm = L === "ko" ? (it[3] || it[2]) : it[2], sub = L === "ko" ? (it[3] ? it[2] : "") : "";
  var desc = op ? (L === "ko" ? (op[4] || op[3]) : op[3]) : "";
  var h = '<li class="kr"><div class="kc">' + comboHTML(it) + '</div><div class="kn"><b>' + esc(nm) + "</b>" + (sub ? ' <span class="ks">' + esc(sub) + "</span>" : "") +
    (it[4] === 1 && L === "ko" ? ' <span class="tag man" title="Blender 한국어 번역에 없는 이름이라 직접 옮겼어요">보충 번역</span>' : "") +
    (it[16] === 1 ? ' <span class="tag new">' + esc(pick("5.x 새 단축키", "new in 5.x")) + "</span>" : it[16] === 2 ? ' <span class="tag chg" title="4.5: ' + esc(it[18]) + '">' + esc(pick("4.5와 다름", "changed since 4.5")) + "</span>" : "") +
    (desc ? '<div class="kd">' + esc(desc) + "</div>" : "") +
    '<div class="km"><span class="ked">' + esc(pick(K.groups[km[7]][1], K.groups[km[7]][2])) + "</span> › " + esc(kmLabel(km)) + (km[4] ? ' <span class="tag mod">' + esc(pick("작업 중", "modal")) + "</span>" : "") +
    ' <code class="op">' + esc(op ? op[0] : it[17]) + "</code>" + (it[15] ? ' <code class="pr">' + esc(it[15]) + "</code>" : "") + "</div></div></li>";
  return h;
}
var lastRes = [], timer = null;
function paint(S){
  var t0 = performance.now(); lastRes = search(); var dt = performance.now() - t0;
  var n = Math.min(lastRes.length, st.shown);
  var c = parseCombo(st.q.trim());
  var info = (st.q.trim() ? (c ? pick("키 조합으로 찾는 중: ", "Searching by key combo: ") : pick("이름·연산자로 찾는 중 · ", "Searching names & operators · ")) : "") + lastRes.length.toLocaleString() + (L === "ko" ? "개" : lastRes.length === 1 ? " shortcut" : " shortcuts") + " · " + dt.toFixed(1) + " ms";
  S.querySelector("#kinfo").textContent = info;
  S.querySelector("#klist").innerHTML = lastRes.length ? lastRes.slice(0, n).map(row).join("") : '<li class="kempty">' + esc(pick("찾는 단축키가 없어요. 다른 말(영어 이름, 연산자 이름, 예: mesh.extrude)이나 키 조합(예: ctrl+shift+a)으로 찾아보세요.", "No shortcut found. Try another word (Korean or English name, operator like mesh.extrude) or a key combo (e.g. ctrl+shift+a).")) + "</li>";
  var more = S.querySelector("#kmore"); more.hidden = lastRes.length <= n; more.textContent = pick("더 보기 (" + (lastRes.length - n).toLocaleString() + "개 남음)", "Show more (" + (lastRes.length - n).toLocaleString() + " left)");
  window.__keysLast = {count: lastRes.length, ms: dt, shown: n};
}
function kmOptions(){
  var o = '<option value="">' + esc(pick("모든 키맵", "All keymaps")) + "</option>";
  K.kms.forEach(function(km, i){ if(st.g === "" || km[7] === +st.g) o += '<option value="' + i + '"' + (String(i) === st.km ? " selected" : "") + ">" + new Array(Math.min(km[8], 3) + 1).join("· ") + esc(kmLabel(km)) + "</option>"; });
  return o;
}
function renderLoaded(S){
  if(!IDX) build();
  var N = K.items.length;
  var h = '<section class="intro"><h1>' + esc(pick("⌨️ 블렌더 단축키 검색", "⌨️ Blender shortcut search")) + " <small>" + N.toLocaleString() + (L === "ko" ? "개" : "") + "</small></h1><p>" +
    esc(pick("Blender " + K.version + " 기본 키맵에 들어 있는 단축키 " + N.toLocaleString() + "개 전부를 Blender에서 직접 뽑았어요(에디터·모드·도구·작업 중 키 포함). 한국어 이름은 Blender 한국어 번역 그대로이고, 번역이 없는 " + K.items.filter(function(i){ return i[4] === 1; }).length + "개만 직접 옮겨 '보충 번역'으로 표시했어요. 기능 이름(한/영), 키 조합, 연산자 이름으로 찾을 수 있어요.",
      "All " + N.toLocaleString() + " shortcuts in Blender " + K.version + "'s default keymap, extracted directly from Blender (every editor, mode, tool and modal map). Search by action name (Korean or English), key combo or operator.")) + "</p></section>";
  h += '<div class="kbar"><input id="kq" type="search" autocomplete="off" spellcheck="false" placeholder="' + esc(pick("예: 돌출, extrude, ctrl+shift+a, g, mesh.loopcut", "e.g. extrude, ctrl+shift+a, g, mesh.loopcut")) + '" value="' + esc(st.q) + '" aria-label="' + esc(pick("단축키 검색", "Search shortcuts")) + '">' +
    '<div class="kos" role="group" aria-label="OS"><button type="button" data-os="win" class="' + (st.os === "win" ? "on" : "") + '">Windows · Linux</button><button type="button" data-os="mac" class="' + (st.os === "mac" ? "on" : "") + '">macOS</button></div></div>';
  h += '<div class="kfil"><label>' + esc(pick("에디터", "Editor")) + ' <select id="kg"><option value="">' + esc(pick("모든 에디터", "All editors")) + "</option>" + K.groups.map(function(g, i){ return '<option value="' + i + '"' + (String(i) === st.g ? " selected" : "") + ">" + esc(pick(g[1], g[2])) + "</option>"; }).join("") + "</select></label>" +
    '<label>' + esc(pick("키맵", "Keymap")) + ' <select id="kkm">' + kmOptions() + "</select></label>" +
    '<label>' + esc(pick("입력", "Input")) + ' <select id="kinp">' + [["kbm", "키보드·마우스", "Keyboard & mouse"], ["kb", "키보드만", "Keyboard only"], ["mouse", "마우스·트랙패드만", "Mouse & trackpad only"], ["ndof", "3D 마우스(NDOF)", "3D mouse (NDOF)"], ["all", "전부 (내부 이벤트 포함)", "Everything (incl. internal events)"]].map(function(o){ return '<option value="' + o[0] + '"' + (st.inp === o[0] ? " selected" : "") + ">" + esc(pick(o[1], o[2])) + "</option>"; }).join("") + "</select></label>" +
    '<label class="chk"><input type="checkbox" id="kmodal"' + (st.modal ? " checked" : "") + "> " + esc(pick("작업 중 키(모달) 포함", "Include modal keys")) + "</label>" +
    '<label class="chk"><input type="checkbox" id="kd45"' + (st.d45 ? " checked" : "") + "> " + esc(pick("4.5와 달라진 것만", "Only changed since 4.5")) + "</label></div>";
  h += '<p class="kinfo mut small" id="kinfo" aria-live="polite"></p><ul class="klist" id="klist"></ul><button type="button" class="kmore" id="kmore" hidden></button>';
  h += '<details class="krem"><summary>' + esc(pick("Blender 4.5에만 있고 5.3 기본 키맵에서 빠진 단축키 (" + K.removed45.length + "개)", "Shortcuts in Blender 4.5 that are gone from the 5.3 default keymap (" + K.removed45.length + ")")) + '</summary><ul class="klist">' +
    K.removed45.map(function(r){ var it = [0, 0, r[1], r[2], 0, r[3], r[4], r[5], r[6], r[7], r[8], 0, r[9], 0, "", "", 0, r[10], "", ""]; return '<li class="kr"><div class="kc">' + comboHTML(it) + '</div><div class="kn"><b>' + esc(L === "ko" ? (r[2] || r[1]) : r[1]) + '</b><div class="km">' + esc(r[0]) + ' <code class="op">' + esc(r[10]) + "</code></div></div></li>"; }).join("") + "</ul></details>";
  h += '<p class="mut small ksrc">' + esc(pick("출처: Blender " + K.version + "에서 bpy.context.window_manager.keyconfigs.default의 모든 키맵을 직접 읽음(공장 초기 설정, 왼쪽 클릭 선택). macOS 표시는 Blender가 macOS에서 Ctrl 단축키에 ⌘ Cmd 버전을 함께 넣는 규칙(bl_keymap_utils.platform_helpers)을 따랐어요. 4.5 비교는 Blender " + K.v45 + "에서 같은 방법으로 뽑았어요. 환경 설정에서 키맵을 바꿨다면 실제 키는 다를 수 있어요.",
    "Source: every keymap in bpy.context.window_manager.keyconfigs.default read directly in Blender " + K.version + " (factory settings, left-click select). macOS display follows Blender's rule of adding a ⌘ Cmd version of Ctrl shortcuts on macOS (bl_keymap_utils.platform_helpers). The 4.5 comparison was extracted the same way from Blender " + K.v45 + ". If you changed your keymap in Preferences, your keys may differ.")) + "</p>";
  S.innerHTML = h;
  var q = S.querySelector("#kq");
  q.oninput = function(){ st.q = q.value; st.shown = 120; clearTimeout(timer); timer = setTimeout(function(){ paint(S); }, 60); };
  S.querySelector("#kg").onchange = function(){ st.g = this.value; st.km = ""; S.querySelector("#kkm").innerHTML = kmOptions(); st.shown = 120; paint(S); };
  S.querySelector("#kkm").onchange = function(){ st.km = this.value; st.shown = 120; paint(S); };
  S.querySelector("#kinp").onchange = function(){ st.inp = this.value; st.shown = 120; paint(S); };
  S.querySelector("#kmodal").onchange = function(){ st.modal = this.checked; st.shown = 120; paint(S); };
  S.querySelector("#kd45").onchange = function(){ st.d45 = this.checked; st.shown = 120; paint(S); };
  S.querySelector("#kmore").onclick = function(){ st.shown += 200; paint(S); };
  S.querySelectorAll(".kos button").forEach(function(b){ b.onclick = function(){ st.os = b.getAttribute("data-os"); try { localStorage.setItem("bsa.keyos", st.os); } catch(e){} S.querySelectorAll(".kos button").forEach(function(x){ x.classList.toggle("on", x === b); }); paint(S); }; });
  paint(S);
}
window.KEYS = {
  render: function(S){
    if(K){ renderLoaded(S); return; }
    S.innerHTML = '<p class="mut">' + esc(pick("단축키 목록 불러오는 중…", "Loading shortcuts…")) + "</p>";
    load(function(err){ if(!S.isConnected) return; if(err){ S.innerHTML = '<p class="mut">' + esc(pick("단축키 목록을 불러오지 못했어요. 새로고침해 주세요.", "Could not load the shortcut list. Please reload.")) + "</p>"; return; } renderLoaded(S); });
  }
};
})();
