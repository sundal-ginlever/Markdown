# DocVault Path 1 핸드오프 패키지 — 다이어트 + 긴 문서 완전 변환

- **버전**: v1.0 (2026-07-03)
- **대상 레포**: https://github.com/sundal-ginlever/Markdown (branch: main)
- **배포**: Vercel (inkimastermarkdown.vercel.app)
- **실행 모델 가정**: Sonnet급 단독 수행. 모든 설계 결정은 3장에 사전 확정되어 있다. **문서 밖 재량 판단·재해석 금지.** 모호하면 3장을 따르고, 3장에 없으면 "가장 작은 변경"을 선택한다.

---

## 0. 컨텍스트 (실행 모델용 요약)

DocVault v2.0은 Vite + Vanilla JS(ES modules) 기반의 "문서 → 마크다운" AI 변환기다. 파일(PDF/DOCX/XLSX/TXT 등)을 브라우저에서 추출한 뒤, Vercel 서버리스 프록시(`api/claude.js`, `api/openai.js`, `api/gemini.js`)를 경유해 AI로 변환한다. 저장은 IndexedDB, 상태는 Proxy 기반 스토어(`src/state/store.js`), 6종 변환 스타일(`STYLES`)을 갖는다.

이 레포는 원래 "Document Vault"(폴더/위키링크/Supabase 실시간 동기화/Q&A)로 시작했다가 "AI 변환기"로 리포커스됐다. **이번 작업은 그 리포커스를 코드 레벨에서 완결짓는 것이다:**

1. v1 잔재 제거 (Supabase 동기화, 실시간, Q&A, 폴더/즐겨찾기/태그)
2. **긴 문서 완전 변환**: 30,000자 절단을 청킹 파이프라인으로 대체
3. Claude 프로바이더 스트리밍
4. BYOK 전용 보안 확정 (서버 키 경로 삭제)
5. 커스텀 스타일 프롬프트 UI 연결 (현재 데드 코드)

---

## 1. 목표 / 비목표

### 목표 (이것만 한다)
- G1. 클라우드/Q&A/폴더 계층 제거 후에도 `업로드 → 변환 → 보기 → 편집 → 내보내기` 전 흐름이 무결하게 동작
- G2. 30,000자를 초과하는 문서(50페이지+ PDF 포함)가 **절단 없이 끝까지** 변환됨
- G3. Claude 프로바이더 사용 시 변환 결과가 실시간 스트리밍으로 표시됨
- G4. 서버 환경변수 API 키 경로가 완전히 제거되고, 키 미제공 시 401 + 명확한 안내
- G5. 커스텀 스타일 선택 시 사용자가 입력한 프롬프트가 실제 변환에 반영됨

### 비목표 (절대 하지 않는다)
- OpenAI/Gemini 스트리밍 (기존 블로킹 방식 유지)
- RAG / 임베딩 / 검색 고도화
- TypeScript 전환, 빌드 체계 변경, 디자인 리뉴얼
- IndexedDB 스키마 버전 bump 또는 마이그레이션
- 새 npm 의존성 추가 (제거만 허용)
- Supabase 재도입, 테스트 프레임워크 도입
- 스코프 밖 리팩토링. 무관한 버그를 발견하면 수정하지 말고 `HANDOFF_NOTES.md`에 기록만 한다.

---

## 2. 현재 구조 맵 (처분 표시)

