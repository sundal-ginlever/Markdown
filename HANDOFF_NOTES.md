# Handoff Notes — Path 1 실행 기록

`HANDOFF-PATH1-docvault-diet.md` 실행 중 발견한 스코프 밖 이슈나 특이사항을 기록한다. 수정하지 않고 기록만 한다 (규칙 3).

## Phase 0
- `npm install`, `npm run dev`, `npm run build` 모두 정상. 취약점 경고(10건, npm audit)는 스코프 밖이라 미조치.
- 빌드 경고: `main.js`가 `cloudModal.js`에서 동적 import되면서 동시에 `index.html`에서 정적 import됨 → Phase 2에서 `cloudModal.js` 삭제 시 자동 해소될 것으로 예상.
