/* Optional AI mode for the image → modeling plan. Sends the photo + key ONLY to the provider the user picks. */
(function(){
"use strict";
var I = window.I18N, t = I.t, L = I.L, pick = I.pick;
function esc(s){ return window.BSA.esc(s); }
var PROV = {
  openai: {label: "OpenAI", base: "https://api.openai.com/v1", model: "gpt-6.1-terra", keyUrl: "https://platform.openai.com/api-keys", kind: "chat"},
  xai: {label: "xAI Grok", base: "https://api.x.ai/v1", model: "grok-4.7", keyUrl: "https://console.x.ai", kind: "chat"},
  gemini: {label: "Google Gemini", base: "https://generativelanguage.googleapis.com/v1beta", model: "gemini-3.8-flash", keyUrl: "https://aistudio.google.com/apikey", kind: "gemini"},
  anthropic: {label: "Anthropic Claude", base: "https://api.anthropic.com/v1", model: "claude-sonnet-5-5", keyUrl: "https://platform.claude.com/settings/keys", kind: "anthropic"}
};
// Blender 5.3 modifier names (checked against bpy in Blender 5.3; see logs/modifier_types_5.3.json)
var MODS = window.APP_DATA.modifier_types || ["Array", "Bevel", "Boolean", "Build", "Decimate", "Edge Split", "Geometry Nodes", "Mask", "Mirror", "Multiresolution", "Remesh", "Screw", "Skin", "Solidify", "Subdivision Surface", "Triangulate", "Volume to Mesh", "Weld", "Wireframe", "Armature", "Cast", "Curve", "Displace", "Hook", "Laplacian Deform", "Lattice", "Mesh Deform", "Shrinkwrap", "Simple Deform", "Smooth", "Smooth Corrective", "Smooth Laplacian", "Surface Deform", "Warp", "Wave", "Weighted Normal", "Data Transfer", "Mesh Cache", "Mesh Sequence Cache", "Normal Edit", "UV Project", "UV Warp", "Vertex Weight Edit", "Vertex Weight Mix", "Vertex Weight Proximity", "Ocean", "Particle Instance", "Particle System", "Cloth", "Collision", "Dynamic Paint", "Explode", "Fluid", "Soft Body", "Corrective Smooth", "Laplacian Smooth", "Subdivision"];
var LS = "bsa.ai.";
function g(k){ try { return localStorage.getItem(LS + k) || ""; } catch(e){ return ""; } }
function s(k, v){ try { if(v) localStorage.setItem(LS + k, v); else localStorage.removeItem(LS + k); } catch(e){} }
var MEM = {}; // keys typed this session (not saved unless "remember")

function prompt(){
  var ids = window.APP_DATA.models.map(function(m){ return m.id; }).join(", ");
  return "You are a Blender 5.3 modeling teacher. Look at the object in the photo (if a red box is drawn, only that object) and plan how to model it.\n" +
    "Answer ONLY with JSON, no markdown, using this schema:\n" +
    '{"object_ko": str, "object_en": str, "primitives": [Shift+A mesh primitive names from: Plane, Cube, Circle, Quad Sphere, UV Sphere, Ico Sphere, Cylinder, Cone, Torus, Grid, Monkey],\n' +
    ' "basic_steps": [{"ko": str, "en": str}]  // 4-8 steps using ONLY edit-mode tools (Extrude E, Inset I, Loop Cut Ctrl+R, Bevel Ctrl+B, Scale S, Move G, Rotate R, Knife K, Spin, Merge M, Bridge Edge Loops, Shift+D). NO modifiers.\n' +
    ' "modifier_steps": [{"ko": str, "en": str, "modifier": str|null}]  // 3-7 steps using modifiers (Mirror, Array, Solidify, Screw, Bevel, Subdivision Surface, Boolean, Simple Deform, Cast, Displace, Curve, Wireframe, Weld, Remesh)\n' +
    ' "better": "basic"|"modifier", "why_ko": str, "why_en": str, "closest_example": one of [' + ids + "] or null, \"confidence\": 0..1}\n" +
    "Korean text must be natural Korean for beginners. Keep each step under 120 characters.";
}
function ui(st){
  var pv = g("provider") || "openai", P = PROV[pv];
  var key = MEM[pv] || g("key." + pv);
  var h = "<h2>" + esc(t("ai_title")) + "</h2>";
  h += '<div class="warn"><ul><li>' + esc(pick("이 기능을 켜면 사진과 API 키가 고른 회사(" + P.label + ") 서버로 직접 보내져요. 이 앱을 만든 사람에게는 아무것도 가지 않아요.", "This sends the photo and your API key directly to the provider you pick (" + P.label + "). Nothing goes to the author of this app.")) + "</li><li>" +
    esc(pick("요금은 키 주인에게 나가요. 키는 ‘기억하기’를 켰을 때만 이 브라우저(localStorage)에 저장돼요 — 공용 PC에서는 켜지 마세요.", "Costs go to the key owner. The key is stored in this browser (localStorage) only if you tick ‘remember’ — don't on shared computers.")) + "</li><li>" +
    esc(pick("AI 답은 틀릴 수 있어요. 앱이 형식과 모디파이어 이름을 검사하고, 기본 방식에 모디파이어가 섞이면 표시해요.", "AI answers can be wrong. The app validates the format and modifier names, and flags modifiers mixed into the basic method.")) + "</li></ul></div>";
  h += '<div class="aiform"><label>' + esc(pick("제공자", "Provider")) + ' <select id="aiprov">' + Object.keys(PROV).map(function(k){ return '<option value="' + k + '"' + (k === pv ? " selected" : "") + ">" + esc(PROV[k].label) + "</option>"; }).join("") + "</select></label>";
  h += '<label>API key <input type="password" id="aikey" autocomplete="off" spellcheck="false" value="' + esc(key) + '"></label>';
  h += '<label class="inl"><input type="checkbox" id="aimem"' + (g("key." + pv) ? " checked" : "") + "> " + esc(pick("이 브라우저에 키 기억하기", "Remember key in this browser")) + '</label> <button class="btn2" id="aiforget">' + esc(pick("저장된 키 지우기", "Forget saved keys")) + "</button>";
  h += '<details><summary>' + esc(pick("고급 (모델·주소)", "Advanced (model / URL)")) + '</summary><label>' + esc(pick("모델", "Model")) + ' <input id="aimodel" value="' + esc(g("model." + pv) || P.model) + '"></label><label>URL <input id="aibase" value="' + esc(g("base." + pv) || P.base) + '"></label><p class="mut small">' + esc(pick("기본 모델 이름은 2026-11-21 각 회사 공식 문서에서 확인했어요. 키 발급: ", "Default model names were checked in each provider's official docs on 2026-11-21. Get a key: ")) + esc(P.keyUrl) + "</p></details>";
  h += '<button class="copybtn" id="aigo"' + (st.aiBusy || !st.img ? " disabled" : "") + ">🤖 " + esc(pick("이 사진 AI로 계획 세우기", "Plan this photo with AI")) + '</button> <span class="mut" id="aistat">' + (st.img ? "" : esc(pick("먼저 사진을 넣어 주세요.", "Add a photo first."))) + "</span></div>";
  h += '<div id="aires">' + (st.ai ? resultHtml(st.ai) : "") + "</div>";
  return h;
}
function bind(st, getImage, rerender){
  var $ = function(id){ return document.getElementById(id); };
  $("aiprov").onchange = function(){ s("provider", this.value); rerender(); };
  $("aikey").oninput = function(){ MEM[$("aiprov").value] = this.value.trim(); if($("aimem").checked) s("key." + $("aiprov").value, this.value.trim()); };
  $("aimem").onchange = function(){ var pv = $("aiprov").value; s("key." + pv, this.checked ? $("aikey").value.trim() : ""); };
  $("aiforget").onclick = function(){ Object.keys(PROV).forEach(function(k){ s("key." + k, ""); MEM[k] = ""; }); rerender(); };
  $("aimodel").onchange = function(){ s("model." + $("aiprov").value, this.value.trim() === PROV[$("aiprov").value].model ? "" : this.value.trim()); };
  $("aibase").onchange = function(){ s("base." + $("aiprov").value, this.value.trim() === PROV[$("aiprov").value].base ? "" : this.value.trim()); };
  $("aigo").onclick = function(){
    var pv = $("aiprov").value, key = $("aikey").value.trim(), model = $("aimodel").value.trim(), base = $("aibase").value.trim().replace(/\/+$/, "");
    if(!key){ $("aistat").textContent = pick("API 키를 넣어 주세요.", "Enter an API key."); return; }
    if(!/^https:\/\//.test(base) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(base)){ $("aistat").textContent = pick("주소는 https:// 로 시작해야 해요.", "URL must start with https://"); return; }
    var img = getImage(); if(!img) return;
    st.aiBusy = true; this.disabled = true; $("aistat").textContent = pick("AI에 묻는 중… (보통 5~30초)", "Asking the AI… (usually 5–30 s)");
    call(pv, base, model, key, img).then(function(txt){
      var j = parseJSON(txt); if(!j) throw {msg: pick("AI 답을 JSON으로 읽지 못했어요.", "Could not read the AI answer as JSON."), detail: String(txt).slice(0, 300)};
      st.ai = validate(j); st.ai.provider = PROV[pv].label + " · " + model;
    }).catch(function(e){ st.ai = {error: e.msg || pick("요청이 실패했어요.", "The request failed."), detail: e.detail || (e.message || "")}; })
      .then(function(){ st.aiBusy = false; rerender(); });
  };
}
function timeoutFetch(url, opt, ms){
  return new Promise(function(res, rej){
    var ctl = window.AbortController ? new AbortController() : null; if(ctl) opt.signal = ctl.signal;
    var to = setTimeout(function(){ if(ctl) ctl.abort(); rej({msg: pick("응답이 너무 오래 걸려요(90초).", "Timed out (90 s).")}); }, ms || 90000);
    fetch(url, opt).then(function(r){ clearTimeout(to); res(r); }, function(e){ clearTimeout(to); rej({msg: pick("서버에 연결하지 못했어요 (인터넷, 주소, 또는 그 회사가 브라우저 직접 호출을 막았을 수 있어요).", "Could not reach the server (network, URL, or the provider blocks direct browser calls)."), detail: e && e.message}); });
  });
}
function httpErr(r, body){
  var m = {401: pick("API 키가 올바르지 않아요 (401).", "Invalid API key (401)."), 403: pick("권한이 없어요 (403).", "Forbidden (403)."), 404: pick("모델 이름이나 주소를 찾을 수 없어요 (404).", "Model or URL not found (404)."), 429: pick("요청 한도나 잔액을 넘었어요 (429).", "Rate limit or quota exceeded (429).")}[r.status];
  return {msg: m || (pick("서버 오류 ", "Server error ") + r.status), detail: String(body || "").slice(0, 300)};
}
function call(pv, base, model, key, dataUrl){
  var P = PROV[pv], b64 = dataUrl.split(",")[1], txt = prompt();
  if(P.kind === "chat"){
    var body = {model: model, messages: [{role: "user", content: [{type: "text", text: txt}, {type: "image_url", image_url: {url: dataUrl}}]}], response_format: {type: "json_object"}};
    return timeoutFetch(base + "/chat/completions", {method: "POST", headers: {"Content-Type": "application/json", "Authorization": "Bearer " + key}, body: JSON.stringify(body)}).then(function(r){
      if(!r.ok) return r.text().then(function(x){ throw httpErr(r, x); });
      return r.json().then(function(j){ var c = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content; if(Array.isArray(c)) c = c.map(function(p){ return p.text || ""; }).join(""); return c || ""; });
    });
  }
  if(P.kind === "gemini"){
    var gb = {contents: [{parts: [{text: txt}, {inline_data: {mime_type: "image/jpeg", data: b64}}]}], generationConfig: {response_mime_type: "application/json"}};
    return timeoutFetch(base + "/models/" + encodeURIComponent(model) + ":generateContent", {method: "POST", headers: {"Content-Type": "application/json", "x-goog-api-key": key}, body: JSON.stringify(gb)}).then(function(r){
      if(!r.ok) return r.text().then(function(x){ throw httpErr(r, x); });
      return r.json().then(function(j){ var p = j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts || []; return p.map(function(x){ return x.text || ""; }).join(""); });
    });
  }
  var ab = {model: model, max_tokens: 2000, messages: [{role: "user", content: [{type: "image", source: {type: "base64", media_type: "image/jpeg", data: b64}}, {type: "text", text: txt}]}]};
  return timeoutFetch(base + "/messages", {method: "POST", headers: {"Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true"}, body: JSON.stringify(ab)}).then(function(r){
    if(!r.ok) return r.text().then(function(x){ throw httpErr(r, x); });
    return r.json().then(function(j){ return (j.content || []).map(function(x){ return x.text || ""; }).join(""); });
  });
}
function parseJSON(text){
  if(!text) return null;
  var tx = String(text).replace(/^\uFEFF/, "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try { return JSON.parse(tx); } catch(e){}
  var a = tx.indexOf("{"), b = tx.lastIndexOf("}");
  if(a >= 0 && b > a){ try { return JSON.parse(tx.slice(a, b + 1)); } catch(e){} }
  return null;
}
var MODRE = /\b(modifier|mirror modifier|array|solidify|screw modifier|subdivision surface|subsurf|boolean|simple deform|displace|wireframe|remesh|shrinkwrap|모디파이어|미러 모디파이어|어레이|솔리디파이)\b/i;
function str(x, n){ return typeof x === "string" ? x.slice(0, n || 300) : ""; }
function validate(j){
  var ids = window.APP_DATA.models.map(function(m){ return m.id; }), warn = [];
  var out = {object_ko: str(j.object_ko, 80), object_en: str(j.object_en, 80), primitives: (Array.isArray(j.primitives) ? j.primitives : []).filter(function(p){ return typeof p === "string"; }).slice(0, 6).map(function(p){ return p.slice(0, 40); }),
    basic: [], modifier: [], better: j.better === "basic" ? "basic" : j.better === "modifier" ? "modifier" : null, why_ko: str(j.why_ko, 400), why_en: str(j.why_en, 400),
    example: ids.indexOf(j.closest_example) >= 0 ? j.closest_example : null, confidence: typeof j.confidence === "number" ? Math.max(0, Math.min(1, j.confidence)) : null, warn: warn};
  (Array.isArray(j.basic_steps) ? j.basic_steps : []).slice(0, 10).forEach(function(x){ if(!x) return; var ko = str(x.ko || x.text, 200), en = str(x.en || x.text, 200); if(!ko && !en) return;
    var bad = MODRE.test(en) && !/\bno modifier/i.test(en); out.basic.push({ko: ko, en: en, flag: bad}); if(bad) warn.push(pick("기본 방식 단계에 모디파이어가 섞여 있어요 (표시된 단계).", "A basic step mentions a modifier (flagged).")); });
  (Array.isArray(j.modifier_steps) ? j.modifier_steps : []).slice(0, 10).forEach(function(x){ if(!x) return; var ko = str(x.ko || x.text, 200), en = str(x.en || x.text, 200); if(!ko && !en) return;
    var m = typeof x.modifier === "string" ? x.modifier.trim() : null, known = !m || MODS.some(function(n){ return n.toLowerCase() === m.toLowerCase() || n.toLowerCase().replace(/ /g, "") === m.toLowerCase().replace(/[ _]/g, ""); });
    out.modifier.push({ko: ko, en: en, mod: m, unknown: !known}); if(!known) warn.push(pick("Blender 5.3에 없는 모디파이어 이름: ", "Not a Blender 5.3 modifier: ") + m); });
  if(!out.basic.length || !out.modifier.length) warn.push(pick("AI가 두 방법 중 하나를 빠뜨렸어요.", "The AI left out one of the two methods."));
  if(j.closest_example && !out.example) warn.push(pick("AI가 없는 예제 이름을 말해서 무시했어요: ", "Ignored unknown example name: ") + String(j.closest_example).slice(0, 40));
  return out;
}
function resultHtml(a){
  if(a.error) return '<div class="err"><b>⚠ ' + esc(a.error) + "</b>" + (a.detail ? '<pre class="small">' + esc(a.detail) + "</pre>" : "") + "</div>";
  var h = '<div class="aires"><h3>' + esc(pick(a.object_ko, a.object_en) || "?") + ' <small class="mut">' + esc(a.provider || "") + (a.confidence != null ? " · " + Math.round(a.confidence * 100) + "%" : "") + "</small></h3>";
  if(a.primitives.length) h += "<p><b>" + esc(t("prims")) + ":</b> " + a.primitives.map(esc).join(", ") + "</p>";
  if(a.warn.length) h += '<div class="warn small">' + a.warn.map(esc).join("<br>") + "</div>";
  h += '<div class="mcols view-both"><div class="mcol basic' + (a.better === "basic" ? " best" : "") + '"><h2>🔧 ' + esc(t("basic")) + (a.better === "basic" ? ' <span class="badge ok">★ ' + esc(t("better")) + "</span>" : "") + '</h2><ol class="steps">' +
    a.basic.map(function(x){ return '<li class="' + (x.flag ? "flag" : "") + '"><div class="stxt">' + esc(pick(x.ko, x.en)) + "</div></li>"; }).join("") + '</ol></div><div class="mcol modifier' + (a.better === "modifier" ? " best" : "") + '"><h2>🧱 ' + esc(t("modifier")) + (a.better === "modifier" ? ' <span class="badge ok">★ ' + esc(t("better")) + "</span>" : "") + '</h2><ol class="steps">' +
    a.modifier.map(function(x){ return '<li class="' + (x.unknown ? "flag" : "") + '"><div class="stxt">' + esc(pick(x.ko, x.en)) + (x.mod ? ' <span class="chip">' + esc(x.mod) + "</span>" : "") + "</div></li>"; }).join("") + "</ol></div></div>";
  if(a.why_ko || a.why_en) h += '<div class="which"><b>💡 ' + esc(t("which")) + "</b> " + esc(pick(a.why_ko, a.why_en)) + "</div>";
  if(a.example){ var m = window.APP_DATA.models.filter(function(x){ return x.id === a.example; })[0]; h += '<p><a class="linkbtn" href="#model/ex/' + a.example + '">' + esc(pick("비슷한 예제 (실제 단계 이미지): ", "Similar worked example (real step images): ")) + esc(pick(m.ko, m.en)) + " →</a></p>"; }
  return h + '<p class="mut small">' + esc(pick("AI가 만든 계획이에요 — 단계 이미지는 없고, 실제로 실행해 검증한 것은 위의 예제들뿐이에요.", "AI-generated plan — no step images; only the worked examples above were actually run and verified.")) + "</p></div>";
}
window.AIPLAN = {ui: ui, bind: bind, validate: validate, parseJSON: parseJSON, call: call, PROV: PROV, prompt: prompt};
})();
