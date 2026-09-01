const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// This key's Gemini quota is tight enough that a single non-English chat
// request (translate-in + embed + translate-out = 3 calls back to back) or a
// multi-chunk document upload reliably hits 429 (confirmed while testing both
// paths). Every Gemini call goes through this retry so any endpoint that
// calls embedText/generateAnswer gets the same protection automatically.
// ponytail: 3-attempt linear backoff is a ceiling; switch to a queue/rate
// limiter if requests still 429 under real traffic.
async function fetchWithRetry(url, options, attempt = 1) {
  const res = await fetch(url, options);

  if (res.status === 429 && attempt < 4) {
    await sleep(attempt * 5000);
    return fetchWithRetry(url, options, attempt + 1);
  }

  return res;
}

// text-embedding-004 is retired for this API key's account; gemini-embedding-001
// is the current replacement. It defaults to 3072 dimensions, so
// outputDimensionality pins it to 768 to match the documents.embedding column.
async function embedText(text) {
  const res = await fetchWithRetry(
    `${BASE_URL}/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-embedding-001',
        content: { parts: [{ text }] },
        outputDimensionality: 768,
      }),
    }
  );

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini embedText failed (${res.status}): ${errBody}`);
  }

  const data = await res.json();
  return data.embedding.values;
}

// gemini-1.5-flash is retired for this API key's account; gemini-3.6-flash
// is the model Google's own 404 response recommended as the replacement.
async function generateAnswer(prompt) {
  const res = await fetchWithRetry(
    `${BASE_URL}/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
      }),
    }
  );

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini generateAnswer failed (${res.status}): ${errBody}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(`Gemini generateAnswer returned no text: ${JSON.stringify(data)}`);
  }
  return text.trim();
}

async function translateText(text, targetLanguage) {
  const prompt = `Translate the following text to ${targetLanguage}. Return ONLY the translated text, nothing else, no explanation: ${text}`;
  return generateAnswer(prompt);
}

module.exports = { embedText, generateAnswer, translateText };
