# DocVault v0.5 — 구현 과정 및 사용 가이드

> **문서 버전**: v0.5.0  
> **작성일**: 2025-04-19  
> **상태**: P1 ~ P4 완료 · MVP 전체 완성  
> **파일**: `docvault.html` (단일 파일 · 외부 서버 불필요)  
> **이전 문서**: v0.4 가이드 참조 (P1~P3 상세 내용)

---

## 목차

1. [전체 개발 히스토리 요약](#1-전체-개발-히스토리-요약)
2. [v0.5 Priority 4 — Supabase 클라우드 동기화](#2-v05-priority-4--supabase-클라우드-동기화)
   - [설계 원칙](#21-설계-원칙)
   - [기술 스택 추가 사항](#22-기술-스택-추가-사항)
   - [데이터베이스 스키마](#23-데이터베이스-스키마)
   - [인증 시스템 구현](#24-인증-시스템-구현)
   - [데이터 동기화 계층](#25-데이터-동기화-계층)
   - [오프라인 우선 전략](#26-오프라인-우선-전략)
   - [로컬 → 클라우드 마이그레이션](#27-로컬--클라우드-마이그레이션)
3. [Supabase 프로젝트 설정 가이드](#3-supabase-프로젝트-설정-가이드)
4. [v0.5 사용 가이드](#4-v05-사용-가이드)
5. [전체 기능 레퍼런스](#5-전체-기능-레퍼런스)
6. [키보드 단축키 전체](#6-키보드-단축키-전체)
7. [로컬스토리지 구조 전체](#7-로컬스토리지-구조-전체)
8. [알려진 제한사항 및 해결방안](#8-알려진-제한사항-및-해결방안)
9. [전체 코드 수정 가이드](#9-전체-코드-수정-가이드)
10. [다음 단계 로드맵 (v0.6+)](#10-다음-단계-로드맵-v06)

---

## 1. 전체 개발 히스토리 요약

| 버전 | 주요 구현 | 상태 |
|------|-----------|------|
| **v0.1** | MVP: 파일 업로드 → Claude 변환 → Markdown 뷰어 · 인라인 편집 · 수정 로그 | ✅ |
| **v0.2** | 반응형 레이아웃 · 스프레드시트(xlsx/xls/ods) 지원 · 멀티 AI 엔진 (Claude/GPT-4o/Gemini/Local) | ✅ |
| **v0.3** | 변환 스타일 시스템 6종 (Dev/Blog/Official/Wiki/Report/Custom) · Warm Cream 테마 | ✅ |
| **v0.4** | P1 파일 다운로드·내보내기 · P2 localStorage 영속성 · P3 스타일 재변환 | ✅ |
| **v0.5** | P4 Supabase 인증 · 클라우드 DB · 실시간 동기화 · 오프라인 우선 · 마이그레이션 | ✅ |

---

## 2. v0.5 Priority 4 — Supabase 클라우드 동기화

### 2.1 설계 원칙

v0.5 구현의 핵심 제약조건은 **기존 로컬 사용자를 깨뜨리지 않는 것**입니다.

```
Supabase 미설정  →  기존 v0.4와 완전히 동일하게 동작 (localStorage 모드)
Supabase 설정됨  →  로그인 화면 → 클라우드 모드 자동 전환
클라우드 + 오프라인 → 로컬 큐에 저장 → 온라인 복귀 시 자동 flush
```

이를 위해 `SB` (Supabase) 객체를 완전히 독립 모듈로 분리하고, 기존 `persistToStorage` / `saveEdit` 함수를 **런타임 패치** 방식으로 확장했습니다. 기존 코드 수정 없이 클라우드 저장 레이어가 덧씌워지는 구조입니다.

---

### 2.2 기술 스택 추가 사항

```html
<!-- Supabase JS SDK v2 (UMD 빌드, CDN) -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
```

**SB 상태 객체**:
```javascript
const SB = {
  client: null,      // Supabase 클라이언트 인스턴스
  user: null,        // 현재 로그인 사용자 (auth.User)
  config: null,      // { url, key } — localStorage에서 복원
  syncStatus: 'off', // 'off' | 'ok' | 'syncing' | 'err'
  lastSync: null,    // 마지막 성공 동기화 시각
  channel: null,     // Realtime 채널 (향후 확장용)
  pendingSync: []    // 오프라인 중 큐에 쌓인 저장 요청
};
```

**저장 키**:

| localStorage 키 | 내용 |
|-----------------|------|
| `dv_ai` | AI 엔진 설정 |
| `dv_style` | 마지막 선택 변환 스타일 |
| `dv_docs_v1` | 문서 전체 (로컬 모드) |
| `dv_sb_config` | Supabase URL + Anon Key |

---

### 2.3 데이터베이스 스키마

Supabase SQL Editor에서 **한 번만** 실행하면 됩니다.

```sql
-- DocVault Schema
-- =====================================================

-- 변환된 Markdown 문서 테이블
create table if not exists public.dv_documents (
  id          text        primary key,         -- 앱 내부 ID (타임스탬프 기반)
  user_id     uuid        references auth.users(id) on delete cascade not null,
  name        text        not null,             -- 파일명 (예: report.md)
  raw_id      text,                             -- 원본 파일 ID
  raw_name    text,                             -- 원본 파일명
  raw_ext     text,                             -- 원본 확장자
  raw_content text,                             -- 원본 내용 (텍스트)
  content     text        not null,             -- 변환된 Markdown 내용
  style_id    text        default 'dev',        -- 변환 스타일 ID
  sheet_count int         default 0,            -- 스프레드시트 시트 수
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 수정 이력 테이블
create table if not exists public.dv_edit_logs (
  id          bigserial   primary key,
  doc_id      text        references public.dv_documents(id) on delete cascade,
  user_id     uuid        references auth.users(id) on delete cascade,
  msg         text,                             -- 수정 내용 요약
  delta       int         default 0,            -- 줄 수 변화
  after_text  text,                             -- 수정 후 내용
  created_at  timestamptz default now()
);

-- Row Level Security: 본인 문서만 접근 가능
alter table public.dv_documents enable row level security;
alter table public.dv_edit_logs  enable row level security;

create policy "users_own_docs" on public.dv_documents
  for all using (auth.uid() = user_id);

create policy "users_own_logs" on public.dv_edit_logs
  for all using (auth.uid() = user_id);

-- 성능 인덱스
create index if not exists idx_docs_user
  on public.dv_documents(user_id, updated_at desc);

create index if not exists idx_logs_doc
  on public.dv_edit_logs(doc_id, created_at desc);
```

**설계 포인트**:

- `id`를 `uuid` 대신 `text`로 지정 — 앱에서 타임스탬프 기반으로 생성한 ID를 그대로 사용하므로 클라이언트-서버 ID 충돌 없음
- `raw_content`를 별도 컬럼으로 분리 — 재변환 시 원본 소스 보존, 쿼리 시 내용 컬럼만 선택 가능
- `on delete cascade` — 사용자 계정 삭제 시 문서 자동 정리
- RLS 정책으로 서버 사이드에서 데이터 격리 보장

---

### 2.4 인증 시스템 구현

#### 초기화 흐름

```javascript
async function initSupabase() {
  // 1. localStorage에서 Supabase 설정 복원
  const cfg = localStorage.getItem('dv_sb_config');
  if (!cfg) return; // 미설정이면 로컬 모드로 유지

  // 2. Supabase 클라이언트 생성
  SB.client = supabase.createClient(cfg.url, cfg.key);

  // 3. 기존 세션 확인
  const { data: { session } } = await SB.client.auth.getSession();
  if (session?.user) {
    await onAuthSuccess(session.user); // 자동 로그인
  } else {
    // 로그인 화면 표시
    document.getElementById('auth-screen').style.display = 'flex';
  }

  // 4. 인증 상태 변화 구독 (OAuth 리디렉션, 토큰 갱신 처리)
  SB.client.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN') {
      document.getElementById('auth-screen').style.display = 'none';
      await onAuthSuccess(session.user);
    } else if (event === 'SIGNED_OUT') {
      onAuthSignOut();
    }
  });

  // 5. 네트워크 상태 감지
  window.addEventListener('online',  () => { hideOfflineBar(); flushPendingSync(); });
  window.addEventListener('offline', () => showOfflineBar());
}
```

#### 로그인 방식

**이메일/비밀번호**:
```javascript
async function authSubmit() {
  const { error } = await SB.client.auth.signInWithPassword({
    email: '이메일',
    password: '비밀번호'
  });
  if (error) showAuthMsg(error.message, 'err');
  // 성공 시 onAuthStateChange → SIGNED_IN 이벤트 자동 처리
}
```

**Google OAuth**:
```javascript
async function authGoogle() {
  await SB.client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href } // 현재 URL로 리디렉션
  });
}
```

> **중요**: Google OAuth는 Supabase 대시보드 Authentication → Providers → Google에서 활성화하고, Google Cloud Console에서 OAuth 2.0 클라이언트를 별도로 생성해야 합니다.

#### 인증 성공 후 처리

```javascript
async function onAuthSuccess(user) {
  SB.user = user;
  updateUserUI(user);                      // 아바타 이니셜 표시
  setSyncStatus('syncing', '데이터 로딩 중...');
  await dbLoadAll();                       // 클라우드에서 문서 전체 로드
  setSyncStatus('ok', '동기화됨');

  // 로컬에 문서가 있고 클라우드가 비어있으면 이전 배너 표시
  const local = localStorage.getItem('dv_docs_v1');
  if (local) {
    const d = JSON.parse(local);
    if (d.md?.length > 0 && S.md.length === 0) {
      document.getElementById('migrate-bar').classList.add('show');
    }
  }
}
```

---

### 2.5 데이터 동기화 계층

#### 문서 저장 (Upsert)

```javascript
async function dbSaveDoc(mf, rawDoc) {
  if (!SB.client || !SB.user) {
    // 오프라인이면 큐에 추가
    if (!navigator.onLine) {
      SB.pendingSync.push({ mf, rawDoc });
      return;
    }
    return;
  }

  setSyncStatus('syncing', '저장 중...');
  try {
    const { error } = await SB.client
      .from('dv_documents')
      .upsert({
        id:           mf.id,
        user_id:      SB.user.id,
        name:         mf.name,
        raw_id:       mf.rawId,
        raw_name:     rawDoc?.name || null,
        raw_ext:      rawDoc?.ext  || null,
        raw_content:  rawDoc?.content || null,
        content:      mf.content,
        style_id:     mf.styleId || 'dev',
        sheet_count:  mf.cnt || 0,
        updated_at:   new Date().toISOString()
      }, { onConflict: 'id' }); // 같은 ID면 업데이트
    if (error) throw error;
    setSyncStatus('ok', '동기화됨');
  } catch(e) {
    setSyncStatus('err', '저장 실패');
    toast('☁️ 클라우드 저장 실패 (로컬에는 저장됨)', 'err');
  }
}
```

**Upsert 선택 이유**: `insert` + `update` 두 번 대신 한 번의 요청으로 생성/갱신을 처리합니다. `onConflict: 'id'`로 중복 시 자동 업데이트.

#### 수정 로그 저장

```javascript
async function dbSaveLog(docId, logEntry) {
  if (!SB.client || !SB.user) return;
  await SB.client.from('dv_edit_logs').insert({
    doc_id:     docId,
    user_id:    SB.user.id,
    msg:        logEntry.msg,
    delta:      logEntry.delta || 0,
    after_text: logEntry.after || ''
  });
}
```

#### 전체 문서 로드

```javascript
async function dbLoadAll() {
  // 1. 문서 목록 로드 (최신 수정 순)
  const { data: docs } = await SB.client
    .from('dv_documents')
    .select('*')
    .eq('user_id', SB.user.id)
    .order('updated_at', { ascending: false });

  // 2. 수정 로그 로드
  const { data: logs } = await SB.client
    .from('dv_edit_logs')
    .select('*')
    .in('doc_id', docs.map(d => d.id))
    .order('created_at', { ascending: false });

  // 3. 앱 상태에 매핑
  S.raw = docs.map(d => ({
    id: d.raw_id || d.id,
    name: d.raw_name || d.name,
    ext: d.raw_ext || 'txt',
    content: d.raw_content || '',
    size: (d.raw_content || '').length,
    uploadedAt: new Date(d.created_at)
  }));
  S.md = docs.map(d => ({
    id: d.id, name: d.name, rawId: d.raw_id || d.id,
    content: d.content, styleId: d.style_id || 'dev',
    cnt: d.sheet_count || 0, createdAt: new Date(d.created_at)
  }));
  S.logs = {};
  S.md.forEach(m => {
    S.logs[m.id] = logs
      .filter(l => l.doc_id === m.id)
      .map(l => ({ ts: new Date(l.created_at), msg: l.msg, delta: l.delta, after: l.after_text }));
  });

  renderRaw(); renderMd();
  if (S.md.length) openDoc(S.md[0]);
}
```

#### 런타임 패치 (기존 함수 확장)

기존 `persistToStorage`와 `saveEdit`을 수정하지 않고 런타임에 덮어써서 클라우드 저장을 추가합니다:

```javascript
// persistToStorage 패치 — 로컬 저장 후 클라우드도 저장
const _origPersist = persistToStorage;
persistToStorage = function() {
  _origPersist(); // 기존 localStorage 저장 유지
  if (SB.client && SB.user && S.md.length) {
    const mf  = S.md[S.md.length - 1]; // 가장 최근 추가된 문서
    const raw = S.raw.find(r => r.id === mf.rawId);
    dbSaveDoc(mf, raw); // 비동기 클라우드 저장 (await 없이 fire-and-forget)
  }
};

// saveEdit 패치 — 수정 저장 시 로그도 클라우드에 기록
const _origSaveEdit = saveEdit;
saveEdit = function() {
  _origSaveEdit(); // 기존 로컬 저장 + 로그 기록 유지
  if (SB.client && SB.user && S.activeDoc) {
    const mf  = S.activeDoc;
    const raw = S.raw.find(r => r.id === mf.rawId);
    const log = (S.logs[mf.id] || [])[0]; // 가장 최근 로그
    dbSaveDoc(mf, raw);
    if (log) dbSaveLog(mf.id, log);
  }
};
```

---

### 2.6 오프라인 우선 전략

```
네트워크 상태        동작
────────────────────────────────────────────────────
온라인 + 로그인     → dbSaveDoc() 즉시 실행
오프라인 + 로그인   → pendingSync 배열에 큐 추가
                      localStorage에는 정상 저장
온라인 복귀         → window 'online' 이벤트
                      → flushPendingSync() 실행
                      → 큐에 쌓인 문서 일괄 저장
```

```javascript
async function flushPendingSync() {
  if (!SB.pendingSync.length) return;
  const queue = [...SB.pendingSync];
  SB.pendingSync = []; // 큐 초기화 (재시도 방지)
  for (const { mf, rawDoc } of queue) {
    await dbSaveDoc(mf, rawDoc);
  }
  toast(`☁️ 오프라인 중 ${queue.length}개 문서 동기화 완료`, 'ok');
}
```

---

### 2.7 로컬 → 클라우드 마이그레이션

v0.4 이전에 로컬로 쌓아온 문서를 클라우드로 이전하는 기능입니다.

```javascript
async function migrateLocalToCloud() {
  const local = localStorage.getItem('dv_docs_v1');
  if (!local) return;
  const d = JSON.parse(local);
  if (!d.md?.length) return;

  showPb(`☁️ 로컬 ${d.md.length}개 문서를 클라우드로 이전 중...`);

  let ok = 0;
  for (const mf of d.md) {
    const raw = (d.raw || []).find(r => r.id === mf.rawId);
    await dbSaveDoc(
      { ...mf, createdAt: new Date(mf.createdAt) },
      raw
    );
    ok++;
  }

  hidePb();
  toast(`✅ ${ok}개 문서가 클라우드로 이전됨`, 'ok');
  await dbLoadAll(); // 클라우드에서 다시 로드하여 UI 갱신
}
```

**트리거 시점**: 로그인 성공 후 로컬에 문서가 있고 클라우드가 비어있을 때 상단 배너로 자동 안내합니다.

---

## 3. Supabase 프로젝트 설정 가이드

### 3.1 Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) 접속 → **Start your project** 클릭
2. GitHub 계정으로 가입 또는 이메일 가입
3. **New project** 클릭
4. 설정 입력:
   - **Name**: `docvault` (자유롭게)
   - **Database Password**: 안전한 비밀번호 설정 (저장해두기)
   - **Region**: `Northeast Asia (Seoul)` 추천
5. 프로젝트 생성 대기 (약 1~2분)

### 3.2 API 키 확인

1. 프로젝트 대시보드 → 좌측 메뉴 **Settings** → **API**
2. 두 가지 값을 복사해둡니다:
   - **Project URL**: `https://xxxxxxxxxxxx.supabase.co`
   - **anon public** key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

> ⚠️ `service_role` key는 절대 사용하지 마세요. 브라우저에서 노출되면 보안 위험입니다.

### 3.3 데이터베이스 테이블 생성

1. 좌측 메뉴 **SQL Editor** 클릭
2. **New query** 클릭
3. DocVault 앱에서 `☁️ Connect` → `📋 SQL 복사` 버튼 클릭
4. 복사된 SQL을 SQL Editor에 붙여넣기
5. **Run** (또는 `Ctrl+Enter`) 클릭
6. 하단에 `Success. No rows returned` 확인

### 3.4 DocVault에 연결

1. DocVault 앱 타이틀바의 `☁️ Connect` 버튼 클릭
2. **PROJECT URL** 입력: `https://xxxxxxxxxxxx.supabase.co`
3. **ANON (PUBLIC) KEY** 입력
4. **🔌 연결 테스트** 버튼 클릭 → `✅ 연결 성공` 확인
5. **✅ 저장 및 연결** 클릭
6. 로그인 화면이 나타나면 설정 완료

### 3.5 Google OAuth 설정 (선택사항)

1. Supabase 대시보드 → **Authentication** → **Providers**
2. **Google** 찾아서 활성화 토글
3. [Google Cloud Console](https://console.cloud.google.com) 접속
4. **새 프로젝트** 생성 → **API 및 서비스** → **OAuth 동의 화면** 구성
5. **사용자 인증 정보** → **OAuth 2.0 클라이언트 ID** 생성
   - 유형: 웹 애플리케이션
   - 승인된 리디렉션 URI: `https://xxxxxxxxxxxx.supabase.co/auth/v1/callback`
6. 생성된 **클라이언트 ID**와 **클라이언트 보안 비밀**을 Supabase Google 설정에 입력
7. 저장

### 3.6 이메일 인증 설정 (선택사항)

기본적으로 Supabase는 회원가입 시 이메일 인증 링크를 발송합니다.

개발/테스트 환경에서 이메일 인증을 건너뛰려면:
1. Authentication → **Email** → **Confirm email** 비활성화

---

## 4. v0.5 사용 가이드

### 4.1 최초 설정 흐름

```
① docvault.html 파일을 브라우저에서 열기
② 타이틀바 [☁️ Connect] 버튼 클릭
③ Supabase URL + Anon Key 입력
④ [📋 SQL 복사] → Supabase SQL Editor에 붙여넣기 → Run
⑤ [🔌 연결 테스트] → 성공 확인
⑥ [✅ 저장 및 연결] 클릭
⑦ 로그인 화면에서 이메일 가입 또는 Google 로그인
⑧ 완료 — 이후 모든 문서가 자동으로 클라우드에 저장됨
```

### 4.2 로그인 없이 사용

Supabase 설정이 없거나, 로그인 화면에서 "로그인 없이 로컬에서 사용하기"를 클릭하면 기존 v0.4와 동일하게 localStorage 모드로 동작합니다. 언제든지 나중에 클라우드로 전환할 수 있습니다.

### 4.3 멀티 디바이스 사용

**PC에서 작업 → 태블릿에서 이어보기**:
1. 두 기기 모두에서 `docvault.html` 열기
2. 같은 Supabase 설정 입력 (또는 동일 계정 로그인)
3. 로그인 완료 시 클라우드에서 자동으로 문서 동기화
4. 한 기기에서 저장하면 다른 기기에서 새로고침 시 반영

> 현재는 실시간 실시간 푸시가 아닌 로드 시 동기화입니다. 실시간 멀티 커서는 v0.6 예정.

### 4.4 동기화 상태 확인

타이틀바에 작은 점으로 현재 동기화 상태를 표시합니다:

| 색상 | 의미 |
|------|------|
| 🟢 초록 | 동기화됨 |
| 🟡 노랑 (깜빡임) | 동기화 중 |
| 🔴 빨강 | 동기화 오류 |
| ⚫ 회색 | 클라우드 비활성 (로컬 모드) |

점 클릭 또는 아바타 클릭 → 계정 메뉴에서 마지막 동기화 시각, 수동 동기화 버튼 확인 가능.

### 4.5 로컬 문서 클라우드 이전

1. Supabase 설정 후 로그인
2. 상단에 초록 배너 표시: `📦 로컬에 저장된 문서가 있습니다`
3. `☁️ 클라우드로 이전` 클릭
4. 진행 배너가 표시되며 전체 문서 업로드
5. 완료 후 클라우드 데이터로 재로드

### 4.6 로그아웃

1. 타이틀바 아바타 클릭 → 계정 메뉴
2. `🚪 로그아웃` 클릭
3. 로그인 화면으로 돌아감 (로컬 데이터는 유지)

---

## 5. 전체 기능 레퍼런스

### 5.1 문서 변환 파이프라인

```
파일 선택 (드래그 or 클릭)
    ↓
변환 스타일 선택 (6종 + Custom)
    ↓
AI 엔진 선택 (Claude / GPT-4o / Gemini / Local)
    ↓
buildPrompt() → 스타일별 시스템 프롬프트 구성
    ↓
aiConvert() → AI API 호출 (max_tokens: 1000)
    ↓
S.md[]에 저장 → persistToStorage() → localStorage 저장
                                   → dbSaveDoc() → Supabase 저장
    ↓
openDoc() → parseMd() → HTML 렌더링
```

### 5.2 변환 스타일 6종 요약

| 아이콘 | ID | 이름 | 최적 입력 | 핵심 특징 |
|--------|-----|------|-----------|-----------|
| ⚙️ | `dev` | Developer Docs | 코드/API 메모 | 코드 블록, 배지, CLI, 파라미터 테이블 |
| ✍️ | `blog` | Blog Post | 아이디어/경험 | 훅 오프닝, SEO H1, TL;DR, CTA |
| 📘 | `doc` | Official Docs | 정책/절차서 | YAML 헤더, 번호 헤딩, RFC 용어 |
| 🧠 | `wiki` | Knowledge Wiki | 학습 노트/회의록 | frontmatter, [[wikilinks]], callouts |
| 📊 | `report` | Report/Analysis | 스프레드시트/데이터 | Executive Summary, KPI 테이블, ➤ 인사이트 |
| 🎛️ | `custom` | Custom | 모든 문서 | 직접 시스템 프롬프트 작성 |

### 5.3 AI 엔진 4종 비교

| 엔진 | 기본 모델 | 별도 키 | 특징 |
|------|-----------|---------|------|
| Claude | Sonnet 4 | 불필요\* | 기본값, 한국어 최고 품질 |
| GPT-4o | gpt-4o | 필수 | 범용 고성능 |
| Gemini | 1.5 Pro | 필수 | 무료 티어 있음 |
| Local | 사용자 지정 | 선택 | Ollama/LM Studio 등 |

\* claude.ai 환경에서는 기본 API 프록시 사용. 자체 키 입력 시 직접 호출.

### 5.4 내보내기 옵션

툴바 `⬇️ Export` 버튼 또는 `Ctrl+D`:

| 옵션 | 출력 형식 | 용도 |
|------|-----------|------|
| `.md 다운로드` | `.md` 파일 | 로컬 저장, 에디터에서 열기 |
| `Markdown 복사` | 클립보드 | Notion, 에디터 직접 붙여넣기 |
| `Obsidian 내보내기` | frontmatter 포함 `.md` | Obsidian Vault에 드롭 |
| `전체 번들 다운로드` | 모든 문서 묶음 `.md` | 전체 백업 |

---

## 6. 키보드 단축키 전체

| 단축키 | 동작 | 조건 |
|--------|------|------|
| `Ctrl+S` / `Cmd+S` | 현재 편집 저장 | 편집 모드 |
| `Ctrl+E` / `Cmd+E` | Preview ↔ Edit 토글 | 문서 열림 |
| `Ctrl+D` / `Cmd+D` | 현재 문서 `.md` 다운로드 | 문서 열림 |
| `Ctrl+R` / `Cmd+R` | 재변환 모달 열기 | 문서 열림 |
| `Esc` | 열린 모달 모두 닫기 | 항상 |

---

## 7. 로컬스토리지 구조 전체

```
localStorage
├── dv_ai          ← AI 엔진 설정
│   {
│     provider: "claude",
│     keys: { claude: "", gpt4: "", gemini: "", local: "" },
│     models: { claude: "claude-sonnet-4-20250514", ... },
│     localUrl: ""
│   }
│
├── dv_style       ← 마지막 선택 변환 스타일 ID
│   "dev"
│
├── dv_sb_config   ← Supabase 연결 설정
│   {
│     url: "https://xxxx.supabase.co",
│     key: "eyJ..."
│   }
│
└── dv_docs_v1     ← 문서 전체 데이터 (로컬 모드 또는 오프라인 캐시)
    {
      raw: [
        {
          id: "1713456789012",
          name: "report.xlsx",
          ext: "xlsx",
          content: "=== Sheet: Sheet1 ===\n...",
          size: 24576,
          uploadedAt: "2025-04-19T10:00:00.000Z"
        }
      ],
      md: [
        {
          id: "md_1713456789012",
          name: "report.md",
          rawId: "1713456789012",
          content: "# Report\n\n...",
          styleId: "report",
          cnt: 3,
          createdAt: "2025-04-19T10:00:05.000Z"
        }
      ],
      logs: {
        "md_1713456789012": [
          {
            ts: "2025-04-19T10:05:00.000Z",
            msg: "Edit: report.md",
            delta: 2,
            after: "수정된 내용..."
          }
        ]
      },
      ts: 1713456900000,
      lite: false   ← true면 raw.content 생략된 경량 저장
    }
```

---

## 8. 알려진 제한사항 및 해결방안

| 항목 | 현재 상태 | 해결 방법 |
|------|-----------|-----------|
| 실시간 다중 기기 동기화 | 로드 시 동기화 (새로고침 필요) | v0.6: Supabase Realtime 구독 |
| PDF 텍스트 추출 | 파일명 기반 컨텍스트만 전달 | v0.6: PDF.js 연동 |
| DOCX 텍스트 추출 | 텍스트 인코딩 의존 | v0.6: mammoth.js 연동 |
| AI 응답 최대 길이 | max_tokens: 1000 | 코드에서 직접 수정 가능 |
| 대용량 파일 (>2MB) | 토큰 한도로 일부만 전달 | 청크 분할 처리 예정 |
| 오프라인 최초 로드 | CDN 폰트/라이브러리 필요 | 브라우저 캐시 활용 or 로컬 번들링 |
| Google OAuth CORS | `file://` 프로토콜에서 미동작 | 로컬 서버 (`python3 -m http.server`) 사용 |
| 동시 편집 충돌 | Last-write-wins (마지막 저장 우선) | v0.6: OT/CRDT 기반 병합 |

---

## 9. 전체 코드 수정 가이드

| 수정 목적 | 찾을 위치 | 변경 내용 |
|-----------|-----------|-----------|
| AI 응답 토큰 늘리기 | `aiConvert()` 내 `max_tokens: 1000` | 원하는 값으로 변경 (비용 증가) |
| 변환 스타일 추가 | `STYLES` 배열 | 새 객체 추가 (`id`, `name`, `icon`, `cls`, `color`, `desc`, `tags`, `prompt`) |
| 기본 변환 스타일 변경 | `S.selectedStyle: 'dev'` | 원하는 스타일 ID로 변경 |
| 색상 테마 변경 | CSS `:root` 변수 | `--acc`, `--bg-base` 등 변경 |
| localStorage 용량 한도 | `MAX_STORAGE_CHARS = 4_500_000` | 원하는 값으로 변경 |
| 수정 로그 보존 개수 | `persistToStorage()` 내 `.slice(0, 5)` | 원하는 개수로 변경 |
| 사이드바 기본 너비 | CSS `--sb: clamp(180px, 20vw, 280px)` | 원하는 범위로 변경 |
| Supabase 테이블명 변경 | `SETUP_SQL`, `dbLoadAll()`, `dbSaveDoc()` | 3곳 모두 일관되게 변경 |
| 파일 입력 허용 확장자 | HTML `<input id="fi" accept="...">` | 원하는 확장자 추가/제거 |

---

## 10. 다음 단계 로드맵 (v0.6+)

### Priority 5 — 전문 검색

```
목표: 쌓인 문서에서 원하는 내용 즉시 찾기

구현 예정:
  - Ctrl+F 전문 검색 (문서 제목 + 내용)
  - 검색어 하이라이팅
  - 태그 기반 필터링 (Wiki 스타일 #tags)
  - 변환 스타일 기반 필터링
  - 최근 문서 / 즐겨찾기
  - Supabase Full Text Search (FTS) 활용

예상 추가 코드: ~150줄
```

### Priority 6 — 실시간 동기화 + PDF/DOCX 완전 지원

```
구현 예정:
  - Supabase Realtime 채널 구독
    → 같은 계정 다른 기기에서 저장 시 즉시 반영
  - PDF.js 연동 → PDF 텍스트 실제 추출
  - mammoth.js 연동 → DOCX 완전 파싱
  - 이미지 포함 문서 → Claude Vision API 활용

예상 추가 코드: ~200줄
```

### Priority 7 — AI 문서 Q&A

```
목표: 열린 문서에 대해 AI에게 질문

구현 예정:
  - 문서 하단 채팅 패널
  - "이 문서 요약해줘" / "3번 항목 설명해줘"
  - "이 내용으로 이메일 초안 써줘"
  - 멀티 문서 컨텍스트 (여러 문서를 동시에 참조)
  - 대화 이력 저장

예상 추가 코드: ~250줄
```

---

## 부록 A — 로컬 개발 환경 설정

```bash
# docvault.html이 있는 폴더에서 실행
$ python3 -m http.server 8080
# → http://localhost:8080/docvault.html

# 또는 Node.js
$ npx serve .
# → http://localhost:3000/docvault.html
```

> Google OAuth는 반드시 `http://` 또는 `https://` 서버 환경에서 실행해야 합니다. `file://` 프로토콜에서는 OAuth 리디렉션이 차단됩니다.

---

## 부록 B — Supabase 무료 티어 한도

| 리소스 | 무료 한도 | DocVault 예상 사용량 |
|--------|-----------|---------------------|
| Database 용량 | 500 MB | 문서 10,000개 ≈ ~50 MB |
| API 요청 | 500,000 / 월 | 일반 사용 충분 |
| Auth 사용자 | 50,000 명 | 개인/팀 충분 |
| Storage | 1 GB | 현재 미사용 |
| 프로젝트 수 | 2개 | 충분 |

> 개인 또는 소규모 팀 사용 시 무료 티어로 충분합니다.

---

## 부록 C — 전체 버전별 변경사항

```
v0.1.0  MVP 출시
        + 파일 업로드 (txt/pdf/md/docx/csv/json)
        + Claude API 변환
        + Markdown 뷰어 (자체 파서)
        + 인라인 편집 모드
        + 수정 이력 + 버전 복원

v0.2.0  반응형 & 확장
        + 반응형 레이아웃 (데스크탑/태블릿/모바일)
        + 사이드바 드래그 리사이즈
        + 스프레드시트 지원 (xlsx/xls/ods via SheetJS)
        + 멀티 AI 엔진 (GPT-4o/Gemini/Local 추가)
        + API Key 설정 모달

v0.3.0  변환 스타일 시스템
        + 6종 변환 스타일 프리셋
        + 스타일별 전용 시스템 프롬프트
        + Custom 프롬프트 직접 입력
        + 🔍 Preview Prompt 기능
        + Warm Cream (#FFF9E3) 테마
        + Obsidian callouts/wikilinks/하이라이트 렌더링

v0.4.0  영속성 & 내보내기
        + localStorage 자동 저장/복원
        + .md 파일 다운로드
        + 클립보드 복사
        + Obsidian 호환 내보내기
        + 전체 번들 다운로드
        + 재변환 (스타일 전환)
        + 저장소 사용량 표시

v0.5.0  클라우드 동기화
        + Supabase Auth (이메일 + Google OAuth)
        + PostgreSQL 클라우드 DB
        + 자동 동기화 (저장 시마다)
        + 오프라인 우선 (큐 + flush)
        + 로컬 → 클라우드 마이그레이션
        + 동기화 상태 표시 (타이틀바 점)
        + 계정 메뉴 (수동 동기화 / 로그아웃)
```

---

*DocVault MVP — P1~P4 완료 · 단일 HTML 파일 · Made with Claude*
