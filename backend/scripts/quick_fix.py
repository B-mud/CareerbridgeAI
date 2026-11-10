"""
Quick Database Fix - Standalone script without dependencies
"""
import sqlite3
import os

def fix_database():
    """Add missing columns to existing database"""
    db_path = "./db/aicareermentor.db"
    
    # Ensure db directory exists
    os.makedirs("./db", exist_ok=True)
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("Fixing database schema...")
        
        # Check if resumes table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='resumes'")
        if not cursor.fetchone():
            print("Creating resumes table...")
            cursor.execute("""
                CREATE TABLE resumes (
                    id TEXT PRIMARY KEY,
                    filename TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    file_size INTEGER,
                    detected_skills TEXT,
                    missing_skills TEXT,
                    skill_scores TEXT,
                    recommendations TEXT,
                    extracted_text TEXT,
                    target_role TEXT DEFAULT 'software_engineer',
                    analysis_date TIMESTAMP,
                    personal_info TEXT,
                    experience_data TEXT,
                    education_data TEXT,
                    projects_data TEXT, -- This line was missing a comma
                    ai_analysis TEXT,
                    learning_resources TEXT,
                    experience_years INTEGER DEFAULT 0,
                    experience_level TEXT DEFAULT 'intermediate',
                    overall_match_score INTEGER DEFAULT 0
                )
            """)
            print("Created resumes table with all columns")
        else:
            # Add missing columns to existing table
            missing_columns = [
                ("personal_info", "TEXT"),
                ("experience_data", "TEXT"),
                ("education_data", "TEXT"),
                ("projects_data", "TEXT"),
                ("ai_analysis", "TEXT"),
                ("learning_resources", "TEXT"),
                ("experience_years", "INTEGER DEFAULT 0"),
                ("experience_level", "TEXT DEFAULT 'intermediate'"),
                ("overall_match_score", "INTEGER DEFAULT 0")
            ]
            
            for column_name, column_type in missing_columns:
                try:
                    cursor.execute(f"ALTER TABLE resumes ADD COLUMN {column_name} {column_type}")
                    print(f"Added column: {column_name}")
                except sqlite3.OperationalError as e:
                    if "duplicate column name" in str(e):
                        print(f"Column {column_name} already exists")
                    else:
                        print(f"Error adding {column_name}: {e}")
        
        # Create other tables if they don't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                preferred_role TEXT DEFAULT 'software_engineer',
                experience_level TEXT DEFAULT 'intermediate'
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS skill_trends (
                id TEXT PRIMARY KEY,
                skill_name TEXT NOT NULL,
                demand_score INTEGER DEFAULT 0,
                growth_rate INTEGER DEFAULT 0,
                category TEXT,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        conn.close()
        print("Database schema fixed successfully!")
        print("You can now restart the backend server!")
        
    except Exception as e:
        print(f"Database fix failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    fix_database()