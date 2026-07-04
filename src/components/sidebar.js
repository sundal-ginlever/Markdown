/**
 * Sidebar and File List Component
 */
import { S, SEARCH } from '../state/store.js';
import { t } from '../utils/i18n.js';
import { IDB } from '../services/db.js';
import { Viewer } from './viewer.js';
import { SearchService } from '../services/search.js';
import { Router } from '../utils/router.js';

export const Sidebar = {
  render() {
    this.renderMD();
    this.renderRaw();
  },

  lastRenderKey: null,

  renderMD() {
    const el = document.getElementById('md-l');
    if (!el) return;

    const currentRenderKey = JSON.stringify({
      mdCount: S.md.length,
      sort: S.sort,
      filter: SEARCH.filter,
      query: SEARCH.query,
      activeId: S.activeDoc?.id,
      lang: S.lang,
      docHash: S.md.map(d => {
        const time = d.updatedAt instanceof Date
          ? d.updatedAt.getTime()
          : (Date.parse(d.updatedAt) || 0);
        return `${d.id}:${d.name}:${time}`;
      }).join('|')
    });

    if (this.lastRenderKey === currentRenderKey) {
      return;
    }
    this.lastRenderKey = currentRenderKey;

    let filtered = S.md;
    if (SEARCH.filter !== 'all') {
      filtered = filtered.filter(d => d.styleId === SEARCH.filter);
    }

    // Apply sorting
    if (S.sort === 'old') {
      filtered.sort((a, b) => a.createdAt - b.createdAt);
    } else if (S.sort === 'new') {
      filtered.sort((a, b) => b.createdAt - a.createdAt);
    } else if (S.sort === 'az') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    const statsEl = document.getElementById('search-stats');
    if (SEARCH.query) {
      filtered = SearchService.search(SEARCH.query, filtered);
      if (statsEl) {
        const isKo = S.lang === 'ko';
        statsEl.textContent = isKo ? `${filtered.length}개의 문서가 검색되었습니다` : `${filtered.length} documents found`;
        statsEl.style.display = 'block';
      }
    } else {
      if (statsEl) {
        statsEl.textContent = '';
        statsEl.style.display = 'none';
      }
    }

    if (!filtered.length) {
      el.innerHTML = `<div class="emp">${t('empty_md')}</div>`;
      const countEl = document.getElementById('md-cnt');
      if (countEl) countEl.textContent = '0';
      return;
    }

    const countEl = document.getElementById('md-cnt');
    if (countEl) countEl.textContent = filtered.length;

    const renderFileItem = (f) => {
      const isAct = S.activeDoc?.id === f.id;
      const snippet = SEARCH.query ? `<div class="fi-snip">${SearchService.buildSnippet(f.content, SEARCH.query)}</div>` : '';
      return `
        <div class="fi ${isAct ? 'act' : ''}" data-id="${f.id}">
          <div class="fi-main">
            <span class="fi-ico">🗒</span>
            <span class="fi-nm" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${SearchService.escapeHtml(f.name)}</span>
            <button class="fi-del" title="삭제">✕</button>
          </div>
          ${snippet}
        </div>
      `;
    };

    el.innerHTML = filtered.map(f => renderFileItem(f)).join('');
  },

  renderRaw() {
    const el = document.getElementById('raw-l');
    if (!el) return;

    if (!S.raw || !S.raw.length) {
      el.innerHTML = `<div class="emp">📂 No files yet</div>`;
      const cnt = document.getElementById('raw-cnt');
      if (cnt) cnt.textContent = '0';
      return;
    }

    el.innerHTML = S.raw.map(f => `
      <div class="fi raw" data-id="${f.id}">
        <div class="fi-main">
          <span class="fi-ico">📄</span>
          <span class="fi-nm">${SearchService.escapeHtml(f.name)}</span>
        </div>
      </div>
    `).join('');

    const rawCntEl = document.getElementById('raw-cnt');
    if (rawCntEl) rawCntEl.textContent = S.raw.length;
  },

  _isInitialized: false,

  init() {
    if (this._isInitialized) return;
    this._isInitialized = true;

    this.initResizer();
    
    // Event Delegation for file list
    const list = document.getElementById('md-l');
    list?.addEventListener('click', async (e) => {
      try {
        const delBtn = e.target.closest('.fi-del');
        const item = e.target.closest('.fi');

        // Delete file button
        if (delBtn && item) {
          e.stopPropagation();
          const id = item.dataset.id;
          const msg = S.lang === 'ko' ? '이 문서를 삭제하시겠습니까?' : 'Are you sure you want to delete this document?';
          if (confirm(msg)) {
            await this.deleteDoc(id);
          }
          return;
        }

        // Open document
        if (item) {
          const id = item.dataset.id;
          this.openDoc(id);
        }
      } catch (err) {
        console.error('Error in sidebar click handler:', err);
      }
    });

    // Section Toggle
    ['h-raw', 'h-md'].forEach(id => {
      const h = document.getElementById(id);
      h?.addEventListener('click', () => {
        const sec = h.closest('.sb-sec');
        sec?.classList.toggle('collapsed');
      });
    });

    // Search Filters
    document.querySelectorAll('.sf').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sf').forEach(b => b.classList.remove('act'));
        btn.classList.add('act');
        SEARCH.filter = btn.dataset.f;
        this.render();
      });
    });

    // Search Sort
    document.getElementById('search-sort')?.addEventListener('change', (e) => {
      S.sort = e.target.value;
      this.render();
    });
  },

  openDoc(id) {
    const doc = S.md.find(d => d.id === id);
    if (!doc) return;
    Router.navigate(id);
  },

  async deleteDoc(id) {
    await IDB.deleteDoc(id);
    S.md = S.md.filter(d => d.id !== id);
    S.raw = S.raw.filter(r => r.id !== id);
    if (S.activeDoc?.id === id) {
      const { Editor } = await import('./editor.js');
      Editor.close();
    }
    this.render();
    if (window.updateStorageInfo) window.updateStorageInfo();
  },

  initResizer() {
    const rsz = document.getElementById('rsz');
    if (!rsz) return;
    
    let isMd = false;
    
    const onMouseMove = (e) => {
      if (!isMd) return;
      const w = Math.max(150, Math.min(600, e.clientX));
      document.documentElement.style.setProperty('--sb', w + 'px');
    };
    
    const onMouseUp = () => {
      isMd = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    rsz.addEventListener('mousedown', (e) => {
      isMd = true;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }
};
