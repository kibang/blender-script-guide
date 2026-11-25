/* '애드온' tab: Script Modeling Guide add-on (download, install, use, safety) — bilingual. Files are copied to app/addon/ by tools/build_app.py. */
(function(){
"use strict";
var I = window.I18N, L = I.L;
function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }
var K = {
 ko: {
  h: "🧩 블렌더 애드온: 예제를 버튼 하나로",
  lead: "이 사이트의 <b>스크립트 {S}개, 모델링 예제 {M2}개({M}개 × 두 가지 방법), 시작 타입 예제 {ST}개</b>를 블렌더 안에서 바로 만들어 주는 애드온이에요. 3D 뷰 오른쪽 사이드바(<kbd>N</kbd>)에서 예제를 골라 <b>만들기</b>를 누르거나, 이 사이트에서 <b>📋 코드 복사</b>를 누른 뒤 블렌더에서 <b>클립보드에서 붙여넣어 만들기</b>를 누르면 돼요. Text Editor를 열고 붙여넣고 실행하는 과정이 버튼 하나로 줄어요.",
  dl: "⬇ 애드온 받기", ver: "블렌더 4.2 ~ 5.3에서 써요 (5.3과 4.5에서 시험함). 블렌더 언어가 한국어면 한국어로, 아니면 영어로 나와요.",
  inst: "설치 (처음 한 번만)",
  i: ["블렌더에서 <kbd>Edit</kbd> › <kbd>Preferences…</kbd> › 왼쪽 <b>Get Extensions</b>(또는 <b>Add-ons</b>)를 눌러요.",
      "오른쪽 위 <b>▾</b> 메뉴 › <b>Install from Disk…</b> › 받은 zip을 골라요. 압축을 풀 필요 없어요.",
      "<b>Script Modeling Guide (스크립트 모델링 가이드)</b>가 켜졌는지 확인해요. 같은 자리에서 <b>언어</b>(자동·한국어·English)를 고를 수 있어요."],
  use: "사용",
  u: ["3D 뷰포트 위에 마우스를 두고 <kbd>N</kbd> 키 › 오른쪽 사이드바에서 <b>스크립트 가이드</b> 탭을 열어요.",
      "<b>방법 1 · 사이트에서 복사:</b> 이 사이트의 아무 예제에서 <b>📋 코드 복사</b>(또는 <b>전체 코드 복사</b>)를 누르고, 블렌더에서 <b>클립보드에서 붙여넣어 만들기</b>를 눌러요.",
      "<b>방법 2 · 애드온 안에서 고르기:</b> 스크립트 / 모델링 예제 / 시작 타입 중 하나를 고르고, 분류나 검색으로 찾은 뒤 예제를 눌러 <b>만들기</b>.",
      "결과가 마음에 안 들면 <kbd>Ctrl</kbd>+<kbd>Z</kbd> 한 번이면 통째로 되돌아가요."],
  what: "무엇이 어디에 만들어지나요?",
  w: ["<b>스크립트</b>는 사이트의 ‘실행 전’ 그림과 똑같은 데모 장면을 <b>새 씬</b>(이름 ScriptGuide_s001 등)에 만든 뒤 실행해요. 지금 작업 중인 씬은 건드리지 않아요. 씬 목록(위쪽 Scene 칸)에서 원래 씬으로 돌아갈 수 있어요. ‘데모 장면 만들기’를 끄면 지금 씬과 선택한 오브젝트에 바로 실행해요.",
      "<b>모델링 예제·시작 타입 예제</b>는 지금 씬의 <b>새 컬렉션</b>(ScriptGuide mug_b 등)에 만들어요.",
      "파일을 쓰는 예제(내보내기·렌더 저장 등)는 저장한 .blend 파일 옆에, 아직 저장하지 않은 파일이면 임시 폴더(blender_script_guide)에 써요. 어디에 썼는지 알려 줘요.",
      "<code>print()</code> 출력은 사이드바의 <b>마지막 결과</b>에도 보여요."],
  safe: "안전하게 실행해요",
  s: ["붙여넣은 코드가 이 사이트의 예제와 <b>글자 하나까지 같으면</b> 그 예제로 알아보고 바로 만들어요.",
      "조금이라도 다른 코드(직접 고친 코드, 다른 곳에서 복사한 코드)는 <b>실행 전에 검사 결과를 보여 주고</b>(파일 쓰기·지우기, 다른 프로그램 실행, 인터넷, .blend 저장/열기, 파일 전체 데이터 변경 등), ‘믿을 수 있어요’에 체크해야만 실행해요. 파이썬 코드는 컴퓨터에서 무엇이든 할 수 있으니 믿을 수 있는 코드만 실행하세요.",
      "문법 오류가 있으면 실행하지 않고 몇 번째 줄인지 알려 줘요.",
      "실행 중 오류가 나면 블렌더가 꺼지지 않고, 만들던 결과를 지운 뒤 오류 줄과 내용을 알려 줘요.",
      "한국어 블렌더에서 ‘새 데이터 번역’이 켜져 있으면 새 오브젝트 이름이 ‘큐브’처럼 바뀌어 사이트 코드(‘Cube’를 찾음)가 틀어질 수 있어요. 애드온은 실행하는 동안만 이 설정을 끄고 다시 돌려놔요."],
  notes: "알아 두면 좋은 점",
  n: ["사이트의 코드는 블렌더 5.3 기준이에요. 4.x에서는 재질 노드를 자동으로 켜서 실행해요(4.x는 새 재질에 노드가 없어요).",
      "‘저장한 파일 옆에 복사본 만들기’ 예제(025)는 파일을 먼저 저장해야 해요. 저장 전에는 실행하지 않고 알려 줘요.",
      "Solid 모드나 Workbench 엔진에서도 결과가 회색으로만 보이지 않게, 예제가 만든 새 재질의 뷰포트 색을 셰이더 색으로 맞춰요 (예제가 직접 정한 뷰포트 색은 그대로 둬요).",
      "렌더 예제는 실제로 렌더를 해서 몇 초~몇십 초 걸릴 수 있어요.",
      "<b>코드 보기</b>를 누르면 Text Editor에 그 예제 코드가 열려요. 고쳐서 Run Script로 실행해 볼 수 있어요. <b>사이트에서 보기</b>는 이 사이트의 해당 페이지(설명·단계 그림)를 열어요."],
  skip: "블렌더 4.5에서 건너뛰는 예제", skipNote: "5.x에만 있는 기능을 써서 4.5에서는 버튼이 꺼지고 이유가 보여요:",
  tests: "시험 결과", shots: "실제 화면", kb: "KB"
 },
 en: {
  h: "🧩 Blender add-on: every example in one click",
  lead: "This add-on builds <b>all {S} scripts, {M2} modeling examples ({M} × two methods) and {ST} start-type examples</b> of this site right inside Blender. Pick an example in the 3D View sidebar (<kbd>N</kbd>) and press <b>Build</b>, or press <b>📋 Copy code</b> on this site and then <b>Paste from Clipboard & Build</b> in Blender. Opening the Text Editor, pasting and running becomes one button.",
  dl: "⬇ Download the add-on", ver: "Works in Blender 4.2 – 5.3 (tested in 5.3 and 4.5). Korean when Blender's interface is Korean, English otherwise.",
  inst: "Install (once)",
  i: ["In Blender open <kbd>Edit</kbd> › <kbd>Preferences…</kbd> › <b>Get Extensions</b> (or <b>Add-ons</b>) on the left.",
      "Top-right <b>▾</b> menu › <b>Install from Disk…</b> › pick the downloaded zip. No need to unzip it.",
      "Check that <b>Script Modeling Guide</b> is enabled. In the same place you can choose the <b>Language</b> (Auto, Korean, English)."],
  use: "Use",
  u: ["Hover the 3D Viewport, press <kbd>N</kbd> and open the <b>Script Guide</b> tab in the right sidebar.",
      "<b>Way 1 · copy on the site:</b> press <b>📋 Copy code</b> (or <b>Copy full code</b>) on any example here, then <b>Paste from Clipboard & Build</b> in Blender.",
      "<b>Way 2 · pick in the add-on:</b> choose Scripts / Modeling / Start types, find an example by category or search, click it and press <b>Build</b>.",
      "Don't like the result? One <kbd>Ctrl</kbd>+<kbd>Z</kbd> undoes all of it."],
  what: "What gets built where?",
  w: ["<b>Scripts</b> first get the same demo scene as the site's ‘Before’ picture, built in a <b>new scene</b> (named ScriptGuide_s001 etc.), then run. Your working scene is not touched; switch back with the Scene selector at the top. Turn off ‘Make the demo scene’ to run on your own scene and selection instead.",
      "<b>Modeling and start-type examples</b> are built into a <b>new collection</b> (ScriptGuide mug_b etc.) in the current scene.",
      "Examples that write files (exports, saved renders…) write next to your saved .blend file, or into a temp folder (blender_script_guide) while the file is unsaved. You are told where.",
      "<code>print()</code> output also appears under <b>Last result</b> in the sidebar."],
  safe: "Safe by default",
  s: ["Pasted code that is <b>identical</b> to an example on this site is recognised and built right away.",
      "Any other code (your edits, code from elsewhere) is <b>checked first and the findings are shown</b> (writing/deleting files, running programs, internet, saving/opening .blend files, changing data in the whole file…). It runs only after you tick ‘I trust it’. Python code can do anything on your computer, so only run code you trust.",
      "Syntax errors are reported with the line number and nothing runs.",
      "If the code fails while running, Blender keeps going: the half-built result is removed and you get the failing line and message.",
      "In a Korean Blender with ‘New Data’ translation on, new objects are named ‘큐브’ instead of ‘Cube’, which breaks site code that looks for ‘Cube’. The add-on turns that setting off only while it runs, then restores it."],
  notes: "Good to know",
  n: ["The site's code is written for Blender 5.3. In 4.x the add-on switches material nodes on automatically (new materials in 4.x have no nodes).",
      "The ‘save a numbered copy next to the file’ example (025) needs a saved file. It is not run before you save, and you are told why.",
      "So results don't look plain grey in Solid mode or with the Workbench engine, new materials made by an example get their shader colour as viewport colour (a viewport colour the example sets itself is kept).",
      "Render examples really render, which can take a few to tens of seconds.",
      "<b>View code</b> opens the example in the Text Editor so you can edit it and Run Script. <b>Open on site</b> opens this site's page for it (explanations, step pictures)."],
  skip: "Examples skipped in Blender 4.5", skipNote: "They use features that exist only in 5.x, so in 4.5 their button is disabled with the reason:",
  tests: "Test results", shots: "Real screenshots", kb: "KB"
 }
};
function figs(list){
  return (list || []).map(function(f){
    var cap = L === "en" ? f.en : f.ko;
    return '<figure class="shot" data-lb="addon" data-src="' + esc(f.src[L] || f.src.ko) + '" data-cap="' + esc(cap) + '"><img loading="lazy" src="' + esc(f.src[L] || f.src.ko) + '" alt="' + esc(cap) + '"><figcaption>' + esc(cap) + "</figcaption></figure>";
  }).join("");
}
window.BSA_ADDON = function(M){
  var AD_ = window.APP_DATA || {scripts: [], models: []}, A = AD_.addon || {}, k = K[L] || K.ko;
  var li = function(a){ return "<ol>" + a.map(function(x){ return "<li>" + x + "</li>"; }).join("") + "</ol>"; };
  var ul = function(a){ return "<ul>" + a.map(function(x){ return "<li>" + x + "</li>"; }).join("") + "</ul>"; };
  var h = '<section class="intro addon"><h1>' + k.h + "</h1><p>" + k.lead.replace("{S}", AD_.scripts.length).replace("{M2}", AD_.models.length * 2).replace("{M}", AD_.models.length).replace("{ST}", (AD_.starts || []).length) + "</p>";
  if(A.zip) h += '<p><a class="copybtn dl" id="addon-dl" href="addon/' + esc(A.zip) + '" download>' + k.dl + "</a> <span class=\"mut\">" + esc(A.zip) + " · " + A.kb + " " + k.kb + " · v" + esc(A.version) + "</span></p>";
  h += '<p class="mut">' + k.ver + "</p></section>";
  var shots = A.shots || [];
  h += '<div class="addon-grid"><div class="addon-txt">';
  h += "<h2>" + k.inst + "</h2>" + li(k.i) + "<h2>" + k.use + "</h2>" + li(k.u) + "<h2>" + k.what + "</h2>" + ul(k.w) + "<h2>" + k.safe + "</h2>" + ul(k.s) + "<h2>" + k.notes + "</h2>" + ul(k.n);
  if(A.skip45 && A.skip45.length) h += "<h2>" + k.skip + "</h2><p>" + k.skipNote + "</p><ul>" + A.skip45.map(function(s){ return "<li><b>" + esc(s.id) + "</b> " + esc(L === "en" ? s.en : s.ko) + " — " + esc(L === "en" ? s.why[1] : s.why[0]) + "</li>"; }).join("") + "</ul>";
  if(A.tests) h += "<h2>" + k.tests + '</h2><p class="mut">' + esc(L === "en" ? A.tests[1] : A.tests[0]) + "</p>";
  h += '</div><div class="addon-shots">' + (shots.length ? "<h2>" + k.shots + '</h2><div class="shots">' + figs(shots) + "</div>" : "") + "</div></div>";
  M.innerHTML = h;
};
window.BSA_ADDON_HINT = function(){
  return '<p class="addon-hint">🧩 ' + (L === "en" ? 'With the <a href="#addon">Blender add-on</a>: copy, then <b>Paste from Clipboard &amp; Build</b> in the 3D View sidebar (N › Script Guide).'
    : '<a href="#addon">블렌더 애드온</a>이 있으면: 복사한 뒤 3D 뷰 사이드바(N › 스크립트 가이드)에서 <b>클립보드에서 붙여넣어 만들기</b> 한 번이면 돼요.') + "</p>";
};
})();
