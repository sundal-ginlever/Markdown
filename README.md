# DocVault

**AI 문서 변환기.** 파일이나 자유롭게 작성한 텍스트를 업로드/입력하면, 선택한 스타일에 맞춰 AI가 깔끔한 Markdown 문서로 정리해 줍니다. 변환한 문서는 브라우저(IndexedDB)에 저장됩니다.

> 사용 방법은 [USAGE.md](USAGE.md)(한국어 사용 가이드)를 참고하세요.

## 핵심 기능
- **문서 → Markdown 변환**: PDF · Word(DOCX) · 스프레드시트(XLSX/XLS/ODS) · 텍스트(TXT/MD/CSV/JSON/코드)
- **직접 작성 → 변환**: 파일 없이 홈에서 아이디어·메모를 자유롭게 쓰고 바로 문서화
- **긴 문서도 절단 없이 완전 변환**: 원문을 문단 단위로 청킹해 순차 변환 후 이어붙이므로, 수십 페이지 분량도 끝까지 처리됩니다
- **Claude 실시간 스트리밍**: 변환 중 결과가 실시간으로 화면에 나타납니다 (접이식 미리보기)
- **변환 스타일 6종**: 개발 문서 · 블로그 · 보고서 · 위키(Obsidian) · 공식 문서 · **커스텀**(직접 프롬프트 입력)
- **다중 파일 일괄 변환** + 변환 전 예상 청크 수/토큰/비용 표시
- **즉석 재변환**(같은 원본을 다른 스타일로) · **원본↔변환 나란히 보기** · 복사 · 내보내기(.md, 전체 ZIP)
- 검색 / 스타일별 필터 / 정렬
- **PWA** 오프라인 지원 · 한국어/영어

## AI 프로바이더 & 모델
설정(⚙️ → 🔑 API 키)에서 프로바이더와 모델을 고릅니다.

| 프로바이더 | 기본 모델 | 비고 |
|---|---|---|
| Claude (Anthropic) | `claude-haiku-4-5` | 비용↓. Sonnet 4.6 / Opus 4.8 선택 가능. **스트리밍 지원** |
| OpenAI | `gpt-5.4-mini` | gpt-5.4-nano / gpt-5.5 |
| Gemini (Google) | `gemini-3.5-flash` | 3.1-flash-lite / 2.5-flash |
| Local / Custom | (사용자 지정) | OpenAI 호환 엔드포인트 |

> **BYOK(Bring Your Own Key) 전용**입니다. **API 키는 이 브라우저에만 저장되며, 서버는 키를 보관하지 않습니다.** 서버리스 프록시(`api/*`)는 요청마다 클라이언트가 보낸 키를 그대로 사용해 각 사 API에 전달할 뿐입니다. claude.ai/ChatGPT 등 **구독은 API에 연결할 수 없습니다** — 비용은 토큰 사용량에 비례하며, 변환은 모두 사용자 클릭으로만 발생합니다(자동 호출 없음).

## 기술 스택 / 구조
- **Vite + 바닐라 JS(ES 모듈)**, PWA(`vite-plugin-pwa`)
- AI 호출은 **Vercel 서버리스 프록시**(`api/claude.js`, `api/openai.js`, `api/gemini.js`)를 경유 — 브라우저에서 각 AI사 API로 직접 호출하지 않음. 세 프록시 모두 **BYOK 전용**이며, 클라이언트 키가 없으면 401을 반환합니다.
- 주요 디렉터리:
  - `src/components` — UI(사이드바, 뷰어, 에디터, 모달 등)
  - `src/services` — `ai`(LLM 호출 · 청킹 · 스트리밍), `db`(IndexedDB), `search`
  - `src/state/store.js` — Proxy 기반 반응형 상태 + 변환 스타일 정의
  - `src/utils` — 추출기(pdf/docx/xlsx), markdown, i18n, crypto, router
  - `api/` — AI 프록시(Vercel Functions, BYOK 전용)

## 로컬 실행 / 배포
```bash
npm install
npm run dev      # http://localhost:5173 (UI 확인용)
npm run build    # dist/ 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```

> ⚠️ **변환 API는 `vite dev`에서 동작하지 않습니다.** `/api/*`가 Vercel Functions라서요. 실제 변환을 테스트하려면 **Vercel 배포**(또는 `vercel dev`)가 필요합니다.

**배포(Vercel):** 이 저장소를 Vercel에 연결하면 `api/`가 자동으로 서버리스 함수가 됩니다. 서버 환경변수에 API 키를 두지 않습니다(BYOK 전용) — 사용자가 앱의 ⚙️ 설정 화면에서 직접 입력한 키만 사용됩니다.

## 라이선스
MIT
