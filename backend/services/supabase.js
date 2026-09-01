const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function verifySchema() {
  const { error } = await supabase.from('documents').select('id').limit(1);

  if (error) {
    console.error('Supabase schema check failed:', error.message);
    console.error(
      'The "documents" table (or pgvector extension / match_documents function) is missing.\n' +
      'This backend cannot create it automatically — Supabase does not allow running ' +
      'CREATE EXTENSION / CREATE TABLE / CREATE FUNCTION through the anon/service_role REST API.\n' +
      'Fix: open the Supabase SQL Editor for this project and run the contents of ' +
      'backend/db/setup.sql once, then restart this server.'
    );
    return false;
  }

  console.log('Supabase connected, documents table ready');
  return true;
}

module.exports = { supabase, verifySchema };
