-- Career Bridge Skill Gap Engine Schema Update
-- Add missing_skills column to analysis table

-- Update analysis table to include missing_skills
ALTER TABLE analysis 
ADD COLUMN IF NOT EXISTS missing_skills TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN analysis.missing_skills IS 'Array of skills missing from resume for target role';

-- Create index for faster queries on missing skills
CREATE INDEX IF NOT EXISTS idx_analysis_missing_skills ON analysis USING GIN(missing_skills);

-- Add possessed_skills for clarity (skills is kept for backward compatibility)
ALTER TABLE analysis 
ADD COLUMN IF NOT EXISTS possessed_skills TEXT[] DEFAULT '{}';

COMMENT ON COLUMN analysis.possessed_skills IS 'Array of skills possessed by user';

-- Update existing records to set possessed_skills same as skills
UPDATE analysis SET possessed_skills = skills WHERE possessed_skills = '{}';
