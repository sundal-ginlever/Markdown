/**
 * AI API Services
 */
import { S } from '../state/store.js';

export async function aiConvert(fname, fd, textOverride, styleDef, signal) {
  const p = S.ai.provider;
  const prompt = buildPrompt(fname, fd, textOverride, styleDef);

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
    if (!r.ok) throw new Error(`OpenAI Proxy ${r.status}`);
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

function buildPrompt(fname, fd, textOverride, styleDef) {
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
    // Note: In modular version, we'll need to pass the custom prompt from UI
    systemPrompt = styleDef.customPrompt || `Convert the following document to clean, structured Markdown. Output ONLY Markdown.`;
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

export async function callQAApi(userQuestion, activeDoc, history, signal) {
  const p = S.ai.provider;
  const doc = activeDoc;

  const contentLimit = 16000;
  let docContent = doc.content;
  let isTruncated = false;
  if (docContent.length > contentLimit) {
    docContent = docContent.substring(0, contentLimit);
    isTruncated = true;
  }

  const systemPrompt = `You are an expert document analyst and assistant. The user has opened the following document and wants to ask questions about it.

Document Name: ${doc.name}
Conversion Style: ${doc.styleId || 'dev'}
Document Length: ${doc.content.length} characters

--- DOCUMENT CONTENT START ---
${docContent}
--- DOCUMENT CONTENT END ---

${isTruncated ? '[SYSTEM WARNING: The document content provided above has been truncated due to length limits. If the user asks about something not present, explicitly state that it might be in the truncated portion.]' : ''}

Instructions:
- Answer questions based on the document content above
- Be concise but thorough
- Use Markdown formatting in your responses (headers, lists, code blocks as needed)
- If the answer is not in the document, say so clearly
- Respond in the same language the user asks in (Korean or English)`;

  const historyForApi = history.slice(-9).map(m => ({
    role: m.role === 'ai' ? 'assistant' : 'user',
    content: m.content
  }));

  const messages = [
    ...historyForApi,
    { role: 'user', content: userQuestion }
  ];

  if (p === 'claude') {
    const h = { 'Content-Type': 'application/json' };
    if (S.ai.keys.claude) h['x-api-key'] = S.ai.keys.claude;
    const r = await fetch('/api/claude', {
      method: 'POST',
      headers: h,
      signal: signal,
      body: JSON.stringify({
        model: S.ai.models.claude,
        max_tokens: 1000,
        // Prompt caching: the document context is identical across every question
        // in a session, so cache it — repeated reads cost ~1/10 of full input price.
        system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
        messages
      })
    });
    if (!r.ok) throw new Error(`Claude Proxy ${r.status}: ${await r.text()}`);
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
        messages: [{ role: 'system', content: systemPrompt }, ...messages]
      })
    });
    if (!r.ok) throw new Error(`OpenAI Proxy ${r.status}`);
    const d = await r.json();
    return d.choices[0].message.content;
  }

  if (p === 'gemini') {
    const geminiMsgs = [
      { role: 'user', parts: [{ text: systemPrompt + '\n\nUnderstood. I will answer questions about this document.' }] },
      { role: 'model', parts: [{ text: '네, 문서를 읽었습니다. 질문해주세요.' }] }
    ];

    let lastRole = 'model';
    messages.forEach(m => {
      const currentRole = m.role === 'assistant' ? 'model' : 'user';
      const cleanContent = (m.content || '').trim();
      if (!cleanContent) return; // Skip empty content to prevent Gemini 400 Bad Request

      if (currentRole !== lastRole) {
        geminiMsgs.push({
          role: currentRole,
          parts: [{ text: cleanContent }]
        });
        lastRole = currentRole;
      } else {
        // Strict Alternation Guard: Merge consecutive identical roles to preserve context safely
        if (geminiMsgs.length > 0) {
          const lastPart = geminiMsgs[geminiMsgs.length - 1].parts[0];
          lastPart.text = (lastPart.text + '\n\n' + cleanContent).trim();
        }
      }
    });

    const url = '/api/gemini';
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: signal,
      body: JSON.stringify({ model: S.ai.models.gemini, contents: geminiMsgs, apiKey: S.ai.keys.gemini || '' })
    });
    if (!r.ok) {
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
    if (!S.ai.localUrl) throw new Error('Local endpoint not set.');
    const h = { 'Content-Type': 'application/json' };
    if (S.ai.keys.local) h['Authorization'] = 'Bearer ' + S.ai.keys.local;
    const r = await fetch(S.ai.localUrl, {
      method: 'POST',
      headers: h,
      signal: signal,
      body: JSON.stringify({
        model: S.ai.models.local || 'default',
        messages: [{ role: 'system', content: systemPrompt }, ...messages]
      })
    });
    if (!r.ok) throw new Error(`Local API ${r.status}`);
    const d = await r.json();
    return d.choices?.[0]?.message?.content || d.response || JSON.stringify(d);
  }

  throw new Error('Unknown AI provider');
}
