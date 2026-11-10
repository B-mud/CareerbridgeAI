-- AI Career Mentor PostgreSQL Schema
-- Production-ready database schema for scalable deployment

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and profiles
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    -- Profile information
    profession VARCHAR(100),
    experience_level VARCHAR(50) DEFAULT 'intermediate',
    target_role VARCHAR(100) DEFAULT 'software_engineer',
    interests JSONB DEFAULT '[]'::jsonb,
    
    -- Indexes
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Resumes table for storing uploaded files and analysis
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Analysis results (stored as JSONB for flexibility)
    detected_skills JSONB DEFAULT '[]'::jsonb,
    missing_skills JSONB DEFAULT '[]'::jsonb,
    skill_scores JSONB DEFAULT '{}'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    
    -- Enhanced analysis data
    personal_info JSONB DEFAULT '{}'::jsonb,
    experience_data JSONB DEFAULT '[]'::jsonb,
    education_data JSONB DEFAULT '{}'::jsonb,
    projects_data JSONB DEFAULT '[]'::jsonb,
    ai_analysis JSONB DEFAULT '{}'::jsonb,
    learning_resources JSONB DEFAULT '{}'::jsonb,
    
    -- Extracted text for ML training (optional)
    extracted_text TEXT,
    
    -- Analysis metadata
    target_role VARCHAR(100) DEFAULT 'software_engineer',
    experience_years INTEGER DEFAULT 0,
    experience_level VARCHAR(50) DEFAULT 'intermediate',
    overall_match_score INTEGER DEFAULT 0,
    analysis_date TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT resumes_file_size_check CHECK (file_size > 0),
    CONSTRAINT resumes_match_score_check CHECK (overall_match_score >= 0 AND overall_match_score <= 100)
);

-- Skill trends table for market data
CREATE TABLE skill_trends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_name VARCHAR(100) NOT NULL,
    demand_score INTEGER DEFAULT 0,
    growth_rate INTEGER DEFAULT 0,
    category VARCHAR(50),
    market_data JSONB DEFAULT '{}'::jsonb,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT skill_trends_demand_check CHECK (demand_score >= 0 AND demand_score <= 100),
    CONSTRAINT skill_trends_growth_check CHECK (growth_rate >= -50 AND growth_rate <= 200),
    UNIQUE(skill_name)
);

-- Learning resources table for courses, tutorials, etc.
CREATE TABLE learning_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    platform VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL, -- course, tutorial, book, video, etc.
    url VARCHAR(500),
    description TEXT,
    duration VARCHAR(50),
    difficulty_level VARCHAR(20), -- beginner, intermediate, advanced
    rating DECIMAL(3,2),
    price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    skills_covered JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    
    -- Constraints
    CONSTRAINT learning_resources_rating_check CHECK (rating >= 0 AND rating <= 5),
    CONSTRAINT learning_resources_price_check CHECK (price >= 0)
);

-- User progress tracking
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES learning_resources(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'not_started', -- not_started, in_progress, completed, paused
    progress_percentage INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    
    -- Constraints
    CONSTRAINT user_progress_percentage_check CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    UNIQUE(user_id, resource_id)
);

-- Skill assessments and test results
CREATE TABLE skill_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    assessment_type VARCHAR(50) NOT NULL, -- quiz, coding_challenge, project_review
    score INTEGER,
    max_score INTEGER,
    percentage DECIMAL(5,2),
    time_taken INTEGER, -- in minutes
    assessment_data JSONB DEFAULT '{}'::jsonb,
    taken_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT skill_assessments_score_check CHECK (score >= 0 AND score <= max_score),
    CONSTRAINT skill_assessments_percentage_check CHECK (percentage >= 0 AND percentage <= 100)
);

