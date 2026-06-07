export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { model, max_tokens, system, messages, stream } = req.body;
  const clientKey = req.headers['x-api-key'];
  const serverKey = process.env.ANTHROPIC_API_KEY;
  const apiKey = serverKey || clientKey;

  if (!apiKey) {
    return res.status(400).json({ error: 'API Key is missing' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-haiku-4-5',
        max_tokens: max_tokens || 4096,
        system,
        messages,
        stream: stream || false
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      return res.status(response.status).send(errorData);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
