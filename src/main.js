/**
 * Main Entry Point for DocVault
 */
import { S, STYLES, SEARCH } from './state/store.js';
import { I18N, t, setLang, renderI18N } from './utils/i18n.js';
import { decrypt, encrypt } from './utils/crypto.js';
import { IDB } from './services/db.js';
import { aiConvert } from './services/ai.js';
import { parseSheet, sheetsToText } from './utils/xlsxExtractor.js';
import { extractPdf } from './utils/pdfExtractor.js';
import { extractDocx } from './utils/docxExtractor.js';

// Services
import { Router } from './utils/router.js';
import { SearchService } from './services/search.js';

// Components
import { UI } from './components/ui.js';
import { Sidebar } from './components/sidebar.js';
import { Viewer } from './components/viewer.js';
import { Editor } from './components/editor.js';
import { UploadModal } from './components/modals/uploadModal.js';
import { SettingsModal } from './components/modals/settingsModal.js';
import { LogPanel } from './components/logPanel.js';

// --- Local Data Loader for Database Partitioning Switch ---
export async function loadLocalData() {
  const docs = await IDB.loadDocs();
  const rawFiles = await IDB.getRawMetadata();

  S.md = docs.sort((a, b) => b.createdAt - a.createdAt);
  S.raw = rawFiles.map(r => ({ id: r.id, name: r.name || 'Original File', type: r.type }));

  const { Sidebar } = await import('./components/sidebar.js');
  Sidebar.render();

  // Close active document reactively if it's no longer present in the newly switched database
  if (S.activeDoc && !S.md.find(d => d.id === S.activeDoc.id)) {
    const { Editor } = await import('./components/editor.js');
    Editor.close();
  }

  updateStorageInfo();
}

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

        // Auto-Migrate: Encrypt and save back with the new AES-GCM logic
        try {
          const secureCipher = await encrypt(JSON.stringify(data));
          localStorage.setItem('dv_ai', secureCipher);
          console.info('Auto-migrated and secured legacy AI settings via AES-GCM');
        } catch (encErr) {
          console.warn('Failed to encrypt legacy AI settings during auto-migration:', encErr);
        }
      } catch (_) {
        console.warn('Failed to load AI settings', e);
      }
    }
  }

  // Migrate stale/retired Claude model IDs saved by older versions (would 404)
  const CURRENT_CLAUDE_MODELS = ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5'];
  if (!CURRENT_CLAUDE_MODELS.includes(S.ai.models.claude)) {
    S.ai.models.claude = 'claude-haiku-4-5';
  }

  // Initialize Services
  await IDB.init();
  await IDB.migrateFromLocalStorage('docvault_data', t, UI.showPb, UI.hidePb, UI.toast);

  // Component Initializations
  UI.initGlobal();
  Sidebar.init();
  UploadModal.init();
  SettingsModal.init();
  renderI18N();

  bindEvents();

  // Initial Data Fetch
  await loadLocalData();

  Router.init();

  console.log('DocVault Ready.');
}

