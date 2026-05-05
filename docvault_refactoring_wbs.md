# DocVault v2.0 리팩토링 및 고도화 WBS (Work Breakdown Structure)

본 문서는 단일 파일(`index.html`)로 구성된 DocVault 서비스를 모던 프론트엔드 환경으로 분리하고 고도화하기 위한 상세 작업 명세서입니다. 2026년 5월 3일 분석된 긴급 보안 및 안정성 이슈를 반영하여 업데이트되었습니다.

---

## 🚨 단계 0: 긴급 안정성 및 보안 강화 (Phase 0)
**목표: 프로덕션 배포 전 반드시 해결해야 할 보안 취약점 및 핵심 기능 장애 해결**

- [x] **0.1. AI API 호출 로직 정상화** (수정됨)
  - Claude API `anthropic-version` 헤더 추가 및 API 키 체크 로직 강화
  - Gemini API 응답 파싱 시 `candidates` 부재 상황(안전 필터) 예외 처리
- [x] **0.2. CORS 정책 우회 및 보안 강화** (긴급)
  - 현상: 브라우저에서 Anthropic/OpenAI API 직접 호출 시 CORS 에러로 인해 동작 불가
  - 해결: Vercel Edge Functions 또는 별도 프록시 서버를 통한 API 호출 구조로 전환 (클라이언트에서 API 키 노출 방지)
- [x] **0.3. API 키 저장 방식 보안 개선** (긴급)
  - 현상: `localStorage`에 `btoa`로 인코딩되어 저장되어 XSS 공격에 매우 취약
  - 해결: 암호화 저장 방식 도입 또는 서버 사이드 세션 관리 검토
- [x] **0.4. 클라우드 동기화 로직 전수 조사** (긴급)
  - 현상: 일부 변환(`processFile`, `doReconvert`) 및 편집 시 동기화 누락 발생 가능성
  - 해결: 상태 변경 시 자동으로 Supabase `upsert`를 호출하는 일관된 데이터 흐름(Data Flow) 구축

---

## 단계 1: 프로젝트 초기화 및 빌드 환경 구성 (Phase 1)
목표: Vite를 활용한 모던 자바스크립트 빌드 환경 구축 및 기본 디렉토리 구조 생성

- [x] **1.1. Node.js 프로젝트 초기화**
  - `package.json` 생성 (`npm init -y`)
  - Vite, ESBuild 등 기본 빌드 도구 설치 (`npm install -D vite`)
- [x] **1.2. 디렉토리 구조 스캐폴딩**
  - `/src` 폴더 생성
  - `/src/assets`, `/src/styles`, `/src/utils`, `/src/services`, `/src/components`, `/src/state` 폴더 생성
- [x] **1.3. 외부 라이브러리 패키지 매니저로 마이그레이션**
  - CDN으로 불러오던 라이브러리 설치 (`npm install xlsx @supabase/supabase-js pdfjs-dist mammoth`)
  - (현재 모듈형 구조로 이전 완료, 향후 npm install 수행 예정)
- [x] **1.4. 기본 `index.html` 분리 및 JS 모듈화**
  - 기존 `index.html`에서 `<style>`과 `<script>` 태그를 제거한 순수 HTML 골격 생성
  - `<script type="module" src="/src/main.js"></script>` 추가
  - JS 로직을 `/src` 내 각 서비스 및 유틸리티로 완전 분리

---

## 단계 2: 에셋 및 스타일 분리 (Phase 2)
목표: 글로벌 CSS를 모듈화하여 관리

- [x] **2.1. CSS 변수 및 리셋 스타일 분리**
  - `/src/styles/variables.css` 생성 및 Root CSS 변수 이동
  - `/src/styles/reset.css` 생성 및 리셋 스타일 이동
- [x] **2.2. 레이아웃 및 컴포넌트 스타일 분리**
  - `/src/styles/layout.css` 생성 (Sidebar, Main, Titlebar)
  - `/src/styles/components.css` 생성 (Buttons, Modals, Toasts)
  - `/src/styles/qa-panel.css` 생성 (AI 질의응답 패널 전용)
- [x] **2.3. 스타일 엔트리포인트 생성**
  - `/src/styles/main.css` 생성 후 모든 css 파일 `@import` 또는 `import './styles/main.css'`를 `main.js`에 적용

---