```
api/
  claude.js          [수정] BYOK 강제 + 스트리밍 passthrough
  openai.js          [수정] BYOK 강제 (env fallback 제거)
  gemini.js          [수정] BYOK 강제 (env fallback 제거)
src/
  main.js            [수정] 849줄. 앱 오케스트레이션 — SB/RT/QA/폴더 참조 제거, 청킹 호출부 교체
  components/
    sidebar.js       [수정] 폴더/즐겨찾기/태그 UI 제거, 문서 목록+이름검색+정렬 유지
    viewer.js        [수정] 재변환 흐름을 청킹 버전으로 교체
    editor.js        [유지]
    logPanel.js      [유지]
    ui.js            [유지]
    qaPanel.js       [삭제]
    modals/
      uploadModal.js [수정] 커스텀 프롬프트 textarea + 스트리밍 미리보기 영역
      settingsModal.js [수정] Supabase 관련 항목이 있으면 제거
      cloudModal.js  [삭제]
  services/
    ai.js            [수정] 핵심 작업 파일 — 청킹/스트리밍/커스텀 프롬프트
    db.js            [수정] sync_queue/folders 접근 함수 제거 (스토어 정의는 방치)
    search.js        [수정] 태그/즐겨찾기 필터 분기 제거, 이름 검색·하이라이트 유지
    supabase.js      [삭제] 554줄
    realtime.js      [삭제]
  state/store.js     [수정] folders/docFolder/favorites/docTags/QA 제거, 커스텀 프롬프트 추가
  styles/
    qa-panel.css     [삭제]
    (나머지 css)     [수정] 삭제된 컴포넌트의 죽은 셀렉터 정리는 선택 사항 (무해하면 방치 가능)
  utils/             [유지] 추출기 3종(pdf/docx/xlsx + worker), i18n, markdown, crypto, router
index.html           [수정] 클라우드/Q&A 버튼·모달 마운트 제거
package.json         [수정] @supabase/supabase-js 제거
README.md / USAGE.md [수정] Phase 6에서 문서 정리
```

---

## 3. 확정된 기술 결정 (재논의 금지)

| ID | 결정 |
|----|------|
| D1 | **BYOK 전용.** `process.env.*_API_KEY` fallback을 세 프록시에서 모두 삭제. 클라이언트 키 헤더 없으면 `401 {"error":"API key required (BYOK). Settings에서 키를 설정하세요."}` |
| D2 | **청킹**: 문단(빈 줄) 경계 greedy packing, 청크 목표 **24,000자**. **순차** 변환(병렬 금지 — 문서 연속성 때문). 직전 청크 **출력의 마지막 400자**를 다음 청크에 연속성 컨텍스트로 전달. 청크당 `max_tokens: 8192`. 청크 실패 시 **1회 재시도**, 재실패 시 해당 파일 전체 실패 처리(기존 per-file 실패 흐름 사용). |
| D3 | **스트리밍은 Claude만.** 프록시는 SSE bytes passthrough. 클라이언트는 **듀얼 모드**: 응답 `content-type`이 `text/event-stream`이면 스트림 파싱, 아니면 기존 JSON 경로. (Vercel이 버퍼링해도 듀얼 모드가 안전망이 되어 기능 저하 없이 동작) |
| D4 | **IndexedDB는 건드리지 않는다.** `folders`, `sync_queue` 스토어는 정의만 남기고 미사용 방치. 버전 bump·마이그레이션 금지. |
| D5 | **커스텀 프롬프트**: `localStorage['dv_custom_prompt']`에 저장. 업로드 모달과 재변환이 같은 값을 공유. `buildPrompt`에 정식 파라미터로 전달 (현재의 `styleDef.customPrompt` 임시 참조를 대체). |
| D6 | **삭제 범위 확정**: `supabase.js`, `realtime.js`, `cloudModal.js`, `qaPanel.js`, `qa-panel.css` + 이들에 대한 모든 import/호출/DOM/이벤트. `@supabase/supabase-js` 의존성 제거. |
| D7 | 사이드바 **이름 검색·정렬은 유지**, 폴더/즐겨찾기/태그는 제거. |
| D8 | 30,000자 truncation 로직(변환용)과 "일부만 전송됩니다" 경고 toast는 **삭제** — 청킹이 대체한다. |
| D9 | i18n: 삭제된 기능의 키는 참조가 사라지면 무해하므로 제거는 선택 사항. 새 UI 문자열(청크 진행, 커스텀 프롬프트 라벨 등)은 KO/EN 둘 다 추가. |
| D10 | 스트리밍 실시간 표시는 **UploadModal 내 접이식 미리보기 `<pre>` 영역**에 `textContent` append로 구현 (innerHTML 금지 — XSS). 변환 완료 후에는 기존 정식 렌더 경로 사용. |

