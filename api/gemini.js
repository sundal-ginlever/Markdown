export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { model, contents } = req.body;
  const clientKey = req.query.key; // Often passed in URL for Gemini
  const serverKey = process.env.GOOGLE_API_KEY;
  const apiKey = serverKey || clientKey;

  if (!apiKey) {
    return res.status(400).json({ error: 'API Key is missing' });
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
      return res.status(response.status).send(errorData);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
