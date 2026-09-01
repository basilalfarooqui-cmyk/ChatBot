-- Run this ONCE in the Supabase SQL Editor (Project > SQL Editor > New query).
-- The anon/service_role REST API keys cannot run DDL (CREATE EXTENSION / TABLE /
-- FUNCTION), so this step can't be automated from the backend at startup --
-- it has to be pasted here manually one time.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  embedding VECTOR(768),
  topic TEXT,
  source_file TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS documents_embedding_idx
  ON documents USING ivfflat (embedding vector_cosine_ops);

-- RPC function so the backend can run a cosine-similarity search via
-- supabase-js's .rpc() instead of building raw SQL with an embedded vector
-- literal through PostgREST (which isn't supported for this kind of query).
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(768),
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  content TEXT,
  topic TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    documents.content,
    documents.topic,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Supabase's PostgREST layer caches the schema and won't see a brand-new
-- function until it reloads. CREATE/REPLACE FUNCTION above doesn't trigger
-- that on its own -- this does.
NOTIFY pgrst, 'reload schema';
