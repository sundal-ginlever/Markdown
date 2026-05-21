/**
 * Document Viewer Component
 */
import { S } from '../state/store.js';
import { parseMd } from '../utils/markdown.js';
import { SEARCH } from '../state/store.js';
import { SearchService } from '../services/search.js';

export const Viewer = {
  render() {
    const el = document.getElementById('mdv');
    if (!el || !S.activeDoc) return;
    el.innerHTML = parseMd(S.activeDoc.content);
    
    // Apply search highlights if query exists
    if (SEARCH.query) {
      SearchService.applyHighlights(el, SEARCH.query);
    }
    
    // Update toolbar
    document.getElementById('dp-name').textContent = S.activeDoc.name;
    document.getElementById('doc-tb').style.display = 'flex';
    document.getElementById('wlc-a').style.display = 'none';
    document.getElementById('view-a').style.display = 'block';

    const badge = document.getElementById('doc-style-badge');
    if (badge && S.activeDoc) {
      import('../state/store.js').then(({ STYLES }) => {
        const st = STYLES.find(s => s.id === S.activeDoc.styleId) || STYLES[0];
        badge.innerHTML = `<span class="style-tag ${st.cls}" style="color:${st.color};border:1px solid ${st.color};padding:2px 6px;border-radius:4px;font-size:10px;cursor:pointer">${st.icon} ${st.name} (재변환)</span>`;
        badge.style.display = 'flex';
        badge.onclick = () => {
           import('./ui.js').then(({ UI }) => UI.toast('재변환 기능은 준비중입니다.', 'info'));
        };
      });
    }
  }
};