---

## 4. Phase별 작업 (순서 고정, phase당 1커밋)

### Phase 0 — 기준선 확인 (커밋 없음)
```bash
npm install
npm run dev     # 구동 확인
npm run build   # 성공 확인
```
루트에 `HANDOFF_NOTES.md` 생성(발견 사항 기록용).

---

### Phase 1 — 보안: BYOK 전용
**commit**: `fix(security): enforce BYOK-only proxies, remove server key path`

- `api/claude.js`, `api/openai.js`, `api/gemini.js`에서 `process.env` 키 fallback 삭제.
- 키 미제공 시 401 반환 (D1의 에러 메시지).
- 프론트(`ai.js` 또는 에러 toast 경로)에서 401 응답 시 사용자에게 "설정에서 API 키를 입력하세요" 안내가 보이는지 확인, 없으면 toast 추가.

**완료 기준**: 로컬에서 키 헤더 없이 `curl -X POST localhost:5173/api/claude`(또는 vercel dev) → 401. `grep -rn "process.env" api/` → API 키 관련 0건.

---

### Phase 2 — 다이어트
**commit**: `refactor: remove cloud sync, QA, folders — converter-only scope`

1. 파일 삭제: `src/services/supabase.js`, `src/services/realtime.js`, `src/components/modals/cloudModal.js`, `src/components/qaPanel.js`, `src/styles/qa-panel.css`
2. `src/main.js`: `SB.*`, `RealtimeService.*`, QA 패널 import/초기화/이벤트 제거. 변환 성공 후 `SB.saveDoc(...)` 호출 제거. 오프라인 동기화 안내 toast(152행 부근)와 `sync_queue` clear 로직(550행 부근) 제거.
3. `src/state/store.js`: `folders`, `docFolder`, `favorites`, `docTags`, `rtStatus` 및 `QA` 스토어 제거. (`QA` export를 지우면 import하는 곳도 모두 정리)
4. `src/components/sidebar.js`: 폴더 트리/즐겨찾기 별/태그 칩 UI와 핸들러 제거. 문서 목록 + 이름 검색 + 정렬(`S.sort`) 유지.
5. `src/services/db.js`: `sync_queue`/`folders` 스토어를 읽고 쓰는 함수 제거. `onupgradeneeded`의 스토어 **정의는 그대로 둔다** (D4).
6. `src/services/search.js`: 즐겨찾기/태그 필터 분기 제거, 이름 검색·하이라이트 유지.
7. `index.html`: 클라우드/Q&A 관련 버튼·모달 마운트 포인트 제거.
8. `package.json`: `@supabase/supabase-js` 제거 → `npm install`로 lock 갱신.
9. `settingsModal.js`에 Supabase/클라우드 항목이 있으면 제거.

**완료 기준**: `npm run build` 성공. `grep -rin "supabase\|realtime\|qaPanel" src/ index.html` → 0건. 스모크: 파일 업로드 → 변환 → 보기 → 편집 저장 → .md 내보내기 전부 정상. 콘솔 에러 0건.

---

### Phase 3 — 커스텀 프롬프트 연결
**commit**: `feat: wire custom style prompt input`

1. `uploadModal.js`: 스타일 선택이 `custom`일 때만 보이는 `<textarea id="dv-custom-prompt">` 추가. placeholder 예: `예) 모든 소제목을 질문형으로 쓰고, 마지막에 3줄 요약을 넣어줘`. 입력 시 `localStorage['dv_custom_prompt']` 저장, 열 때 복원.
2. `ai.js`: `buildPrompt(fname, fd, textOverride, styleDef, customPrompt)`로 시그니처 확장. `styleDef.id === 'custom'`일 때 `customPrompt`가 있으면 그것을 시스템 지시문으로 사용, 없으면 기존 generic fallback.
3. 호출부(업로드 변환 / 자유 입력 변환 / `viewer.js` 재변환) 모두 `localStorage['dv_custom_prompt']` 값을 전달.
4. i18n 키 추가 (KO/EN).

