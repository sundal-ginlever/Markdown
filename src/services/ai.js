/**
 * AI API Services
 */
import { S } from '../state/store.js';

// BYOK-only backend: every proxy returns 401 when no client key was sent.
// Surface one clear, localized message instead of raw proxy JSON/text.
function byokError() {
  return new Error(S.lang === 'ko'
    ? 'API 키가 설정되지 않았습니다. ⚙️ 설정에서 API 키를 입력하세요.'
    : 'API key not set. Please enter your API key in ⚙️ Settings.');
}

// Dual-mode Claude request: streams via SSE when the proxy responds with
// text/event-stream, and falls back to a single JSON parse otherwise (e.g. if
// the hosting platform buffers the response). onDelta is optional.
async function claudeRequest(body, signal, onDelta) {
  const h = { 'Content-Type': 'application/json' };
  if (S.ai.keys.claude) h['x-api-key'] = S.ai.keys.claude;

  const r = await fetch('/api/claude', {
    method: 'POST', headers: h, signal, body: JSON.stringify(body)
  });
  if (!r.ok) {
    if (r.status === 401) throw byokError();
    throw new Error(`Claude Proxy ${r.status}: ${await r.text()}`);
  }

  const ct = r.headers.get('content-type') || '';
  if (!ct.includes('text/event-stream')) {
    const d = await r.json();
    return d.content.map(b => b.text || '').join('');
  }

  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = '', full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop(); // carry the last incomplete line into the next loop
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      let ev;
      try { ev = JSON.parse(payload); } catch { continue; }
      if (ev.type === 'content_block_delta' && ev.delta?.text) {
        full += ev.delta.text;
        onDelta?.(ev.delta.text, full);
      } else if (ev.type === 'error') {
        throw new Error(ev.error?.message || 'Stream error');
      }
    }
  }
  return full;
}

