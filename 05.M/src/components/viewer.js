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
  }
};
