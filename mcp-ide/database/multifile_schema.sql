-- Multi-File IDE Schema
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. Projects Table
-- Stores user projects (collections of files)
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,  -- NULL for anonymous users
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  last_opened_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Index for user queries
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_updated_at_idx ON projects(updated_at DESC);

-- ============================================================================
-- 2. Files Table
-- Stores individual code files
-- ============================================================================
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID,  -- NULL for anonymous users
  name TEXT NOT NULL,
  path TEXT NOT NULL,  -- e.g., "src/utils/helper.js"
  language TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN DEFAULT false,  -- Currently open file
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  
  -- Ensure unique paths within a project
  UNIQUE(project_id, path)
);

-- Indexes
CREATE INDEX IF NOT EXISTS files_project_id_idx ON files(project_id);
CREATE INDEX IF NOT EXISTS files_user_id_idx ON files(user_id);
CREATE INDEX IF NOT EXISTS files_language_idx ON files(language);
CREATE INDEX IF NOT EXISTS files_updated_at_idx ON files(updated_at DESC);

-- ============================================================================
-- 3. File Versions Table
-- Track file history for undo/redo and learning analytics
-- ============================================================================
CREATE TABLE IF NOT EXISTS file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  change_description TEXT,  -- e.g., "Fixed syntax error", "Added function"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Index for file queries
CREATE INDEX IF NOT EXISTS file_versions_file_id_idx ON file_versions(file_id);
CREATE INDEX IF NOT EXISTS file_versions_created_at_idx ON file_versions(created_at DESC);

-- ============================================================================
-- 4. Enhanced Code Embeddings for RAG
-- Store embeddings for semantic search across files
-- ============================================================================

-- Add project_id to existing code_embeddings table
ALTER TABLE code_embeddings 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS file_id UUID REFERENCES files(id) ON DELETE CASCADE;

-- Add indexes
CREATE INDEX IF NOT EXISTS code_embeddings_project_id_idx ON code_embeddings(project_id);
CREATE INDEX IF NOT EXISTS code_embeddings_file_id_idx ON code_embeddings(file_id);

-- ============================================================================
-- 5. Helper Functions
-- ============================================================================

-- Function to get all files in a project
CREATE OR REPLACE FUNCTION get_project_files(p_project_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  path TEXT,
  language TEXT,
  content TEXT,
  is_active BOOLEAN,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.name,
    f.path,
    f.language,
    f.content,
    f.is_active,
    f.updated_at
  FROM files f
  WHERE f.project_id = p_project_id
  ORDER BY f.path;
END;
$$;

-- Function to search code across project using embeddings
CREATE OR REPLACE FUNCTION search_project_code(
  p_project_id UUID,
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  file_id UUID,
  file_path TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.file_id,
    ce.file_path,
    ce.content,
    1 - (ce.embedding <=> query_embedding) AS similarity
  FROM code_embeddings ce
  WHERE 
    ce.project_id = p_project_id
    AND 1 - (ce.embedding <=> query_embedding) > match_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to get file history
CREATE OR REPLACE FUNCTION get_file_history(p_file_id UUID, p_limit INT DEFAULT 10)
RETURNS TABLE (
  id UUID,
  content TEXT,
  change_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fv.id,
    fv.content,
    fv.change_description,
    fv.created_at
  FROM file_versions fv
  WHERE fv.file_id = p_file_id
  ORDER BY fv.created_at DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- 6. Triggers
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at
  BEFORE UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create file version on update
CREATE OR REPLACE FUNCTION create_file_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if content changed
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    INSERT INTO file_versions (file_id, content, change_description)
    VALUES (NEW.id, OLD.content, 'Auto-saved version');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_version_files
  BEFORE UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION create_file_version();

-- ============================================================================
-- 7. RLS Policies (Allow anonymous for now)
-- ============================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (will add proper auth later)
CREATE POLICY "Anyone can manage projects"
  ON projects FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can manage files"
  ON files FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can view file versions"
  ON file_versions FOR SELECT
  USING (true);

-- ============================================================================
-- 8. Sample Data
-- ============================================================================

-- Create a sample project
INSERT INTO projects (id, name, description)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'My First Project',
  'A sample project to get started'
) ON CONFLICT DO NOTHING;

-- Create sample files
INSERT INTO files (project_id, name, path, language, content, is_active)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001',
    'main.js',
    'main.js',
    'javascript',
    '// Welcome to MCP-IDE!\nconsole.log("Hello, World!");',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'utils.js',
    'utils.js',
    'javascript',
    '// Utility functions\nexport function add(a, b) {\n  return a + b;\n}',
    false
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Verification
-- ============================================================================

SELECT 'Multi-file schema created successfully!' as status;

-- Show sample project
SELECT * FROM projects WHERE id = '00000000-0000-0000-0000-000000000001';

-- Show sample files
SELECT id, name, path, language, is_active FROM files 
WHERE project_id = '00000000-0000-0000-0000-000000000001';
