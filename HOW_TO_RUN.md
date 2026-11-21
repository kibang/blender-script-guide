# 실행 방법 / How to run

**한국어**
- `index.html`을 더블클릭해도 거의 모든 기능이 돼요.
- **AI 사진 인식(SigLIP)** 은 브라우저 보안 때문에 파일로 직접 연 상태(file://)에서는 동작하지 않아요(그때는 예전 오프라인 모양 매칭으로 자동 전환).
  이 폴더에서 터미널을 열고 `python3 -m http.server 8000` 을 실행한 뒤 http://localhost:8000 으로 여세요.
- 인식 모델(약 110MB)은 ‘모델 받고 인식하기’를 눌렀을 때만 내려받고, 브라우저 저장소(Cache Storage)에 보관돼요. 사진은 밖으로 보내지 않아요.
- 사진은 물체 하나가 크고 선명하게 단독으로 찍힌 것이 가장 정확해요.

**English**
- Double-clicking `index.html` works for almost everything.
- **AI photo recognition (SigLIP)** cannot run from a local file (file://) because of browser security; the app then falls back to offline shape matching.
  Run `python3 -m http.server 8000` in this folder and open http://localhost:8000.
- The ~110 MB model is downloaded only when you press “Download model & recognise” and kept in the browser's Cache Storage. Photos never leave your device.

Third-party licenses: see `THIRD_PARTY.md`.
