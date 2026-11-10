import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger(__name__)

def get_database_url():
    """Get database URL based on environment variables"""
    # Check for PostgreSQL first (production)
    if os.getenv("DATABASE_URL"):
        return os.getenv("DATABASE_URL")
    
    # Check for individual PostgreSQL components
    pg_host = os.getenv("POSTGRES_HOST")
    pg_db = os.getenv("POSTGRES_DB")
    pg_user = os.getenv("POSTGRES_USER")
    pg_password = os.getenv("POSTGRES_PASSWORD")
    pg_port = os.getenv("POSTGRES_PORT", "5432")
    
    if all([pg_host, pg_db, pg_user, pg_password]):
        return f"postgresql://{pg_user}:{pg_password}@{pg_host}:{pg_port}/{pg_db}"
    
    # Fallback to SQLite for development
    os.makedirs("./db", exist_ok=True)
    return "sqlite:///./db/aicareermentor.db"

# Database configuration
DATABASE_URL = get_database_url()
logger.info(f"Using database: {'PostgreSQL' if 'postgresql' in DATABASE_URL else 'SQLite'}")

# Create engine with appropriate settings
if "postgresql" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=300
    )
else:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()