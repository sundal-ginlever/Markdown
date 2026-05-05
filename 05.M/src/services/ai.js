/**
 * AI API Services
 */
import { S } from '../state/store.js';

export async function aiConvert(fname, fd, textOverride, styleDef) {
  const p = S.ai.provider;
  const prompt = buildPrompt(fname, fd, textOverride, styleDef);

  if (p === 'claude') {
    const h = { 'Content-Type': 'application/json' };
    if (S.ai.keys.claude) h['x-api-key'] = S.ai.keys.claude;

    const r = await fetch('/api/claude', {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        model: S.ai.models.claude || 'claude-3-5-sonnet-20240620',
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
    const url = `/api/gemini${S.ai.keys.gemini ? '?key=' + S.ai.keys.gemini : ''}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: S.ai.models.gemini,
        contents: [{ parts: [{ text: prompt }] }]
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

  const textToConvert = textOverride || fd.text.substring(0, 30000);

  return `${systemPrompt}

---
CONTENT TO CONVERT:
${textToConvert}
---`;
}

export async function callQAApi(userQuestion, activeDoc, history) {
  const p = S.ai.provider;
  const doc = activeDoc;

  const systemPrompt = `You are an expert document analyst and assistant. The user has opened the following document and wants to ask questions about it.

Document Name: ${doc.name}
Conversion Style: ${doc.styleId || 'dev'}
Document Length: ${doc.content.length} characters

--- DOCUMENT CONTENT START ---
${doc.content.substring(0, 16000)}
--- DOCUMENT CONTENT END ---

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
      body: JSON.stringify({
        model: S.ai.models.claude,
        max_tokens: 1000,
        system: systemPrompt,
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
      { role: 'model', parts: [{ text: '네, 문서를 읽었습니다. 질문해주세요.' }] },
      ...messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
    ];
    const url = `/api/gemini${S.ai.keys.gemini ? '?key=' + S.ai.keys.gemini : ''}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: S.ai.models.gemini, contents: geminiMsgs })
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
