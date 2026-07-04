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

export async function aiConvert(fname, fd, textOverride, styleDef, signal, customPrompt) {
  const p = S.ai.provider;
  const prompt = buildPrompt(fname, fd, textOverride, styleDef, customPrompt);

  if (p === 'claude') {
    const h = { 'Content-Type': 'application/json' };
    if (S.ai.keys.claude) h['x-api-key'] = S.ai.keys.claude;

    const r = await fetch('/api/claude', {
      method: 'POST',
      headers: h,
      signal: signal,
      body: JSON.stringify({
        model: S.ai.models.claude || 'claude-haiku-4-5',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!r.ok) {
      if (r.status === 401) throw byokError();
      const errTxt = await r.text();
      throw new Error(`Claude Proxy ${r.status}: ${errTxt}`);
    }
    const d = await r.json();
    return d.content.map(b => b.text || '').join('');
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
        max_tokens: 4096
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

function buildPrompt(fname, fd, textOverride, styleDef, customPrompt) {
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

  let isTruncated = false;
  let textToConvert = textOverride || fd.text;
  if (textToConvert.length > 30000) {
    textToConvert = textToConvert.substring(0, 30000);
    isTruncated = true;
  }

  const langDirective = S.lang === 'ko'
    ? '\n\n[OUTPUT LANGUAGE] Write the ENTIRE output document in Korean (한국어), regardless of the source language. Keep code, identifiers, URLs, and proper nouns as-is.'
    : '\n\n[OUTPUT LANGUAGE] Write the entire output document in English.';

  return `${systemPrompt}${langDirective}
${isTruncated ? '\n[SYSTEM WARNING: The original document was too long and has been truncated. Please convert the provided portion and note that it is incomplete.]\n' : ''}
---
CONTENT TO CONVERT:
${textToConvert}
---`;
}

