# Database Setup Guide

Complete guide for setting up Supabase with pgvector for MCP-IDE RAG functionality.

## What You Get

The database provides:
- **Vector search** for code and documentation (RAG)
- **Session tracking** for analytics and learning insights
- **Code history** for tracking student progress
- **Concept database** for educational content
- **Error patterns** for intelligent hints

## Database Schema

### Tables Overview

1. **code_embeddings** - Stores user code with vector embeddings for similarity search
2. **doc_embeddings** - Documentation, lessons, and learning materials
3. **tutor_sessions** - Tracks user sessions and conversation context
4. **tutor_messages** - Stores all chat messages with metadata
5. **learning_concepts** - Programming concepts database with examples
6. **common_errors** - Error patterns with explanations and hints
7. **code_history** - Tracks code changes over time for analytics

### Search Functions

- `search_similar_code()` - Find similar code snippets
- `search_similar_docs()` - Find relevant documentation
- `search_similar_concepts()` - Find related programming concepts
- `search_similar_errors()` - Find matching error patterns

## Step-by-Step Setup

### Step 1: Create Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: `mcp-ide` (or your choice)
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to you
4. Click "Create new project"
5. Wait 2-3 minutes for setup

### Step 2: Enable pgvector Extension

1. In your Supabase dashboard, go to **Database** → **Extensions**
2. Search for "vector"
3. Enable the **vector** extension
4. Wait for it to activate

### Step 3: Run the Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New Query"
3. Copy the entire contents of `supabase_schema.sql`
4. Paste into the editor
5. Click "Run" or press Ctrl+Enter
6. Wait for completion (should take 5-10 seconds)

### Step 4: Verify Installation

Run this query in SQL Editor:

```sql
-- Check tables
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'code_embeddings', 
  'doc_embeddings', 
  'tutor_sessions', 
  'tutor_messages',
  'learning_concepts',
  'common_errors'
);
```

You should see all 6 tables listed.

### Step 5: Get Connection Details

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...`
   - **service_role key**: `eyJhbGc...` (keep secret!)

### Step 6: Configure Backend

Add to `mcp-ide/backend/.env`:

```bash
# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

### Step 7: Install Supabase Client

```bash
cd mcp-ide/backend
pip install supabase
```

Add to `requirements.txt`:
```
supabase==2.3.0
```

## Testing the Database

### Test 1: Check Extension

```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

Should return one row.

### Test 2: Insert Sample Data

```sql
-- Insert a test embedding
INSERT INTO learning_concepts (
  concept_name, 
  language, 
  difficulty_level, 
  description,
  embedding
) VALUES (
  'Test Concept',
  'javascript',
  'beginner',
  'This is a test',
  '[0.1, 0.2, 0.3]'::vector(768) -- Dummy vector
);
```

### Test 3: Search Function

```sql
-- Test similarity search
SELECT * FROM search_similar_concepts(
  query_embedding := '[0.1, 0.2, 0.3]'::vector(768),
  match_threshold := 0.5,
  match_count := 5
);
```

## Using the Database in Backend

### Step 1: Create Supabase Client

Create `mcp-ide/backend/app/db/supabase.py`:

```python
from supabase import create_client, Client
from app.core.config import settings

def get_supabase_client() -> Client:
    """Get Supabase client instance"""
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_KEY
    )

supabase = get_supabase_client()
```

### Step 2: Create RAG Service

Create `mcp-ide/backend/app/services/rag_service.py`:

```python
from app.db.supabase import supabase
import google.generativeai as genai

class RAGService:
    """Service for RAG operations"""
    
    async def embed_text(self, text: str) -> list:
        """Generate embedding for text"""
        result = genai.embed_content(
            model="models/embedding-001",
            content=text,
            task_type="retrieval_query"
        )
        return result['embedding']
    
    async def search_similar_docs(self, query: str, language: str = None):
        """Search for similar documentation"""
        # Generate embedding
        embedding = await self.embed_text(query)
        
        # Search in Supabase
        result = supabase.rpc('search_similar_docs', {
            'query_embedding': embedding,
            'match_threshold': 0.7,
            'match_count': 5,
            'filter_language': language
        }).execute()
        
        return result.data
```

### Step 3: Integrate with Tutor Agent

Update `tutor_agent.py` to use RAG:

```python
from app.services.rag_service import RAGService

class TutorAgent:
    def __init__(self):
        # ... existing code ...
        self.rag_service = RAGService()
    
    async def get_guidance(self, editor_state, user_question, model_type):
        # Search for relevant documentation
        docs = await self.rag_service.search_similar_docs(
            query=user_question,
            language=editor_state.language
        )
        
        # Include in context
        context = self.build_context(editor_state, user_question)
        if docs:
            context += "\n\nRelevant Documentation:\n"
            for doc in docs[:3]:
                context += f"- {doc['title']}: {doc['content'][:200]}...\n"
        
        # ... rest of the code ...