**완료 기준**: 커스텀 스타일 + 프롬프트 "모든 헤더를 물음표로 끝내라" 입력 → 출력의 헤더가 물음표로 끝남. 재변환에서도 동일 동작.

---

### Phase 4 — 청킹 파이프라인 (핵심)
**commit**: `feat: chunked conversion pipeline for long documents`

1. `ai.js`에 5.1~5.3 레퍼런스 코드 기반으로 `splitIntoChunks()`, `chunkDirective()`, `aiConvertChunked()` 추가. 기존 `aiConvert`는 `aiConvertSingle`로 리네임하고 `extraDirective`, `onDelta` 파라미터를 받도록 확장 (프롬프트 끝에 directive를 덧붙임).
2. **30,000자 절단 로직과 truncation 경고를 제거** (D8): `buildPrompt` 내 substring 분기, `main.js`의 "너무 길어 일부만 전송" toast.
3. 호출부 3곳(`main.js`의 `processFile`, 자유 텍스트 변환 경로, `viewer.js` 재변환)을 `aiConvertChunked`로 교체. `onProgress(i, n)`을 받아 진행 표시: KO `"청크 {i}/{n} 변환 중..."` / EN `"Converting chunk {i}/{n}..."`. 단일 청크(n=1)일 때는 기존 문구 유지.
4. `estimateConversion()` 갱신: `chunkCount = Math.ceil(totalChars / 24000)`을 계산해 확인 다이얼로그에 `예상 청크: N개` 표기, 출력 토큰 상한을 `8192 × N` 기준으로 보정.
5. 청크당 `max_tokens: 8192` 적용 (Claude/OpenAI 요청 바디, 프록시 기본값도 8192로).

**완료 기준**: 인수 테스트 T1, T2, T11 통과.

---

### Phase 5 — Claude 스트리밍
**commit**: `feat: SSE streaming for Claude conversion`

1. `api/claude.js`를 5.4 레퍼런스로 교체 (BYOK + passthrough 통합본).
2. `ai.js`의 Claude 분기를 5.5의 `claudeRequest()`로 교체. 변환 경로에서만 `stream: true` + `onDelta` 사용. (다른 프로바이더는 손대지 않음)
3. `uploadModal.js`: 진행바 아래 접이식 `<pre id="dv-stream-preview">` 추가. `onDelta(deltaText)`마다 `pre.textContent += deltaText` + 자동 스크롤. 새 청크 시작 시 구분선 텍스트 한 줄 append. 변환 완료/실패 시 초기화. (D10 — innerHTML 금지)
4. 재변환(`viewer.js`)은 스트리밍 미리보기 없이 `onDelta` 생략 가능 (완료 후 렌더만) — 스코프 최소화.

**완료 기준**: T3 통과. 배포 환경에서 스트리밍이 버퍼링되더라도(전부 한 번에 도착) 결과가 정상 저장·렌더되어야 함 — 듀얼 모드 확인.

---

### Phase 6 — 문서/가이드 마감
**commit**: `chore: docs & guide update for converter-only release`

- `README.md`, `USAGE.md`, 인앱 가이드에서 Supabase/클라우드 동기화/Q&A/폴더 서술 삭제.
- BYOK 전용임을 명시: "API 키는 브라우저에만 저장되며 서버는 키를 보관하지 않습니다."
- 긴 문서 청킹 변환을 기능으로 소개.
- 전체 인수 테스트(6장) 수행 → push → Vercel 배포 확인.

---

## 5. 핵심 구현 스펙 (레퍼런스 코드)

