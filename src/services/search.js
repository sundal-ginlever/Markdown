/**
 * Full-text Search and Highlighting Service
 */
import { S, SEARCH } from '../state/store.js';

export const SearchService = {
  activeHls: [], // Local non-reactive DOM cache to prevent GC leakage and native Proxy wrapping

  /**
   * Search documents based on query and scoring
   */
  search(query, docs) {
    if (!query) return docs;
    const q = query.toLowerCase();
    
    return docs
      .map(doc => {
        let score = 0;
        const name = (doc.name || '').toLowerCase();
        const content = (doc.content || '').toLowerCase();
        
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
   * Build a search snippet for results (XSS Safe)
   */
  buildSnippet(content, query, length = 150) {
    if (!content || !query) return '';
    const idx = content.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return this.escapeHtml(content.substring(0, length) + '...');
    
    const start = Math.max(0, idx - 50);
    const end = Math.min(content.length, idx + length);
    let snippet = content.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet += '...';
    
    return this.escapeHtml(snippet);
  },

  escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
  },

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  applyHighlights(container, query) {
    this.clearHighlights(container);
    if (!query) return;
    const filter = {
      acceptNode(node) {
        let parent = node.parentNode;
        while (parent && parent !== container) {
          const tag = parent.tagName ? parent.tagName.toLowerCase() : '';
          if (tag === 'pre' || tag === 'code') {
            return NodeFilter.FILTER_REJECT;
          }
          parent = parent.parentNode;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    };
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, filter, false);
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
    this.activeHls = marks;
    
    if (marks.length === 0) {
      SEARCH.hlIdx = -1;
      SEARCH.hlCount = 0;
    } else {
      SEARCH.hlCount = marks.length;
      if (SEARCH.hlIdx >= marks.length || SEARCH.hlIdx < 0) {
        SEARCH.hlIdx = 0;
      }
    }
    this.updateHighlightUI();
  },

  updateHighlightUI() {
    const { hlIdx } = SEARCH;
    const nav = document.getElementById('hl-nav');
    if (!nav) return;
    
    // Safety Filter: Keep only DOM-attached highlight elements
    const validHls = this.activeHls.filter(hl => document.contains(hl));
    if (validHls.length !== this.activeHls.length) {
      this.activeHls = validHls;
      SEARCH.hlCount = validHls.length;
      if (validHls.length === 0) {
        SEARCH.hlIdx = -1;
        nav.style.display = 'none';
        return;
      }
      if (SEARCH.hlIdx >= validHls.length || SEARCH.hlIdx < 0) {
        SEARCH.hlIdx = 0;
      }
    }
    
    const currentHls = this.activeHls;
    const currentIdx = SEARCH.hlIdx;
    
    if (currentHls.length === 0) {
      nav.style.display = 'none';
      return;
    }
    
    nav.style.display = 'flex';
    document.getElementById('hl-status').textContent = `${currentIdx + 1}/${currentHls.length}`;
    
    currentHls.forEach((hl, i) => {
      if (i === currentIdx) hl.classList.add('hl-active');
      else hl.classList.remove('hl-active');
    });
    
    if (currentIdx >= 0 && currentHls[currentIdx] && document.contains(currentHls[currentIdx])) {
      currentHls[currentIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  clearHighlights(container) {
    if (!container) return;
    const marks = Array.from(container.querySelectorAll('mark.hl'));
    marks.forEach(mark => {
      const parent = mark.parentNode;
      if (parent) {
        while (mark.firstChild) {
          parent.insertBefore(mark.firstChild, mark);
        }
        parent.removeChild(mark);
      }
    });
    container.normalize();
    
    this.activeHls = [];
    SEARCH.hlIdx = -1;
    SEARCH.hlCount = 0;
    const nav = document.getElementById('hl-nav');
    if (nav) nav.style.display = 'none';
  },

  nextHighlight() {
    if (!this.activeHls.length) return;
    SEARCH.hlIdx = (SEARCH.hlIdx + 1) % this.activeHls.length;
    this.updateHighlightUI();
  },
  
  prevHighlight() {
    if (!this.activeHls.length) return;
    SEARCH.hlIdx = (SEARCH.hlIdx - 1 + this.activeHls.length) % this.activeHls.length;
    this.updateHighlightUI();
  }
};
