const { embedText } = require('./gemini');
const { supabase } = require('./supabase');

// Confirmed live on a real document: a 300-word chunk cut off mid-sentence
// right at "1. Ministry of Cooperation (MoC): a. To convene the meetings
// of the" -- the actual role details were the next chunk, which didn't
// score highly enough for the matching query to be retrieved. Documents
// with long numbered/lettered stakeholder lists (common in government
// SOPs) need enough room per chunk to hold a full list item, and enough
// overlap that a split mid-list still carries context into the next chunk.
function chunkText(text, chunkSize = 600) {
  const words = text.split(/\s+/).filter(Boolean);
  const overlap = 150;
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

// No numeric cutoff actually separates relevant from irrelevant here --
// measured directly against this project's real data, a genuinely relevant
// short query ("who is mohan") scored 0.4661, LOWER than a genuinely
// irrelevant chunk scored for that same query (0.4784, "basil is
// brainless"). Score ranges for relevant and irrelevant chunks overlap
// (roughly 0.46-0.60 for both), so no threshold value can cleanly draw a
// line between them -- raising it to exclude floor-noise greetings also
// excluded real matches like this one. The LLM's own instructed judgment
// (buildPrompt's case 1/2/3 classification) has proven reliable across
// every test case even with irrelevant chunks present, including staying
// in the caller's own language -- that was fixed at the prompt level, not
// by filtering chunks. So don't filter at all; let Gemini decide relevance
// from whatever's retrieved.
const SIMILARITY_THRESHOLD = 0;

// Measured directly: a real answer-bearing chunk ranked 6th (0.5905)
// against a query asking exactly the question it answers, with only a
// 0.014 score gap to the top result -- these are near-ties among
// topically-similar chunks from the same document, not a clean
// relevant/irrelevant split. A top-5 window was cutting off genuine
// matches that scored a hair below other same-topic chunks. 10 gives
// enough headroom for that without flooding the prompt.
const MATCH_COUNT = 10;

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

Always respond in the same language and script the caller used in their message below, no matter what language these instructions are written in.

${hasContext ? `Reference information (use ONLY this for facts):\n${info}` : 'No reference information matched this message.'}

Decide which case applies to the message below:
1. Greeting, small talk, or a general message not asking for specific factual information (e.g. "hi", "thanks", "how are you", "what can you do") -- respond briefly and naturally in one or two sentences, in the caller's own language, and mention you can help with cooperative schemes, PACS services, and agricultural support. Ignore the reference information for this case.
2. A real question that the reference information above actually answers -- answer it directly and conversationally, the way a knowledgeable person would explain it in their own words, not the way a search engine would. Extract and state only the specific fact(s) the question actually asked for. Do not quote, copy, or reproduce sentences from the reference information verbatim, and do not include surrounding context, background, or other facts from the same chunk that the question didn't ask about, even if they're related. Keep it as short as the question allows -- usually one or two sentences unless the question genuinely requires a list or multiple steps. Still treat the reference information as authoritative and correct even if it conflicts with what you already know; do not correct, second-guess, or override it with your own general knowledge.
3. A real question the reference information does NOT answer, or a question clearly outside cooperative governance/schemes/agricultural support -- respond with EXACTLY this text and nothing else, translated into the caller's language: "${NO_INFO_MESSAGE}"

Never invent facts, numbers, scheme names, or legal details not present in the reference information. Never contradict the reference information using outside knowledge.

Message: ${userMessage}

Answer:`;
}

module.exports = {
  chunkText,
  embedAndStoreChunks,
  searchDocuments,
  buildPrompt,
  NO_INFO_MESSAGE,
  SIMILARITY_THRESHOLD,
  MATCH_COUNT,
};
