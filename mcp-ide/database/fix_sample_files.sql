-- Fix Sample Files
-- Run this in Supabase SQL Editor

-- Delete all existing files in the sample project
DELETE FROM files WHERE project_id = '00000000-0000-0000-0000-000000000001';

-- Recreate sample files with correct is_folder values
INSERT INTO files (id, project_id, name, path, language, content, is_active, parent_folder, is_folder)
VALUES 
  (
    '59b8f49a-4129-4c22-a4e0-9758a1c58639',
    '00000000-0000-0000-0000-000000000001',
    'main.js',
    'main.js',
    'javascript',
    '// Welcome to MCP-IDE!
console.log("Hello, World!");',
    true,
    '/',
    false
  ),
  (
    '23f93982-09ad-4a28-81b5-a4f89f359806',
    '00000000-0000-0000-0000-000000000001',
    'utils.js',
    'utils.js',
    'javascript',
    '// Utility functions
function add(a, b) {
  return a + b;
}

module.exports = { add };',
    false,
    '/',
    false
  );

-- Verify
SELECT id, name, path, is_folder, parent_folder, language, is_active
FROM files 
WHERE project_id = '00000000-0000-0000-0000-000000000001';
