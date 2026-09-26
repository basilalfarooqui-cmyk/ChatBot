const express = require('express');
const { embedText, generateAnswer } = require('../services/gemini');
const { translateText } = require('../services/translate');
const { searchDocuments, buildPrompt, SIMILARITY_THRESHOLD, MATCH_COUNT } = require('../services/rag');

const router = express.Router();

// TEMPORARY DEMO OVERRIDE (2026-09): the app's per-request `language` field
// is unreliable right now because all 4 reliable Gemini models are quota-
// exhausted today, forcing every request onto weaker fallback models that
// don't reliably follow buildPrompt's language-matching instruction. For
// recording a stable demo video, ignore the app's per-request language
// entirely and force one explicit output language via this env var --
// always translated as a separate, focused call, not left up to the main
// generation step to get right on its own. Change FORCE_LANGUAGE in
// Railway's Variables tab to switch languages between takes, no redeploy
// of code needed. Remove this override once quota/model reliability is
// sorted -- this is NOT the real per-user-language behavior, just a
// predictable default for recording.
const FORCE_LANGUAGE = process.env.FORCE_LANGUAGE || 'Hindi';

// The app's selected language doesn't guarantee what script the user
// actually typed in -- someone with Telugu selected can still type in
// English. Skip the translate-in call (one fewer Gemini round trip) when
// the message is already plain ASCII, since every supported non-English
// language uses a non-Latin script.
function looksEnglish(text) {
  return /^[\x00-\x7F]*$/.test(text);
}

router.post('/', async (req, res) => {
  try {
    const { message } = req.body;

    if (typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ reply: 'Message is required.' });
    }

    // "language === 'en'" describes the app's SELECTED language, not the
    // actual script of the message -- typing or speaking Hindi while
    // English is selected (easy via voice input) previously skipped
    // translation entirely, so buildPrompt saw raw Hindi text and its own
    // "match the caller's language" instruction correctly mirrored that,
    // replying in Hindi regardless of what was selected. The only safe
    // signal for "is this already English" is the message's own script.
    const englishMessage = looksEnglish(message) ? message : await translateText(message, 'English');

    const queryEmbedding = await embedText(englishMessage);
    const retrievedChunks = await searchDocuments(queryEmbedding, MATCH_COUNT);
    const relevantChunks = retrievedChunks.filter(c => c.similarity >= SIMILARITY_THRESHOLD);

    const prompt = buildPrompt(englishMessage, relevantChunks);
    const englishAnswer = await generateAnswer(prompt);

    // Always translate, even to English -- generateAnswer itself can still
    // produce the wrong language under today's quota exhaustion (that's the
    // root bug), so skipping this call whenever FORCE_LANGUAGE is English
    // would let a wrong-language englishAnswer straight through
    // uncorrected. This call is what actually enforces FORCE_LANGUAGE.
    const finalAnswer = await translateText(englishAnswer, FORCE_LANGUAGE);

    return res.json({ reply: finalAnswer });
  } catch (error) {
    console.error('POST /api/chat error:', error);
    return res.status(500).json({ reply: 'Sorry, I encountered an error. Please try again.' });
  }
});

module.exports = router;
