const express = require('express');
const { embedText, streamAnswer, translateText } = require('../services/gemini');
const { searchDocuments, buildPrompt, SIMILARITY_THRESHOLD, MATCH_COUNT } = require('../services/rag');

const router = express.Router();

const MODEL_NAME = 'sih-chatbot-rag';
const AUTH_TOKEN = process.env.CUSTOM_LLM_SECRET;

// Same TEMPORARY DEMO OVERRIDE as the app's /api/chat -- see that file's
// comment for the full reasoning. Forces every call answer to one fixed
// language regardless of what the caller actually spoke, since buildPrompt's
// language-matching instruction is unreliable while all 4 reliable Gemini
// models are quota-exhausted. Change FORCE_LANGUAGE in Railway's Variables
// tab to switch languages between takes.
const FORCE_LANGUAGE = process.env.FORCE_LANGUAGE || 'English';

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
// app's text chat (embed -> search -> prompt). While FORCE_LANGUAGE is
// active (see above), the full answer is collected and translated before
// sending -- real token-by-token streaming is temporarily off in exchange
// for guaranteed language correctness; remove the override to restore it.
router.post('/chat/completions', async (req, res) => {
  const id = `chatcmpl-${Date.now()}`;
  const created = Math.floor(Date.now() / 1000);

  try {
    const { messages = [] } = req.body;
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    const userText = lastUserMessage?.content;

    if (typeof userText !== 'string' || userText.trim().length === 0) {
      return res.status(400).json({ error: { message: 'No user message found.' } });
    }

    const queryEmbedding = await embedText(userText);
    const retrievedChunks = await searchDocuments(queryEmbedding, MATCH_COUNT);
    const relevantChunks = retrievedChunks.filter(c => c.similarity >= SIMILARITY_THRESHOLD);
    // buildPrompt itself now instructs Gemini to reply in the caller's own
    // language -- a no-op for the app's text chat (which always sends it
    // pre-translated English) but essential here, since Bolna sends whatever
    // language the caller actually spoke with no translation step.
    const prompt = buildPrompt(userText, relevantChunks);

    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    const chunk = (delta, finish_reason = null) =>
      res.write(
        `data: ${JSON.stringify({
          id,
          object: 'chat.completion.chunk',
          created,
          model: MODEL_NAME,
          choices: [{ index: 0, delta, finish_reason }],
        })}\n\n`
      );

    chunk({ role: 'assistant' });
    try {
      // Collect the full answer first instead of forwarding deltas live --
      // this sacrifices some of the real-time streaming feel (there's a
      // pause while both generation and the correction below finish), but
      // an always-on translation step is what actually enforces
      // FORCE_LANGUAGE even when streamAnswer itself gets the language
      // wrong under today's quota exhaustion. Same tradeoff accepted for
      // the app's /api/chat.
      let fullAnswer = '';
      await streamAnswer(prompt, delta => { fullAnswer += delta; });
      const finalAnswer = await translateText(fullAnswer, FORCE_LANGUAGE);
      chunk({ content: finalAnswer });
    } catch (streamErr) {
      console.error('streamAnswer failed mid-request:', streamErr);
      chunk({ content: "Sorry, I'm having trouble answering right now. Please try again." });
    }
    chunk({}, 'stop');

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
