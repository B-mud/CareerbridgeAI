-- Supabase Database Schema for AI Career Mentor
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Table: users
-- Stores user information
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================================
-- Table: resumes
-- Stores uploaded resume information
-- ============================================================================
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'software_engineer',
    raw_text TEXT,
    filename TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON resumes(created_at DESC);

-- ============================================================================
-- Table: analysis
-- Stores resume analysis results
-- ============================================================================
CREATE TABLE IF NOT EXISTS analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
    skills TEXT[] DEFAULT '{}',
    possessed_skills TEXT[] DEFAULT '{}',
    missing_skills TEXT[] DEFAULT '{}',
    experience TEXT,
    match_score INTEGER DEFAULT 0,
    recommendations JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster resume lookups
CREATE INDEX IF NOT EXISTS idx_analysis_resume_id ON analysis(resume_id);

-- ============================================================================
-- Table: activity_logs
-- Stores user activity history
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    action_type TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON activity_logs(action_type);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- Note: For demo purposes, these are permissive. Tighten in production.
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Users table policies (allow all for service role)
CREATE POLICY "Allow service role full access to users" ON users
    FOR ALL USING (true) WITH CHECK (true);

-- Resumes table policies (allow all for service role)
CREATE POLICY "Allow service role full access to resumes" ON resumes
    FOR ALL USING (true) WITH CHECK (true);

-- Analysis table policies (allow all for service role)
CREATE POLICY "Allow service role full access to analysis" ON analysis
    FOR ALL USING (true) WITH CHECK (true);

-- Activity logs policies (allow all for service role)
CREATE POLICY "Allow service role full access to activity_logs" ON activity_logs
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- Sample Data (Optional - for testing)
-- ============================================================================

-- Insert a demo user (using auto-generated UUID)
INSERT INTO users (name, email, created_at)
VALUES (
    'Demo User',
    'demo@aicareermentor.com',
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'resumes', 'analysis', 'activity_logs');

-- Check row counts
SELECT 
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM resumes) as resumes_count,
    (SELECT COUNT(*) FROM analysis) as analysis_count,
    (SELECT COUNT(*) FROM activity_logs) as activity_logs_count;
