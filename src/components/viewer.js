/**
 * Document Viewer Component
 */
import { S, SEARCH } from '../state/store.js';
import { parseMd } from '../utils/markdown.js';
import { SearchService } from '../services/search.js';
import { UI } from './ui.js';

export const Viewer = {
  render() {
    const el = document.getElementById('mdv');
    if (!el || !S.activeDoc) return;
    
    // Reset search highlight navigation state on doc switch
    SearchService.activeHls = [];
    SEARCH.hlIdx = -1;
    SEARCH.hlCount = 0;
    const nav = document.getElementById('hl-nav');
    if (nav) nav.style.display = 'none';

    const content = S.activeDoc.content || '';
    if (!content.trim()) {
      const msg = S.lang === 'ko'
        ? '이 문서는 내용이 비어 있습니다. (변환 결과가 비었거나 실패했을 수 있어요 — 재변환을 시도해 보세요.)'
        : 'This document is empty. (Conversion may have returned nothing or failed — try Reconvert.)';
      el.innerHTML = `<p style="color:var(--t3);font-size:13px;text-align:center;padding:40px 0">${msg}</p>`;
    } else {
      el.innerHTML = parseMd(content);
    }

    // Bind Wikilinks clicking & Check dead links (Dynamic Resolver)
    el.querySelectorAll('.wiki-link').forEach(link => {
      const docName = link.getAttribute('data-target') || link.querySelector('span')?.textContent?.trim();
      if (!docName) return;
      
      const target = S.md.find(d => 
        d.name.toLowerCase() === docName.toLowerCase() || 
        d.name.replace(/\.[^.]+$/, '').toLowerCase() === docName.toLowerCase()
      );
      
      if (!target) {
        link.classList.add('wiki-dead');
        link.title = S.lang === 'ko' ? '대상 문서가 존재하지 않습니다.' : 'Target document does not exist.';
      } else {
        link.classList.remove('wiki-dead');
        link.title = S.lang === 'ko' ? `이동: ${target.name}` : `Navigate to: ${target.name}`;
      }
    });

    // Event Delegation: Bind single listener on container once
    if (!el.dataset.delegated) {
      el.dataset.delegated = 'true';
      
      el.addEventListener('mouseover', (e) => {
        const link = e.target.closest('.wiki-link');
        if (!link) return;
        
        const docName = link.getAttribute('data-target') || link.querySelector('span')?.textContent?.trim();
        if (!docName) return;
        
        const target = S.md.find(d => 
          d.name.toLowerCase() === docName.toLowerCase() || 
          d.name.replace(/\.[^.]+$/, '').toLowerCase() === docName.toLowerCase()
        );
        
        if (!target) {
          link.classList.add('wiki-dead');
          link.title = S.lang === 'ko' ? '대상 문서가 존재하지 않습니다.' : 'Target document does not exist.';
        } else {
          link.classList.remove('wiki-dead');
          link.title = S.lang === 'ko' ? `이동: ${target.name}` : `Navigate to: ${target.name}`;
        }
      });
      
      el.addEventListener('click', (e) => {
        const link = e.target.closest('.wiki-link');
        if (!link) return;
        e.preventDefault();
        
        const docName = link.getAttribute('data-target') || link.querySelector('span')?.textContent?.trim();
        if (!docName) return;
        
        const target = S.md.find(d => 
          d.name.toLowerCase() === docName.toLowerCase() || 
          d.name.replace(/\.[^.]+$/, '').toLowerCase() === docName.toLowerCase()
        );
        
        if (target) {
          import('./sidebar.js').then(({ Sidebar }) => {
            Sidebar.openDoc(target.id);
          });
        } else {
          import('./ui.js').then(({ UI }) => {
            UI.toast(S.lang === 'ko' ? '이동할 대상 문서를 찾을 수 없습니다: ' + docName : 'Target document not found: ' + docName, 'warn');
          });
        }
      });
    }
    
    // Apply search highlights if query exists
    if (SEARCH.query) {
      SearchService.applyHighlights(el, SEARCH.query);
    }
    
    // Update toolbar + force a clean single-area preview state
    document.getElementById('dp-name').textContent = S.activeDoc.name;
    S.mode = 'view';
    UI.setLayout('view');
    const saveBtn = document.getElementById('b-save');
    if (saveBtn) saveBtn.style.display = 'none';
    document.getElementById('b-edit')?.classList.remove('act');
    document.getElementById('b-view')?.classList.add('act');

    // Fresh document → ensure the source-compare split starts closed
    const srcPane = document.getElementById('src-pane');
    if (srcPane) srcPane.style.display = 'none';
    document.getElementById('view-a')?.classList.remove('split');
    document.getElementById('b-source')?.classList.remove('on');

    const badge = document.getElementById('doc-style-badge');
    if (badge && S.activeDoc) {
      import('../state/store.js').then(({ STYLES }) => {
        const st = STYLES.find(s => s.id === S.activeDoc.styleId) || STYLES[0];
        badge.innerHTML = `<span class="style-tag ${st.cls}" style="color:${st.color};border:1px solid ${st.color};padding:2px 6px;border-radius:4px;font-size:10px;cursor:pointer">${st.icon} ${st.name} (재변환)</span>`;
        badge.style.display = 'flex';
        badge.onclick = () => this.openReconvModal();
      });
    }
  },

  async toggleSource() {
    const pane = document.getElementById('src-pane');
    const view = document.getElementById('view-a');
    const btn = document.getElementById('b-source');
    if (!pane || !view || !S.activeDoc) return;

    // Always show preview (not edit) when comparing
    if (S.mode === 'edit') {
      const { Editor } = await import('./editor.js');
      Editor.setMode('view');
    }

    const showing = pane.style.display !== 'none';
    if (showing) {
      pane.style.display = 'none';
      view.classList.remove('split');
      view.style.display = 'block';
      btn?.classList.remove('on');
      return;
    }

    const { IDB } = await import('../services/db.js');
    let text = S.lang === 'ko' ? '(원본 데이터를 찾을 수 없습니다)' : '(Original source not found)';
    try {
      const raw = await IDB.get('raw', S.activeDoc.rawId);
      if (raw && raw.data != null) {
        if (typeof raw.data === 'string') text = raw.data;
        else if (raw.data instanceof ArrayBuffer) {
          try { text = new TextDecoder('utf-8').decode(raw.data); } catch { /* keep fallback */ }
        } else text = String(raw.data);
      }
    } catch (e) {
      console.warn('Failed to load original source:', e);
    }

    document.getElementById('src-text').textContent = text;
    pane.style.display = 'flex';
    view.classList.add('split');
    view.style.display = 'flex';
    btn?.classList.add('on');
  },

  openReconvModal() {
    if (!S.activeDoc) return;
    import('../state/store.js').then(({ STYLES }) => {
      const grid = document.getElementById('reconv-style-grid');
      if (grid) {
        grid.innerHTML = STYLES.map(s => `
          <div class="style-card ${S.activeDoc.styleId === s.id ? 'act' : ''}" data-id="${s.id}">
            <div class="sc-ico">${s.icon}</div>
            <div class="sc-tit">${s.name}</div>
          </div>
        `).join('');
        
        grid.querySelectorAll('.style-card').forEach(c => {
          c.onclick = () => {
            grid.querySelectorAll('.style-card').forEach(x => x.classList.remove('act'));
            c.classList.add('act');
          };
        });
      }
      
      const uiProm = import('./ui.js').then(({ UI }) => UI);
      
      document.getElementById('btn-reconv-cancel').onclick = () => uiProm.then(UI => UI.toggleModal('reconv-mo', false));
      document.getElementById('btn-reconv-start').onclick = () => this.startReconv();
      
      uiProm.then(UI => UI.toggleModal('reconv-mo', true));
    });
  },

  async startReconv() {
    const actCard = document.querySelector('#reconv-style-grid .style-card.act');
    if (!actCard || !S.activeDoc) return;
    const styleId = actCard.dataset.id;
    if (S.activeDoc.styleId === styleId) {
      UI.toast('이미 동일한 스타일입니다!', 'warn');
      return;
    }
    
    // Capture target document reference and ID securely to prevent race conditions
    const targetDoc = S.activeDoc;
    const targetDocId = targetDoc.id;
    
    const [{ IDB }, { STYLES }, { aiConvert }, { Sidebar }] = await Promise.all([
      import('../services/db.js'),
      import('../state/store.js'),
      import('../services/ai.js'),
      import('./sidebar.js')
    ]);

    UI.toggleModal('reconv-mo', false);
    UI.showPb('원본 데이터 불러오는 중...');
    
    if (S.abortController) S.abortController.abort();
    S.abortController = new AbortController();
    const signal = S.abortController.signal;

    try {
      const rawRes = await IDB.get('raw', targetDoc.rawId);
      if (!rawRes || !rawRes.data) throw new Error('원본 데이터(Raw)를 찾을 수 없습니다.');
      
      UI.showPb('AI 재변환 중...');
      const styleDef = STYLES.find(s => s.id === styleId) || STYLES[0];
      
      let text = '';
      if (typeof rawRes.data === 'string') {
        text = rawRes.data;
      } else if (rawRes.data instanceof ArrayBuffer) {
        try {
          const decoder = new TextDecoder('utf-8');
          text = decoder.decode(rawRes.data);
        } catch (err) {
          console.warn('Failed to decode rawRes.data as UTF-8 string', err);
        }
      } else if (rawRes.data) {
        text = String(rawRes.data);
      }
      
      const customPrompt = localStorage.getItem('dv_custom_prompt') || '';
      const mdc = await aiConvert(rawRes.name, { type: rawRes.type, cnt: 0, text: text }, text, styleDef, signal, customPrompt);
      
      const delta = mdc.length - targetDoc.content.length;
      targetDoc.content = mdc;
      targetDoc.styleId = styleId;
      targetDoc.updatedAt = new Date();
      
      await IDB.put('docs', targetDoc);
      const logEntry = { docId: targetDocId, ts: Date.now(), msg: `스타일 재변환 (${styleDef.name})`, delta };
      await IDB.put('logs', logEntry);

      // Update UI only if the target document is still the active one
      if (S.activeDoc && S.activeDoc.id === targetDocId) {
        this.render();
        Sidebar.render();
        
        // Update LogPanel if it is currently open
        if (S.logOpen) {
          import('./logPanel.js').then(({ LogPanel }) => LogPanel.render());
        }
      } else {
        Sidebar.render();
      }
      
      UI.toast('성공적으로 재변환되었습니다.', 'ok');
    } catch (e) {
      if (e.message !== 'Cancelled' && e.name !== 'AbortError') {
        console.error(e);
        UI.toast('재변환 오류: ' + e.message, 'err');
      }
    } finally {
      if (S.abortController?.signal === signal) {
        S.abortController = null;
      }
      UI.hidePb();
    }
  }
};
