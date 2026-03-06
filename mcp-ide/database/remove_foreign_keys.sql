-- Remove Foreign Key Constraints for Anonymous Usage
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- Make user_id nullable and remove foreign key constraints
-- This allows the system to work without authentication
-- ============================================================================

-- 1. Drop foreign key constraint on tutor_sessions
ALTER TABLE tutor_sessions 
DROP CONSTRAINT IF EXISTS tutor_sessions_user_id_fkey;

-- 2. Make user_id nullable in tutor_sessions
ALTER TABLE tutor_sessions 
ALTER COLUMN user_id DROP NOT NULL;

-- 3. Drop foreign key constraint on code_embeddings
ALTER TABLE code_embeddings 
DROP CONSTRAINT IF EXISTS code_embeddings_user_id_fkey;

-- 4. Make user_id nullable in code_embeddings
ALTER TABLE code_embeddings 
ALTER COLUMN user_id DROP NOT NULL;

-- 5. Drop foreign key constraint on code_history
ALTER TABLE code_history 
DROP CONSTRAINT IF EXISTS code_history_user_id_fkey;

-- 6. Make user_id nullable in code_history
ALTER TABLE code_history 
ALTER COLUMN user_id DROP NOT NULL;

-- ============================================================================
-- Verify changes
-- ============================================================================

-- Check tutor_sessions structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tutor_sessions' AND column_name = 'user_id';

-- Check code_history structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'code_history' AND column_name = 'user_id';

-- Check code_embeddings structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'code_embeddings' AND column_name = 'user_id';

-- ============================================================================
-- Test insert (should work now)
-- ============================================================================

-- Test session creation
INSERT INTO tutor_sessions (id, user_id, file_path, language, model_type, message_count)
VALUES (
  gen_random_uuid(),
  NULL,  -- NULL user_id for anonymous
  'test.js',
  'javascript',
  'gemini',
  0
);

-- Clean up test data
DELETE FROM tutor_sessions WHERE file_path = 'test.js';

SELECT 'Foreign key constraints removed successfully!' as status;
