"""
Database Fix Script - Add missing columns to existing SQLite database
"""
import sqlite3
import os
from app.database.config import get_database_url

def fix_database():
    """Add missing columns to existing database"""
    db_path = "./db/aicareermentor.db"
    
    # Ensure db directory exists
    os.makedirs("./db", exist_ok=True)
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔧 Fixing database schema...")
        
        # Add missing columns to resumes table
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
                print(f"✅ Added column: {column_name}")
            except sqlite3.OperationalError as e:
                if "duplicate column name" in str(e):
                    print(f"⚠️  Column {column_name} already exists")
                else:
                    print(f"❌ Error adding {column_name}: {e}")
        
        conn.commit()
        conn.close()
        print("✅ Database schema fixed successfully!")
        
    except Exception as e:
        print(f"❌ Database fix failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    fix_database()