function bindEvents() {
  // Titlebar
  document.getElementById('key-btn')?.addEventListener('click', () => {
    UI.toggleModal('key-mo', true);
    setTimeout(() => {
      const container = document.getElementById('kf-claude');
      const firstInput = container?.querySelector('input, select');
      if (firstInput) firstInput.focus();
    }, 100);
  });
  document.getElementById('btn-up')?.addEventListener('click', () => UI.toggleModal('up-mo', true));

  // Settings (⚙️) dropdown menu in the titlebar
  const tbMenu = document.getElementById('tb-menu');
  document.getElementById('tb-gear-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    tbMenu?.classList.toggle('show');
  });
  // Close the menu after picking any action inside it
  tbMenu?.addEventListener('click', (e) => {
    if (e.target.closest('button')) tbMenu.classList.remove('show');
  });
  // Close on outside click
  document.addEventListener('click', (e) => {
    if (tbMenu?.classList.contains('show') && !e.target.closest('.tb-settings-wrap')) {
      tbMenu.classList.remove('show');
    }
  });

  // Home (welcome) converter: click drop zone to pick a file, then convert inline
  document.getElementById('main-dz')?.addEventListener('click', () => document.getElementById('fi')?.click());
  document.getElementById('wlc-convert')?.addEventListener('click', processFile);

  // Home mode toggle: upload a file vs. write text directly
  document.querySelectorAll('.wlc-mode').forEach(b =>
    b.addEventListener('click', () => setWelcomeMode(b.dataset.mode)));
  document.getElementById('wlc-text-convert')?.addEventListener('click', processText);

  // Help / usage guide modal
  const openHelp = () => UI.toggleModal('help-mo', true);
  document.getElementById('help-btn')?.addEventListener('click', openHelp);
  document.getElementById('wlc-help-link')?.addEventListener('click', openHelp);
  document.getElementById('help-close-btn')?.addEventListener('click', () => UI.toggleModal('help-mo', false));

  // AI engine selector (titlebar) — now actually drives the active provider
  const aiSel = document.getElementById('ai-sel');
  if (aiSel) {
    aiSel.value = S.ai.provider;
    syncEngineBadge();
    aiSel.addEventListener('change', async (e) => {
      S.ai.provider = e.target.value;
      try { localStorage.setItem('dv_ai', await encrypt(JSON.stringify(S.ai))); } catch (_) {}
      syncEngineBadge();
      UI.toast((S.lang === 'ko' ? 'AI 엔진: ' : 'AI engine: ') + providerLabel(S.ai.provider), 'ok');
    });
  }

  // Close the original-source comparison pane
  document.getElementById('src-close-btn')?.addEventListener('click', () => Viewer.toggleSource());

  // Close the current document and return to the home screen
  document.getElementById('b-home')?.addEventListener('click', () => Editor.close());

  // PWA install: show the titlebar button only when the browser offers install
  let deferredInstallPrompt = null;
  const installBtn = document.getElementById('pwa-install-btn');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (installBtn) installBtn.style.display = '';
  });
  installBtn?.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installBtn.style.display = 'none';
  });
  window.addEventListener('appinstalled', () => {
    if (installBtn) installBtn.style.display = 'none';
  });

  // Backdrop clicks to close modals
  document.querySelectorAll('.ov').forEach(ov => {
    ov.addEventListener('click', (e) => {
      if (e.target === ov) {
        if (ov.id === 'up-mo') {
          import('./components/modals/uploadModal.js').then(({ UploadModal }) => UploadModal.close());
        } else if (ov.id === 'key-mo') {
          SettingsModal.close();
        } else if (ov.id === 'reconv-mo') {
          UI.toggleModal('reconv-mo', false);
        } else if (ov.id === 'help-mo') {
          UI.toggleModal('help-mo', false);
        } else if (ov.id === 'cmd-pal') {
          ov.classList.remove('show');
        }
      }
    });
  });
  
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const l = btn.dataset.lang;
      setLang(l);
      UI.toast(l === 'ko' ? '🇰🇷 한국어로 전환되었습니다' : '🇺🇸 Switched to English', 'ok');
    });
  });

  // Modals
  document.getElementById('btn-up-cancel')?.addEventListener('click', () => UploadModal.close());
  document.getElementById('btn-key-cancel')?.addEventListener('click', () => SettingsModal.close());
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
  document.getElementById('btn-clear-hl')?.addEventListener('click', () => {
    document.getElementById('search-input').value = '';
    SEARCH.query = '';
    document.getElementById('hl-nav').style.display = 'none';
    Sidebar.render();
    Viewer.render();
  });
  document.getElementById('btn-prev-hl')?.addEventListener('click', () => {
    SearchService.prevHighlight();
  });
  document.getElementById('btn-next-hl')?.addEventListener('click', () => {
    SearchService.nextHighlight();
  });

  // Mobile Sidebar Toggle
  document.getElementById('mob-sb-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('sb')?.classList.toggle('show');
  });
  document.addEventListener('click', (e) => {
    const sb = document.getElementById('sb');
    if (sb && sb.classList.contains('show') && !e.target.closest('.sb') && !e.target.closest('#mob-sb-btn')) {
      sb.classList.remove('show');
    }
  });

  // Editor/Viewer Tabs
  document.getElementById('b-view')?.addEventListener('click', () => Editor.setMode('view'));
  document.getElementById('b-edit')?.addEventListener('click', () => Editor.setMode('edit'));
  document.getElementById('b-save')?.addEventListener('click', () => Editor.save());
  document.getElementById('b-log')?.addEventListener('click', () => LogPanel.toggle(true));
  document.getElementById('b-log-close')?.addEventListener('click', (e) => {
    e.stopPropagation();
    LogPanel.toggle(false);
  });

  // Command Palette
  let cmdSelIdx = 0;
  let currentFilteredCmds = [];

  const toggleCmdPal = (show) => {
    const pal = document.getElementById('cmd-pal');
    if (!pal) return;
    const isShowing = show ?? !pal.classList.contains('show');
    pal.classList.toggle('show', isShowing);
    if (isShowing) {
      const inp = document.getElementById('cmd-input');
      inp.value = '';
      setTimeout(() => inp.focus(), 50);
      renderCmdList();
    }
  };

  const renderCmdList = (q = '') => {
    const list = document.getElementById('cmd-list');
    const cmds = [
      { t: '새로운 문서 변환 시작', icon: '⚡', action: () => UI.toggleModal('up-mo', true) },
      { t: 'AI 프로바이더 설정', icon: '🔑', action: () => UI.toggleModal('key-mo', true) },
      ...S.md.map(d => ({ t: `문서 열기: ${d.name}`, icon: '🗒', action: () => Sidebar.openDoc(d.id) }))
    ];
    
    currentFilteredCmds = cmds.filter(c => c.t.toLowerCase().includes(q.toLowerCase()));
    cmdSelIdx = 0;
    drawCmdList();
  };

  const drawCmdList = () => {
    const list = document.getElementById('cmd-list');
    if (!list) return;

    list.innerHTML = currentFilteredCmds.map((c, i) => {
      const isSel = i === cmdSelIdx;
      return `
        <div class="cmd-item" style="padding:12px 16px;cursor:pointer;color:var(--t1);border-radius:6px;display:flex;align-items:center;gap:12px;background:${isSel ? 'var(--bg-hov)' : 'transparent'};" data-idx="${i}">
          <span>${c.icon}</span> <span>${c.t}</span>
        </div>
      `;
    }).join('');
    
    list.querySelectorAll('.cmd-item').forEach(el => {
      el.onclick = () => {
        toggleCmdPal(false);
        currentFilteredCmds[el.dataset.idx].action();
      };
      el.onmouseover = () => {
        cmdSelIdx = parseInt(el.dataset.idx);
        drawCmdList();
      };
    });

    const activeEl = list.querySelector(`.cmd-item[data-idx="${cmdSelIdx}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  };

  document.getElementById('cmd-input')?.addEventListener('input', (e) => renderCmdList(e.target.value));
  document.getElementById('cmd-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentFilteredCmds.length > 0) {
        cmdSelIdx = (cmdSelIdx + 1) % currentFilteredCmds.length;
        drawCmdList();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentFilteredCmds.length > 0) {
        cmdSelIdx = (cmdSelIdx - 1 + currentFilteredCmds.length) % currentFilteredCmds.length;
        drawCmdList();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentFilteredCmds.length > 0 && currentFilteredCmds[cmdSelIdx]) {
        toggleCmdPal(false);
        currentFilteredCmds[cmdSelIdx].action();
      }
    }
  });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      toggleCmdPal();
    }
  });

  // Document Rename
  const triggerRename = () => {
    if (!S.activeDoc) return;
    const nameEl = document.getElementById('dp-name');
    if (nameEl.querySelector('input')) return;
    
    const curName = S.activeDoc.name;
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.value = curName;
    inp.style.cssText = 'background:transparent;border:1px solid var(--acc);color:var(--t1);font:inherit;padding:0 4px;border-radius:3px;outline:none;';
    inp.style.width = Math.max(80, curName.length * 8) + 'px';
    
    const saveName = async () => {
      const nw = inp.value.trim();
      if (nw && nw !== curName) {
        S.activeDoc.name = nw;
        S.activeDoc.updatedAt = new Date();
        await IDB.put('docs', S.activeDoc);
        const logEntry = { docId: S.activeDoc.id, ts: Date.now(), msg: `문서 이름 변경: ${nw}` };
        await IDB.put('logs', logEntry);
        Sidebar.render();
      }
      nameEl.textContent = S.activeDoc.name;
    };
    
    inp.onblur = saveName;
    inp.onkeydown = e => {
      if (e.key === 'Enter') inp.blur();
      if (e.key === 'Escape') {
        inp.onblur = null;
        nameEl.textContent = curName;
      }
    };
    
    nameEl.innerHTML = '';
    nameEl.appendChild(inp);
    inp.focus();
  };
  document.getElementById('dp-rename-btn')?.addEventListener('click', triggerRename);
  document.getElementById('dp-name')?.addEventListener('dblclick', triggerRename);

  // Conversion-experience actions (Phase 2)
  document.getElementById('b-source')?.addEventListener('click', () => Viewer.toggleSource());
  document.getElementById('b-reconv')?.addEventListener('click', () => Viewer.openReconvModal());
  document.getElementById('b-copy')?.addEventListener('click', async () => {
    if (!S.activeDoc) return;
    try {
      await navigator.clipboard.writeText(S.activeDoc.content || '');
      UI.toast(S.lang === 'ko' ? '마크다운이 복사되었습니다' : 'Markdown copied', 'ok');
    } catch (e) {
      UI.toast(S.lang === 'ko' ? '복사 실패 (권한 확인)' : 'Copy failed (check permissions)', 'err');
    }
  });

  // Additional Document Actions
  document.getElementById('b-export')?.addEventListener('click', () => Editor.export());
  document.getElementById('btn-export-all')?.addEventListener('click', () => Editor.exportAll());
  document.getElementById('btn-clear-all')?.addEventListener('click', async () => {
    const isKo = S.lang === 'ko';
    const msg = isKo ? '모든 데이터를 완전히 초기화하시겠습니까? (문서, 원본 파일, 편집 로그, 폴더 정보 모두 삭제되며 복구 불가)' : 'Are you sure you want to clear all data? (All documents, raw files, logs, and folders will be deleted permanently)';
    if (confirm(msg)) {
      try {
        await Promise.all([
          IDB.clear('docs'),
          IDB.clear('raw'),
          IDB.clear('logs'),
          IDB.clear('folders')
        ]);
        S.md = [];
        S.raw = [];
        S.activeDoc = null;

        Sidebar.render();
        Editor.close();
        updateStorageInfo();

        UI.toast(isKo ? '전체 데이터가 초기화되었습니다' : 'All data cleared successfully.', 'ok');
      } catch (err) {
        console.error('Clear all error:', err);
        UI.toast(isKo ? '초기화 오류: ' + err.message : 'Reset error: ' + err.message, 'err');
      }
    }
  });
}

// Extract raw text/data from a single file (text, PDF, DOCX, spreadsheet)
async function extractFileData(file, signal) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (['xlsx', 'xls', 'ods'].includes(ext)) {
    const d = await parseSheet(file, signal);
    return { type: 'sheet', text: sheetsToText(d), cnt: d.names.length };
  }
  if (ext === 'pdf') return await extractPdf(file, UI.showPb, null, signal);
  if (ext === 'docx') return await extractDocx(file, UI.showPb, null, signal);

  const allowedTextExts = ['txt', 'md', 'csv', 'json', 'html', 'xml', 'js', 'css', 'py', 'java', 'c', 'cpp', 'rs', 'go', 'ts'];
  if (!allowedTextExts.includes(ext)) {
    throw new Error(S.lang === 'ko' ? `지원하지 않는 파일 형식입니다 (.${ext}). 텍스트 또는 문서(PDF, DOCX, XLSX) 파일만 업로드 가능합니다.` : `Unsupported file type (.${ext}). Only text or document (PDF, DOCX, XLSX) files are allowed.`);
  }
  return await new Promise((res, rej) => {
    if (signal && signal.aborted) return rej(new Error('Cancelled'));
    const onAbort = () => { cleanup(); rej(new Error('Cancelled')); };
    const cleanup = () => { if (signal) signal.removeEventListener('abort', onAbort); };
    if (signal) signal.addEventListener('abort', onAbort);
    const r = new FileReader();
    r.onload = e => { cleanup(); res({ type: 'text', text: e.target.result, cnt: 0 }); };
    r.onerror = err => { cleanup(); rej(err); };
    r.readAsText(file, 'UTF-8');
  });
}

// Rough pre-conversion cost/token estimate so users aren't surprised by bulk runs.
// Prices are USD per 1M tokens [input, output]; only shown for models with known pricing.
const MODEL_PRICES = {
  'claude-haiku-4-5': [1, 5],
  'claude-sonnet-4-6': [3, 15],
  'claude-opus-4-8': [5, 25],
  'gpt-5.5': [5, 30]
};

function estimateConversion(files, model) {
  let inTok = 0, outTok = 0;
  for (const f of files) {
    // App truncates source text at 30,000 chars (~7,500 tokens); size/4 ≈ chars→tokens
    inTok += Math.min(Math.ceil(f.size / 4), 7500) + 400; // +system prompt
    outTok += 2500; // typical converted-markdown output
  }
  const price = MODEL_PRICES[model];
  let costText = null;
  if (price) {
    const cost = (inTok * price[0] + outTok * price[1]) / 1e6;
    costText = '$' + cost.toFixed(cost < 0.1 ? 3 : 2);
  }
  return { tokens: inTok + outTok, costText };
}

async function processFile() {
  const files = (S.pendingFiles && S.pendingFiles.length)
    ? Array.from(S.pendingFiles)
    : (S.pendingFile ? [S.pendingFile] : []);
  if (!files.length) return;
  const isKo = S.lang === 'ko';

  // Pre-conversion estimate + confirmation for bulk or large jobs
  const model = S.ai.models[S.ai.provider];
  const needsConfirm = files.length > 1 || files.some(f => f.size > 200 * 1024);
  if (needsConfirm) {
    const est = estimateConversion(files, model);
    const tokStr = est.tokens.toLocaleString();
    const costPart = est.costText
      ? (isKo ? `\n예상 비용: 약 ${est.costText}` : `\nEst. cost: ~${est.costText}`)
      : (isKo ? '\n(이 모델은 비용 추정을 지원하지 않습니다)' : '\n(cost estimate unavailable for this model)');
    const msg = isKo
      ? `${files.length}개 파일을 변환합니다.\n모델: ${model}\n예상 토큰: 약 ${tokStr} (대략치)${costPart}\n\n진행할까요?`
      : `Converting ${files.length} file(s).\nModel: ${model}\nEst. tokens: ~${tokStr} (rough)${costPart}\n\nProceed?`;
    if (!confirm(msg)) return;
  }

  // Safe dynamic import to get the isolated UploadModal controller
  const { UploadModal } = await import('./components/modals/uploadModal.js');
  if (UploadModal.abortController) UploadModal.abortController.abort();
  UploadModal.abortController = new AbortController();
  const signal = UploadModal.abortController.signal;

  const styleDef = STYLES.find(s => s.id === S.selectedStyle) || STYLES[0];
  const multi = files.length > 1;
  let lastDocId = null;
  let okCount = 0;
  const failed = [];

  try {
    for (let i = 0; i < files.length; i++) {
      if (signal.aborted) throw new Error('Cancelled');
      const file = files[i];
      const prefix = multi ? `(${i + 1}/${files.length}) ` : '';

      try {
        UI.showPb(`${prefix}${isKo ? '파일 분석 중' : 'Analyzing'}: ${file.name}`);
        const fd = await extractFileData(file, signal);

        if (fd.text && fd.text.length > 30000) {
          UI.toast((isKo ? `${file.name}: 문서가 너무 길어 일부만 전송됩니다.` : `${file.name}: too long, only a portion processed.`), 'warn');
        }

        UI.showPb(`${prefix}${isKo ? 'AI 변환 중...' : 'Converting...'}`);
        const mdc = await aiConvert(file.name, fd, null, styleDef, signal);

        const docId = 'md_' + Date.now().toString() + '_' + i;
        const doc = {
          id: docId,
          name: file.name.replace(/\.[^.]+$/, '') + '.md',
          rawId: docId,
          content: mdc,
          styleId: S.selectedStyle,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1
        };

        await IDB.saveDoc(doc, fd.text, null, file.name, fd.type);

        if (!S.raw) S.raw = [];
        S.raw.unshift({ id: doc.id, name: file.name, type: fd.type });
        S.md.unshift(doc);
        lastDocId = docId;
        okCount++;
        Sidebar.render();
      } catch (err) {
        if (err.name === 'AbortError' || err.message === 'Cancelled') throw err;
        console.error(`Failed to convert ${file.name}:`, err);
        failed.push(file.name);
      }
    }

    UI.hidePb();
    UploadModal.close();

    if (okCount > 0) {
      const eng = providerLabel(S.ai.provider);
      UI.toast((multi ? `${okCount}${isKo ? '개 변환 완료' : ' converted'}` : (isKo ? '변환 완료' : 'Converted')) + ` · ${eng}`, 'ok');
    }
    if (failed.length) {
      UI.toast((isKo ? '변환 실패: ' : 'Failed: ') + failed.join(', '), 'err');
    }
    // Open the freshly converted document so the result is visible immediately
    if (lastDocId) Sidebar.openDoc(lastDocId);
    updateStorageInfo();
  } catch (e) {
    if (e.name === 'AbortError' || e.message === 'Cancelled') {
      console.log('File processing was gracefully cancelled by user.');
    } else {
      console.error(e);
      UI.toast('오류: ' + e.message, 'err');
    }
    UI.hidePb();
    if (okCount > 0) Sidebar.render();
  }
}

// Human-readable label for the active AI provider
function providerLabel(p) {
  return ({ claude: 'Claude', gpt4: 'GPT', gemini: 'Gemini', local: 'Custom' })[p] || p;
}

// Sidebar storage-usage indicator (doc count + approximate IndexedDB usage)
async function updateStorageInfo() {
  const el = document.getElementById('sb-storage');
  if (!el) return;
  const isKo = S.lang === 'ko';
  const docCount = S.md.length;
  let usageStr = '';
  try {
    if (navigator.storage?.estimate) {
      const { usage } = await navigator.storage.estimate();
      const mb = (usage || 0) / (1024 * 1024);
      usageStr = ' · ' + (mb < 1 ? `${(mb * 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`);
    }
  } catch (_) { /* estimate unsupported */ }
  el.textContent = `${docCount}${isKo ? '개 문서' : ' docs'}${usageStr}`;
}
window.updateStorageInfo = updateStorageInfo;
function syncEngineBadge() {
  const badge = document.getElementById('qa-model-badge');
  if (badge) badge.textContent = providerLabel(S.ai.provider);
}

// Switch the home screen between file-upload and write-directly modes
function setWelcomeMode(mode) {
  const isText = mode === 'text';
  document.querySelectorAll('.wlc-mode').forEach(b => b.classList.toggle('act', b.dataset.mode === mode));
  const dz = document.getElementById('main-dz');
  const box = document.getElementById('wlc-textbox');
  const fileAction = document.getElementById('wlc-action');
  const textAction = document.getElementById('wlc-text-action');
  if (dz) dz.style.display = isText ? 'none' : '';
  if (box) box.style.display = isText ? 'block' : 'none';
  if (textAction) textAction.style.display = isText ? 'flex' : 'none';
  // The file action only belongs in file mode, and only once a file is picked
  if (fileAction) fileAction.style.display = (!isText && S.pendingFile) ? 'flex' : 'none';
  if (isText) document.getElementById('wlc-text')?.focus();
}

// Derive a document title from the first meaningful line of free-form text
function deriveTitle(text) {
  const firstLine = (text.split('\n').find(l => l.trim()) || '').trim();
  let t = firstLine.replace(/^#+\s*/, '').replace(/[\\/:*?"<>|]/g, '').trim();
  if (t.length > 40) t = t.slice(0, 40).trim();
  if (!t) {
    const d = new Date().toISOString().slice(0, 10);
    t = (S.lang === 'ko' ? '빠른 메모 ' : 'Quick note ') + d;
  }
  return t;
}

// Convert free-form text typed on the home screen into a styled document
async function processText() {
  const ta = document.getElementById('wlc-text');
  const text = (ta?.value || '').trim();
  const isKo = S.lang === 'ko';
  if (!text) {
    UI.toast(isKo ? '변환할 내용을 입력하세요' : 'Enter some text to convert', 'warn');
    return;
  }

  const { UploadModal } = await import('./components/modals/uploadModal.js');
  if (UploadModal.abortController) UploadModal.abortController.abort();
  UploadModal.abortController = new AbortController();
  const signal = UploadModal.abortController.signal;

  const styleDef = STYLES.find(s => s.id === S.selectedStyle) || STYLES[0];
  try {
    UI.showPb(isKo ? 'AI 변환 중...' : 'Converting...');
    const fd = { type: 'text', text, cnt: 0 };
    const title = deriveTitle(text);
    const mdc = await aiConvert(title + '.txt', fd, null, styleDef, signal);

    const docId = 'md_' + Date.now().toString();
    const doc = {
      id: docId,
      name: title + '.md',
      rawId: docId,
      content: mdc,
      styleId: S.selectedStyle,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };

    await IDB.saveDoc(doc, text, null, title + '.txt', 'text');

    if (!S.raw) S.raw = [];
    S.raw.unshift({ id: doc.id, name: title + '.txt', type: 'text' });
    S.md.unshift(doc);

    Sidebar.render();
    UI.hidePb();
    UI.toast((isKo ? '변환 완료' : 'Converted') + ' · ' + providerLabel(S.ai.provider), 'ok');
    if (ta) ta.value = '';
    Sidebar.openDoc(docId);
    updateStorageInfo();
  } catch (e) {
    if (e.name === 'AbortError' || e.message === 'Cancelled') {
      console.log('Text conversion cancelled.');
    } else {
      console.error(e);
      UI.toast('오류: ' + e.message, 'err');
    }
    UI.hidePb();
  }
}

document.addEventListener('DOMContentLoaded', init);
