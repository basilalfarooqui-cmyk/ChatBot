const express = require('express');
const multer = require('multer');
const { transcribeAudio, synthesizeSpeech } = require('../services/gemini');
const { pcmToWav, parseSampleRate } = require('../services/wav');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio uploaded (field name must be "audio").' });
    }

    const base64Audio = req.file.buffer.toString('base64');
    const text = await transcribeAudio(base64Audio, req.file.mimetype, req.body.language);
    return res.json({ text });
  } catch (error) {
    console.error('POST /voice/transcribe error:', error);
    return res.status(500).json({ error: 'Failed to transcribe audio.' });
  }
});

// GET (not POST) so the native audio player can stream straight from this
// URL as its source instead of the app fetching bytes and writing them to a
// local file itself -- one fewer dependency, one fewer moving part.
// ponytail: query-string text has a practical length ceiling (~8KB on most
// proxies/servers); fine for spoken chat replies, would need to switch to a
// POST + local file if this ever needs to speak arbitrarily long text.
router.get('/speak', async (req, res) => {
  try {
    const { text } = req.query;
    if (typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required.' });
    }

    const { base64Pcm, mimeType } = await synthesizeSpeech(text);
    const wavBuffer = pcmToWav(Buffer.from(base64Pcm, 'base64'), parseSampleRate(mimeType));

    res.set('Content-Type', 'audio/wav');
    return res.send(wavBuffer);
  } catch (error) {
    console.error('GET /voice/speak error:', error);
    return res.status(500).json({ error: 'Failed to synthesize speech.' });
  }
});

module.exports = router;
