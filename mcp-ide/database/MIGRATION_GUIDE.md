# Database Migration Guide

## 🎯 One-Time Setup

If you're setting up the database for the **first time**, use this:

### Option 1: Complete Schema (Recommended)
```sql
-- Run this ONCE in Supabase SQL Editor
-- File: database/complete_schema.sql
```

This includes:
- ✅ Projects & Files (with folders)
- ✅ File versions
- ✅ Tutor sessions & messages
- ✅ Code history
- ✅ Code embeddings (RAG)
- ✅ Learning concepts
- ✅ Common errors
- ✅ All indexes & triggers
- ✅ RLS policies
- ✅ Sample data

## 🔄 Incremental Migrations

If you already have the database and need to add features:

### Migration 1: Multi-File Support
```sql
-- File: database/multifile_schema.sql
-- Adds: projects, files, file_versions tables
```

### Migration 2: Remove Foreign Keys
```sql
-- File: database/remove_foreign_keys.sql
-- Allows: Anonymous users without auth
```

### Migration 3: Add Message Context
```sql
-- File: database/add_message_context_columns.sql
-- Adds: code_context, execution_context to tutor_messages
```

### Migration 4: Add Folder Support
```sql
-- File: database/add_folder_support.sql
-- Adds: parent_folder, is_folder columns to files
```

### Migration 5: Fix RLS Policies
```sql
-- File: database/fix_rls_policies.sql
-- Updates: RLS policies for anonymous access
```

## 📋 Migration Order

If running incremental migrations, use this order:

1. `multifile_schema.sql` - Base tables
2. `remove_foreign_keys.sql` - Allow anonymous
3. `add_message_context_columns.sql` - Message context
4. `add_folder_support.sql` - Folder support
5. `fix_rls_policies.sql` - RLS policies

## ✅ Verification

After running migrations, verify:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check sample project
SELECT * FROM projects 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Check sample files
SELECT name, path, is_folder, parent_folder 
FROM files 
WHERE project_id = '00000000-0000-0000-0000-000000000001';

-- Check columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'files'
ORDER BY ordinal_position;
```

## 🐛 Troubleshooting

### Error: "relation already exists"
- Safe to ignore if using `CREATE TABLE IF NOT EXISTS`
- Or drop and recreate: `DROP TABLE IF EXISTS table_name CASCADE;`

### Error: "column already exists"
- Safe to ignore if using `ADD COLUMN IF NOT EXISTS`
- Or check existing columns first

### Error: "foreign key constraint"
- Run `remove_foreign_keys.sql`
- Or manually drop constraints

### Error: "RLS policy already exists"
- Drop existing: `DROP POLICY IF EXISTS policy_name ON table_name;`
- Then recreate

## 🎯 Recommended Approach

**For new setup:**
1. Use `complete_schema.sql` (one file, everything included)
2. Run once
3. Done!

**For existing database:**
1. Check what you have
2. Run only missing migrations
3. Verify with queries above

## 📝 Notes

- All migrations are idempotent (safe to run multiple times)
- Use `IF NOT EXISTS` and `IF EXISTS` clauses
- Sample data uses `ON CONFLICT DO NOTHING`
- RLS policies allow anonymous access (add auth later)

## 🚀 After Migration

1. Restart backend: `python main.py`
2. Refresh frontend
3. Test features:
   - Create files
   - Create folders
   - Run code
   - Chat with AI
   - Check database for saved data

Everything should work! 🎉
