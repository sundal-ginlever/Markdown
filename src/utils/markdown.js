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
    let cleanText = text.trim();
    const isParagraphWrapped = cleanText.startsWith('<p>') && cleanText.endsWith('</p>');
    
    // Extract Admonition tag regardless of multiple paragraphs
    const admonitionRegex = /^(?:<p>)?\[!(NOTE|TIP|WARNING|IMPORTANT|INFO)\](.*?)(?:\n|<br>|<\/p>)/i;
    const match = cleanText.match(admonitionRegex);
    
    if (match) {
      const type = match[1].toUpperCase();
      const title = match[2].trim();
      
      let body = cleanText.substring(match[0].length).trim();
      
      // If it was paragraph wrapped and body doesn't end with </p>, ensure it closes properly
      if (isParagraphWrapped && !body.endsWith('</p>') && body.length > 0) {
        body = body + '</p>';
      }
      // If the header match stripped <p> but body has the rest, restore the opening <p> tag
      if (match[0].startsWith('<p>') && !body.startsWith('<p>') && body.length > 0) {
        body = '<p>' + body;
      }

      const icons = { NOTE: 'ℹ️', TIP: '💡', WARNING: '⚠️', IMPORTANT: '🔴', INFO: 'ℹ️' };
      const colors = { NOTE: 'var(--acc)', TIP: 'var(--grn)', WARNING: 'var(--yel)', IMPORTANT: 'var(--red)', INFO: 'var(--acc)' };
      
      return `<blockquote class="admonition" style="border-left-color:${colors[type]}">
        <strong>${icons[type]} ${type}${title ? ': ' + title : ''}</strong>
        <div>${body}</div>
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

const wikiLinkExtension = {
  name: 'wikilink',
  level: 'inline',
  start(src) { return src.match(/\[\[/)?.index; },
  tokenizer(src, tokens) {
    const rule = /^\[\[([^\]]+)\]\]/;
    const match = rule.exec(src);
    if (match) {
      const parts = match[1].split('|');
      const target = parts[0].trim();
      const display = parts[1] ? parts[1].trim() : target;
      return {
        type: 'wikilink',
        raw: match[0],
        target: target,
        display: display
      };
    }
  },
  renderer(token) {
    return `<a href="#" class="wiki-link" data-target="${token.target}">[[<span>${token.display}</span>]]</a>`;
  }
};

const highlightExtension = {
  name: 'highlight',
  level: 'inline',
  start(src) { return src.match(/==/)?.index; },
  tokenizer(src, tokens) {
    const rule = /^==([^=]+)==/;
    const match = rule.exec(src);
    if (match) {
      return {
        type: 'highlight',
        raw: match[0],
        text: match[1]
      };
    }
  },
  renderer(token) {
    return `<mark class="md-mark">${token.text}</mark>`;
  }
};

marked.use({ extensions: [wikiLinkExtension, highlightExtension] });

export function parseMd(s) {
  if (!s) return '';
  
  // Convert to HTML
  const rawHtml = marked.parse(s);
  
  // Sanitize
  return DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: ['mark'],
    ADD_ATTR: ['target', 'rel', 'data-target', 'class', 'style']
  });
}

export function renderQAMarkdown(s) {
  return parseMd(s);
}
