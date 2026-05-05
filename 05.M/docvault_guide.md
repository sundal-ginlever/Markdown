# DocVault v0.4 — 구현 과정 및 사용 가이드

> **문서 버전**: v0.4.0  
> **작성일**: 2025-04-19  
> **상태**: P1 ~ P3 완료 · 로컬 완전 동작  
> **파일**: `docvault.html` (단일 파일 · 외부 서버 불필요)

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택 및 아키텍처](#2-기술-스택-및-아키텍처)
3. [단계별 구현 과정](#3-단계별-구현-과정)
   - [v0.1 — MVP 기반 구축](#v01--mvp-기반-구축)
   - [v0.2 — 반응형·스프레드시트·멀티 AI](#v02--반응형스프레드시트멀티-ai)
   - [v0.3 — 변환 스타일 시스템](#v03--변환-스타일-시스템)
   - [v0.4 — P1 내보내기 + P2 영속성 + P3 재변환](#v04--p1-내보내기--p2-영속성--p3-재변환)
4. [UI 구조 설명](#4-ui-구조-설명)
5. [변환 스타일 가이드](#5-변환-스타일-가이드)
6. [AI 엔진 설정 가이드](#6-ai-엔진-설정-가이드)
7. [기능별 사용 가이드](#7-기능별-사용-가이드)
8. [키보드 단축키](#8-키보드-단축키)
9. [데이터 저장 구조](#9-데이터-저장-구조)
10. [지원 파일 형식](#10-지원-파일-형식)
11. [알려진 제한사항](#11-알려진-제한사항)
12. [다음 단계 로드맵](#12-다음-단계-로드맵)

---

## 1. 프로젝트 개요

DocVault는 **문서를 업로드하면 AI가 자동으로 구조화된 Markdown으로 변환**해주는 로컬 문서 관리 도구입니다.

### 핵심 컨셉

```
원본 파일 (txt/pdf/xlsx/docx...) 
    ↓  AI 변환 (용도별 스타일 선택)
구조화된 Markdown 
    ↓  브라우저 내 편집
최종 결과물 (.md 파일 / 클립보드)
```

### 설계 원칙

- **단일 HTML 파일**: 설치 불필요. 파일 하나를 브라우저에서 열면 즉시 실행
- **외부 의존성 최소화**: SheetJS(CDN), Google Fonts(CDN) 외 모든 로직 내장
- **점진적 발전**: 로컬 → localStorage → Supabase 클라우드 순서로 단계별 확장
- **AI 엔진 교체 가능**: Claude, GPT-4o, Gemini, 로컬 LLM 중 선택

---

## 2. 기술 스택 및 아키텍처

### 사용 기술

| 구분 | 기술 | 역할 |
|------|------|------|
| 런타임 | Vanilla JavaScript (ES2022+) | 전체 앱 로직 |
| 스타일 | CSS Variables + Flexbox | 반응형 레이아웃 |
| 폰트 | JetBrains Mono, Syne, DM Sans | UI 타이포그래피 |
| 스프레드시트 | SheetJS 0.18.5 (CDN) | xlsx/xls/ods 파싱 |
| 기본 AI | Anthropic Claude API | 문서 변환 |
| 저장소 | Browser localStorage | 문서 영속성 (P2) |
| 내보내기 | Blob API + URL.createObjectURL | 파일 다운로드 (P1) |

### 앱 상태 구조 (State)

```javascript
const S = {
  raw: [],          // 원본 파일 메타데이터 배열
  md: [],           // 변환된 Markdown 문서 배열
  logs: {},         // 문서별 수정 이력 { [docId]: [...] }
  activeDoc: null,  // 현재 열린 문서 객체
  mode: 'view',     // 'view' | 'edit'
  logOpen: false,   // 수정 로그 패널 열림 여부
  pendingFile: null, // 업로드 대기 중인 파일
  selectedStyle: 'dev', // 선택된 변환 스타일 ID
  secOpen: { raw: true, md: true }, // 섹션 접힘 상태
  ai: {
    provider: 'claude', // 'claude' | 'gpt4' | 'gemini' | 'local'
    keys: { claude:'', gpt4:'', gemini:'', local:'' },
    models: { claude:'claude-sonnet-4-20250514', ... },
    localUrl: ''
  }
};
```

### 데이터 흐름

```
[파일 선택] → readFile() → [원본 텍스트 추출]
    ↓
[스타일 선택] → buildPrompt() → [AI 시스템 프롬프트 구성]
    ↓
aiConvert() → [AI API 호출] → [Markdown 텍스트 반환]
    ↓
[S.md 배열에 저장] → persistToStorage() → [localStorage 기록]
    ↓
openDoc() → parseMd() → [HTML 렌더링] → [화면 표시]
```

---

## 3. 단계별 구현 과정

### v0.1 — MVP 기반 구축

**목표**: 파일 업로드 → Claude 변환 → 화면 표시의 최소 파이프라인

**구현 내용**:
- 좌측 사이드바 (Raw Files / Markdown 섹션 상하 분할)
- 우측 메인 뷰어 (Markdown 렌더링)
- 파일 업로드 모달 (드래그 앤 드롭 포함)
- Claude API 연동 (`/v1/messages` 엔드포인트)
- 인라인 편집 모드 (Preview ↔ Edit 토글)
- 수정 이력 로그 패널 (버전 복원 포함)
- 기본 Markdown 파서 (자체 구현 — 외부 라이브러리 미사용)

**핵심 코드 — 기본 Markdown 파서**:
```javascript
function parseMd(s) {
  // 코드 블록 → 헤딩 → 강조 → 인라인 코드 → 테이블 → 리스트 순서로 치환
  s = s.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, l, c) =>
    `<pre><code class="lang-${l}">${c.trim()}</code></pre>`);
  s = s.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  // ... (이하 생략)
  return s;
}
```

---

### v0.2 — 반응형·스프레드시트·멀티 AI

**목표**: 다양한 디바이스 지원, Excel 파일 처리, AI 엔진 교체

**구현 내용**:

#### 반응형 레이아웃

CSS `clamp()` 함수로 사이드바 너비를 뷰포트 비율로 제어:

```css
:root {
  --sb: clamp(180px, 20vw, 280px); /* 최소 180px, 최대 280px, 기본 20vw */
}
```

| 화면 크기 | 동작 |
|-----------|------|
| 1200px 이상 | 사이드바 22vw, 로그 패널 22vw, 3단 레이아웃 |
| 900px ~ 1200px | 사이드바 축소, 상태바 숨김 |
| 600px ~ 900px | AI 레이블 숨김, 키 버튼 아이콘만 |
| 600px 미만 | 사이드바 → 드로어 오버레이(position:fixed) |
| 380px 미만 | 업로드 버튼 아이콘만, AI 선택 숨김 |

사이드바 너비 드래그 리사이즈:
```javascript
function initRsz() {
  const r = document.getElementById('rsz');
  const sb = document.getElementById('sb');
  let drag = false, sx = 0, sw = 0;
  r.addEventListener('mousedown', e => {
    drag = true; sx = e.clientX; sw = sb.offsetWidth;
    document.body.style.cssText = 'cursor:col-resize;user-select:none';
  });
  document.addEventListener('mousemove', e => {
    if (!drag) return;
    sb.style.width = Math.max(140, Math.min(400, sw + e.clientX - sx)) + 'px';
  });
}
```

#### 스프레드시트 파싱 (SheetJS)

```javascript
async function parseSheet(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => {
      const wb = XLSX.read(e.target.result, { type: 'binary' });
      const sheets = {};
      wb.SheetNames.forEach(n => {
        sheets[n] = XLSX.utils.sheet_to_json(wb.Sheets[n], {
          header: 1,    // 배열 형태로 반환
          defval: '',   // 빈 셀 처리
          raw: false    // 원시값 대신 포맷된 문자열
        });
      });
      res({ names: wb.SheetNames, sheets });
    };
    r.readAsBinaryString(file); // SheetJS는 BinaryString 필요
  });
}
```

시트 데이터를 텍스트로 직렬화:
```javascript
function sheetsToText(d) {
  let o = '';
  d.names.forEach(n => {
    o += `\n=== Sheet: ${n} ===\n`;
    d.sheets[n].forEach(row => { o += row.join('\t') + '\n'; });
  });
  return o;
}
```

#### 멀티 AI 엔진 분기

```javascript
async function aiConvert(fname, fd) {
  const p = S.ai.provider;
  const prompt = buildPrompt(fname, fd);

  if (p === 'claude') {
    // Anthropic API — 앱 내 프록시로 별도 키 없이도 동작
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: S.ai.models.claude, max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }] })
    });
    const d = await res.json();
    return d.content.map(b => b.text || '').join('');
  }

  if (p === 'gpt4') {
    // OpenAI API — 별도 키 필수
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${S.ai.keys.gpt4}` },
      body: JSON.stringify({ model: S.ai.models.gpt4,
        messages: [{ role: 'user', content: prompt }] })
    });
    const d = await res.json();
    return d.choices[0].message.content;
  }

  if (p === 'gemini') { /* ... Google AI API ... */ }
  if (p === 'local')  { /* ... OpenAI 호환 엔드포인트 ... */ }
}
```

---

### v0.3 — 변환 스타일 시스템

**목표**: 동일 문서를 용도에 맞는 형식으로 변환

**구현 내용**:

#### 스타일 정의 구조

```javascript
const STYLES = [
  {
    id: 'dev',
    name: 'Developer Docs',
    icon: '⚙️',
    cls: 'style-dev',       // CSS 클래스 (색상 테마)
    color: '#15803D',        // 뱃지·하이라이트 색상
    desc: 'Code-first. README, API refs, changelogs.',
    tags: ['README', 'API', 'changelog', 'code blocks'],
    prompt: (fname, ext, isSheet, sheetCount) => `...시스템 프롬프트...`
  },
  // ... 5개 프리셋 + 1 커스텀
];
```

각 스타일의 `prompt` 함수는 파일명, 확장자, 스프레드시트 여부, 시트 수를 받아 **해당 용도에 최적화된 시스템 프롬프트**를 동적으로 생성합니다.

#### CSS 색상 시스템 (CSS Custom Properties 활용)

```css
.style-dev   { --sc: #15803D }
.style-blog  { --sc: #C2410C }
.style-doc   { --sc: #1D4ED8 }
.style-wiki  { --sc: #7C3AED }
.style-report{ --sc: #B45309 }
.style-custom{ --sc: #0F766E }

/* 선택 상태: --sc 색상 기반 동적 배경 */
.sc.sel {
  border-color: var(--sc, var(--acc));
  background: color-mix(in srgb, var(--sc) 6%, var(--bg-base));
}
```

#### 프롬프트 빌더

```javascript
function buildPrompt(fname, fd) {
  const st = getStyleDef();    // 현재 선택된 스타일 객체
  const ext = fname.split('.').pop().toLowerCase();
  const isSh = fd.type === 'sheet';

  let systemPrompt = '';
  if (st.id === 'custom') {
    // 사용자가 직접 입력한 프롬프트 사용
    systemPrompt = document.getElementById('custom-prompt').value.trim()
      || 'Convert the following document to clean, structured Markdown.';
  } else {
    // 스타일별 프리셋 프롬프트
    systemPrompt = st.prompt(fname, ext, isSh, fd.cnt);
  }

  return `${systemPrompt}\n\n---\nCONTENT TO CONVERT:\n${fd.text.substring(0, 9500)}\n---`;
}
```

#### 색상 테마 (Warm Cream Palette)

`#FFF9E3` 기반 따뜻한 크림 팔레트:

```css
:root {
  --bg-base:  #FFF9E3;  /* 메인 배경 — 따뜻한 파치먼트 */
  --bg-panel: #FEF3C4;  /* 사이드바/타이틀바 — 소프트 앰버 */
  --bg-surf:  #FFFDF5;  /* 카드/모달 — 거의 흰색 따뜻함 */
  --bg-hov:   #FEF9D3;  /* 호버 — 연한 레몬 */
  --bg-act:   #FDEEA0;  /* 선택됨 — 따뜻한 골드 */
  --bdr:      #E2D08A;  /* 구분선 — 따뜻한 샌드 */
  --acc:      #C2410C;  /* 포인트 — 번트 오렌지 */
  --t1:       #1C1405;  /* 본문 — 거의 검정 따뜻함 */
  --t2:       #57460C;  /* 보조 텍스트 — 따뜻한 갈색 */
  --t3:       #A08C3A;  /* 힌트 텍스트 — 뮤트 골드 */
}
```

---

### v0.4 — P1 내보내기 + P2 영속성 + P3 재변환

**목표**: 새로고침 후에도 문서 유지, 파일 다운로드, 스타일 전환

---

#### P1 — 다운로드 & 내보내기

**현재 문서 `.md` 다운로드**:
```javascript
function downloadMd(docId) {
  const f = docId ? S.md.find(m => m.id === docId) : S.activeDoc;
  if (!f) { toast('열려있는 문서가 없습니다', 'err'); return; }

  const blob = new Blob([f.content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = f.name;  // 파일명 그대로 사용
  a.click();
  URL.revokeObjectURL(url);  // 메모리 해제
}
```

**전체 문서 번들 다운로드**:
```javascript
function downloadAllMd() {
  let bundle = `# DocVault Export Bundle\n# Generated: ${new Date().toLocaleString('ko-KR')}\n\n`;
  S.md.forEach((f, i) => {
    bundle += `${'='.repeat(60)}\n# FILE ${i + 1}: ${f.name}\n${'='.repeat(60)}\n\n${f.content}\n\n`;
  });
  // ... Blob 다운로드
}
```

**Obsidian 호환 내보내기**:
```javascript
function exportToObsidian() {
  let content = S.activeDoc.content;
  // frontmatter가 없으면 자동 추가
  if (!content.startsWith('---')) {
    content = `---\ntitle: "${S.activeDoc.name.replace('.md', '')}"\ntags: [docvault, ${S.activeDoc.styleId}]\ncreated: ${new Date().toISOString().split('T')[0]}\n---\n\n${content}`;
  }
  // ... Blob 다운로드
}
```

---

#### P2 — localStorage 영속성

**저장 키 구조**:

```
localStorage
├── dv_ai        → AI 엔진 설정 (provider, keys, models)
├── dv_style     → 마지막 선택한 변환 스타일 ID
└── dv_docs_v1   → 전체 문서 데이터 (JSON)
```

**`dv_docs_v1` JSON 구조**:
```json
{
  "raw": [
    {
      "id": "1713456789012",
      "name": "report.xlsx",
      "ext": "xlsx",
      "content": "=== Sheet: Sheet1 ===\n...",
      "size": 24576,
      "uploadedAt": "2025-04-19T10:00:00.000Z"
    }
  ],
  "md": [
    {
      "id": "md_1713456789012",
      "name": "report.md",
      "rawId": "1713456789012",
      "content": "# Report\n\n...",
      "styleId": "report",
      "cnt": 3,
      "createdAt": "2025-04-19T10:00:05.000Z"
    }
  ],
  "logs": {
    "md_1713456789012": [
      {
        "ts": "2025-04-19T10:05:00.000Z",
        "msg": "Edit: report.md",
        "delta": 2,
        "after": "# Report\n\n수정된 내용..."
      }
    ]
  },
  "ts": 1713456900000
}
```

**용량 초과 대응 (4.5MB 임계치)**:
```javascript
function persistToStorage() {
  const logsSlim = {}; // 로그는 최근 5개만
  Object.keys(S.logs).forEach(k => {
    logsSlim[k] = (S.logs[k] || []).slice(0, 5)
      .map(l => ({ ts: l.ts, msg: l.msg, delta: l.delta, after: l.after }));
  });

  const payload = JSON.stringify({ raw: S.raw, md: S.md, logs: logsSlim });

  if (payload.length > 4_500_000) {
    // Raw 원본 내용 제외 (메타만 유지) → 용량 대폭 절감
    const rawLite = S.raw.map(r => ({ id: r.id, name: r.name, ext: r.ext, size: r.size }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ raw: rawLite, md: S.md, logs: logsSlim, lite: true }));
  } else {
    localStorage.setItem(STORAGE_KEY, payload);
  }
}
```

**복원 시점**: 앱 초기화 시 자동 복원. 저장된 데이터가 있으면 데모 건너뜀.
```javascript
(function() {
  // ...설정 복원...
  if (!restoreFromStorage()) loadDemo(); // 저장 데이터 없을 때만 데모
})();
```

---

#### P3 — 재변환 (스타일 전환)

**핵심 로직**:
```javascript
async function doReconvert() {
  if (!S.activeDoc) return;
  const st = getStyleDef(); // 새로 선택한 스타일

  // 1. 원본 Raw 파일 내용 우선 사용 (없으면 현재 MD를 소스로)
  const rawDoc = S.raw.find(r => r.id === S.activeDoc.rawId);
  const sourceText = rawDoc?.content || S.activeDoc.content;

  // 2. 기존 내용을 수정 로그에 보존
  S.logs[S.activeDoc.id].unshift({
    ts: new Date(),
    msg: `Reconvert: ${oldStyle.icon}${oldStyleId} → ${st.icon}${st.id}`,
    before: S.activeDoc.content,
    after: null, // 아직 미완성
    delta: 0
  });

  // 3. AI 재변환 실행
  const fd = { type: 'text', text: sourceText, cnt: S.activeDoc.cnt || 0 };
  const mdc = await aiConvert(S.activeDoc.name, fd);

  // 4. 문서 업데이트 + 스타일 ID 변경
  S.activeDoc.content = mdc;
  S.activeDoc.styleId = S.selectedStyle;

  // 5. 저장 및 화면 갱신
  persistToStorage();
  renderMd();
  openDoc(S.activeDoc);
}
```

**재변환 동작 보장**:
- 원본 Raw 파일이 있으면 항상 그것으로 재변환 (MD→MD 변환 품질 저하 방지)
- 재변환 전 기존 MD는 수정 로그에 자동 백업 (언제든 복원 가능)
- 재변환 후 스타일 배지가 즉시 업데이트됨

---

## 4. UI 구조 설명

```
┌─────────────────────────────────────────────────────────┐
│  TITLEBAR                                               │
│  DocVault v0.4 │ ☰ │ AI ENGINE [select] │ 🔑 │ ⊕Upload │
├──────────┬──────────────────────────────────┬───────────┤
│ SIDEBAR  │  DOC TOOLBAR                     │  LOG BAR  │
│          │  path › doc.md [style] 👁 ✏️ ⬇️ 📋│ (토글)    │
│ 📁 RAW   ├──────────────────────────────────┤           │
│ ─────── │  [변환 중 배너]                   │ 수정 기록 │
│ file.txt │                                  │ ─────── │
│ data.xlsx│  MAIN CONTENT AREA               │ 2025-04  │
│          │  (Markdown 렌더링 or 에디터)      │ Edit: ... │
│ 🗒 MD   │                                  │ +3 lines  │
│ ─────── │                                  │           │
│ file.md  │                                  │           │
│ data.md  │                                  │           │
│          │                                  │           │
│ [⬇️ 🗑] │                                  │           │
└──────────┴──────────────────────────────────┴───────────┘
```

### 각 영역 설명

**타이틀바 (Titlebar)**
- 앱 로고 + 버전
- `☰` 모바일 사이드바 토글
- AI 엔진 선택 드롭다운 + API Key 설정 버튼
- AI 연결 상태 표시 (초록/노랑 점)
- `⊕ Upload` 업로드 버튼

**좌측 사이드바 (Sidebar)**
- `📁 Raw Files`: 업로드된 원본 파일 목록 (클릭 시 해당 MD 파일로 이동)
- `🗒 Markdown`: 변환된 MD 파일 목록 (스타일 아이콘 뱃지 포함)
- 하단 footer: `⬇️ Export` 전체 내보내기 / `🗑` 전체 초기화
- 리사이저 드래그로 너비 조절 (140px ~ 400px)

**문서 툴바 (Doc Toolbar)**
- 파일 경로 브레드크럼 (`docvault / md / 파일명`)
- 현재 스타일 배지 (클릭 → 재변환 모달)
- `👁 Preview` / `✏️ Edit` 모드 전환
- `💾 Save` (편집 모드에서만 표시)
- `⬇️ Export` 내보내기 모달
- `📋 Log` 수정 이력 패널 토글

**메인 영역 (Main Area)**
- Preview 모드: Markdown을 HTML로 렌더링
- Edit 모드: 모노스페이스 텍스트에어리어 에디터
- 변환 중 노란 배너 표시

**우측 로그 패널 (Log Bar)**
- `📋 Log` 버튼으로 토글
- 문서별 수정/재변환 이력
- 각 항목 클릭 → 해당 버전으로 복원 (confirm 팝업)

---

## 5. 변환 스타일 가이드

### ⚙️ Developer Docs — 개발자 문서

**최적 입력**: API 메모, 기술 사양서, 설정 파일 설명, 코드 주석

**출력 구조**:
```
# 프로젝트명

![badges]

## Overview
## Prerequisites / Requirements
## Installation / Quick Start
## Usage
## Configuration (파라미터 테이블)
## API Reference
## Examples
## Changelog
```

**특징**:
- 모든 명령어, 경로, 환경변수를 코드 블록으로 감싸기
- CLI 명령어 앞에 `$` 접두사
- 파라미터/설정값 테이블로 정리
- 기술적 · 정확한 · 간결한 문체
- 마케팅 문구, 결론 섹션 없음

**예시 변환**:
```
입력: "API 키는 환경변수 OPENAI_KEY에 설정. 기본 모델은 gpt-4o."

출력:
## Configuration
| Key | Default | Description |
|-----|---------|-------------|
| `OPENAI_KEY` | required | OpenAI API 인증 키 |
| `MODEL` | `gpt-4o` | 사용할 모델명 |

\```bash
export OPENAI_KEY=sk-your-key-here
\```
```

---

### ✍️ Blog Post — 블로그 포스팅

**최적 입력**: 아이디어 메모, 인터뷰 내용, 연구 결과, 경험 정리

**출력 구조**:
```
[훅 문장 — 제목 전]
# SEO 최적화 제목 (~60자)

> TL;DR: 핵심 요약

## Introduction
## Section 1 (H2)
## Section 2 (H2)
...
## Conclusion
[CTA — 선택사항]
```

**특징**:
- 첫 문장이 훅 (질문, 통계, 대담한 주장)
- 대화체 · 1~2인칭 · 짧고 긴 문장 혼합
- 핵심 인사이트는 blockquote로 강조
- 이모지 1~2개 최대
- "이 글에서는~" 같은 진부한 도입 금지

---

### 📘 Official Docs — 공식 문서

**최적 입력**: 내부 정책, 절차서, 규격 문서, 계약서, 제안서

**출력 구조**:
```
\```
Document: 제목
Version:  1.0.0
Status:   Draft
Date:     YYYY-MM-DD
Author:   —
\```

# 1. Executive Summary
# 2. Scope & Purpose
# 3. Definitions
# 4. Main Content
  ## 4.1 ...
  ## 4.2 ...
# 5. Appendix
# 6. References
```

**특징**:
- YAML 스타일 메타데이터 블록 (코드 펜스 내)
- 번호 매기기 헤딩으로 추적 가능성 확보
- RFC 2119 용어 (`shall`, `must`, `should`) 사용
- 3인칭 · 격식체 · 수동태 허용
- 경고/주의는 blockquote 사용

---

### 🧠 Knowledge Wiki — 지식 위키

**최적 입력**: 개념 정리, 학습 노트, 회의록, 아이디어 연결

**출력 구조**:
```yaml
---
title: "문서 제목"
tags: [tag1, tag2]
created: YYYY-MM-DD
type: note | concept | reference | process
related: []
---

한 줄 요약

## Context
## Main Content
## Key Concepts
## Related Topics
## References

#tag1 #tag2
```

**특징**:
- YAML frontmatter (Obsidian/Notion 호환)
- `[[Topic Name]]` 위키링크 스타일
- Obsidian callouts: `> [!NOTE]`, `> [!TIP]`, `> [!WARNING]`
- `==하이라이트==` 핵심 정의 강조
- 파일 하단 `#태그` 라인
- 백과사전적이나 개인적인 문체

---

### 📊 Report / Analysis — 보고서 & 분석

**최적 입력**: 스프레드시트, 데이터 파일, 실적 자료, 설문 결과

**출력 구조**:
```
# 보고서 제목

## Executive Summary (3~5개 핵심 bullet)

## Context
## Methodology
## Findings
  ### Finding 1 — [데이터 테이블]
  ### Finding 2 — [데이터 테이블]
## Insights & Analysis (➤ 접두사)
## Recommendations
## Appendix
```

**특징**:
- Executive Summary 필수 (3~5개 bullet)
- 모든 수치는 테이블로 제시
- 인사이트에 `➤` 접두사
- 트렌드 방향 기호 `↑ ↓ →`
- KPI/핵심 수치는 blockquote 강조
- 3인칭 · 근거 기반 · 수치화

---

### 🎛️ Custom — 완전 자유형

시스템 프롬프트를 직접 작성합니다. `🔍 Preview Prompt` 버튼으로 프롬프트 전문 확인 및 복사 가능.

**작성 예시**:
```
당신은 교육 콘텐츠 전문가입니다.

다음 문서를 초등학생도 이해할 수 있는 
학습 자료 형식으로 변환해주세요.

규칙:
- 어려운 용어는 쉬운 말로 풀어서 설명
- 각 섹션에 핵심 질문 추가
- 예시와 비유 적극 활용
- 요약 박스 포함
- Markdown만 출력, 설명 없이
```

---

## 6. AI 엔진 설정 가이드

타이틀바의 `🔑 API Key` 버튼을 클릭하면 설정 모달이 열립니다.

### Claude (Anthropic) — 기본값

별도 키 없이도 claude.ai 환경에서 동작합니다.

자체 키를 사용하려면:
1. [console.anthropic.com](https://console.anthropic.com) 접속
2. API Keys 메뉴 → Create Key
3. `sk-ant-api03-...` 형태의 키 복사 → 입력

**모델 선택 기준**:
| 모델 | 특징 | 추천 용도 |
|------|------|-----------|
| Claude Sonnet 4 | 속도와 품질 균형 | 일반 문서 변환 (기본값) |
| Claude Opus 4.5 | 최고 품질, 느림 | 복잡한 보고서·공식 문서 |
| Claude Haiku 4.5 | 가장 빠름, 저비용 | 간단한 메모·빠른 초안 |

### GPT-4o (OpenAI)

1. [platform.openai.com](https://platform.openai.com) 접속
2. API Keys → Create new secret key
3. `sk-...` 형태 키 입력

> ⚠️ OpenAI 키는 사용량에 따라 과금됩니다.

### Gemini (Google)

1. [aistudio.google.com](https://aistudio.google.com) 접속
2. Get API Key 클릭
3. `AIza...` 형태 키 입력

> ℹ️ Gemini 1.5 Flash는 무료 티어 한도 내에서 무료 사용 가능.

### Local / Custom (Ollama, LM Studio 등)

OpenAI 호환 엔드포인트를 지원하는 어떤 로컬 서버도 연결 가능합니다.

**Ollama 예시**:
```bash
# Ollama 설치 후 모델 실행
$ ollama pull llama3.1
$ ollama serve  # 기본 포트: 11434
```

설정 모달에 입력:
- **Endpoint URL**: `http://localhost:11434/v1/chat/completions`
- **Model Name**: `llama3.1`

**LM Studio 예시**:
- **Endpoint URL**: `http://localhost:1234/v1/chat/completions`
- **Model Name**: LM Studio에서 로드한 모델명

> ⚠️ 로컬 서버는 CORS 설정이 필요할 수 있습니다.

---

## 7. 기능별 사용 가이드

### 문서 업로드 및 변환

1. 타이틀바 `⊕ Upload` 버튼 클릭 (또는 메인 화면 드롭존에 파일 드래그)
2. 파일 선택 또는 드래그 앤 드롭
3. 우측 패널에서 **변환 스타일** 선택
   - 처음이라면 `⚙️ Developer Docs` 또는 `📊 Report / Analysis` 추천
4. `🔍 Preview Prompt` 클릭 → AI에게 전달될 프롬프트 미리 확인 (선택사항)
5. `⚡ Convert` 버튼 클릭
6. 변환 완료 후 오른쪽 메인 영역에 Markdown이 표시됨

**팁**: 같은 파일을 여러 스타일로 변환하고 싶으면 `P3 재변환` 기능을 사용하세요. 매번 업로드할 필요 없습니다.

---

### 문서 편집

1. 문서 열린 상태에서 툴바 `✏️ Edit` 버튼 클릭 (또는 `Ctrl+E`)
2. 우측에 Markdown 에디터가 열림
3. 직접 수정
4. `💾 Save` 버튼 (또는 `Ctrl+S`) → 저장과 동시에 수정 이력 기록
5. `👁 Preview` 버튼으로 결과 확인

**주의**: Save 없이 모드를 전환하면 변경사항이 사라집니다.

---

### 수정 이력 관리

1. 툴바 `📋 Log` 버튼 → 우측에 수정 이력 패널 슬라이드 오픈
2. 이력 목록: 날짜/시간, 변경 내용 요약, 줄 수 변화 표시
3. 특정 이력 클릭 → 복원 확인 팝업 → 확인 시 해당 버전으로 복원

**이력 기록 시점**:
- 편집 후 Save
- 재변환 실행 (이전 내용 자동 보존)

---

### 스타일 재변환 (P3)

1. 문서 열린 상태에서 툴바의 **스타일 배지** 클릭 (예: `⚙️ Developer Docs`)
2. 재변환 모달에서 새 스타일 선택
3. `⚡ 재변환 실행` 클릭
4. AI가 원본 파일로부터 새 스타일로 재변환
5. 기존 내용은 수정 로그에 자동 보존

**예시 활용 시나리오**:
- 사내 보고서를 `📘 Official Docs`로 변환 → 공유용 블로그는 `✍️ Blog Post`로 재변환
- API 노트를 `⚙️ Dev Docs`로 변환 → 팀 위키에 올릴 때 `🧠 Wiki`로 재변환

---

### 내보내기 (P1)

툴바 `⬇️ Export` 버튼 클릭:

| 옵션 | 설명 |
|------|------|
| **⬇️ .md 다운로드** | 현재 문서를 `.md` 파일로 저장 |
| **📋 Markdown 복사** | 내용을 클립보드에 복사 (Notion, 에디터에 바로 붙여넣기) |
| **🔮 Obsidian 내보내기** | YAML frontmatter 포함 Obsidian 호환 `.md` 파일 |
| **⬇️ 전체 번들** | 모든 문서를 하나의 `.md` 파일로 묶어 다운로드 |

**사이드바 하단 버튼**:
- `⬇️ Export` — 전체 내보내기 모달 오픈
- `🗑` — 저장된 모든 문서 초기화

---

### 스프레드시트 업로드

xlsx, xls, ods 파일 업로드 시 자동으로 시트별 분리 처리됩니다.

**처리 흐름**:
```
.xlsx 업로드
  → SheetJS로 시트별 배열 추출
  → 탭 구분 텍스트로 직렬화
  → AI에 전달 (시트 수 정보 포함)
  → 스타일별 최적화 변환
    (Report 스타일 → 각 시트가 H2 섹션 + 테이블)
```

**추천 스타일**: 스프레드시트에는 `📊 Report / Analysis`가 최적입니다.

---

## 8. 키보드 단축키

| 단축키 | 동작 |
|--------|------|
| `Ctrl+S` (또는 `Cmd+S`) | 편집 모드에서 저장 |
| `Ctrl+E` (또는 `Cmd+E`) | Preview / Edit 모드 전환 |
| `Ctrl+D` (또는 `Cmd+D`) | 현재 문서 `.md` 즉시 다운로드 |
| `Ctrl+R` (또는 `Cmd+R`) | 재변환 모달 열기 |
| `Esc` | 열린 모달 모두 닫기 |

---

## 9. 데이터 저장 구조

### 저장 위치

모든 데이터는 **브라우저 localStorage**에 저장됩니다. 서버 전송 없음.

```
브라우저 DevTools → Application → Local Storage
├── dv_ai        (AI 설정)
├── dv_style     (마지막 선택 스타일)
└── dv_docs_v1   (문서 전체 데이터)
```

### 용량 관리

| 상황 | 대응 |
|------|------|
| 4.5MB 미만 | 전체 데이터 저장 (Raw 원본 포함) |
| 4.5MB 이상 | Raw 원본 내용 제외, 메타만 저장 (`lite: true`) |
| 용량 초과 오류 | 콘솔에 경고, 저장 실패 |

**저장 안전 한도**: localStorage는 브라우저별로 5~10MB 제한. 문서가 많아지면 Export로 백업 후 `🗑 초기화` 권장.

### 데이터 백업 권장 시점

- 중요한 문서 변환 후
- 문서가 10개 이상 쌓였을 때
- `⬇️ 전체 번들 다운로드`로 정기 백업

---

## 10. 지원 파일 형식

| 확장자 | 분류 | 처리 방식 |
|--------|------|-----------|
| `.txt` | 텍스트 | FileReader로 직접 읽기 |
| `.md` | Markdown | FileReader로 직접 읽기 |
| `.csv` | 데이터 | FileReader로 직접 읽기 |
| `.json` | 데이터 | FileReader로 직접 읽기 |
| `.xlsx` | 스프레드시트 | SheetJS 파싱 |
| `.xls` | 스프레드시트 | SheetJS 파싱 |
| `.ods` | 스프레드시트 | SheetJS 파싱 |
| `.pdf` | 문서 | 파일명 기반 컨텍스트 전달\* |
| `.docx` | 문서 | FileReader + 텍스트 추출\* |

> \* PDF와 DOCX는 현재 바이너리 파싱 없이 파일명과 힌트를 AI에 전달하는 방식으로 처리됩니다. 완전한 텍스트 추출은 Phase 2에서 PDF.js / mammoth.js 연동으로 개선 예정입니다.

---

## 11. 알려진 제한사항

| 항목 | 현재 상태 | 개선 계획 |
|------|-----------|-----------|
| 새 브라우저/기기 | 문서 없음 (localStorage는 브라우저 한정) | Phase 2: Supabase 클라우드 |
| PDF 내용 추출 | 파일명 기반만 | Phase 2: PDF.js 연동 |
| DOCX 내용 추출 | 텍스트 인코딩에 의존 | Phase 2: mammoth.js 연동 |
| 이미지 포함 문서 | 이미지 무시 | Phase 3: 비전 API 활용 |
| 대용량 파일 (>10MB) | 토큰 한도 초과 가능 | 청크 분할 처리 예정 |
| AI 응답 최대 길이 | `max_tokens: 1000` 제한 | 필요시 직접 수정 가능 |
| 오프라인 사용 | CDN 폰트/라이브러리 필요 | 로컬 번들링 예정 |

---

## 12. 다음 단계 로드맵

### Phase 2 — Supabase 클라우드 (Priority 4)

```
목표: 어떤 디바이스에서도 내 문서에 접근

구현 내용:
  - Supabase Auth (이메일/Google OAuth)
  - Documents 테이블 (id, user_id, name, style_id, content, created_at)
  - Edit Logs 테이블 (id, doc_id, before, after, delta, ts)
  - 실시간 WebSocket 동기화 (Supabase Realtime)
  - localStorage → Supabase 마이그레이션 자동화
  - 오프라인 우선 (write-ahead log → 온라인 시 sync)

예상 추가 코드: ~300줄
```

### Phase 3 — 전문 검색 (Priority 5)

```
목표: 쌓인 문서에서 원하는 내용 즉시 찾기

구현 내용:
  - 실시간 전문 검색 (문서 제목 + 내용)
  - 검색어 하이라이팅
  - 태그 기반 필터링
  - 스타일 기반 필터링
  - 최근 문서 / 즐겨찾기

예상 추가 코드: ~150줄
```

### Phase 4 — AI 문서 Q&A (Priority 6)

```
목표: 열린 문서에 대해 AI에게 질문

구현 내용:
  - "이 문서 요약해줘"
  - "3번 항목 설명해줘"
  - "이 내용을 이메일로 써줘"
  - 멀티 문서 컨텍스트

예상 추가 코드: ~200줄
```

---

## 부록 — 개발 환경 설정

### 로컬 실행

별도 설치 없이 `docvault.html` 파일을 브라우저에서 직접 열면 됩니다.

```bash
# macOS
open docvault.html

# Windows
start docvault.html

# Linux
xdg-open docvault.html
```

### 개발 서버로 실행 (권장)

일부 브라우저에서 `file://` 프로토콜로 열 때 CORS 제한이 있을 수 있습니다.

```bash
# Python 기본 서버
python3 -m http.server 8080
# → http://localhost:8080/docvault.html

# Node.js (npx 필요)
npx serve .
# → http://localhost:3000/docvault.html
```

### 코드 수정 포인트

| 수정 목적 | 파일 위치 |
|-----------|-----------|
| AI 시스템 프롬프트 튜닝 | JS `STYLES` 배열 내 `prompt` 함수 |
| 색상 테마 변경 | CSS `:root` 변수 |
| 최대 응답 토큰 조정 | `aiConvert()` 내 `max_tokens: 1000` |
| 저장 용량 한도 조정 | `MAX_STORAGE_CHARS = 4_500_000` |
| 수정 로그 보존 개수 | `persistToStorage()` 내 `.slice(0, 5)` |
| 사이드바 기본 너비 | CSS `--sb: clamp(180px, 20vw, 280px)` |

---

*DocVault — Built to grow · Made with Claude*
