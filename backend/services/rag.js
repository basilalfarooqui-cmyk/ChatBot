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

function buildRAGPrompt(userQuestion, retrievedChunks) {
  const info = retrievedChunks.map(c => c.content).join('\n\n---\n\n');

  return `You are a helpful assistant for cooperative society members in India. Answer questions about cooperative laws, government schemes, PACS services, and agricultural support.

Use ONLY the information provided below to answer. If the answer is not in the provided information, respond with exactly: 'I don't have information on that topic. Please contact your local PACS office or visit cooperation.gov.in for assistance.'

Do NOT make up information. Do NOT answer questions outside of cooperative governance, schemes, and agricultural support.

Information:
${info}

Question: ${userQuestion}

Answer:`;
}

module.exports = { chunkText, embedAndStoreChunks, searchDocuments, buildRAGPrompt };
