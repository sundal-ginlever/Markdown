export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required (BYOK). Settings에서 키를 설정하세요.' });
  }
  const { model, max_tokens, system, messages, stream } = req.body;

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-haiku-4-5',
        max_tokens: max_tokens || 8192,
        system,
        messages,
        stream: !!stream
      })
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return res.status(upstream.status).send(errText);
    }

    if (stream) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
      });
      for await (const chunk of upstream.body) res.write(chunk);
      return res.end();
    }

    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (error) {
    if (!res.headersSent) return res.status(500).json({ error: error.message });
    return res.end();
  }
}
