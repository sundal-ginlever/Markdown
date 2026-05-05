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
    
    nodes.forEach(node => {
      const txt = node.nodeValue;
      const regex = new RegExp(`(${this.escapeRegExp(query)})`, 'gi');
      if (regex.test(txt)) {
        const span = document.createElement('span');
        span.innerHTML = txt.replace(regex, '<mark class="hl">$1</mark>');
        node.parentNode.replaceChild(span, node);
      }
    });
  }
};
