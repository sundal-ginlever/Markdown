# Handoff Notes — Path 1 실행 기록

`HANDOFF-PATH1-docvault-diet.md` 실행 중 발견한 스코프 밖 이슈나 특이사항을 기록한다. 수정하지 않고 기록만 한다 (규칙 3).

## Phase 0
- `npm install`, `npm run dev`, `npm run build` 모두 정상. 취약점 경고(10건, npm audit)는 스코프 밖이라 미조치.
- 빌드 경고: `main.js`가 `cloudModal.js`에서 동적 import되면서 동시에 `index.html`에서 정적 import됨 → Phase 2에서 `cloudModal.js` 삭제 시 자동 해소될 것으로 예상.

## Phase 2
- `src/components/sidebar.js`의 `import { Viewer } from './viewer.js'`는 이번 작업 이전부터 미사용(pre-existing dead import)이었음. Phase 2 변경과 무관하여 그대로 둠 (스코프 밖 리팩토링 금지 규칙).
- `src/services/db.js`의 `switchUser(userId)` 메서드는 Supabase 멀티유저 전환용이었고 이제 호출부가 없어 죽은 코드가 됨. D4(IndexedDB 스키마 불변)와 별개로 메서드 자체는 핸드오프에 명시적 제거 대상이 아니라 그대로 둠.
- `src/utils/router.js`는 원래 처분 표시에 [유지]로 분류돼 있었으나, 실제로는 삭제 대상인 `qaPanel.js`를 동적 import하고 있어(`handleRoute()` 내 문서 열기 경로) 그대로 두면 문서를 열 때마다 모듈 로드 실패로 앱이 깨짐. 완료 기준(스모크 테스트: 업로드→변환→보기→편집저장→내보내기)을 만족시키기 위해 해당 QAPanel 참조 2곳만 제거함. `src/components/ui.js`의 Esc 키 핸들러에도 동일한 이유로 qaPanel.js 동적 import가 있어 함께 제거함.
- **스모크 테스트 한계**: 이 환경에는 헤드리스 브라우저(Playwright/Puppeteer)가 설치돼 있지 않고 `vercel dev`도 로그인 토큰이 없어 로컬에서 `/api/*` 서버리스 함수를 실행할 수 없음(이전 세션에서도 확인된 제약). 따라서 "업로드→변환→보기→편집저장→내보내기" 스모크 테스트 중 **AI 변환이 포함된 부분은 실제 브라우저·배포 환경에서 수동 검증 필요**. 대신 이번 Phase 2에서는 다음으로 대체 검증함: (1) `npm run build` 성공(모듈 그래프·문법 오류 없음), (2) `npm run dev` 구동 후 `/`와 `/src/main.js` 200 OK 확인, (3) 제거 대상 식별자(SB/QAPanel/RealtimeService/CloudModal/S.folders/S.favorites/S.docFolder 등) 전역 grep 0건, (4) 모든 DOM 이벤트 바인딩이 기존부터 `?.` 옵셔널 체이닝을 사용해 제거된 엘리먼트에 안전. 실제 파일 업로드→AI 변환→저장→내보내기의 대화식 확인은 배포 후 사용자가 직접 해달라고 안내함.
