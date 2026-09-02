const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// This key's Gemini quota is tight enough that retries alone aren't
// sufficient: confirmed by testing that 3 concurrent chat requests each
// exhaust their own retries independently and all fail, because they're
// competing for the same tiny per-minute quota at once. Serializing every
// Gemini call through this queue means only one request is ever in flight,
// so the retry backoff below actually has quota to recover into instead of
// being drowned out by parallel retry storms.
// ponytail: single global FIFO queue, no priority/timeout -- upgrade to a
// proper rate limiter (or just a bigger quota) if concurrent traffic grows
// enough that requests start queueing for a long time.
let queueTail = Promise.resolve();

function withQueue(task) {
  const result = queueTail.then(task, task);
  queueTail = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

async function fetchWithRetry(url, options, attempt = 1) {
  const res = await fetch(url, options);

  if (res.status === 429 && attempt < 4) {
    await sleep(attempt * 5000);
    return fetchWithRetry(url, options, attempt + 1);
  }

  return res;
}

function queuedFetchWithRetry(url, options) {
  return withQueue(() => fetchWithRetry(url, options));
}

// text-embedding-004 is retired for this API key's account; gemini-embedding-001
// is the current replacement. It defaults to 3072 dimensions, so
// outputDimensionality pins it to 768 to match the documents.embedding column.
async function embedText(text) {
  const res = await queuedFetchWithRetry(
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
// This flow only needs correct instruction-following, not any one model's
// specific quality/speed -- so on quota exhaustion (429) or retirement
// (404) it falls through to the next model in the list, which has its own
// separate daily quota. Order is newest-first (best chance of being live).
const GENERATION_MODELS = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-2.5-flash'];

async function generateAnswer(prompt) {
  let lastError;

  for (const model of GENERATION_MODELS) {
    let res;
    try {
      res = await withQueue(() =>
        fetch(`${BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
          }),
        })
      );
    } catch (networkErr) {
      // Network-level failure (DNS, connection reset, etc) -- not an HTTP
      // error response, so it never reaches the status-code checks below.
      // Worth trying the next model rather than aborting the whole request.
      lastError = networkErr;
      continue;
    }

    if (res.ok) {
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text.trim();
      lastError = new Error(`Gemini ${model} returned no text: ${JSON.stringify(data)}`);
      continue;
    }

    const errBody = await res.text();
    lastError = new Error(`Gemini ${model} failed (${res.status}): ${errBody}`);
    // 429 (quota), 404 (retired), 503 (temporarily overloaded) -- all worth
    // trying the next model for. Anything else is a real error.
    if (res.status !== 429 && res.status !== 404 && res.status !== 503) throw lastError;
  }

  throw lastError;
}

async function translateText(text, targetLanguage) {
  const prompt = `Translate the following text to ${targetLanguage}. Return ONLY the translated text, nothing else, no explanation: ${text}`;
  return generateAnswer(prompt);
}

module.exports = { embedText, generateAnswer, translateText };
