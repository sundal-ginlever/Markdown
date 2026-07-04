export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { model, contents, apiKey: bodyKey } = req.body;
  const apiKey = bodyKey || req.query.key;

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required (BYOK). Settings에서 키를 설정하세요.' });
  }

  const modelId = model || 'gemini-1.5-pro';

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${modelId}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ contents })
    });

    if (!response.ok) {
      const errorData = await response.text();
      try {
        const jsonError = JSON.parse(errorData);
        return res.status(response.status).json(jsonError);
      } catch (e) {
        return res.status(response.status).json({ error: errorData });
      }
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
