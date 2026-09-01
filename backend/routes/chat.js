const express = require('express');
const { embedText, generateAnswer } = require('../services/gemini');
const { translateText } = require('../services/translate');
const { searchDocuments, buildRAGPrompt } = require('../services/rag');

const router = express.Router();

const LANGUAGE_NAMES = {
  en: 'English', hi: 'Hindi', bn: 'Bengali', te: 'Telugu', mr: 'Marathi',
  ta: 'Tamil', ur: 'Urdu', gu: 'Gujarati', kn: 'Kannada', or: 'Odia',
  ml: 'Malayalam', pa: 'Punjabi', as: 'Assamese', mai: 'Maithili',
  sat: 'Santali', ks: 'Kashmiri', ne: 'Nepali', kok: 'Konkani',
  sd: 'Sindhi', doi: 'Dogri', mni: 'Manipuri', brx: 'Bodo', sa: 'Sanskrit',
};

const NO_INFO_MESSAGE =
  "I don't have information on that topic. Please contact your local PACS office or visit cooperation.gov.in for assistance.";

const SIMILARITY_THRESHOLD = 0.3;

router.post('/', async (req, res) => {
  try {
    const { message, language = 'en' } = req.body;

    if (typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ reply: 'Message is required.' });
    }

    const languageName = LANGUAGE_NAMES[language] || 'English';

    const englishMessage =
      language === 'en' ? message : await translateText(message, 'English');

    const queryEmbedding = await embedText(englishMessage);
    const retrievedChunks = await searchDocuments(queryEmbedding, 5);

    const hasRelevantInfo =
      retrievedChunks.length > 0 &&
      retrievedChunks.some(c => c.similarity >= SIMILARITY_THRESHOLD);

    if (!hasRelevantInfo) {
      const reply =
        language === 'en'
          ? NO_INFO_MESSAGE
          : await translateText(NO_INFO_MESSAGE, languageName);
      return res.json({ reply });
    }

    const prompt = buildRAGPrompt(englishMessage, retrievedChunks);
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
