const express = require('express');

const router = express.Router();

// TODO: Wire to chat flow when Exotel number is purchased. Follow HORA
// pattern: extract transcript from payload, process through RAG, return answer.
router.post('/bolna-webhook', (req, res) => {
  console.log('Bolna webhook received:', JSON.stringify(req.body));
  res.status(200).json({ received: true });
});

module.exports = router;
