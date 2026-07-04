# Handoff Notes — Path 1 실행 기록

`HANDOFF-PATH1-docvault-diet.md` 실행 중 발견한 스코프 밖 이슈나 특이사항을 기록한다. 수정하지 않고 기록만 한다 (규칙 3).

## Phase 0
- `npm install`, `npm run dev`, `npm run build` 모두 정상. 취약점 경고(10건, npm audit)는 스코프 밖이라 미조치.
- 빌드 경고: `main.js`가 `cloudModal.js`에서 동적 import되면서 동시에 `index.html`에서 정적 import됨 → Phase 2에서 `cloudModal.js` 삭제 시 자동 해소될 것으로 예상.

## Phase 6 — 인수 테스트(6장) 결과

이 환경은 헤드리스 브라우저와 `vercel dev`(로그인 필요)를 쓸 수 없어, 실제 AI 응답·실제 브라우저 렌더링이 필요한 항목은 **배포 환경에서 사용자 확인이 필요**합니다. 실행 가능한 항목은 직접 검증했습니다.

| # | 시나리오 | 결과 |
|---|---|---|
| T1 | 50페이지+ PDF → Claude 변환, 절단 없음, 마지막 페이지 포함, 청크 진행 표시 | ⏸ 실제 AI 필요 — Phase 4에서 청킹 알고리즘 자체는 Node 단위 테스트로 무손실·마지막 문단 보존 확인. 배포 환경에서 실물 PDF로 재확인 필요 |
| T2 | 60,000자 텍스트 → 3청크 분할, 제목 중복 없음 | ⏸ 실제 AI 필요(제목 중복 방지는 `chunkDirective`의 모델 지시문에 의존) — 배포 환경 확인 필요 |
| T3 | Claude 변환 중 미리보기 점진적 표시 | ⏸ 실제 SSE 스트림 필요 — 코드 리뷰로 듀얼 모드·textContent 전용 배선 확인 (Phase 5 참고) |
| T4 | 커스텀 스타일+프롬프트 반영, 재변환도 동일 | ⏸ 실제 AI 필요 — 프롬프트 전달 경로는 Phase 3에서 코드 추적 확인 |
| T5 | API 키 미설정 → 401 → 안내 토스트, 크래시 없음 | ✅ **통과** — `fetch`를 401로 모킹해 `aiConvertChunked` 호출 시 "API 키가 설정되지 않았습니다..." 메시지가 정확히 발생함을 Node로 직접 검증 |
| T6 | 기존 문서 재변환 | ⏸ 실제 AI 필요 — 청킹 경유 확인(Phase 4/5 코드) |
| T7 | .md 단건 내보내기 + ZIP 백업 | ⏸ 브라우저 필요 — `Editor.export()`/`exportAll()`는 AI 미의존 순수 클라이언트 로직이라 동작 자체는 안전하나(폴더 제거 후 `S.folders` 참조 제거 완료, Phase 2), 실제 다운로드는 브라우저에서 확인 필요 |
| T8 | KO↔EN 전환, 신규 문자열 포함 | ✅ **통과** — index.html의 모든 `data-i18n*` 키(56개)가 ko/en 양쪽에 존재함을 스크립트로 확인 |
| T9 | PWA 설치 후 오프라인 저장 문서 열람 | ⏸ 실제 브라우저/서비스워커 필요 — 배포 환경 확인 필요 |
| T10 | `npm run build` 후 `grep -ri supabase dist/` | ✅ **통과** — 0건 |
| T11 | 다청크 변환 중 취소 → 즉시 중단, 부분 저장 없음 | ⏸ 실제 AI 필요 — Phase 4에서 AbortController 전파 구조와 "성공 후에만 저장" 흐름을 코드로 확인 |

**요약**: 정적/구조적으로 검증 가능한 T5·T8·T10은 통과 확인. 나머지(T1-T4, T6, T7, T9, T11)는 실제 AI 응답 또는 실제 브라우저가 필요해 **Vercel 배포 환경에서 사용자의 최종 확인이 필요**합니다.

## Phase 5
- T3(스트리밍 점진적 표시) 검증은 실제 Claude API 스트림 응답이 필요해 이 환경에서 실행 불가(이전 Phase들과 동일한 로컬 제약). 코드 리뷰로 대체 확인: `claudeRequest()`가 응답 `content-type`으로 SSE/JSON을 분기하는 듀얼 모드이며, `onDelta`는 `main.js`의 `appendStreamDelta`/`appendStreamDivider`를 통해 `textContent`만 사용(D10 — innerHTML 미사용, XSS 방지)하도록 배선함. 배포 환경에서 실제 스트리밍 점진 표시와 "버퍼링 환경에서도 결과 정상 저장" 여부는 사용자가 확인 필요.
- 스펙 step 4에 따라 재변환(`viewer.js`)에는 스트리밍 미리보기(`onDelta`)를 연결하지 않음(완료 후 렌더만) — 의도된 축소 범위.

