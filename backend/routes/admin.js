const express = require('express');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { chunkText, embedAndStoreChunks } = require('../services/rag');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const ADMIN_PASSWORD = '696969';

router.use((req, res, next) => {
  const auth = req.headers.authorization || '';
  const [, encoded] = auth.split(' ');
  const decoded = encoded ? Buffer.from(encoded, 'base64').toString() : '';
  const [, password] = decoded.split(':');

  if (password === ADMIN_PASSWORD) return next();

  res.set('WWW-Authenticate', 'Basic realm="Admin"');
  return res.status(401).send('Auth required.');
});

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin-ui', 'index.html'));
});

router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded (field name must be "document").' });
    }

    const { originalname, buffer, mimetype } = req.file;
    const topic = req.body.topic || 'general';

    let text;
    if (mimetype === 'application/pdf' || originalname.toLowerCase().endsWith('.pdf')) {
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else if (mimetype === 'text/plain' || originalname.toLowerCase().endsWith('.txt')) {
      text = buffer.toString('utf-8');
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Only .txt and .pdf are supported.' });
    }

    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: 'Document too short or could not be read.' });
    }

    const chunks = chunkText(text);
    const chunksStored = await embedAndStoreChunks(chunks, topic, originalname);

    return res.json({ success: true, chunks_stored: chunksStored, filename: originalname });
  } catch (error) {
    console.error('POST /admin/upload error:', error);
    return res.status(500).json({ error: 'Failed to process document.' });
  }
});

module.exports = router;
