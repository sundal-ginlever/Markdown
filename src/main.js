/**
 * Main Entry Point for DocVault
 */
import { S, STYLES, SEARCH, subscribe } from './state/store.js';
import { I18N, t, setLang, renderI18N } from './utils/i18n.js';
import { decrypt } from './utils/crypto.js';
import { IDB } from './services/db.js';
import { SB } from './services/supabase.js';
import { aiConvert } from './services/ai.js';
import { parseSheet, sheetsToText } from './utils/xlsxExtractor.js';
import { extractPdf } from './utils/pdfExtractor.js';
import { extractDocx } from './utils/docxExtractor.js';

// Services
import { RealtimeService } from './services/realtime.js';
import { Router } from './utils/router.js';

// Components
import { UI } from './components/ui.js';
import { Sidebar } from './components/sidebar.js';
import { Viewer } from './components/viewer.js';
import { Editor } from './components/editor.js';
import { QAPanel } from './components/qaPanel.js';
import { UploadModal } from './components/modals/uploadModal.js';
import { SettingsModal } from './components/modals/settingsModal.js';

// --- Initialization ---
async function init() {
  console.log('DocVault Initializing...');
  
  // Load AI settings from storage (AES-GCM encrypted, with legacy btoa fallback)
  const aiSettings = localStorage.getItem('dv_ai');
  if (aiSettings) {
    try {
      // Try AES-GCM decryption first
      const json = await decrypt(aiSettings);
      const data = JSON.parse(json);
      Object.assign(S.ai, data);
    } catch (e) {
      // Fallback: try legacy btoa format for migration
      try {
        const data = JSON.parse(decodeURIComponent(escape(atob(aiSettings))));
        Object.assign(S.ai, data);
        console.info('Migrated AI settings from legacy btoa format');
      } catch (_) {
        console.warn('Failed to load AI settings', e);
      }
    }
  }

  // Initialize Services
  await IDB.init();
  const sbClient = await SB.init();
  if (sbClient) {
    RealtimeService.subscribe();
  }
  
  // Component Initializations
  Sidebar.init();
  UploadModal.init();
  SettingsModal.init();
  renderI18N();
  
  bindEvents();
  Router.init();

  // Initial Data Fetch
  const docs = await IDB.loadDocs();
  const rawFiles = await IDB.getAll('raw');
  S.md = docs.sort((a, b) => b.createdAt - a.createdAt);
  S.raw = rawFiles.map(r => ({ id: r.id, name: r.name || 'Original File', type: r.type }));
  Sidebar.render();

  // Watch Realtime Status
  subscribe((state) => updateRTUI(state.rtStatus));

  console.log('DocVault Ready.');
}

function updateRTUI(status) {
  const badge = document.getElementById('rt-badge');
  const dot = badge?.querySelector('.rt-pulse');
  if (!badge || !dot) return;

  badge.className = `rt-badge ${status}`;
  if (status === 'connected') {
    badge.title = '실시간 동기화 활성 (연결됨)';
  } else if (status === 'connecting') {
    badge.title = '실시간 동기화 연결 중...';
  } else {
    badge.title = '실시간 동기화 비활성 (연결 끊김)';
  }
}

