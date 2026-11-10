"""
Quick verification script to check if Supabase is ready
Run this before starting the backend to verify setup
"""
import os
from dotenv import load_dotenv

load_dotenv()

def check_setup():
    """Quick check of Supabase setup status"""
    
    print("\n" + "="*60)
    print("🔍 Supabase Setup Verification")
    print("="*60 + "\n")
    
    all_good = True
    
    # Check 1: Environment file
    if os.path.exists(".env"):
        print("✅ .env file exists")
    else:
        print("❌ .env file missing")
        all_good = False
    
    # Check 2: Environment variables
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if supabase_url:
        print(f"✅ SUPABASE_URL configured: {supabase_url}")
    else:
        print("❌ SUPABASE_URL not found in .env")
        all_good = False
    
    if supabase_key:
        print(f"✅ SUPABASE_KEY configured: {supabase_key[:20]}...")
    else:
        print("❌ SUPABASE_KEY not found in .env")
        all_good = False
    
    # Check 3: Required files
    required_files = [
        "supabase_schema.sql",
        "test_supabase.py",
        "start_supabase.bat",
        "app/database/supabase_client.py",
        "app/database/user_service.py",
        "app/database/resume_service.py",
        "app/api/resume_supabase.py"
    ]
    
    print("\n✅ Checking required files...")
    for file in required_files:
        if os.path.exists(file):
            print(f"   ✓ {file}")
        else:
            print(f"   ✗ {file} - MISSING")
            all_good = False
    
    # Check 4: Dependencies
    print("\n✅ Checking dependencies...")
    try:
        import supabase
        print("   ✓ supabase package installed")
    except ImportError:
        print("   ✗ supabase package missing - run: pip install -r requirements.txt")
        all_good = False
    
    try:
        import dotenv
        print("   ✓ python-dotenv installed")
    except ImportError:
        print("   ✗ python-dotenv missing - run: pip install -r requirements.txt")
        all_good = False
    
    try:
        import fastapi
        print("   ✓ fastapi installed")
    except ImportError:
        print("   ✗ fastapi missing - run: pip install -r requirements.txt")
        all_good = False
    
    print("\n" + "="*60)
    
    if all_good:
        print("✅ ALL CHECKS PASSED!")
        print("\n📝 Next steps:")
        print("   1. Run SQL schema in Supabase SQL Editor:")
        print("      Copy contents of supabase_schema.sql")
        print("   2. Test connection:")
        print("      python test_supabase.py")
        print("   3. Start backend:")
        print("      python -m uvicorn main:app --reload --port 8000")
    else:
        print("❌ SETUP INCOMPLETE")
        print("\n📝 Actions needed:")
        if not os.path.exists(".env"):
            print("   - Create .env file with Supabase credentials")
        if not supabase_url or not supabase_key:
            print("   - Add SUPABASE_URL and SUPABASE_KEY to .env")
        print("   - Run: pip install -r requirements.txt")
    
    print("="*60 + "\n")
    
    return all_good

if __name__ == "__main__":
    check_setup()
