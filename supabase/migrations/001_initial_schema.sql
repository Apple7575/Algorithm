-- 001_initial_schema.sql
-- Algo-PT Database Schema
-- Based on specs/001-algo-pt/data-model.md

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Users table
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  baekjoon_id VARCHAR(50) UNIQUE,
  target_tier VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_baekjoon_id ON users(baekjoon_id);

-- ============================================================
-- Problems table (cache from Solved.ac)
-- ============================================================
CREATE TABLE problems (
  problem_id INTEGER PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  level INTEGER,
  tags JSONB DEFAULT '[]',
  cached_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_problems_level ON problems(level);
CREATE INDEX idx_problems_tags ON problems USING GIN(tags);

-- ============================================================
-- Study logs table
-- ============================================================
CREATE TABLE study_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id INTEGER NOT NULL REFERENCES problems(problem_id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('solved', 'failed', 'review_needed')),
  duration_seconds INTEGER,
  difficulty_rating VARCHAR(10) CHECK (difficulty_rating IN ('easy', 'normal', 'hard')),
  failure_reason VARCHAR(20) CHECK (failure_reason IN ('algo', 'impl', 'time', 'edge')),
  solved_at TIMESTAMPTZ DEFAULT NOW(),
  next_review_date DATE,
  easiness_factor DECIMAL(4,2) DEFAULT 2.50 CHECK (easiness_factor >= 1.30),
  interval_days INTEGER DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_study_logs_user_next_review ON study_logs(user_id, next_review_date);
CREATE INDEX idx_study_logs_user_problem ON study_logs(user_id, problem_id);
CREATE INDEX idx_study_logs_user_status ON study_logs(user_id, status);
CREATE INDEX idx_study_logs_failure_reason ON study_logs(user_id, failure_reason)
  WHERE failure_reason IS NOT NULL;

-- ============================================================
-- AI usage tracking
-- ============================================================
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  flash_count INTEGER DEFAULT 0 CHECK (flash_count >= 0 AND flash_count <= 50),
  pro_count INTEGER DEFAULT 0 CHECK (pro_count >= 0 AND pro_count <= 10),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_ai_usage_user_date ON ai_usage(user_id, date);

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Study logs policies
CREATE POLICY "Users can view own logs" ON study_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON study_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own logs" ON study_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- AI usage policies
CREATE POLICY "Users can view own AI usage" ON ai_usage
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI usage" ON ai_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own AI usage" ON ai_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- Problems table is public (cached metadata)
-- No RLS needed - public read access

-- ============================================================
-- Trigger: Sync auth.users to public.users
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Trigger: Update updated_at on users
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
