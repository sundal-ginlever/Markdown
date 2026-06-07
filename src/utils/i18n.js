/**
 * Internationalization (I18N) Module
 */
import { S } from '../state/store.js';

export const I18N = {
  cur: localStorage.getItem('dv_lang') || 'ko',
  ko: {
    logo: 'DocVault',
    upload_btn: '문서 업로드',
    api_key_btn: 'API 키 설정',
    sync_btn: '클라우드',
    qa_btn: 'AI 질문',
    export_btn: '내보내기',
    style_sel_lbl: 'AI 엔진',
    search_ph: '문서 검색...',
    new_doc: '새 문서',
    empty_md: '변환된 문서가 없습니다',
    empty_raw: '원본 파일이 없습니다',
    sec_raw: '원본 파일',
    sec_md: '변환된 문서',
    tab_preview: '👁 미리보기',
    tab_edit: '✏️ 편집',
    tab_save: '💾 저장',
    tab_log: '📋 기록',
    wlc_ttl: 'DocVault에 오신 것을 환영합니다',
    wlc_sub: '파일을 드래그하거나 클릭하여 AI 변환을 시작하세요.',
    dz_txt: '여기에 파일을 드롭하여 변환',
    dz_sub: 'PDF, Word, TXT, CSV 등을 지원합니다.',
    mo_up_ttl: '업로드 및 변환',
    mo_up_sub: '파일을 선택하고 AI 스타일을 지정하세요.',
    mo_up_drop: '파일 선택 또는 드래그',
    mo_style_ttl: '변환 스타일',
    mo_key_ttl: 'AI 제공자 설정',
    mo_key_sub: 'API 키는 브라우저에 안전하게 로컬 저장됩니다.',
    mo_export_ttl: '내보내기',
    mo_export_sub: '문서를 다운로드하거나 복사합니다.',
    qa_empty_ttl: '이 문서에 대해 궁금한 점을 물어보세요',
    qa_input_ph: '질문을 입력하세요... (Enter 전송)',
    status_ready: '준비됨',
    status_proc: '처리 중...',
    toast_saved: '저장됨',
    toast_deleted: '삭제됨',
    toast_copied: '복사됨',
    toast_err: '오류 발생',
    toast_no_doc: '열려있는 문서가 없습니다',
    toast_copy_fail: '복사 실패 (권한 확인)',
    conf_clear: '모든 저장된 문서를 삭제할까요?\n(원본 + 변환 MD + 수정 기록)',
    export_bundle: '개 문서 묶음 다운로드됨',
    export_obsidian: 'Obsidian 형식으로 내보내기 완료',
    status_restore: '개 문서 복원됨',
    mo_reconv_ttl: '🔄 스타일 재변환',
    mo_reconv_sub: '같은 원본으로 다른 Markdown 스타일을 생성합니다. 기존 내용은 수정 기록에 보존됩니다.',
    btn_cancel: '취소',
    btn_close: '닫기',
    btn_save: '💾 저장',
    btn_clear: '🗑 전체 초기화',
    btn_install: '⬇️ 설치',
    btn_copy_my: '📋 내 문서로 복사',
    pwa_msg: '📱 앱으로 설치하면 오프라인에서도 사용할 수 있습니다',
    shared_msg: '🔗 공유된 문서입니다 — ',
    offline_msg: '⚡ 오프라인 모드 — 인터넷 연결 시 자동으로 클라우드에 동기화됩니다',
    login: '로그인',
    signup: '회원가입',
    status_nokey: ' · 키 없음',
    aria_logo: 'DocVault 로고',
    aria_upload: '문서 업로드 및 변환',
    aria_keys: 'AI API 키 설정',
    aria_sync: '클라우드 동기화 설정',
    aria_ko: '한국어로 전환',
    aria_en: '영어인 전환',
    aria_search: '문서 검색',
    aria_export: '문서 내보내기',
    aria_clear: '전체 문서 삭제',
    aria_resize: '사이드바 크기 조절',
    aria_qa_toggle: 'AI 질의응답 패널 토글',
    aria_qa_expand: '질의응답 패널 확대/축소',
    aria_qa_clear: '대화 기록 초기화',
    aria_qa_send: '질문 전송',
    aria_close: '닫기',
    btn_new_folder: '📁 새 폴더',
    mo_folder_ttl: '폴더 관리',
    mo_folder_name: '폴더 이름',
    uncategorized: '미분류 문서',
    move_to_folder: '폴더로 이동',
    conf_del_folder: '폴더를 삭제할까요? (내부 문서는 삭제되지 않고 미분류로 이동합니다)',
    aria_clear_search: '검색 초기화',
    aria_copy: '클립보드 복사',
    aria_delete: '문서 삭제',
    aria_filter_all: '전체 필터',
    aria_filter_blog: '블로그 필터',
    aria_filter_custom: '커스텀 필터',
    aria_filter_dev: '개발 문서 필터',
    aria_filter_doc: '공식 문서 필터',
    aria_filter_report: '보고서 필터',
    aria_filter_wiki: '위키 필터',
    aria_install: '앱 설치',
    aria_later: '나중에',
    aria_live: '실시간 동기화 활성',
    aria_migrate: '클라우드로 마이그레이션',
    aria_new_folder: '새 폴더 만들기',
    aria_next_hl: '다음 검색 결과',
    aria_prev_hl: '이전 검색 결과',
    aria_qa_input: '질문 입력',
    aria_share: '문서 공유',
    aria_sort: '정렬 방식 선택',
    aria_tag_add: '태그 추가',
    aria_user: '사용자 정보'
  },
  en: {
    logo: 'DocVault',
    upload_btn: 'Upload Doc',
    api_key_btn: 'API Key',
    sync_btn: 'Cloud',
    qa_btn: 'Q&A',
    export_btn: 'Export',
    style_sel_lbl: 'AI Engine',
    search_ph: 'Search docs...',
    new_doc: 'New Doc',
    empty_md: 'No converted docs',
    empty_raw: 'No source files',
    sec_raw: 'Raw Files',
    sec_md: 'Converted Docs',
    tab_preview: '👁 Preview',
    tab_edit: '✏️ Edit',
    tab_save: '💾 Save',
    tab_log: '📋 Log',
    wlc_ttl: 'Welcome to DocVault',
    wlc_sub: 'Drag or click to start AI conversion.',
    dz_txt: 'Drop files here to convert',
    dz_sub: 'Supports PDF, Word, TXT, CSV, etc.',
    mo_up_ttl: 'Upload & Convert',
    mo_up_sub: 'Select file and choose AI style.',
    mo_up_drop: 'Select or drag file',
    mo_style_ttl: 'Conversion Style',
    mo_key_ttl: 'AI Provider Settings',
    mo_key_sub: 'API keys are stored locally in your browser.',
    mo_export_ttl: 'Export',
    mo_export_sub: 'Download or copy documents.',
    qa_empty_ttl: 'Ask about this document',
    qa_input_ph: 'Type your question... (Enter to send)',
    status_ready: 'Ready',
    status_proc: 'Processing...',
    toast_saved: 'Saved',
    toast_deleted: 'Deleted',
    toast_copied: 'Copied',
    toast_err: 'Error occurred',
    toast_no_doc: 'No document is open',
    toast_copy_fail: 'Copy failed (Check permissions)',
    conf_clear: 'Delete all saved documents?\n(Raw files + Converted MD + Edit history)',
    export_bundle: 'docs bundle downloaded',
    export_obsidian: 'Exported for Obsidian',
    status_restore: 'docs restored',
    mo_reconv_ttl: '🔄 Reconvert Style',
    mo_reconv_sub: 'Generate a different Markdown style from the same source. Old content is kept in history.',
    btn_cancel: 'Cancel',
    btn_close: 'Close',
    btn_save: '💾 Save',
    btn_clear: '🗑 Clear All',
    btn_install: '⬇️ Install',
    btn_copy_my: '📋 Copy to My Docs',
    pwa_msg: '📱 Install as app to use offline',
    shared_msg: '🔗 Shared document — ',
    offline_msg: '⚡ Offline Mode — Changes will sync when online',
    login: 'Login',
    signup: 'Sign Up',
    status_nokey: ' · no key',
    aria_logo: 'DocVault Logo',
    aria_upload: 'Upload and convert document',
    aria_keys: 'Set AI API keys',
    aria_sync: 'Cloud sync settings',
    aria_ko: 'Switch to Korean',
    aria_en: 'Switch to English',
    aria_search: 'Search documents',
    aria_export: 'Export document',
    aria_clear: 'Clear all documents',
    aria_resize: 'Resize sidebar',
    aria_qa_toggle: 'Toggle AI Q&A panel',
    aria_qa_expand: 'Expand Q&A panel',
    aria_qa_clear: 'Clear Q&A history',
    aria_qa_send: 'Send question',
    aria_close: 'Close',
    btn_new_folder: '📁 New Folder',
    mo_folder_ttl: 'Folder Management',
    mo_folder_name: 'Folder Name',
    uncategorized: 'Uncategorized',
    move_to_folder: 'Move to Folder',
    conf_del_folder: 'Delete folder? (Documents will be moved to Uncategorized)',
    aria_clear_search: 'Clear search',
    aria_copy: 'Copy to clipboard',
    aria_delete: 'Delete document',
    aria_filter_all: 'All filter',
    aria_filter_blog: 'Blog filter',
    aria_filter_custom: 'Custom filter',
    aria_filter_dev: 'Dev docs filter',
    aria_filter_doc: 'Official docs filter',
    aria_filter_report: 'Report filter',
    aria_filter_wiki: 'Wiki filter',
    aria_install: 'Install app',
    aria_later: 'Later',
    aria_live: 'Live sync active',
    aria_migrate: 'Migrate to cloud',
    aria_new_folder: 'Create new folder',
    aria_next_hl: 'Next search result',
    aria_prev_hl: 'Previous search result',
    aria_qa_input: 'Question input',
    aria_share: 'Doc share',
    aria_sort: 'Sort order',
    aria_tag_add: 'Add tag',
    aria_user: 'User info'
  }
};

export function t(key) {
  return I18N[I18N.cur][key] || key;
}

export function setLang(lang) {
  if (!I18N[lang]) return;
  I18N.cur = lang;
  localStorage.setItem('dv_lang', lang);
  if (S) {
    S.lang = lang;
  }
  renderI18N();
}

export function renderI18N() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const translation = t(el.dataset.i18n);
    // Find the first text node child to replace, or set textContent if none
    const textNode = Array.from(el.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0);
    if (textNode) {
      textNode.textContent = translation;
    } else {
      // If there are child elements (like icons) but no text node, append a text node
      if (el.children.length > 0) {
        el.appendChild(document.createTextNode(translation));
      } else {
        el.textContent = translation;
      }
    }
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPh);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('act', btn.dataset.lang === I18N.cur);
  });
}
