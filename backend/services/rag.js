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

const NO_INFO_MESSAGE =
  "I don't have information on that topic. Please contact your local PACS office or visit cooperation.gov.in for assistance.";

// Used when no document chunk scores above the similarity threshold. Without
// this, every greeting ("hi", "thanks") also fails the threshold and gets the
// same canned no-info line, which reads as broken to a real user. This still
// forbids fabricating domain facts -- it just lets Gemini tell the difference
// between "not a real question" and "real question, nothing on file."
function buildNoContextPrompt(userMessage) {
  return `You are a helpful assistant for cooperative society members in India, focused on cooperative laws, government schemes, PACS services, and agricultural support.

No document information matched this message. Decide which case applies:

1. If this is a greeting, small talk, or a general message not asking for specific factual information (e.g. "hi", "thanks", "how are you", "what can you do") -- respond briefly and naturally in one or two sentences, and mention you can help with questions about cooperative schemes, PACS services, and agricultural support.
2. If this is a real question about cooperative laws, schemes, PACS, or agricultural support that you have no matching information for -- respond with EXACTLY this text and nothing else: "${NO_INFO_MESSAGE}"
3. If this is a real question but clearly outside cooperative governance, schemes, and agricultural support (e.g. unrelated general knowledge) -- respond with EXACTLY this text and nothing else: "${NO_INFO_MESSAGE}"

Never invent specific facts, numbers, scheme names, or legal details that weren't provided to you.

Message: ${userMessage}

Answer:`;
}

module.exports = {
  chunkText,
  embedAndStoreChunks,
  searchDocuments,
  buildRAGPrompt,
  buildNoContextPrompt,
  NO_INFO_MESSAGE,
};