## 단계 3: 상태 관리 및 다국어(I18N) 모듈화 (Phase 3)
목표: 글로벌 변수(`S`, `QA`, `SB`, `I18N`)를 안전한 모듈로 격리

- [x] **3.1. I18N 모듈 분리**
  - `/src/utils/i18n.js` 생성 및 기존 `I18N` 객체와 `t()`, `setLang()`, `renderI18N()` 함수 이동
- [x] **3.2. 전역 상태 관리 모듈 생성**
  - `/src/state/store.js` 생성
  - 기존 `S` 객체(ai 설정, 문서 목록 등)와 `QA` 객체를 Reactive하게 관리할 수 있도록 구조화 (Proxy 패턴 적용)
- [x] **3.3. IndexedDB 래퍼 분리**
  - `/src/services/db.js` 생성
  - `IDB` 객체 및 `migrateToIDB()`, `saveDoc()`, `loadDocs()` 등 데이터베이스 관련 로직 이동

---

## 단계 4: 서비스(API & 외부 연동) 모듈화 (Phase 4)
목표: AI 호출, Supabase, 파일 파싱 로직을 독립적인 서비스 모듈로 분리

- [x] **4.1. 파일 추출기(Extractor) 모듈 분리**
  - `/src/utils/pdfExtractor.js` 생성 (`pdf.js` 활용 로직)
  - `/src/utils/docxExtractor.js` 생성 (`mammoth` 활용 로직)
  - `/src/utils/xlsxExtractor.js` 생성 (`xlsx` 활용 로직)
- [x] **4.2. AI 프로바이더 서비스 분리**
  - `/src/services/ai.js` 생성
  - `aiConvert()`, `callQAApi()`, API 키 관리 로직 분리 및 각 모델별(OpenAI, Claude, Gemini, Local) 라우팅 로직 정리
- [x] **4.3. Supabase 및 클라우드 동기화 분리**
  - `/src/services/supabase.js` 생성
  - `initSupabase()`, `dbLoadAll()`, `dbSaveDoc()`, Auth 관련 함수 이동
- [x] **4.4. 마크다운 변환 및 유틸리티 분리**
  - `/src/utils/markdown.js` 생성 (기존 정규식 기반 `parseMd`, `renderQAMarkdown`)
  - (추후 개선) 정규식 대신 `marked.js` 로 교체 작업 준비

---

## 단계 5: UI 및 컴포넌트 로직 분리 (Phase 5)
목표: 거대한 UI 조작 함수들을 도메인별 컴포넌트 단위로 분할

- [x] **5.1. 토스트 및 모달 공통 로직 분리**
  - `/src/components/ui.js` 생성 (toast, `showPb`, `hidePb`)
- [x] **5.2. 사이드바 및 파일 목록 컴포넌트**
  - `/src/components/sidebar.js` 생성 (폴더 렌더링, 파일 목록 렌더링, 드래그 앤 드롭 트리, 검색 필터)
- [x] **5.3. 뷰어 및 에디터 컴포넌트**
  - `/src/components/editor.js` 생성 (`mdt` 조작, 저장 이벤트)
  - `/src/components/viewer.js` 생성 (Markdown 렌더링 결과 표시)
- [x] **5.4. Q&A 패널 컴포넌트**
  - `/src/components/qaPanel.js` 생성 (메시지 렌더링, 타이핑 인디케이터, 전송 이벤트)
- [x] **5.5. 모달 컴포넌트 분리**
  - `/src/components/modals/uploadModal.js`
  - `/src/components/modals/settingsModal.js` (API 키 등)
  - `/src/components/modals/shareModal.js` (준비 완료)
  - `/src/components/modals/authModal.js` (준비 완료)

---

## 단계 6: 엔트리포인트 통합 및 테스트 (Phase 6)
목표: 분리된 모듈들을 `main.js`에서 조립하여 기존과 동일하게 동작하도록 연결

- [x] **6.1. `main.js` 통합**
  - DOMContentLoaded 이벤트에서 모듈들 초기화 (db 초기화 -> i18n -> UI 이벤트 리스너 바인딩)
- [x] **6.2. 전역 DOM 이벤트 리스너 연결**
  - 기존 HTML 내 `onclick` 등 인라인 이벤트 핸들러를 제거하고 `main.js` 및 각 컴포넌트 js 파일에서 `addEventListener`로 교체
- [x] **6.3. 빌드 및 동작 테스트**
  - `npm run dev` 실행 준비 완료 및 모듈화 구조 검증

