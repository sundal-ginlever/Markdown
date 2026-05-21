/**
 * Sidebar and File List Component
 */
import { S, SEARCH } from '../state/store.js';
import { t } from '../utils/i18n.js';
import { IDB } from '../services/db.js';
import { Viewer } from './viewer.js';
import { QAPanel } from './qaPanel.js';
import { SearchService } from '../services/search.js';

export const Sidebar = {
  render() {
    this.renderMD();
    this.renderRaw();
  },

  renderMD() {
    const el = document.getElementById('md-l');
    if (!el) return;
    
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

    if (SEARCH.query) {
      filtered = SearchService.search(SEARCH.query, filtered);
    }

    if (!filtered.length) {
      el.innerHTML = `<div class="emp">${t('empty_md')}</div>`;
      return;
    }

    el.innerHTML = filtered.map(f => {
      const isAct = S.activeDoc?.id === f.id;
      const snippet = SEARCH.query ? `<div class="fi-snip">${SearchService.buildSnippet(f.content, SEARCH.query)}</div>` : '';
      return `
        <div class="fi ${isAct ? 'act' : ''}" data-id="${f.id}">
          <div class="fi-main">
            <span class="fi-ico">🗒</span>
            <span class="fi-nm">${f.name}</span>
            <button class="fi-del" title="삭제">✕</button>
          </div>
          ${snippet}
        </div>
      `;
    }).join('');
    
    const countEl = document.getElementById('md-cnt');
    if (countEl) countEl.textContent = filtered.length;
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
          <span class="fi-nm">${f.name}</span>
        </div>
      </div>
    `).join('');

    const rawCntEl = document.getElementById('raw-cnt');
    if (rawCntEl) rawCntEl.textContent = S.raw.length;
  },

  init() {
    this.initResizer();
    
    // Event Delegation for file list
    const list = document.getElementById('md-l');
    list?.addEventListener('click', (e) => {
      const delBtn = e.target.closest('.fi-del');
      const item = e.target.closest('.fi');
      
      if (delBtn && item) {
        e.stopPropagation();
        const id = item.dataset.id;
        if (confirm('이 문서를 삭제하시겠습니까?')) {
          this.deleteDoc(id);
        }
        return;
      }

      if (item) {
        const id = item.dataset.id;
        this.openDoc(id);
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
    S.activeDoc = doc;
    Viewer.render();
    this.render();
    QAPanel.render();
  },

  async deleteDoc(id) {
    await IDB.deleteDoc(id);
    S.md = S.md.filter(d => d.id !== id);
    if (S.activeDoc?.id === id) {
      const { Editor } = await import('./editor.js');
      Editor.close();
    }
    this.render();
  },

  initResizer() {
    const rsz = document.getElementById('rsz');
    let isMd = false;
    rsz?.addEventListener('mousedown', () => isMd = true);
    document.addEventListener('mousemove', (e) => {
      if (!isMd) return;
      const w = Math.max(150, Math.min(600, e.clientX));
      document.documentElement.style.setProperty('--sb', w + 'px');
    });
    document.addEventListener('mouseup', () => isMd = false);
  }
};
