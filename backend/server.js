require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { verifySchema } = require('./services/supabase');
const chatRoute = require('./routes/chat');
const adminRoute = require('./routes/admin');
const bolnaRoute = require('./routes/bolna');
const voiceRoute = require('./routes/voice');
const llmRoute = require('./routes/llm');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.use('/api/chat', chatRoute);
app.use('/admin', adminRoute);
app.use('/calls', bolnaRoute);
app.use('/voice', voiceRoute);
app.use('/v1', llmRoute);

async function start() {
  const schemaOk = await verifySchema();
  if (!schemaOk) {
    process.exit(1);
  }

  console.log('pgvector enabled');

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