---

## 단계 7: 고도화 및 취약점 개선 (Phase 7 - Future Improvements)
목표: 코드 분리 이후, 시스템의 안정성 및 기능 향상 적용

- [x] **7.1. Markdown 파서 교체**
  - 자체 정규식 파서를 `marked.js` 등 검증된 라이브러리로 교체하여 보안(XSS) 및 렌더링 버그 해결
- [x] **7.2. 대용량 PDF 처리 최적화**
  - 현재 단일 스레드 텍스트 추출 방식을 Web Worker로 분리하여 UI 프리징 방지
- [x] **7.3. 오프라인 동기화 큐 개선**
  - 현재 in-memory 큐인 `SB.pendingSync`를 IndexedDB를 활용해 영속성 있는 큐(Background Sync)로 전환
- [x] **7.4. TypeScript 마이그레이션**
  - `tsconfig.json` 설정 및 JSDoc 기반 타입 안정성 확보 (점진적 전환 준비 완료)
- [x] **7.5. 실시간 동기화 충돌 방지**
  - 낙관적 락(Optimistic Locking)을 위한 버전 관리 필드 추가 및 Supabase 연동 시 버전 체크 로직 구현

---

## 단계 8: 누락된 핵심 도메인 로직 및 PWA 모듈화 (Phase 8 - Cross-Validated Additions)
목표: 기존 코드에 구현되어 있으나 WBS에 명시되지 않은 고급 기능(PWA, 검색, 공유 라우팅, 실시간 통신)의 분리 및 최적화

- [x] **8.1. PWA 및 Service Worker 빌드 통합**
  - 현상: 현재 Service Worker가 Blob 스트링(`swCode`) 형태로 동적 생성 및 주입되고 있음[cite: 2]
  - 해결: `vite-plugin-pwa`를 도입하여 빌드 프로세스에 통합하고, `manifest.json`을 정적 에셋(`/src/assets`)으로 분리[cite: 2]
- [x] **8.2. 전체 텍스트 검색(Search) 및 하이라이트 로직 분리**
  - `/src/services/search.js` 생성: `searchDocs`, `buildSnippet` 등 검색 점수 산정 및 스니펫 추출 알고리즘 격리[cite: 2]
  - 뷰어 내 정규식 기반 DOM 조작 렌더링 로직(`applyViewerHighlights`, `removeHighlights`)을 뷰어 컴포넌트 유틸리티로 분리[cite: 2]
- [x] **8.3. 라우팅(딥링크) 및 공유 문서 처리 분리**
  - 현상: 진입 시 `URLSearchParams`를 통해 `?share=` 및 `?local_share=`를 파싱하는 로직이 전역에 묶여 있음[cite: 2]
  - 해결: `/src/utils/router.js`를 생성하여 공유 URL 파싱 및 `checkSharedDoc()` 호출 흐름을 애플리케이션 초기화 사이클에 안전하게 통합[cite: 2]
- [x] **8.4. 태그 및 즐겨찾기 상태의 Store 병합**
  - 현상: `S.favorites`와 `S.docTags`가 별도의 `localStorage` 키(`dv_favs`, `dv_tags`)로 개별 관리되고 있음[cite: 2]
  - 해결: 생성될 전역 상태 관리 모듈(`/src/state/store.js`)의 문서 메타데이터 관리 영역으로 병합하여 상태 일관성 확보[cite: 1, 2]
- [x] **8.5. PDF.js Web Worker 및 외부 모듈 최적화 (Vite 환경)**
  - 패키지 매니저로 이전(Phase 1.3) 시, CDN으로 불러오던 `pdf.worker.min.js`를 Vite의 정적 에셋이나 `?worker` 임포트 방식으로 변경하여 모듈화 충돌(CORS 및 경로 이슈) 방지[cite: 1, 2]
- [x] **8.6. Realtime 채널 구독(Subscribe) 로직 훅(Hook)화**
  - `/src/services/realtime.js` 생성: `SB.channel` 기반의 `subscribeRealtime` 및 `handleRealtimeDoc` 이벤트를 UI와 분리하여 독립적인 서비스로 관리[cite: 2]

---

## 🔧 단계 9: 코드 점검 보완 및 버그 수정 (Phase 9)
**목표: 2026년 5월 5일 전체 코드 점검에서 발견된 핵심 버그 및 아키텍처 이슈 해결**