function bindEvents() {
  // Titlebar
  document.getElementById('key-btn')?.addEventListener('click', () => UI.toggleModal('key-mo', true));
  document.getElementById('btn-up')?.addEventListener('click', () => UI.toggleModal('up-mo', true));
  
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const l = btn.dataset.lang;
      setLang(l);
      UI.toast(l === 'ko' ? '🇰🇷 한국어로 전환되었습니다' : '🇺🇸 Switched to English', 'ok');
    });
  });

  // Modals
  document.getElementById('btn-up-cancel')?.addEventListener('click', () => UploadModal.close());
  document.getElementById('btn-key-cancel')?.addEventListener('click', () => UI.toggleModal('key-mo', false));
  document.getElementById('save-key-btn')?.addEventListener('click', () => SettingsModal.save());
  document.getElementById('fi')?.addEventListener('change', UploadModal.handleFileSelect);
  document.getElementById('b-proc')?.addEventListener('click', processFile);

  // Search
  document.getElementById('search-input')?.addEventListener('input', (e) => {
    SEARCH.query = e.target.value.toLowerCase();
    Sidebar.render();
  });
  document.getElementById('search-clear')?.addEventListener('click', () => {
    document.getElementById('search-input').value = '';
    SEARCH.query = '';
    Sidebar.render();
  });

  // Editor/Viewer Tabs
  document.getElementById('b-view')?.addEventListener('click', () => Editor.setMode('view'));
  document.getElementById('b-edit')?.addEventListener('click', () => Editor.setMode('edit'));
  document.getElementById('b-save')?.addEventListener('click', () => Editor.save());

  // Q&A Panel
  document.getElementById('b-qa')?.addEventListener('click', () => QAPanel.toggle());
  document.getElementById('qa-close-btn')?.addEventListener('click', () => QAPanel.toggle());
  document.getElementById('qa-send')?.addEventListener('click', () => QAPanel.ask());
  document.getElementById('qa-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); QAPanel.ask(); }
  });

  // Additional Document Actions
  document.getElementById('b-export')?.addEventListener('click', () => Editor.export());
  document.getElementById('btn-export-all')?.addEventListener('click', () => Editor.exportAll());
  document.getElementById('btn-clear-all')?.addEventListener('click', () => {
    if (confirm('모든 문서를 삭제하시겠습니까? (복구 불가)')) {
      IDB.clear('docs');
      IDB.clear('raw');
      IDB.clear('logs');
      S.md = [];
      Sidebar.render();
      Editor.close();
      UI.toast('전체 데이터가 초기화되었습니다', 'ok');
    }
  });
}

async function processFile() {
  if (!S.pendingFile) return;
  const file = S.pendingFile;
  UI.showPb('파일 분석 중...');
  
  try {
    const ext = file.name.split('.').pop().toLowerCase();
    let fd;
    if (['xlsx', 'xls', 'ods'].includes(ext)) {
      const d = await parseSheet(file);
      fd = { type: 'sheet', text: sheetsToText(d), cnt: d.names.length };
    } else if (ext === 'pdf') {
      fd = await extractPdf(file, UI.showPb, null);
    } else if (ext === 'docx') {
      fd = await extractDocx(file, UI.showPb, null);
    } else {
      fd = await new Promise(res => {
        const r = new FileReader();
        r.onload = e => res({ type: 'text', text: e.target.result, cnt: 0 });
        r.readAsText(file, 'UTF-8');
      });
    }

    const styleDef = STYLES.find(s => s.id === S.selectedStyle) || STYLES[0];
    UI.showPb('AI 변환 중...');
    const mdc = await aiConvert(file.name, fd, null, styleDef);
    
    const id = Date.now().toString();
    const doc = {
      id: 'md_' + id,
      name: file.name.replace(/\.[^.]+$/, '') + '.md',
      rawId: id,
      content: mdc,
      styleId: S.selectedStyle,
      createdAt: new Date(),
      version: 1
    };

    await IDB.saveDoc(doc, fd.text, null, file.name, fd.type);
    await SB.saveDoc(doc, { name: file.name, ext, content: fd.text });
    
    // Update local state
    const rawFile = { id: doc.id, name: file.name, type: fd.type };
    if (!S.raw) S.raw = [];
    S.raw.unshift(rawFile);
    S.md.unshift(doc);
    
    // Clear file input to allow re-uploading same file
    document.getElementById('fi').value = '';

    Sidebar.render();
    UI.toast('변환 완료!', 'ok');
    UI.hidePb();
    UploadModal.close();
  } catch (e) {
    console.error(e);
    UI.toast('오류: ' + e.message, 'err');
    UI.hidePb();
  }
}

// Global hook for dynamic radio buttons in modal
window.selectStyle = (id) => { S.selectedStyle = id; UploadModal.renderStyles(); };

document.addEventListener('DOMContentLoaded', init);
