"""
Supabase client configuration for backend
Handles connection to Supabase PostgreSQL database
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Initialize Supabase client
supabase: Client = None

def get_supabase_client() -> Client:
    """Get or create Supabase client instance"""
    global supabase
    
    if supabase is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            logger.warning(
                "⚠️ SUPABASE_URL and SUPABASE_KEY not set in .env file"
            )
            return None
        
        try:
            # Suppress proxy parameter for newer versions of httpx
            import os as os_module
            os_module.environ['SUPABASE_CLIENT_DISABLE_PROXY'] = 'true'
            
            supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
            logger.info("✅ Supabase client initialized successfully")
        except TypeError as e:
            if "proxy" in str(e):
                logger.warning(f"⚠️ Supabase client initialization failed due to httpx version: {e}")
                logger.warning("⚠️ Continuing with fallback (no Supabase)")
                return None
            raise
        except Exception as e:
            logger.error(f"❌ Failed to initialize Supabase client: {e}")
            logger.warning("⚠️ Continuing with fallback (no Supabase)")
            return None
    
    return supabase

def test_connection():
    """Test Supabase connection"""
    try:
        client = get_supabase_client()
        # Try a simple query to test connection
        result = client.table("users").select("id").limit(1).execute()
        logger.info("✅ Supabase connection test successful")
        return True
    except Exception as e:
        logger.error(f"❌ Supabase connection test failed: {e}")
        return False

# Initialize on import
try:
    get_supabase_client()
except Exception as e:
    logger.warning(f"⚠️ Supabase client initialization delayed: {e}")
