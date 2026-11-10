"""
Quick Database Setup Script
Creates required tables in Supabase database
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

def setup_database():
    """Create all required tables in Supabase"""
    
    # Get credentials
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Missing SUPABASE_URL or SUPABASE_KEY in .env file")
        return False
    
    print("🔄 Connecting to Supabase...")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # SQL Schema - Exact copy from supabase_schema.sql
    schema_sql = """
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Table: resumes
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'software_engineer',
    raw_text TEXT,
    filename TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON resumes(created_at DESC);

-- Table: analysis
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

CREATE INDEX IF NOT EXISTS idx_analysis_resume_id ON analysis(resume_id);

-- Table: activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    action_type TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON activity_logs(action_type);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
DROP POLICY IF EXISTS "Allow service role full access to users" ON users;
CREATE POLICY "Allow service role full access to users" ON users
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role full access to resumes" ON resumes;
CREATE POLICY "Allow service role full access to resumes" ON resumes
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role full access to analysis" ON analysis;
CREATE POLICY "Allow service role full access to analysis" ON analysis
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role full access to activity_logs" ON activity_logs;
CREATE POLICY "Allow service role full access to activity_logs" ON activity_logs
    FOR ALL USING (true) WITH CHECK (true);
"""
    
    print("\n🔧 Creating database tables...")
    print("=" * 60)
    
    try:
        # Note: Supabase Python client doesn't support raw SQL execution
        # You need to run this via the SQL Editor in Supabase Dashboard
        
        print("\n⚠️  IMPORTANT: Supabase Python SDK doesn't support DDL (CREATE TABLE) operations")
        print("📝 You need to run the SQL schema manually in Supabase Dashboard\n")
        
        print("✅ STEPS TO FIX:")
        print("=" * 60)
        print("1. Go to https://supabase.com/dashboard")
        print("2. Select your project")
        print("3. Click 'SQL Editor' in the left sidebar")
        print("4. Click 'New query'")
        print("5. Copy the entire content from: backend/supabase_schema.sql")
        print("6. Paste it into the SQL editor")
        print("7. Click 'Run' button")
        print("8. Wait for 'Success. No rows returned' message")
        print("\n💡 OR use the quick copy below:")
        print("=" * 60)
        print(schema_sql)
        print("=" * 60)
        
        print("\n✅ After running the SQL, your tables will be created!")
        print("🔄 Then try uploading your resume again\n")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("\n🚀 AI Career Mentor - Database Setup")
    print("=" * 60)
    setup_database()
