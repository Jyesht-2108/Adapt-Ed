-- MCP-IDE Database Schema for Supabase
-- This schema supports RAG (Retrieval-Augmented Generation) for the AI tutor

-- Enable the pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- 1. Code Embeddings Table
-- Stores vector embeddings of code files for RAG retrieval
-- ============================================================================
CREATE TABLE IF NOT EXISTS code_embeddings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  language TEXT NOT NULL,
  chunk_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(768), -- Dimension for Gemini embeddings (768) or adjust for your model
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  
  -- Composite index for efficient lookups
  UNIQUE(user_id, file_path, chunk_id)
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS code_embeddings_embedding_idx 
  ON code_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Index for user queries
CREATE INDEX IF NOT EXISTS code_embeddings_user_id_idx 
  ON code_embeddings(user_id);

-- Index for file path queries
CREATE INDEX IF NOT EXISTS code_embeddings_file_path_idx 
  ON code_embeddings(file_path);

-- Index for language filtering
CREATE INDEX IF NOT EXISTS code_embeddings_language_idx 
  ON code_embeddings(language);

-- ============================================================================
-- 2. Documentation Embeddings Table
-- Stores vector embeddings of documentation and learning materials
-- ============================================================================
CREATE TABLE IF NOT EXISTS doc_embeddings (
  id BIGSERIAL PRIMARY KEY,
  doc_type TEXT NOT NULL, -- 'lesson', 'concept', 'example', 'reference'
  title TEXT NOT NULL,
  language TEXT, -- Programming language (if applicable)
  chunk_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(768),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  
  UNIQUE(doc_type, title, chunk_id)
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS doc_embeddings_embedding_idx 
  ON doc_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Index for document type filtering
CREATE INDEX IF NOT EXISTS doc_embeddings_doc_type_idx 
  ON doc_embeddings(doc_type);

-- Index for language filtering
CREATE INDEX IF NOT EXISTS doc_embeddings_language_idx 
  ON doc_embeddings(language);

-- ============================================================================
-- 3. Tutor Sessions Table
-- Tracks user interactions with the AI tutor
-- ============================================================================
CREATE TABLE IF NOT EXISTS tutor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  language TEXT NOT NULL,
  model_type TEXT NOT NULL, -- 'ollama' or 'gemini'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  ended_at TIMESTAMP WITH TIME ZONE,
  message_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'
);

-- Index for user queries
CREATE INDEX IF NOT EXISTS tutor_sessions_user_id_idx 
  ON tutor_sessions(user_id);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS tutor_sessions_started_at_idx 
  ON tutor_sessions(started_at DESC);

-- ============================================================================
-- 4. Tutor Messages Table
-- Stores individual messages in tutor sessions
-- ============================================================================
CREATE TABLE IF NOT EXISTS tutor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES tutor_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  code_context TEXT,  -- Added: stores code at time of message
  execution_context JSONB,  -- Added: stores execution results
  cursor_line INTEGER,
  cursor_column INTEGER,
  selected_text TEXT,
  errors TEXT[],
  model_type TEXT,
  response_time_ms INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Index for session queries
CREATE INDEX IF NOT EXISTS tutor_messages_session_id_idx 
  ON tutor_messages(session_id);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS tutor_messages_created_at_idx 
  ON tutor_messages(created_at DESC);

-- ============================================================================
-- 5. User Code History Table
-- Tracks code changes for learning analytics
-- ============================================================================
CREATE TABLE IF NOT EXISTS code_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  language TEXT NOT NULL,
  code_content TEXT NOT NULL,
  cursor_line INTEGER,
  cursor_column INTEGER,
  errors TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Index for user queries
CREATE INDEX IF NOT EXISTS code_history_user_id_idx 
  ON code_history(user_id);

-- Index for file path queries
CREATE INDEX IF NOT EXISTS code_history_file_path_idx 
  ON code_history(file_path);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS code_history_created_at_idx 
  ON code_history(created_at DESC);