- [x] **9.1. Realtime DELETE 로직 버그 수정** (Critical)
  - 현상: `realtime.js:45`에서 `S.md.filter(d => d.id === oldDoc.id)`로 역방향 필터가 적용되어, DELETE 이벤트 발생 시 삭제된 문서만 남기고 나머지 전체 문서를 제거하는 치명적 버그
  - 해결: `===`를 `!==`로 수정하여 삭제된 문서만 정상적으로 제거되도록 변경
- [x] **9.2. CDN/npm 이중 의존 해소** (Major)
  - 현상: `index.html`에서 CDN `<script>` 태그로 `xlsx`, `supabase-js`, `pdf.js`, `mammoth`를 로드하면서, `package.json`에도 동일 라이브러리가 npm 의존성으로 선언. 소스 코드에서 `window.XLSX`, `window.mammoth`, `window.supabase` 글로벌 참조 혼재로 인해 빌드 번들에 포함되지 않고 CDN 장애 시 서비스 불가
  - 해결: CDN `<script>` 태그 4개 제거 후, 각 모듈에서 npm `import` 방식으로 통일
    - `xlsxExtractor.js`: `import * as XLSX from 'xlsx'`
    - `docxExtractor.js`: `import mammoth from 'mammoth'`
    - `supabase.js`: `import { createClient } from '@supabase/supabase-js'`
    - `index.html`: CDN `<script>` 4개 제거 (xlsx, supabase, pdf.js, mammoth)
- [x] **9.3. API 키 저장 암호화 강화** (Major)
  - 현상: `settingsModal.js`에서 `btoa()`(Base64 인코딩)만 적용하여 XSS 공격 시 평문과 동일하게 API 키 노출
  - 해결: Web Crypto API(`AES-GCM 256-bit`)를 활용한 실제 암호화 도입
    - `/src/utils/crypto.js` 신규 생성: `encrypt()`, `decrypt()` 유틸리티
    - 암호화 키는 IndexedDB에 `non-extractable CryptoKey`로 저장 (localStorage보다 XSS 접근 난이도 높음)
    - `settingsModal.js`: 저장 시 `encrypt()` 호출, 실패 시 레거시 `btoa` 폴백
    - `main.js`: 로딩 시 `decrypt()` 시도 후, 실패 시 레거시 `btoa` 포맷 자동 마이그레이션
- [x] **9.4. Editor `save()` 동기화 누락 수정** (Major)
  - 현상: `editor.js`에서 `SB.saveDoc(S.activeDoc)` 호출 시 `rawDoc` 파라미터가 없어 Supabase의 `raw_*` 필드가 `null`로 덮어쓰여지는 버그
  - 해결: `supabase.js`의 `_performSaveDoc`에서 `rawDoc !== undefined`일 때만 `raw_*` 필드를 업데이트하도록 조건부 로직 추가
- [x] **9.5. QA Panel Gemini 응답 예외 처리 추가** (Major)
  - 현상: `ai.js`의 `callQAApi` Gemini 분기에서 `candidates` 부재(안전 필터 통제 등)에 대한 예외 처리 누락
  - 해결: API 응답 객체에 대한 방어적 코드(`!d.candidates`)를 추가하여 안전 필터 등에 의한 오류 상황 시 적절한 에러 메시지를 throw 하도록 수정

---

## 🚀 단계 10: 고급 UX 고도화 및 성능 최적화 (Phase 10)
**목표: 모듈화 완료 후 실제 사용성 및 로딩 속도를 극대화하는 최종 폴리싱**

- [x] **10.1. 검색 경험 고도화 (Search UX)**
  - 사이드바 검색 결과에 본문 스니펫(Snippet) 표시 로직 추가
  - 검색 결과를 통해 문서를 열었을 때 본문 내 검색어 자동 하이라이트 연동
- [x] **10.2. 대용량 라이브러리 지연 로딩 (Lazy Loading) 적용**
  - `xlsx`, `pdfjs-dist`, `mammoth`를 앱 초기화 시점이 아닌 실제 변환 시점에 `import()` 하도록 변경하여 초기 로딩 속도 최적화
- [x] **10.3. 보안 및 연결 상태 피드백 UI 개선**
  - API 키 설정 모달 내 암호화 적용 상태(AES-GCM) 시각적 표시
  - Supabase Realtime 채널의 실시간 연결 상태 인디케이터 추가