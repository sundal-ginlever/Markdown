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

// Custom Renderer for Admonitions and Heading IDs
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
  },

  heading({ text, depth }) {
    // Create a safe, slugified ID from the text content (supporting Korean, English, and numeric slugs)
    const rawText = text.replace(/<[^>]*>/g, ''); // strip HTML tags
    const id = rawText
      .toLowerCase()
      .trim()
      .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣-]/g, '') // Keep letters, numbers, spaces, Korean, and hyphens
      .replace(/[\s_]+/g, '-')                  // Replace spaces and underscores with hyphens
      .replace(/-+/g, '-');                     // Replace multiple hyphens with a single hyphen

    return `<h${depth} id="${id}">${text}</h${depth}>`;
  }
};

marked.use({ renderer });

export function parseMd(s) {
  if (!s) return '';
  
  // Pre-process custom syntax not handled by marked (e.g. Wikilinks, Mark)
  let processed = s;
  
  // ==Highlight==
  processed = processed.replace(/==(.+?)==/g, '<mark class="md-mark">$1</mark>');
  
  // [[Wikilink]] or [[Wikilink|Alias]]
  processed = processed.replace(/\[\[([^\]]+)\]\]/g, (match, content) => {
    const parts = content.split('|');
    const target = parts[0].trim();
    const display = parts[1] ? parts[1].trim() : target;
    return `<a href="#" class="wiki-link" data-target="${target}">[[<span>${display}</span>]]</a>`;
  });

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