> 아래 코드는 스펙의 일부다. 변수명/스타일은 기존 코드베이스에 맞춰 조정해도 되지만 **로직·경계값·에러 처리는 그대로** 구현한다.

### 5.1 `splitIntoChunks` — 문단 경계 greedy packing
```js
const CHUNK_TARGET = 24000;

export function splitIntoChunks(text, target = CHUNK_TARGET) {
  if (!text || text.length <= target) return [text || ''];
  const paras = text.split(/\n{2,}/);
  const chunks = [];
  let buf = '';
  for (const p of paras) {
    const piece = p.trim();
    if (!piece) continue;
    if (piece.length > target) {
      // 빈 줄 없는 초장문 블록(대형 표 등): 줄바꿈 무시하고 강제 분할
      if (buf) { chunks.push(buf); buf = ''; }
      for (let i = 0; i < piece.length; i += target) {
        chunks.push(piece.slice(i, i + target));
      }
      continue;
    }
    if (buf.length + piece.length + 2 > target) {
      chunks.push(buf);
      buf = piece;
    } else {
      buf = buf ? buf + '\n\n' + piece : piece;
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}
```
표는 보통 빈 줄 없이 연속된 줄이므로 문단 분할에서 중간에 잘리지 않는다.

### 5.2 `chunkDirective` — 청크 위치별 지시문
```js
function chunkDirective(i, n, prevTail) {
  if (n === 1) return '';
  let d = `\n\n[CHUNK ${i + 1}/${n}] This is part ${i + 1} of ${n} of ONE document. Convert ONLY this part.`;
  if (i === 0) {
    d += ' Start the document normally (title/frontmatter allowed). Do NOT write a conclusion or closing summary.';
  } else if (i === n - 1) {
    d += ' Do NOT repeat the document title or frontmatter. Continue seamlessly from the previous part. You MAY write the closing section.';
  } else {
    d += ' Do NOT repeat the title/frontmatter. Do NOT write a conclusion. Continue seamlessly.';
  }
  if (prevTail) {
    d += `\n[PREVIOUS OUTPUT TAIL — continuity reference only, do NOT repeat it]:\n...${prevTail}`;
  }
  return d;
}
```

### 5.3 `aiConvertChunked` — 오케스트레이터
```js
export async function aiConvertChunked(fname, fd, textOverride, styleDef, signal, hooks = {}) {
  const { onProgress, onDelta, customPrompt } = hooks;
  const fullText = textOverride || fd.text || '';
  const chunks = splitIntoChunks(fullText);
  const out = [];
  for (let i = 0; i < chunks.length; i++) {
    if (signal?.aborted) throw new Error('Cancelled');
    onProgress?.(i + 1, chunks.length);
    const prevTail = i > 0 ? out[i - 1].slice(-400) : '';
    const directive = chunkDirective(i, chunks.length, prevTail);
    let md;
    try {
      md = await aiConvertSingle(fname, fd, chunks[i], styleDef, signal, directive, onDelta, customPrompt);
    } catch (e) {
      if (e.name === 'AbortError' || e.message === 'Cancelled') throw e;
      // 1회 재시도, 재실패 시 throw → 기존 per-file 실패 처리로 전파
      md = await aiConvertSingle(fname, fd, chunks[i], styleDef, signal, directive, onDelta, customPrompt);
    }
    out.push((md || '').trim());
  }
  return out.join('\n\n');
}
```
`aiConvertSingle` = 기존 `aiConvert` 리네임. `directive`는 `buildPrompt` 결과 끝에 append, `max_tokens: 8192`, Claude 분기만 `onDelta` 전달.

