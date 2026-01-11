-- 002_solved_ac_sync.sql
-- Add support for Solved.ac synchronization

-- Add synced_from_solved_ac flag to study_logs
ALTER TABLE study_logs ADD COLUMN IF NOT EXISTS synced_from_solved_ac BOOLEAN DEFAULT FALSE;

-- Create profiles table (alternative to using users table directly)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  baekjoon_id VARCHAR(50),
  solved_ac_tier INTEGER,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create index for baekjoon_id lookups
CREATE INDEX IF NOT EXISTS idx_profiles_baekjoon_id ON profiles(baekjoon_id);
CREATE INDEX IF NOT EXISTS idx_study_logs_synced ON study_logs(synced_from_solved_ac);