```

## Populating the Database

### Add Documentation

```python
# Example: Add a lesson
supabase.table('doc_embeddings').insert({
    'doc_type': 'lesson',
    'title': 'Introduction to Recursion',
    'language': 'javascript',
    'chunk_id': 0,
    'content': 'Recursion is when a function calls itself...',
    'embedding': embedding_vector
}).execute()
```

### Add Learning Concepts

```python
# Example: Add a concept
supabase.table('learning_concepts').insert({
    'concept_name': 'Closures',
    'language': 'javascript',
    'difficulty_level': 'intermediate',
    'description': 'A closure is a function that has access to variables in its outer scope...',
    'examples': ['function outer() { let x = 10; return function inner() { return x; } }'],
    'related_concepts': ['scope', 'functions', 'lexical environment'],
    'embedding': embedding_vector
}).execute()
```

### Add Common Errors

```python
# Example: Add an error
supabase.table('common_errors').insert({
    'error_type': 'ReferenceError',
    'language': 'javascript',
    'error_message': 'x is not defined',
    'explanation': 'You are trying to use a variable that has not been declared.',
    'hint': 'Check if you declared the variable with let, const, or var.',
    'example_code': 'let x = 10; // Declare before use',
    'embedding': embedding_vector
}).execute()
```

## Monitoring and Analytics

### Query Session Statistics

```sql
-- Total sessions per user
SELECT 
  user_id,
  COUNT(*) as session_count,
  AVG(message_count) as avg_messages_per_session
FROM tutor_sessions
GROUP BY user_id;

-- Most active users
SELECT 
  user_id,
  COUNT(*) as total_messages
FROM tutor_messages tm
JOIN tutor_sessions ts ON tm.session_id = ts.id
GROUP BY user_id
ORDER BY total_messages DESC
LIMIT 10;

-- Average response time by model
SELECT 
  model_type,
  AVG(response_time_ms) as avg_response_time,
  COUNT(*) as message_count
FROM tutor_messages
WHERE role = 'assistant'
GROUP BY model_type;
```

### Query Common Questions

```sql
-- Most common questions
SELECT 
  content,
  COUNT(*) as frequency
FROM tutor_messages
WHERE role = 'user'
GROUP BY content
ORDER BY frequency DESC
LIMIT 20;
```

## Backup and Restore

### Backup

Supabase automatically backs up your database. To export:

1. Go to **Database** → **Backups**
2. Click "Download backup"

### Manual Export

```bash
# Using pg_dump (requires PostgreSQL client)
pg_dump -h db.xxxxx.supabase.co -U postgres -d postgres > backup.sql
```

## Performance Optimization

### 1. Adjust IVFFlat Lists

For larger datasets (>100k embeddings):

```sql
-- Drop and recreate index with more lists
DROP INDEX code_embeddings_embedding_idx;
CREATE INDEX code_embeddings_embedding_idx 
  ON code_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 200); -- Increase based on data size
```

### 2. Vacuum Regularly

```sql
VACUUM ANALYZE code_embeddings;
VACUUM ANALYZE doc_embeddings;
```

### 3. Monitor Query Performance

```sql
-- Check slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
WHERE query LIKE '%embedding%'
ORDER BY mean_time DESC
LIMIT 10;
```

## Security Best Practices

### 1. Use RLS Policies

All tables have Row Level Security enabled. Users can only access their own data.

### 2. Use Anon Key in Frontend

Never expose the service_role key in frontend code.

### 3. Validate Input

Always validate and sanitize user input before storing.

### 4. Rate Limiting

Implement rate limiting in your backend to prevent abuse.

## Troubleshooting

### "extension vector does not exist"

Enable it manually:
```sql
CREATE EXTENSION vector;
```

If this fails, contact Supabase support.

### "function search_similar_code does not exist"

Re-run the schema file. The functions should be created.

### "permission denied for table"

Check RLS policies. You may need to use the service_role key for admin operations.

### Slow Vector Searches

1. Check if indexes exist
2. Increase `lists` parameter
3. Reduce `match_count`
4. Optimize embedding dimension

## Next Steps

1. ✅ Schema is set up
2. 📝 Populate with your learning materials
3. 🔧 Integrate with backend
4. 🧪 Test RAG functionality
5. 📊 Monitor usage and optimize

## Resources

- [Supabase pgvector Guide](https://supabase.com/docs/guides/ai/vector-columns)
- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [Vector Similarity Search](https://supabase.com/docs/guides/ai/vector-search)
- [Supabase Python Client](https://supabase.com/docs/reference/python/introduction)

## Support

For database issues:
1. Check Supabase dashboard for errors
2. Review SQL Editor logs
3. Test queries individually
4. Check RLS policies
5. Verify extension is enabled

---

## Quick Start Checklist

- [ ] Create Supabase project
- [ ] Enable pgvector extension
- [ ] Run `supabase_schema.sql`
- [ ] Copy connection details to `.env`
- [ ] Install `pip install supabase`
- [ ] Test with sample queries
- [ ] Integrate with backend
- [ ] Populate with learning materials

**Estimated Setup Time**: 15-20 minutes

**Ready to use RAG?** Follow the "Using the Database in Backend" section above to integrate vector search into your tutor agent.