## Phase 4
- 청킹 알고리즘(`splitIntoChunks`)은 이 환경에서 실행 가능한 순수 함수라 Node로 직접 단위 검증함(60,000자 텍스트 → 3청크, 무손실 재결합, 마지막 문단 보존 확인; 빈 줄 없는 70,000자 단일 블록 → 하드 스플릿 3청크 확인). T1/T2/T11의 **실제 AI 변환 결과물** 검증(원문 마지막 페이지 내용이 출력에 포함되는지, 청크 진행 표시 UI 등)은 이전 Phase들과 동일한 이유로 이 환경에서 실행 불가 — 배포 환경에서 확인 필요.
- 취소(T11) 구조 확인: 청크 루프 시작 시 `signal.aborted` 체크 + `fetch`의 `signal`로 인해 진행 중 취소 시 AbortError가 `aiConvertChunked`까지 전파되고 재시도 없이 즉시 throw됨. 문서 저장(`IDB.saveDoc`)은 변환 성공 후에만 실행되므로 부분 문서가 저장되지 않는 구조.

## Phase 3
- Phase 2에서 Q&A 기능(qaPanel.js 등) 삭제 시 `src/services/ai.js`의 `callQAApi()`(약 145줄)가 호출부 없는 죽은 코드로 남아있던 것을 발견. Phase 3에서 이 파일(ai.js)을 어차피 수정하므로 함께 제거함. (원래 Phase 2 완료 기준에는 없었으나, "핵심 작업 파일"인 ai.js를 정리하는 김에 처리 — 새 기능 추가가 아닌 이전 단계의 정리 누락 보완.)
- **완료 기준 검증 한계**: "커스텀 스타일 + 프롬프트 입력 → 출력에 반영" 검증은 실제 AI 응답이 필요한데, 이 환경에서는 `/api/*` 서버리스 함수를 로컬 실행할 수 없음(Phase 0/2와 동일한 제약). 대신 코드 경로를 직접 추적해 확인함: `uploadModal.js`가 `#custom-prompt`/`#wlc-custom-prompt` 값을 `localStorage['dv_custom_prompt']`에 저장 → `main.js`의 `processFile`/`processText`와 `viewer.js`의 `startReconv` 3곳 모두 그 값을 읽어 `aiConvert(..., customPrompt)`로 전달 → `ai.js`의 `buildPrompt`가 `styleDef.id === 'custom'`일 때 그 값을 시스템 프롬프트로 사용함을 확인. 실제 프롬프트 반영 여부는 배포 환경에서 사용자가 직접 확인 필요.

## Phase 2
- `src/components/sidebar.js`의 `import { Viewer } from './viewer.js'`는 이번 작업 이전부터 미사용(pre-existing dead import)이었음. Phase 2 변경과 무관하여 그대로 둠 (스코프 밖 리팩토링 금지 규칙).
- `src/services/db.js`의 `switchUser(userId)` 메서드는 Supabase 멀티유저 전환용이었고 이제 호출부가 없어 죽은 코드가 됨. D4(IndexedDB 스키마 불변)와 별개로 메서드 자체는 핸드오프에 명시적 제거 대상이 아니라 그대로 둠.
- `src/utils/router.js`는 원래 처분 표시에 [유지]로 분류돼 있었으나, 실제로는 삭제 대상인 `qaPanel.js`를 동적 import하고 있어(`handleRoute()` 내 문서 열기 경로) 그대로 두면 문서를 열 때마다 모듈 로드 실패로 앱이 깨짐. 완료 기준(스모크 테스트: 업로드→변환→보기→편집저장→내보내기)을 만족시키기 위해 해당 QAPanel 참조 2곳만 제거함. `src/components/ui.js`의 Esc 키 핸들러에도 동일한 이유로 qaPanel.js 동적 import가 있어 함께 제거함.
- **스모크 테스트 한계**: 이 환경에는 헤드리스 브라우저(Playwright/Puppeteer)가 설치돼 있지 않고 `vercel dev`도 로그인 토큰이 없어 로컬에서 `/api/*` 서버리스 함수를 실행할 수 없음(이전 세션에서도 확인된 제약). 따라서 "업로드→변환→보기→편집저장→내보내기" 스모크 테스트 중 **AI 변환이 포함된 부분은 실제 브라우저·배포 환경에서 수동 검증 필요**. 대신 이번 Phase 2에서는 다음으로 대체 검증함: (1) `npm run build` 성공(모듈 그래프·문법 오류 없음), (2) `npm run dev` 구동 후 `/`와 `/src/main.js` 200 OK 확인, (3) 제거 대상 식별자(SB/QAPanel/RealtimeService/CloudModal/S.folders/S.favorites/S.docFolder 등) 전역 grep 0건, (4) 모든 DOM 이벤트 바인딩이 기존부터 `?.` 옵셔널 체이닝을 사용해 제거된 엘리먼트에 안전. 실제 파일 업로드→AI 변환→저장→내보내기의 대화식 확인은 배포 후 사용자가 직접 해달라고 안내함.
