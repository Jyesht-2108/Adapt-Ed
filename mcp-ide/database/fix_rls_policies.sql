-- Fix RLS Policies to Allow Anonymous Users
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- Allow anonymous users to insert into tutor_sessions
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own tutor sessions" ON tutor_sessions;
DROP POLICY IF EXISTS "Users can view their own tutor sessions" ON tutor_sessions;
DROP POLICY IF EXISTS "Users can update their own tutor sessions" ON tutor_sessions;

-- Create new policies that allow anonymous access
CREATE POLICY "Anyone can insert tutor sessions"
  ON tutor_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view tutor sessions"
  ON tutor_sessions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update tutor sessions"
  ON tutor_sessions FOR UPDATE
  USING (true);

-- ============================================================================
-- Allow anonymous users to insert into tutor_messages
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert messages to their sessions" ON tutor_messages;
DROP POLICY IF EXISTS "Users can view messages from their sessions" ON tutor_messages;

-- Create new policies that allow anonymous access
CREATE POLICY "Anyone can insert tutor messages"
  ON tutor_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view tutor messages"
  ON tutor_messages FOR SELECT
  USING (true);

-- ============================================================================
-- Allow anonymous users to insert into code_history
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own code history" ON code_history;
DROP POLICY IF EXISTS "Users can view their own code history" ON code_history;

-- Create new policies that allow anonymous access
CREATE POLICY "Anyone can insert code history"
  ON code_history FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view code history"
  ON code_history FOR SELECT
  USING (true);

-- ============================================================================
-- Verify policies are applied
-- ============================================================================

-- Check tutor_sessions policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'tutor_sessions';

-- Check tutor_messages policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'tutor_messages';

-- Check code_history policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'code_history';