// Convert a single chunk of text (or the whole document, if it fits in one chunk).
async function aiConvertSingle(fname, fd, textOverride, styleDef, signal, directive, onDelta, customPrompt) {
  const p = S.ai.provider;
  const prompt = buildPrompt(fname, fd, textOverride, styleDef, customPrompt, directive);

  if (p === 'claude') {
    return await claudeRequest({
      model: S.ai.models.claude || 'claude-haiku-4-5',
      max_tokens: 8192,
      stream: true,
      messages: [{ role: 'user', content: prompt }]
    }, signal, onDelta);
  }

  if (p === 'gpt4') {
    const h = { 'Content-Type': 'application/json' };
    if (S.ai.keys.gpt4) h['Authorization'] = 'Bearer ' + S.ai.keys.gpt4;

    const r = await fetch('/api/openai', {
      method: 'POST',
      headers: h,
      signal: signal,
      body: JSON.stringify({
        model: S.ai.models.gpt4,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 8192
      })
    });
    if (!r.ok) {
      if (r.status === 401) throw byokError();
      throw new Error(`OpenAI Proxy ${r.status}`);
    }
    const d = await r.json();
    return d.choices[0].message.content;
  }

  if (p === 'gemini') {
    const r = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: signal,
      body: JSON.stringify({
        model: S.ai.models.gemini,
        contents: [{ parts: [{ text: prompt }] }],
        apiKey: S.ai.keys.gemini || ''
      })
    });
    if (!r.ok) {
      if (r.status === 401) throw byokError();
      const errJson = await r.json().catch(() => ({}));
      throw new Error(`Gemini Proxy ${r.status}: ${errJson.error?.message || 'Unknown error'}`);
    }
    const d = await r.json();
    if (!d.candidates || d.candidates.length === 0) {
      throw new Error('Gemini returned no candidates. This might be due to safety filters.');
    }
    return d.candidates[0].content.parts.map(x => x.text).join('');
  }

  if (p === 'local') {
    if (!S.ai.localUrl) throw new Error('Local endpoint not set — click 🔑 API Key.');
    const h = { 'Content-Type': 'application/json' };
    if (S.ai.keys.local) h['Authorization'] = 'Bearer ' + S.ai.keys.local;
    const r = await fetch(S.ai.localUrl, {
      method: 'POST',
      headers: h,
      signal: signal,
      body: JSON.stringify({
        model: S.ai.models.local || 'default',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!r.ok) throw new Error(`Local API ${r.status}`);
    const d = await r.json();
    return d.choices?.[0]?.message?.content || d.response || JSON.stringify(d);
  }

  throw new Error('Unknown provider');
}

function buildPrompt(fname, fd, textOverride, styleDef, customPrompt, extraDirective) {
  const ext = fname.split('.').pop().toLowerCase();
  const isSh = fd.type === 'sheet';
  const cnt = fd.cnt || 0;
  const isPdf = fd.type === 'pdf';
  const isDocx = fd.type === 'docx';

  let fileCtx = '';
  if (isPdf && fd.meta?.pages) fileCtx = ` (PDF · ${fd.meta.pages} 페이지)`;
  else if (isDocx) fileCtx = ' (DOCX · Word 문서)';
  else if (isSh) fileCtx = ` (스프레드시트 · ${cnt}개 시트)`;

  let systemPrompt = '';
  if (styleDef.id === 'custom') {
    systemPrompt = customPrompt?.trim() || `Convert the following document to clean, structured Markdown. Output ONLY Markdown.`;
  } else {
    systemPrompt = styleDef.prompt(fname + fileCtx, ext, isSh, cnt);
  }

  const textToConvert = textOverride || fd.text;

  const langDirective = S.lang === 'ko'
    ? '\n\n[OUTPUT LANGUAGE] Write the ENTIRE output document in Korean (한국어), regardless of the source language. Keep code, identifiers, URLs, and proper nouns as-is.'
    : '\n\n[OUTPUT LANGUAGE] Write the entire output document in English.';

  return `${systemPrompt}${langDirective}${extraDirective || ''}
---
CONTENT TO CONVERT:
${textToConvert}
---`;
}

// Split text into chunks along paragraph (blank-line) boundaries, greedily
// packing each chunk up to ~`target` characters. Falls back to a hard split
// for a single overlong block with no blank lines (e.g. a huge table).
const CHUNK_TARGET = 24000;

export function splitIntoChunks(text, target = CHUNK_TARGET) {
  if (!text || text.length <= target) return [text || ''];
  const paras = text.split(/\n{2,}/);
  const chunks = [];
  let buf = '';
  for (const p of paras) {
    const piece = p.trim();
    if (!piece) continue;
    if (piece.length > target) {
      if (buf) { chunks.push(buf); buf = ''; }
      for (let i = 0; i < piece.length; i += target) {
        chunks.push(piece.slice(i, i + target));
      }
      continue;
    }
    if (buf.length + piece.length + 2 > target) {
      chunks.push(buf);
      buf = piece;
    } else {
      buf = buf ? buf + '\n\n' + piece : piece;
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

// Build the per-chunk instruction telling the model which part of the
// document it's converting, so multi-chunk output stitches together cleanly.
function chunkDirective(i, n, prevTail) {
  if (n === 1) return '';
  let d = `\n\n[CHUNK ${i + 1}/${n}] This is part ${i + 1} of ${n} of ONE document. Convert ONLY this part.`;
  if (i === 0) {
    d += ' Start the document normally (title/frontmatter allowed). Do NOT write a conclusion or closing summary.';
  } else if (i === n - 1) {
    d += ' Do NOT repeat the document title or frontmatter. Continue seamlessly from the previous part. You MAY write the closing section.';
  } else {
    d += ' Do NOT repeat the title/frontmatter. Do NOT write a conclusion. Continue seamlessly.';
  }
  if (prevTail) {
    d += `\n[PREVIOUS OUTPUT TAIL — continuity reference only, do NOT repeat it]:\n...${prevTail}`;
  }
  return d;
}

// Convert an arbitrarily long document by splitting it into chunks and
// converting each in sequence (never parallel — each chunk's prompt carries
// continuity context from the previous chunk's output).
export async function aiConvertChunked(fname, fd, textOverride, styleDef, signal, hooks = {}) {
  const { onProgress, onDelta, customPrompt } = hooks;
  const fullText = textOverride || fd.text || '';
  const chunks = splitIntoChunks(fullText);
  const out = [];
  for (let i = 0; i < chunks.length; i++) {
    if (signal?.aborted) throw new Error('Cancelled');
    onProgress?.(i + 1, chunks.length);
    const prevTail = i > 0 ? out[i - 1].slice(-400) : '';
    const directive = chunkDirective(i, chunks.length, prevTail);
    let md;
    try {
      md = await aiConvertSingle(fname, fd, chunks[i], styleDef, signal, directive, onDelta, customPrompt);
    } catch (e) {
      if (e.name === 'AbortError' || e.message === 'Cancelled') throw e;
      // Single retry; a second failure propagates to the caller's per-file error handling.
      md = await aiConvertSingle(fname, fd, chunks[i], styleDef, signal, directive, onDelta, customPrompt);
    }
    out.push((md || '').trim());
  }
  return out.join('\n\n');
}

