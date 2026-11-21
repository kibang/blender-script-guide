# 블렌더 스크립트 & 모델링 도우미 · Blender Script & Modeling Guide

**사이트 / Site:** https://kibang.github.io/blender-script-guide/ · **PDF:** [guide_ko.pdf](guide_ko.pdf)

**한국어** — Blender 5.3에서 직접 실행해 검증한 정적 웹앱입니다.
- bpy 스크립트 100개: 줄 단위 코드 해설, 처음 나오는 파이썬·bpy 용어마다 초보자용 설명, **파이썬·bpy 용어 사전**(77개), 실행 전/후 화면
- **AI 사진 인식 (SigLIP, 기기 안에서)**: 사진 속 물체를 127종 중에서 알아맞혀 후보 3개를 점수와 함께 보여 주고, 점수가 비슷하면 ‘확실하지 않음’으로 직접 고르게 해요 → 검증된 예제·장면 물체·캐릭터 안내로 연결
- 사진 → 모델링 계획: 여러 물체가 있는 장면은 영역을 잘라(마우스/터치) 물체별로 계획, 캐릭터는 고급(스컬프트)으로 표시
- 예제 45개(기본 모델링 vs 모디파이어): 단계마다 모드·단축키·메뉴 경로·입력값, 모든 모디파이어의 Add Modifier 경로·주요 값·커터 숨기기·Apply
- **시작 타입별 예제 26개**: Circle·Curve·Surface·Metaball·Text·Point Cloud(Geometry Nodes)·Grease Pencil·Armature에서 시작
- 단축키·메뉴 사전, Shift+A 추가 메뉴 갤러리. 한국어/영어(`?lang=en`).

**English** — A static web app, everything verified by running it in Blender 5.3:
- 100 bpy scripts with line-by-line walkthroughs, a beginner note for every Python/bpy term where it first appears, a **Python & bpy glossary** (77 terms), before/after screenshots
- **On-device AI photo recognition (SigLIP)**: names the object from 127 kinds with 3 scored candidates; asks you to pick when it is ‘not sure’ → links to the verified example, scene-object guide or character guide
- Photo → modeling plan, with scene mode (crop each object by mouse or touch, per-object plans; characters flagged as advanced sculpting)
- 45 worked examples (plain modeling vs. modifiers) with mode, keys, menu paths and values per step, and the Add Modifier path, key fields, cutter hiding and Apply for every modifier
- **26 examples by start type**: Circle, Curve, Surface, Metaball, Text, Point Cloud (Geometry Nodes), Grease Pencil, Armature
- Shortcut & menu glossary and a Shift+A gallery. Korean/English (`?lang=en`).

## AI 사진 인식 / AI photo recognition

> ⚠️ **물체 하나가 크고 선명하게 단독으로 찍힌 사진을 넣어주세요.** 여러 물체가 섞인 장면·그림은 인식이 틀릴 수 있어요. 목록(127종)에 없는 물체는 비슷한 다른 이름으로 나올 수 있어요. 장면·그림은 ‘🧩 장면 모드’에서 물체를 하나씩 네모로 골라 주세요.
>
> Use a photo where **one object is shown large and sharp, on its own**. Scenes or pictures with many objects can be recognised wrongly; objects not in the 127-item list may come out under a similar name. For scenes, use Scene mode and box one object at a time.

- 모델: SigLIP base patch16-224 이미지 인코더(8비트 ONNX, 99.5 MB) + 미리 계산한 텍스트 임베딩(127종 × 프롬프트 묶음, 캐릭터/물체 먼저 판별), 2가지 잘라보기 평균. onnxruntime-web(WASM)으로 **브라우저 안에서** 실행 — 사진은 어디에도 보내지 않아요.
- 처음 ‘모델 받고 인식하기’를 누를 때만 약 110 MB를 내려받고(진행 막대), 브라우저 Cache Storage에 저장해 다음부터 바로 시작합니다. 모델을 못 받으면 예전 오프라인 모양 매칭으로 자동 전환해요. 파일로 직접 연 경우(file://)에는 동작하지 않으니 `python3 -m http.server`로 여세요 (HOW_TO_RUN.md).
- 정확도(솔직하게, 시험 이미지 158장): 1등 정답 92.4%, 3등 안 97.5%. 단독 물체 사진 105장 95.2%(브라우저에서 측정, 3등 안 100%), 만화·그림체 37장 91.9%, 여러 물체가 있는 그림에서 잘라낸 조각 16개 75%. ‘확실하지 않음’ 표시 없이 틀린 경우 2.5%. 설정을 같은 이미지로 골랐기 때문에 처음 보는 사진에서는 조금 낮을 수 있어요. 처리 시간: 컴퓨터 약 1–2초, 휴대폰 5초 이상.
- Accuracy (158 test images): top-1 92.4%, top-3 97.5% — single-object photos 95.2% (measured in the browser), cartoons 91.9%, crops from a busy illustration 75%. Wrong without a “not sure” flag: 2.5%. Thresholds were chosen on these same images, so new photos may score a little lower.

**라이선스 / Licenses**
- SigLIP base patch16-224 — Google, **Apache License 2.0** (https://huggingface.co/google/siglip-base-patch16-224); 8-bit ONNX export by Xenova / transformers.js, Apache-2.0 (https://huggingface.co/Xenova/siglip-base-patch16-224). Full text: `vendor/siglip/LICENSE`, notice: `vendor/siglip/NOTICE.md`.
- onnxruntime-web 1.31.1 — Microsoft, **MIT** (`vendor/ort/LICENSE`).
- Sample photos: Wikimedia Commons, author/licence shown in the app. Details: `THIRD_PARTY.md`.

No build step: open `index.html` or serve the folder. The optional AI mode uses an API key you type in the browser; no key is stored in this repository.
