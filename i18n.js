(function(){
var L = (new URLSearchParams(location.search).get("lang") || (function(){ try { return localStorage.getItem("bsa.lang"); } catch(e){ return null; } })() || "ko") === "en" ? "en" : "ko";
try { localStorage.setItem("bsa.lang", L); } catch(e){}
var T = {
 title: ["블렌더 스크립트 & 모델링 도우미", "Blender Script & Modeling Helper"],
 tab_scripts: ["스크립트 사전", "Script dictionary"], tab_model: ["모델링 도우미", "Modeling helper"],
 sub_plan: ["📷 사진으로 모델링 계획", "📷 Image → modeling plan"], sub_examples: ["🧩 예제 (두 가지 방법)", "🧩 Worked examples (two methods)"], sub_gallery: ["➕ 추가 메뉴(Shift+A) 갤러리", "➕ Add menu (Shift+A) gallery"],
 search: ["검색 (예: 이름, 머티리얼, 렌더, 애니메이션…)", "Search (e.g. rename, material, render, keyframe…)"],
 all: ["전체", "All"], level: ["난이도", "Difficulty"], category: ["분류", "Category"], results: ["개", "results"],
 verified: ["Blender 5.3에서 실제 실행·검증됨", "Run & verified in Blender 5.3"], copy: ["코드 복사", "Copy code"], copied: ["복사됨!", "Copied!"],
 howto: ["실행 방법", "How to run"], before: ["실행 전", "Before"], after: ["실행 후", "After"], steps: ["중간 단계", "Intermediate steps"],
 ex_title: ["코드 해설", "Code walkthrough"], ex_sum: ["한 줄 요약", "In one line"], ex_blocks: ["블록별 설명", "Block by block"], ex_apis: ["핵심 bpy API", "Key bpy APIs"],
 ex_tweak: ["바꿔 볼 값", "What to tweak"], ex_pit: ["주의할 점", "Pitfalls"], ex_line: ["줄", "line"], ex_lines: ["줄", "lines"],
 ex_hint: ["줄 번호 칩을 누르면 위 코드에서 그 줄이 강조돼요. 코드 줄을 눌러도 해당 설명으로 이동합니다.", "Tap a line chip to highlight those lines in the code above; tapping a code line jumps to its explanation."],
 back: ["← 목록", "← List"], code: ["코드", "Code"], result: ["결과 이미지", "Result images"], what: ["무엇을 하나요?", "What it does"],
 basic: ["기본 모델링", "Basic modeling"], modifier: ["모디파이어", "Modifiers"], basic_sub: ["Edit Mode 도구만 (Extrude·Inset·Loop Cut·Bevel·Spin…) · 모디파이어 없음", "Edit-mode tools only (extrude, inset, loop cut, bevel, spin…) · no modifiers"],
 modifier_sub: ["모디파이어로 만들기 (Mirror·Array·Solidify·Screw·Bevel·Subdivision…) · 나중에 숫자로 수정", "Modifier workflow (Mirror, Array, Solidify, Screw, Bevel, Subdivision…) · editable later"],
 which: ["어느 방법이 나을까?", "Which method is better?"], better: ["추천", "Recommended"], both: ["둘 다 보기", "Both"], final: ["완성 렌더", "Final render"],
 full_code: ["전체 코드 복사 (도우미 함수 포함)", "Copy full code (with helper functions)"], helper_note: ["예제 코드는 맨 위의 짧은 도우미 함수(add, extrude, inset…)를 씁니다. ‘전체 코드 복사’를 누르면 도우미까지 함께 복사돼요. 각 도우미는 실제 Blender 메뉴 조작 한 가지(E, I, Ctrl+R…)와 같아요.", "Examples use short helper functions (add, extrude, inset…) — each one equals one Blender action (E, I, Ctrl+R…). ‘Copy full code’ includes them."],
 drop: ["사진을 여기에 끌어다 놓거나, 붙여넣기(Ctrl+V) 또는", "Drop an image here, paste (Ctrl+V) or"], open: ["파일 열기", "open a file"],
 samples: ["예시 사진으로 해 보기", "Try a sample photo"], analysing: ["분석 중…", "Analysing…"],
 plan_title: ["모델링 계획", "Modeling plan"], shape: ["모양 분석", "Shape analysis"], matches: ["가장 비슷한 예제", "Closest worked examples"], hints: ["모양에서 읽은 힌트", "Hints from the shape"],
 offline_note: ["오프라인 분석: 사진을 어디에도 보내지 않고 이 브라우저 안에서만 계산해요. 배경과 물체를 나눈 뒤 외곽 모양(가로세로 비율, 대칭, 폭 변화, 구멍, 볼록함)을 45개 예제의 실제 Blender 렌더 실루엣과 비교합니다.", "Offline analysis: nothing leaves this browser. The object is separated from the background and its outline (aspect, symmetry, width profile, holes, convexity) is compared with silhouettes rendered in Blender from the 45 worked examples."],
 acc_title: ["정확도 (솔직하게)", "Accuracy (honestly)"], ai_title: ["🤖 AI로 분석하기 (선택)", "🤖 Analyse with AI (optional)"],
 gallery_intro: ["Blender 5.3의 Shift+A(추가) 메뉴에 있는 모든 항목을 실제로 하나씩 추가해서 찍은 화면이에요. 각 항목이 어디에 좋은지 함께 적었어요.", "Every item of the Shift+A (Add) menu in Blender 5.3, added one by one and captured from the real viewport, with what each is good for."],
 menu_shots: ["실제 Shift+A 메뉴 화면", "The real Shift+A menu"], prims: ["시작 도형", "Starting primitives"], open_example: ["예제 열기 →", "Open example →"],
 step: ["단계", "Step"], notdone: ["실패", "failed"], lvl_names: [["", "입문", "기초", "중급", "고급", "전문"], ["", "Beginner", "Basic", "Intermediate", "Advanced", "Expert"]]
};
var CAT = {naming: ["이름 정리", "Naming"], select: ["선택", "Selection"], transform: ["배치·변형", "Transform"], mesh: ["메시 편집", "Mesh"], modifier: ["모디파이어", "Modifiers"],
 material: ["머티리얼", "Materials"], light: ["조명", "Lighting"], camera: ["카메라", "Camera"], render: ["렌더", "Render"], anim: ["애니메이션", "Animation"], io: ["가져오기·내보내기", "Import/Export"],
 cleanup: ["정리·최적화", "Cleanup"], generate: ["생성", "Generate"], scene: ["씬 관리", "Scene"], addon: ["애드온·UI", "Add-on & UI"],
 kitchen: ["주방", "Kitchen"], furniture: ["가구", "Furniture"], food: ["음식", "Food"], nature: ["자연", "Nature"], building: ["건물", "Building"], prop: ["소품", "Props"],
 tech: ["전자기기", "Tech"], mech: ["기계 부품", "Mechanical"], vehicle: ["탈것", "Vehicles"], character: ["캐릭터", "Character"], tool: ["공구", "Tools"]};
window.I18N = {L: L, t: function(k){ var v = T[k]; return v ? v[L === "en" ? 1 : 0] : k; }, cat: function(c){ var v = CAT[c]; return v ? v[L === "en" ? 1 : 0] : c; },
  pick: function(ko, en){ return L === "en" ? (en || ko) : (ko || en); }, lvl: function(n){ return T.lvl_names[L === "en" ? 1 : 0][n] || n; }};
})();
