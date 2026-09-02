const { embedText } = require('./gemini');
const { supabase } = require('./supabase');

function chunkText(text, chunkSize = 300) {
  const words = text.split(/\s+/).filter(Boolean);
  const overlap = 50;
  const chunks = [];

  if (words.length <= chunkSize) {
    return [words.join(' ')];
  }

  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    chunks.push(words.slice(start, end).join(' '));
    if (end >= words.length) break;
    start = end - overlap;
  }

  return chunks;
}

async function embedAndStoreChunks(chunks, topicName, sourceFile) {
  let stored = 0;

  for (const chunk of chunks) {
    const embedding = await embedText(chunk);
    const { error } = await supabase.from('documents').insert({
      content: chunk,
      embedding,
      topic: topicName,
      source_file: sourceFile,
    });

    if (error) {
      throw new Error(`Failed to store chunk: ${error.message}`);
    }
    stored += 1;
  }

  return stored;
}

async function searchDocuments(queryEmbedding, limit = 5) {
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_count: limit,
  });

  if (error) {
    throw new Error(`searchDocuments failed: ${error.message}`);
  }

  return data || [];
}

const NO_INFO_MESSAGE =
  "I don't have information on that topic. Please contact your local PACS office or visit cooperation.gov.in for assistance.";

// A hard similarity threshold alone can't reliably tell "greeting" apart from
// "real question" when the DB is small -- unrelated short text (e.g. "hi")
// still lands above 0.3 cosine similarity against almost anything, purely
// from the embedding space's baseline floor, not real relevance. So this
// prompt always carries the greeting/small-talk branch itself, whether or
// not context was retrieved -- Gemini decides relevance, not a raw number.
function buildPrompt(userMessage, retrievedChunks) {
  const hasContext = retrievedChunks.length > 0;
  const info = hasContext
    ? retrievedChunks.map(c => c.content).join('\n\n---\n\n')
    : null;

  return `You are a helpful assistant for cooperative society members in India, focused on cooperative laws, government schemes, PACS services, and agricultural support.

${hasContext ? `Reference information (use ONLY this for facts):\n${info}` : 'No reference information matched this message.'}

Decide which case applies to the message below:
1. Greeting, small talk, or a general message not asking for specific factual information (e.g. "hi", "thanks", "how are you", "what can you do") -- respond briefly and naturally in one or two sentences, and mention you can help with cooperative schemes, PACS services, and agricultural support. Ignore the reference information for this case.
2. A real question that the reference information above actually answers -- answer using ONLY that information.
3. A real question the reference information does NOT answer, or a question clearly outside cooperative governance/schemes/agricultural support -- respond with EXACTLY this text and nothing else: "${NO_INFO_MESSAGE}"

Never invent facts, numbers, scheme names, or legal details not present in the reference information.

Message: ${userMessage}

Answer:`;
}

module.exports = {
  chunkText,
  embedAndStoreChunks,
  searchDocuments,
  buildPrompt,
  NO_INFO_MESSAGE,
};
