-- Add Context Columns to tutor_messages
-- Run this in your Supabase SQL Editor

-- Add code_context column to store the code at time of message
ALTER TABLE tutor_messages 
ADD COLUMN IF NOT EXISTS code_context TEXT;

-- Add execution_context column to store execution results
ALTER TABLE tutor_messages 
ADD COLUMN IF NOT EXISTS execution_context JSONB;

-- Add timestamp column (rename created_at to timestamp for consistency)
-- Note: We'll keep created_at and add timestamp as alias
ALTER TABLE tutor_messages 
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- Update existing rows to copy created_at to timestamp
UPDATE tutor_messages 
SET timestamp = created_at 
WHERE timestamp IS NULL;

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tutor_messages'
ORDER BY ordinal_position;

SELECT 'Context columns added successfully!' as status;
