"""
Database Migration Script for AI Career Mentor
Supports migration from SQLite to PostgreSQL and environment-based database selection
"""

import os
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.database.models import Base, Resume, User, SkillTrend
from app.database.config import get_database_url
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseMigrator:
    def __init__(self):
        self.sqlite_url = "sqlite:///./db/aicareermentor.db"
        self.postgres_url = get_database_url()
        
    def create_tables(self, engine):
        """Create all tables in the target database"""
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("✅ Tables created successfully")
        except Exception as e:
            logger.error(f"❌ Error creating tables: {e}")
            raise
    
    def migrate_sqlite_to_postgres(self):
        """Migrate data from SQLite to PostgreSQL"""
        logger.info("🚀 Starting migration from SQLite to PostgreSQL...")
        
        # Create engines
        sqlite_engine = create_engine(self.sqlite_url)
        postgres_engine = create_engine(self.postgres_url)
        
        # Create sessions
        SqliteSession = sessionmaker(bind=sqlite_engine)
        PostgresSession = sessionmaker(bind=postgres_engine)
        
        sqlite_session = SqliteSession()
        postgres_session = PostgresSession()
        
        try:
            # Create tables in PostgreSQL
            self.create_tables(postgres_engine)
            
            # Migrate Users
            logger.info("📊 Migrating users...")
            users = sqlite_session.query(User).all()
            for user in users:
                # Check if user already exists
                existing = postgres_session.query(User).filter(User.email == user.email).first()
                if not existing:
                    new_user = User(
                        id=user.id,
                        email=user.email,
                        created_at=user.created_at,
                        last_login=user.last_login,
                        preferred_role=user.preferred_role,
                        experience_level=user.experience_level
                    )
                    postgres_session.add(new_user)
            
            # Migrate Resumes
            logger.info("📄 Migrating resumes...")
            resumes = sqlite_session.query(Resume).all()
            for resume in resumes:
                existing = postgres_session.query(Resume).filter(Resume.id == resume.id).first()
                if not existing:
                    new_resume = Resume(
                        id=resume.id,
                        filename=resume.filename,
                        file_path=resume.file_path,
                        upload_date=resume.upload_date,
                        file_size=resume.file_size,
                        detected_skills=resume.detected_skills,
                        missing_skills=resume.missing_skills,
                        skill_scores=resume.skill_scores,
                        recommendations=resume.recommendations,
                        personal_info=getattr(resume, 'personal_info', {}),
                        experience_data=getattr(resume, 'experience_data', []),
                        education_data=getattr(resume, 'education_data', {}),
                        projects_data=getattr(resume, 'projects_data', []),
                        ai_analysis=getattr(resume, 'ai_analysis', {}),
                        learning_resources=getattr(resume, 'learning_resources', {}),
                        extracted_text=resume.extracted_text,
                        target_role=resume.target_role,
                        experience_years=getattr(resume, 'experience_years', 0),
                        experience_level=getattr(resume, 'experience_level', 'intermediate'),
                        overall_match_score=getattr(resume, 'overall_match_score', 0),
                        analysis_date=resume.analysis_date
                    )
                    postgres_session.add(new_resume)
            
            # Migrate Skill Trends
            logger.info("📈 Migrating skill trends...")
            skill_trends = sqlite_session.query(SkillTrend).all()
            for trend in skill_trends:
                existing = postgres_session.query(SkillTrend).filter(SkillTrend.skill_name == trend.skill_name).first()
                if not existing:
                    new_trend = SkillTrend(
                        id=trend.id,
                        skill_name=trend.skill_name,
                        demand_score=trend.demand_score,
                        growth_rate=trend.growth_rate,
                        category=trend.category,
                        last_updated=trend.last_updated
                    )
                    postgres_session.add(new_trend)
            
            # Commit all changes
            postgres_session.commit()
            logger.info("✅ Migration completed successfully!")
            
            # Print summary
            user_count = postgres_session.query(User).count()
            resume_count = postgres_session.query(Resume).count()
            trend_count = postgres_session.query(SkillTrend).count()
            
            logger.info(f"📊 Migration Summary:")
            logger.info(f"   Users: {user_count}")
            logger.info(f"   Resumes: {resume_count}")
            logger.info(f"   Skill Trends: {trend_count}")
            
        except Exception as e:
            postgres_session.rollback()
            logger.error(f"❌ Migration failed: {e}")
            raise
        finally:
            sqlite_session.close()
            postgres_session.close()
    
    def setup_development_data(self):
        """Setup sample data for development"""
        logger.info("🔧 Setting up development data...")
        
        engine = create_engine(get_database_url())
        Session = sessionmaker(bind=engine)
        session = Session()
        
        try:
            # Create tables
            self.create_tables(engine)
            
            # Add sample skill trends if they don't exist
            sample_skills = [
                {"skill_name": "Python", "demand_score": 95, "growth_rate": 15, "category": "programming"},
                {"skill_name": "JavaScript", "demand_score": 92, "growth_rate": 12, "category": "programming"},
                {"skill_name": "React", "demand_score": 90, "growth_rate": 20, "category": "frontend"},
                {"skill_name": "AWS", "demand_score": 93, "growth_rate": 22, "category": "cloud"},
                {"skill_name": "Docker", "demand_score": 88, "growth_rate": 25, "category": "devops"},
                {"skill_name": "Kubernetes", "demand_score": 82, "growth_rate": 30, "category": "devops"},
                {"skill_name": "Machine Learning", "demand_score": 90, "growth_rate": 35, "category": "ai"},
                {"skill_name": "TypeScript", "demand_score": 88, "growth_rate": 28, "category": "programming"},
                {"skill_name": "Node.js", "demand_score": 85, "growth_rate": 18, "category": "backend"},
                {"skill_name": "PostgreSQL", "demand_score": 80, "growth_rate": 15, "category": "database"}
            ]
            
            for skill_data in sample_skills:
                existing = session.query(SkillTrend).filter(
                    SkillTrend.skill_name == skill_data["skill_name"]
                ).first()
                
                if not existing:
                    skill_trend = SkillTrend(**skill_data)
                    session.add(skill_trend)
            
            session.commit()
            logger.info("✅ Development data setup completed!")
            
        except Exception as e:
            session.rollback()
            logger.error(f"❌ Development data setup failed: {e}")
            raise
        finally:
            session.close()
    
    def check_database_connection(self):
        """Check if database connection is working"""
        try:
            engine = create_engine(get_database_url())
            with engine.connect() as conn:
                result = conn.execute(text("SELECT 1"))
                logger.info("✅ Database connection successful!")
                return True
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            return False
    
    def get_database_info(self):
        """Get information about current database setup"""
        db_url = get_database_url()
        db_type = "PostgreSQL" if db_url.startswith("postgresql") else "SQLite"
        
        logger.info(f"📊 Database Information:")
        logger.info(f"   Type: {db_type}")
        logger.info(f"   URL: {db_url}")
        
        if self.check_database_connection():
            engine = create_engine(db_url)
            Session = sessionmaker(bind=engine)
            session = Session()
            
            try:
                user_count = session.query(User).count()
                resume_count = session.query(Resume).count()
                trend_count = session.query(SkillTrend).count()
                
                logger.info(f"   Users: {user_count}")
                logger.info(f"   Resumes: {resume_count}")
                logger.info(f"   Skill Trends: {trend_count}")
                
            except Exception as e:
                logger.warning(f"   Could not get table counts: {e}")
            finally:
                session.close()

def main():
    """Main function for running migration commands"""
    import sys
    
    migrator = DatabaseMigrator()
    
    if len(sys.argv) < 2:
        print("Usage: python database_migration.py [command]")
        print("Commands:")
        print("  info          - Show database information")
        print("  setup         - Setup development data")
        print("  migrate       - Migrate from SQLite to PostgreSQL")
        print("  check         - Check database connection")
        return
    
    command = sys.argv[1].lower()
    
    if command == "info":
        migrator.get_database_info()
    elif command == "setup":
        migrator.setup_development_data()
    elif command == "migrate":
        migrator.migrate_sqlite_to_postgres()
    elif command == "check":
        migrator.check_database_connection()
    else:
        print(f"Unknown command: {command}")

if __name__ == "__main__":
    main()