/**
 * Full-text Search and Highlighting Service
 */
import { S } from '../state/store.js';

export const SearchService = {
  /**
   * Search documents based on query and scoring
   */
  search(query, docs) {
    if (!query) return docs;
    const q = query.toLowerCase();
    
    return docs
      .map(doc => {
        let score = 0;
        const name = doc.name.toLowerCase();
        const content = doc.content.toLowerCase();
        
        if (name.includes(q)) score += 100;
        if (name === q) score += 500;
        
        const count = (content.match(new RegExp(this.escapeRegExp(q), 'gi')) || []).length;
        score += count * 10;
        
        return { ...doc, _score: score };
      })
      .filter(doc => doc._score > 0)
      .sort((a, b) => b._score - a._score);
  },

  /**
   * Build a search snippet for results
   */
  buildSnippet(content, query, length = 150) {
    if (!query) return '';
    const idx = content.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return content.substring(0, length) + '...';
    
    const start = Math.max(0, idx - 50);
    const end = Math.min(content.length, idx + length);
    let snippet = content.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet += '...';
    
    return snippet;
  },

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  applyHighlights(container, query) {
    if (!query) return;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    
    const escaped = this.escapeRegExp(query);
    nodes.forEach(node => {
      const txt = node.nodeValue;
      const regex = new RegExp(escaped, 'gi');
      if (!regex.test(txt)) return;
      
      // Safe DOM-based replacement (no innerHTML)
      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      txt.replace(new RegExp(`(${escaped})`, 'gi'), (match, p1, offset) => {
        if (offset > lastIdx) {
          frag.appendChild(document.createTextNode(txt.slice(lastIdx, offset)));
        }
        const mark = document.createElement('mark');
        mark.className = 'hl';
        mark.textContent = match;
        frag.appendChild(mark);
        lastIdx = offset + match.length;
        return match;
      });
      if (lastIdx < txt.length) {
        frag.appendChild(document.createTextNode(txt.slice(lastIdx)));
      }
      node.parentNode.replaceChild(frag, node);
    });

    // Collect highlights and update UI
    const marks = Array.from(container.querySelectorAll('mark.hl'));
    import('../state/store.js').then(({ SEARCH }) => {
      SEARCH.activeHls = marks;
      SEARCH.hlIdx = marks.length > 0 ? 0 : -1;
      this.updateHighlightUI();
    });
  },

  updateHighlightUI() {
    import('../state/store.js').then(({ SEARCH }) => {
      const { activeHls, hlIdx } = SEARCH;
      const nav = document.getElementById('hl-nav');
      if (!nav) return;
      if (activeHls.length === 0) {
        nav.style.display = 'none';
        return;
      }
      nav.style.display = 'flex';
      document.getElementById('hl-status').textContent = `${hlIdx + 1}/${activeHls.length}`;
      
      activeHls.forEach((hl, i) => {
        if (i === hlIdx) hl.classList.add('hl-active');
        else hl.classList.remove('hl-active');
      });
      
      if (hlIdx >= 0 && activeHls[hlIdx]) {
        activeHls[hlIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  },

  nextHighlight() {
    import('../state/store.js').then(({ SEARCH }) => {
      if (!SEARCH.activeHls.length) return;
      SEARCH.hlIdx = (SEARCH.hlIdx + 1) % SEARCH.activeHls.length;
      this.updateHighlightUI();
    });
  },
  
  prevHighlight() {
    import('../state/store.js').then(({ SEARCH }) => {
      if (!SEARCH.activeHls.length) return;
      SEARCH.hlIdx = (SEARCH.hlIdx - 1 + SEARCH.activeHls.length) % SEARCH.activeHls.length;
      this.updateHighlightUI();
    });
  }
};
