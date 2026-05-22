/**
 * Professional Markdown Parsing and Rendering Utility
 * Uses marked.js for core parsing and DOMPurify for XSS protection.
 */
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure Marked
marked.setOptions({
  gfm: true,
  breaks: true
});

// Custom Renderer for Admonitions (Github style)
const renderer = {
  blockquote({ text }) {
    // In marked v11+, the argument is a token object
    const admonitionMatch = text.match(/^<p>\[!(NOTE|TIP|WARNING|IMPORTANT|INFO)\](.*?)\n?([\s\S]*?)<\/p>$/i) || 
                            text.match(/^\[!(NOTE|TIP|WARNING|IMPORTANT|INFO)\](.*?)\n?([\s\S]*)$/i);
    if (admonitionMatch) {
      const type = admonitionMatch[1].toUpperCase();
      const title = admonitionMatch[2].trim();
      const body = admonitionMatch[3].trim();
      const icons = { NOTE: 'ℹ️', TIP: '💡', WARNING: '⚠️', IMPORTANT: '🔴', INFO: 'ℹ️' };
      const colors = { NOTE: 'var(--acc)', TIP: 'var(--grn)', WARNING: 'var(--yel)', IMPORTANT: 'var(--red)', INFO: 'var(--acc)' };
      return `<blockquote class="admonition" style="border-left-color:${colors[type]}">
        <strong>${icons[type]} ${type}${title ? ': ' + title : ''}</strong>
        <p>${body}</p>
      </blockquote>`;
    }
    return `<blockquote>${text}</blockquote>`;
  }
};

marked.use({ renderer });

export function parseMd(s) {
  if (!s) return '';
  
  // Pre-process custom syntax not handled by marked (e.g. Wikilinks, Mark)
  let processed = s;
  
  // ==Highlight==
  processed = processed.replace(/==(.+?)==/g, '<mark class="md-mark">$1</mark>');
  
  // [[Wikilink]]
  processed = processed.replace(/\[\[([^\]]+)\]\]/g, '<a href="#" class="wiki-link">[[<span>$1</span>]]</a>');

  // Convert to HTML
  const rawHtml = marked.parse(processed);
  
  // Sanitize
  return DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: ['mark'],
    ADD_ATTR: ['target', 'rel']
  });
}

export function renderQAMarkdown(s) {
  return parseMd(s);
}
