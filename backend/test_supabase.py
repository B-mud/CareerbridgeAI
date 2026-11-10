"""
Test Supabase connection and database operations
Run this to verify everything is set up correctly
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import (
    get_supabase_client, test_connection,
    UserService, ResumeService, AnalysisService, ActivityLogService
)
from dotenv import load_dotenv
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_supabase_setup():
    """Test complete Supabase setup"""
    
    print("\n" + "="*60)
    print("🔍 Testing Supabase Connection")
    print("="*60 + "\n")
    
    # Load environment variables
    load_dotenv()
    
    # Test 1: Environment variables
    print("✅ Step 1: Checking environment variables...")
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ SUPABASE_URL or SUPABASE_KEY not found in .env file")
        return False
    
    print(f"   ✓ SUPABASE_URL: {supabase_url}")
    print(f"   ✓ SUPABASE_KEY: {supabase_key[:20]}...")
    
    # Test 2: Client initialization
    print("\n✅ Step 2: Initializing Supabase client...")
    try:
        client = get_supabase_client()
        print("   ✓ Supabase client initialized successfully")
    except Exception as e:
        print(f"   ❌ Failed to initialize client: {e}")
        return False
    
    # Test 3: Connection test
    print("\n✅ Step 3: Testing connection...")
    if not test_connection():
        print("   ❌ Connection test failed - check if tables exist in Supabase")
        print("   💡 Run the SQL schema in Supabase SQL Editor first!")
        return False
    print("   ✓ Connection successful")
    
    # Test 4: User service
    print("\n✅ Step 4: Testing User service...")
    user_service = UserService()
    try:
        test_user = user_service.get_or_create_user(
            name="Test User",
            email="test@aicareermentor.com"
        )
        if test_user:
            print(f"   ✓ User created/retrieved: {test_user['name']} ({test_user['email']})")
            test_user_id = test_user['id']
        else:
            print("   ❌ Failed to create/get user")
            return False
    except Exception as e:
        print(f"   ❌ User service error: {e}")
        return False
    
    # Test 5: Resume service
    print("\n✅ Step 5: Testing Resume service...")
    resume_service = ResumeService()
    try:
        test_resume = resume_service.create_resume(
            user_id=test_user_id,
            role="software_engineer",
            raw_text="Test resume content with skills like Python, React, and SQL.",
            filename="test_resume.pdf"
        )
        if test_resume:
            print(f"   ✓ Resume created: {test_resume['id']}")
            test_resume_id = test_resume['id']
        else:
            print("   ❌ Failed to create resume")
            return False
    except Exception as e:
        print(f"   ❌ Resume service error: {e}")
        return False
    
    # Test 6: Analysis service
    print("\n✅ Step 6: Testing Analysis service...")
    analysis_service = AnalysisService()
    try:
        test_analysis = analysis_service.create_analysis(
            resume_id=test_resume_id,
            skills=["Python", "React", "SQL"],
            experience="2 years",
            match_score=85,
            recommendations=[
                {"text": "Learn TypeScript"},
                {"text": "Practice system design"}
            ]
        )
        if test_analysis:
            print(f"   ✓ Analysis created: {test_analysis['id']}")
            print(f"   ✓ Skills: {test_analysis['skills']}")
            print(f"   ✓ Match score: {test_analysis['match_score']}")
        else:
            print("   ❌ Failed to create analysis")
            return False
    except Exception as e:
        print(f"   ❌ Analysis service error: {e}")
        return False
    
    # Test 7: Activity log service
    print("\n✅ Step 7: Testing Activity Log service...")
    activity_service = ActivityLogService()
    try:
        activity = activity_service.log_activity(
            user_id=test_user_id,
            action_type="test_connection",
            details={"message": "Testing Supabase integration"}
        )
        if activity:
            print(f"   ✓ Activity logged: {activity['action_type']}")
        else:
            print("   ❌ Failed to log activity")
            return False
    except Exception as e:
        print(f"   ❌ Activity service error: {e}")
        return False
    
    # Test 8: Retrieval
    print("\n✅ Step 8: Testing data retrieval...")
    try:
        # Get user resumes
        user_resumes = resume_service.get_user_resumes(test_user_id)
        print(f"   ✓ Found {len(user_resumes)} resume(s) for user")
        
        # Get analysis
        resume_analysis = analysis_service.get_analysis_by_resume_id(test_resume_id)
        if resume_analysis:
            print(f"   ✓ Retrieved analysis with {len(resume_analysis['skills'])} skills")
        
        # Get activities
        activities = activity_service.get_user_activities(test_user_id)
        print(f"   ✓ Found {len(activities)} activity log(s)")
        
    except Exception as e:
        print(f"   ❌ Retrieval error: {e}")
        return False
    
    # Test 9: Cleanup (optional)
    print("\n✅ Step 9: Cleanup test data...")
    try:
        # Delete test resume (cascade will delete analysis)
        resume_service.delete_resume(test_resume_id)
        print("   ✓ Test data cleaned up")
    except Exception as e:
        print(f"   ⚠️ Cleanup warning: {e}")
    
    print("\n" + "="*60)
    print("✅ ALL TESTS PASSED! Supabase is configured correctly!")
    print("="*60 + "\n")
    
    return True

if __name__ == "__main__":
    try:
        success = test_supabase_setup()
        if success:
            print("🚀 Ready to use Supabase with your backend!")
            print("\n📝 Next steps:")
            print("   1. Make sure to run supabase_schema.sql in Supabase SQL Editor")
            print("   2. Update main.py to use resume_supabase.py router")
            print("   3. Start your backend: uvicorn main:app --reload --port 8000")
            sys.exit(0)
        else:
            print("\n❌ Setup incomplete. Please fix the errors above.")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n⚠️ Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
