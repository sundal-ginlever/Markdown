/**
 * Sidebar and File List Component
 */
import { S, SEARCH } from '../state/store.js';
import { t } from '../utils/i18n.js';
import { Viewer } from './viewer.js';
import { QAPanel } from './qaPanel.js';
import { SearchService } from '../services/search.js';

export const Sidebar = {
  render() {
    const el = document.getElementById('md-l');
    if (!el) return;
    
    let filtered = S.md;
    if (SEARCH.query) {
      filtered = SearchService.search(SEARCH.query, S.md);
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
          </div>
          ${snippet}
        </div>
      `;
    }).join('');
  },

  init() {
    this.initResizer();
    
    // Event Delegation for file list
    const list = document.getElementById('md-l');
    list?.addEventListener('click', (e) => {
      const item = e.target.closest('.fi');
      if (item) {
        const id = item.dataset.id;
        this.openDoc(id);
      }
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