### 5.4 `api/claude.js` — BYOK + 스트리밍 passthrough (전체 교체본)
```js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required (BYOK). Settings에서 키를 설정하세요.' });
  }
  const { model, max_tokens, system, messages, stream } = req.body;

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-haiku-4-5',
        max_tokens: max_tokens || 8192,
        system,
        messages,
        stream: !!stream
      })
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return res.status(upstream.status).send(errText);
    }

    if (stream) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
      });
      for await (const chunk of upstream.body) res.write(chunk);
      return res.end();
    }

    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (error) {
    if (!res.headersSent) return res.status(500).json({ error: error.message });
    return res.end();
  }
}
```
`openai.js` / `gemini.js`는 env fallback 제거 + 401 처리만 적용 (스트리밍 없음).

### 5.5 클라이언트 듀얼 모드 요청 (`ai.js` Claude 분기)
```js
async function claudeRequest(body, signal, onDelta) {
  const h = { 'Content-Type': 'application/json' };
  if (S.ai.keys.claude) h['x-api-key'] = S.ai.keys.claude;

  const r = await fetch('/api/claude', {
    method: 'POST', headers: h, signal, body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`Claude Proxy ${r.status}: ${await r.text()}`);

  const ct = r.headers.get('content-type') || '';
  if (!ct.includes('text/event-stream')) {
    const d = await r.json();
    return d.content.map(b => b.text || '').join('');
  }

  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = '', full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop(); // 마지막 불완전 라인은 다음 루프로 이월
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      let ev;
      try { ev = JSON.parse(payload); } catch { continue; }
      if (ev.type === 'content_block_delta' && ev.delta?.text) {
        full += ev.delta.text;
        onDelta?.(ev.delta.text, full);
      } else if (ev.type === 'error') {
        throw new Error(ev.error?.message || 'Stream error');
      }
    }
  }
  return full;
}
```
변환 경로: `claudeRequest({ ...body, stream: true }, signal, onDelta)`. onDelta가 없거나 서버가 JSON으로 응답해도 동일하게 동작해야 한다(안전망).

---

## 6. 인수 테스트 (수동, Phase 6에서 전체 1회)

| # | 시나리오 | 통과 기준 |
|---|---------|----------|
| T1 | 50페이지+ PDF 업로드 → Claude 변환 | 절단 경고 없음. 출력에 원문 **마지막 페이지** 내용 포함. 청크 진행 표시(i/N) 노출 |
| T2 | 자유 입력에 60,000자 텍스트 붙여넣기 → 변환 | 3개 청크로 분할 변환, 병합 결과에 제목 중복 없음 |
| T3 | Claude로 변환 중 미리보기 | 텍스트가 점진적으로 append됨 (버퍼링 환경이면 일괄 도착해도 결과 정상) |
| T4 | 커스텀 스타일 + 프롬프트 입력 | 지시가 출력에 반영. 재변환에서도 동일 |
| T5 | API 키 미설정 상태에서 변환 | 401 → "키를 설정하세요" 안내 toast, 앱 크래시 없음 |
| T6 | 기존 문서 스타일 재변환 | 정상 동작 (청킹 경유) |
| T7 | .md 단건 내보내기 + ZIP 백업 | 정상 |
| T8 | KO ↔ EN 전환 | 새 UI 문자열 포함 전부 전환 |
| T9 | PWA 설치 후 오프라인에서 저장 문서 열람 | 정상 |
| T10 | `npm run build` 후 `grep -ri supabase dist/` | 0건 |
| T11 | 다청크 변환 중 취소 버튼 | 즉시 중단, 부분 문서 저장 안 됨, 이후 새 변환 정상 |

---

## 7. 작업 규칙

1. Phase 순서 고정. **phase당 정확히 1커밋**, 명시된 커밋 메시지 사용.
2. 매 커밋 전 `npm run build` 성공 필수.
3. 이 문서에 없는 기능 추가·리팩토링 금지. 발견한 무관 이슈는 `HANDOFF_NOTES.md`에 한 줄씩 기록.
4. 각 Phase 완료 시 다음 형식으로 보고: `✅ Phase N 완료 — 변경 파일 목록 / 완료 기준 확인 결과 / 특이사항`.
5. 완료 기준을 만족하지 못하면 다음 Phase로 넘어가지 않는다.
