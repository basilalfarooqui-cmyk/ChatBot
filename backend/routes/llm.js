const express = require('express');
const { embedText, generateAnswer } = require('../services/gemini');
const { searchDocuments, buildPrompt } = require('../services/rag');

const router = express.Router();

const MODEL_NAME = 'sih-chatbot-rag';
const SIMILARITY_THRESHOLD = 0.3;
const AUTH_TOKEN = process.env.CUSTOM_LLM_SECRET;

// Bolna's voice agent authenticates with a Bearer token, same as calling
// real OpenAI -- this is a secret we chose ourselves (CUSTOM_LLM_SECRET),
// pasted into Bolna's "Add your own LLM" dialog as its API key. Doubles as
// this endpoint's only auth, so no request reaches Gemini/Supabase without it.
router.use((req, res, next) => {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!AUTH_TOKEN || token !== AUTH_TOKEN) {
    return res.status(401).json({ error: { message: 'Invalid API key' } });
  }
  next();
});

// Bolna checks this once when you add the custom LLM, to confirm the model
// name you typed in its dashboard actually exists on this server.
router.get('/models', (req, res) => {
  res.json({
    object: 'list',
    data: [{ id: MODEL_NAME, object: 'model', created: 0, owned_by: 'sih26088' }],
  });
});

// Bolna's voice agent calls this exactly like OpenAI's chat completions API
// on every conversation turn, sending the full message history. We only use
// the latest user turn, running it through the same RAG pipeline as the
// app's text chat (embed -> search -> prompt -> generate), then stream the
// answer back in the required OpenAI SSE delta format.
// ponytail: this sends the whole answer as one chunk, not real token-by-
// token streaming (our Gemini calls aren't streaming-based) -- valid per
// the OpenAI SSE protocol, but the caller hears nothing until the full RAG
// answer is ready. Upgrade to Gemini's streamGenerateContent if live-call
// latency becomes a real complaint.
router.post('/chat/completions', async (req, res) => {
  try {
    const { messages = [] } = req.body;
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    const userText = lastUserMessage?.content;

    if (typeof userText !== 'string' || userText.trim().length === 0) {
      return res.status(400).json({ error: { message: 'No user message found.' } });
    }

    const queryEmbedding = await embedText(userText);
    const retrievedChunks = await searchDocuments(queryEmbedding, 5);
    const relevantChunks = retrievedChunks.filter(c => c.similarity >= SIMILARITY_THRESHOLD);
    const prompt = buildPrompt(userText, relevantChunks);
    const answer = await generateAnswer(prompt);

    const id = `chatcmpl-${Date.now()}`;
    const created = Math.floor(Date.now() / 1000);

    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    res.write(
      `data: ${JSON.stringify({
        id,
        object: 'chat.completion.chunk',
        created,
        model: MODEL_NAME,
        choices: [{ index: 0, delta: { role: 'assistant', content: answer }, finish_reason: null }],
      })}\n\n`
    );

    res.write(
      `data: ${JSON.stringify({
        id,
        object: 'chat.completion.chunk',
        created,
        model: MODEL_NAME,
        choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
      })}\n\n`
    );

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('POST /v1/chat/completions error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: { message: 'Failed to generate response.' } });
    } else {
      res.end();
    }
  }
});

module.exports = router;
