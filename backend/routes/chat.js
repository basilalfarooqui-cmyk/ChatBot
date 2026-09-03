const express = require('express');
const { embedText, generateAnswer } = require('../services/gemini');
const { translateText } = require('../services/translate');
const { searchDocuments, buildPrompt, SIMILARITY_THRESHOLD } = require('../services/rag');

const router = express.Router();

const LANGUAGE_NAMES = {
  en: 'English', hi: 'Hindi', bn: 'Bengali', te: 'Telugu', mr: 'Marathi',
  ta: 'Tamil', ur: 'Urdu', gu: 'Gujarati', kn: 'Kannada', or: 'Odia',
  ml: 'Malayalam', pa: 'Punjabi', as: 'Assamese', mai: 'Maithili',
  sat: 'Santali', ks: 'Kashmiri', ne: 'Nepali', kok: 'Konkani',
  sd: 'Sindhi', doi: 'Dogri', mni: 'Manipuri', brx: 'Bodo', sa: 'Sanskrit',
};

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
    const { message, language = 'en' } = req.body;

    if (typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ reply: 'Message is required.' });
    }

    const languageName = LANGUAGE_NAMES[language] || 'English';

    const englishMessage =
      language === 'en' || looksEnglish(message) ? message : await translateText(message, 'English');

    const queryEmbedding = await embedText(englishMessage);
    const retrievedChunks = await searchDocuments(queryEmbedding, 5);
    const relevantChunks = retrievedChunks.filter(c => c.similarity >= SIMILARITY_THRESHOLD);

    const prompt = buildPrompt(englishMessage, relevantChunks);
    const englishAnswer = await generateAnswer(prompt);

    const finalAnswer =
      language === 'en' ? englishAnswer : await translateText(englishAnswer, languageName);

    return res.json({ reply: finalAnswer });
  } catch (error) {
    console.error('POST /api/chat error:', error);
    return res.status(500).json({ reply: 'Sorry, I encountered an error. Please try again.' });
  }
});

module.exports = router;