-- ============================================================================
-- 6. Learning Concepts Table
-- Stores programming concepts for RAG retrieval
-- ============================================================================
CREATE TABLE IF NOT EXISTS learning_concepts (
  id BIGSERIAL PRIMARY KEY,
  concept_name TEXT NOT NULL UNIQUE,
  language TEXT, -- Programming language (if applicable)
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  description TEXT NOT NULL,
  examples TEXT[],
  related_concepts TEXT[],
  embedding VECTOR(768),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS learning_concepts_embedding_idx 
  ON learning_concepts 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Index for concept name queries
CREATE INDEX IF NOT EXISTS learning_concepts_name_idx 
  ON learning_concepts(concept_name);

-- Index for language filtering
CREATE INDEX IF NOT EXISTS learning_concepts_language_idx 
  ON learning_concepts(language);

-- ============================================================================
-- 7. Common Errors Table
-- Stores common programming errors and their explanations
-- ============================================================================
CREATE TABLE IF NOT EXISTS common_errors (
  id BIGSERIAL PRIMARY KEY,
  error_type TEXT NOT NULL,
  language TEXT NOT NULL,
  error_message TEXT NOT NULL,
  explanation TEXT NOT NULL,
  hint TEXT NOT NULL,
  example_code TEXT,
  embedding VECTOR(768),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS common_errors_embedding_idx 
  ON common_errors 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Index for language filtering
CREATE INDEX IF NOT EXISTS common_errors_language_idx 
  ON common_errors(language);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to search for similar code
CREATE OR REPLACE FUNCTION search_similar_code(
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_language TEXT DEFAULT NULL,
  filter_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  file_path TEXT,
  language TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.id,
    ce.file_path,
    ce.language,
    ce.content,
    1 - (ce.embedding <=> query_embedding) AS similarity
  FROM code_embeddings ce
  WHERE 
    (filter_language IS NULL OR ce.language = filter_language)
    AND (filter_user_id IS NULL OR ce.user_id = filter_user_id)
    AND 1 - (ce.embedding <=> query_embedding) > match_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to search for similar documentation
CREATE OR REPLACE FUNCTION search_similar_docs(
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_doc_type TEXT DEFAULT NULL,
  filter_language TEXT DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  doc_type TEXT,
  title TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.doc_type,
    de.title,
    de.content,
    1 - (de.embedding <=> query_embedding) AS similarity
  FROM doc_embeddings de
  WHERE 
    (filter_doc_type IS NULL OR de.doc_type = filter_doc_type)
    AND (filter_language IS NULL OR de.language = filter_language)
    AND 1 - (de.embedding <=> query_embedding) > match_threshold
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to search for similar concepts
CREATE OR REPLACE FUNCTION search_similar_concepts(
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_language TEXT DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  concept_name TEXT,
  description TEXT,
  examples TEXT[],
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lc.id,
    lc.concept_name,
    lc.description,
    lc.examples,
    1 - (lc.embedding <=> query_embedding) AS similarity
  FROM learning_concepts lc
  WHERE 
    (filter_language IS NULL OR lc.language = filter_language)
    AND 1 - (lc.embedding <=> query_embedding) > match_threshold
  ORDER BY lc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to search for similar errors
CREATE OR REPLACE FUNCTION search_similar_errors(
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_language TEXT DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  error_type TEXT,
  error_message TEXT,
  explanation TEXT,
  hint TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.id,
    ce.error_type,
    ce.error_message,
    ce.explanation,
    ce.hint,
    1 - (ce.embedding <=> query_embedding) AS similarity
  FROM common_errors ce
  WHERE 
    (filter_language IS NULL OR ce.language = filter_language)
    AND 1 - (ce.embedding <=> query_embedding) > match_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE code_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_history ENABLE ROW LEVEL SECURITY;

-- Code embeddings policies
CREATE POLICY "Users can view their own code embeddings"
  ON code_embeddings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own code embeddings"
  ON code_embeddings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own code embeddings"
  ON code_embeddings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own code embeddings"
  ON code_embeddings FOR DELETE
  USING (auth.uid() = user_id);

-- Tutor sessions policies
CREATE POLICY "Users can view their own tutor sessions"
  ON tutor_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tutor sessions"
  ON tutor_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tutor sessions"
  ON tutor_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Tutor messages policies (through session)
CREATE POLICY "Users can view messages from their sessions"
  ON tutor_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tutor_sessions
      WHERE tutor_sessions.id = tutor_messages.session_id
      AND tutor_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their sessions"
  ON tutor_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tutor_sessions
      WHERE tutor_sessions.id = tutor_messages.session_id
      AND tutor_sessions.user_id = auth.uid()
    )
  );

-- Code history policies
CREATE POLICY "Users can view their own code history"
  ON code_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own code history"
  ON code_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Public read access for documentation, concepts, and errors
CREATE POLICY "Anyone can view documentation embeddings"
  ON doc_embeddings FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view learning concepts"
  ON learning_concepts FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view common errors"
  ON common_errors FOR SELECT
  USING (true);

-- ============================================================================
-- Sample Data (Optional - for testing)
-- ============================================================================

-- Insert sample learning concepts
INSERT INTO learning_concepts (concept_name, language, difficulty_level, description, examples, related_concepts)
VALUES 
  ('Recursion', 'javascript', 'intermediate', 
   'A function that calls itself to solve a problem by breaking it down into smaller subproblems.',
   ARRAY['factorial', 'fibonacci', 'tree traversal'],
   ARRAY['base case', 'call stack', 'iteration']),
  
  ('Array Methods', 'javascript', 'beginner',
   'Built-in functions for manipulating arrays like map, filter, and reduce.',
   ARRAY['map', 'filter', 'reduce', 'forEach'],
   ARRAY['higher-order functions', 'callbacks', 'functional programming']),
  
  ('Async/Await', 'javascript', 'advanced',
   'Modern syntax for handling asynchronous operations in JavaScript.',
   ARRAY['async function', 'await keyword', 'Promise handling'],
   ARRAY['Promises', 'callbacks', 'event loop'])
ON CONFLICT (concept_name) DO NOTHING;

-- Insert sample common errors
INSERT INTO common_errors (error_type, language, error_message, explanation, hint, example_code)
VALUES 
  ('ReferenceError', 'javascript', 'variable is not defined',
   'You are trying to use a variable that has not been declared.',
   'Check if you declared the variable with let, const, or var before using it.',
   'let myVar = 10; // Declare before use'),
  
  ('TypeError', 'javascript', 'Cannot read property of undefined',
   'You are trying to access a property of an undefined or null value.',
   'Check if the object exists before accessing its properties. Use optional chaining (?.) or conditional checks.',
   'if (obj && obj.property) { ... }'),
  
  ('SyntaxError', 'javascript', 'Unexpected token',
   'There is a syntax error in your code, such as a missing bracket or comma.',
   'Check for matching brackets, parentheses, and proper syntax structure.',
   'function test() { return 42; } // Ensure brackets match')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Maintenance
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_code_embeddings_updated_at
  BEFORE UPDATE ON code_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doc_embeddings_updated_at
  BEFORE UPDATE ON doc_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_concepts_updated_at
  BEFORE UPDATE ON learning_concepts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_common_errors_updated_at
  BEFORE UPDATE ON common_errors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Usage Examples
-- ============================================================================

/*
-- Example 1: Search for similar code
SELECT * FROM search_similar_code(
  query_embedding := '[0.1, 0.2, ...]'::vector(768),
  match_threshold := 0.7,
  match_count := 5,
  filter_language := 'javascript'
);

-- Example 2: Search for similar documentation
SELECT * FROM search_similar_docs(
  query_embedding := '[0.1, 0.2, ...]'::vector(768),
  match_threshold := 0.7,
  match_count := 5,
  filter_doc_type := 'lesson'
);

-- Example 3: Search for similar concepts
SELECT * FROM search_similar_concepts(
  query_embedding := '[0.1, 0.2, ...]'::vector(768),
  match_threshold := 0.7,
  match_count := 5,
  filter_language := 'javascript'
);

-- Example 4: Search for similar errors
SELECT * FROM search_similar_errors(
  query_embedding := '[0.1, 0.2, ...]'::vector(768),
  match_threshold := 0.7,
  match_count := 5,
  filter_language := 'javascript'
);
*/