-- Job market data for salary insights
CREATE TABLE job_market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_title VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    salary_min INTEGER,
    salary_max INTEGER,
    currency VARCHAR(3) DEFAULT 'USD',
    required_skills JSONB DEFAULT '[]'::jsonb,
    preferred_skills JSONB DEFAULT '[]'::jsonb,
    experience_required VARCHAR(50),
    company_size VARCHAR(50),
    industry VARCHAR(100),
    remote_friendly BOOLEAN DEFAULT false,
    data_source VARCHAR(100),
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT job_market_salary_check CHECK (salary_min <= salary_max)
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_profession ON users(profession);
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_upload_date ON resumes(upload_date);
CREATE INDEX idx_resumes_target_role ON resumes(target_role);
CREATE INDEX idx_resumes_detected_skills ON resumes USING GIN(detected_skills);
CREATE INDEX idx_skill_trends_name ON skill_trends(skill_name);
CREATE INDEX idx_skill_trends_category ON skill_trends(category);
CREATE INDEX idx_learning_resources_platform ON learning_resources(platform);
CREATE INDEX idx_learning_resources_type ON learning_resources(resource_type);
CREATE INDEX idx_learning_resources_skills ON learning_resources USING GIN(skills_covered);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_status ON user_progress(status);
CREATE INDEX idx_skill_assessments_user_id ON skill_assessments(user_id);
CREATE INDEX idx_skill_assessments_skill ON skill_assessments(skill_name);
CREATE INDEX idx_job_market_role ON job_market_data(role_title);
CREATE INDEX idx_job_market_location ON job_market_data(location);
CREATE INDEX idx_job_market_skills ON job_market_data USING GIN(required_skills);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_resources_updated_at BEFORE UPDATE ON learning_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for skill trends
INSERT INTO skill_trends (skill_name, demand_score, growth_rate, category) VALUES
('Python', 95, 15, 'programming'),
('JavaScript', 92, 12, 'programming'),
('React', 90, 20, 'frontend'),
('AWS', 93, 22, 'cloud'),
('Docker', 88, 25, 'devops'),
('Kubernetes', 82, 30, 'devops'),
('Machine Learning', 90, 35, 'ai'),
('TypeScript', 88, 28, 'programming'),
('Node.js', 85, 18, 'backend'),
('PostgreSQL', 80, 15, 'database');

-- Sample learning resources
INSERT INTO learning_resources (title, platform, resource_type, url, description, duration, difficulty_level, rating, skills_covered) VALUES
('Complete Python Bootcamp', 'Udemy', 'course', 'https://udemy.com/python-bootcamp', 'Comprehensive Python course from beginner to advanced', '22 hours', 'beginner', 4.6, '["Python", "Programming Fundamentals"]'),
('React - The Complete Guide', 'Udemy', 'course', 'https://udemy.com/react-complete', 'Master React with hooks, context, and modern patterns', '48 hours', 'intermediate', 4.8, '["React", "JavaScript", "Frontend Development"]'),
('AWS Cloud Practitioner', 'AWS', 'certification', 'https://aws.amazon.com/certification/', 'Entry-level AWS certification', '40 hours', 'beginner', 4.5, '["AWS", "Cloud Computing"]'),
('Machine Learning Specialization', 'Coursera', 'specialization', 'https://coursera.org/ml-specialization', 'Stanford ML course by Andrew Ng', '3 months', 'intermediate', 4.9, '["Machine Learning", "Python", "Mathematics"]');

-- Views for common queries
CREATE VIEW user_skill_summary AS
SELECT 
    u.id as user_id,
    u.full_name,
    u.profession,
    u.experience_level,
    r.detected_skills,
    r.missing_skills,
    r.overall_match_score,
    r.analysis_date
FROM users u
LEFT JOIN resumes r ON u.id = r.user_id
WHERE r.analysis_date = (
    SELECT MAX(analysis_date) 
    FROM resumes r2 
    WHERE r2.user_id = u.id
);

CREATE VIEW trending_skills_view AS
SELECT 
    skill_name,
    demand_score,
    growth_rate,
    category,
    (demand_score + growth_rate) as total_score
FROM skill_trends
ORDER BY total_score DESC;

-- Grant permissions (adjust as needed for your deployment)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aicareer_app;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aicareer_app;