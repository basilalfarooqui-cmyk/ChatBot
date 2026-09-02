const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// No timeout on the raw fetch calls meant a genuinely hung request (Gemini
// overloaded but not returning a clean error) would wait forever -- the
// request only died when Railway's own ~5min proxy timeout killed the
// connection, giving the user a multi-minute hang instead of a fast retry
// or fallback. This caps every attempt so a hang fails fast instead.
const FETCH_TIMEOUT_MS = 20000;

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
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
  const res = await fetchWithTimeout(url, options);

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
// gemini-2.5-flash is confirmed retired (404) for this key -- dropped, it
// was pure wasted time on every single call. Padded the list further since
// all 4 previous entries have been observed failing simultaneously (one
// exhausted, one retired, two hung) during a single real request.
const GENERATION_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
];

async function attemptModel(model, parts) {
  const startedAt = Date.now();
  let res;
  try {
    res = await fetchWithTimeout(`${BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      }),
    });
  } catch (networkErr) {
    console.log(`[gemini] ${model} threw after ${Date.now() - startedAt}ms: ${networkErr.message}`);
    throw networkErr;
  }

  console.log(`[gemini] ${model} responded ${res.status} in ${Date.now() - startedAt}ms`);

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini ${model} failed (${res.status}): ${errBody}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`Gemini ${model} returned no text: ${JSON.stringify(data)}`);
  return text.trim();
}

// A strictly sequential fallback meant one hung model (no error, just slow)
// blocked every model after it from even starting -- confirmed live: a 20s
// timeout on one model added a full 20s of dead time before the next model,
// which would have succeeded in 15s, ever got a chance to run. Racing them
// instead means total latency is bounded by whichever model finishes first,
// not the sum of every failed/hung attempt before it. Different models have
// separate quotas, so running them concurrently doesn't reintroduce the
// same-model quota race the queue below still guards against.
function raceModels(parts, models = GENERATION_MODELS) {
  return withQueue(async () => {
    const attempts = models.map(
      (model, i) =>
        new Promise((resolve, reject) => {
          // Small stagger so a fast 429 (quota exhausted) on an earlier
          // model can be seen before piling every model's request on at
          // once -- not required for correctness, just avoids needlessly
          // spamming every model when the first one would've failed fast.
          setTimeout(() => attemptModel(model, parts).then(resolve, reject), i * 500);
        })
    );

    try {
      return await Promise.any(attempts);
    } catch (aggregateErr) {
      const messages = (aggregateErr.errors ?? [aggregateErr]).map(e => e.message).join(' | ');
      throw new Error(`All Gemini models failed: ${messages}`);
    }
  });
}

async function generateAnswer(prompt) {
  return raceModels([{ text: prompt }]);
}

async function translateText(text, targetLanguage) {
  const prompt = `Translate the following text to ${targetLanguage}. Return ONLY the translated text, nothing else, no explanation: ${text}`;
  return generateAnswer(prompt);
}

// "lite"/"preview" model variants are reduced-capability and confirmed bad
// at this specifically: gemini-3.1-flash-lite returned 200 OK but just
// echoed the raw audio bytes back as garbled text instead of transcribing
// it -- no error, just wrong output, which is worse than a clean failure.
// Restrict audio transcription to the full flash models, which are
// documented as fully multimodal.
const TRANSCRIPTION_MODELS = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];

// Same multimodal generateContent endpoint the text models use -- Gemini
// accepts an audio part alongside the text prompt and transcribes it
// directly, so this reuses the exact same model-racing/fallback machinery
// as generateAnswer instead of needing a separate dedicated STT provider.
async function transcribeAudio(base64Audio, mimeType, languageHint) {
  const languageLine = languageHint ? ` The speaker is using ${languageHint}.` : '';
  return raceModels(
    [
      { text: `Transcribe exactly what is said in this audio.${languageLine} Return ONLY the transcribed text, nothing else, no explanation.` },
      { inlineData: { mimeType, data: base64Audio } },
    ],
    TRANSCRIPTION_MODELS
  );
}

// Gemini's TTS models return raw PCM samples (no container/header), not a
// standard playable audio file -- the caller wraps this into a WAV file.
const TTS_MODELS = ['gemini-2.5-flash-preview-tts', 'gemini-2.5-pro-preview-tts', 'gemini-3.1-flash-tts-preview'];

async function attemptTts(model, text) {
  const startedAt = Date.now();
  const res = await fetchWithTimeout(`${BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    }),
  });

  console.log(`[gemini-tts] ${model} responded ${res.status} in ${Date.now() - startedAt}ms`);

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini TTS ${model} failed (${res.status}): ${errBody}`);
  }

  const data = await res.json();
  const part = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!part) throw new Error(`Gemini TTS ${model} returned no audio: ${JSON.stringify(data)}`);
  return { base64Pcm: part.data, mimeType: part.mimeType };
}

async function synthesizeSpeech(text) {
  return withQueue(async () => {
    const attempts = TTS_MODELS.map(
      (model, i) =>
        new Promise((resolve, reject) => {
          setTimeout(() => attemptTts(model, text).then(resolve, reject), i * 500);
        })
    );

    try {
      return await Promise.any(attempts);
    } catch (aggregateErr) {
      const messages = (aggregateErr.errors ?? [aggregateErr]).map(e => e.message).join(' | ');
      throw new Error(`All Gemini TTS models failed: ${messages}`);
    }
  });
}

module.exports = { embedText, generateAnswer, translateText, transcribeAudio, synthesizeSpeech };
