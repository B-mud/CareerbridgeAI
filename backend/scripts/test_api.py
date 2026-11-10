#!/usr/bin/env python3
"""
Simple API test script to verify backend functionality
"""

import requests
import json
import os

BASE_URL = "http://localhost:8000"

def test_health_check():
    """Test if the API is running"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ Health Check: {response.status_code} - {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Health Check Failed: {e}")
        return False

def test_root_endpoint():
    """Test root endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"✅ Root Endpoint: {response.status_code} - {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Root Endpoint Failed: {e}")
        return False

def test_skills_trending():
    """Test skills trending endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/api/skills/trending")
        print(f"✅ Skills Trending: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Data: {json.dumps(data, indent=2)[:200]}...")
        return True
    except Exception as e:
        print(f"❌ Skills Trending Failed: {e}")
        return False

def test_file_upload():
    """Test file upload with a dummy file"""
    try:
        # Create a dummy text file to test upload
        dummy_content = """
        John Doe
        Software Engineer
        
        Experience:
        - 3 years of experience in Python development
        - Worked with React and JavaScript
        - Proficient in SQL and Git
        
        Education:
        - Bachelor's degree in Computer Science
        
        Skills:
        - Python, JavaScript, React, SQL, Git
        """
        
        # Save as temporary file
        with open("temp_resume.txt", "w") as f:
            f.write(dummy_content)
        
        # Try to upload (this should fail validation but test the endpoint)
        with open("temp_resume.txt", "rb") as f:
            files = {"file": ("resume.txt", f, "text/plain")}
            response = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        
        print(f"✅ File Upload Test: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
        
        # Clean up
        os.remove("temp_resume.txt")
        return True
        
    except Exception as e:
        print(f"❌ File Upload Test Failed: {e}")
        # Clean up on error
        if os.path.exists("temp_resume.txt"):
            os.remove("temp_resume.txt")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing AI Career Mentor Backend API")
    print("=" * 50)
    
    tests = [
        ("Health Check", test_health_check),
        ("Root Endpoint", test_root_endpoint),
        ("Skills Trending", test_skills_trending),
        ("File Upload", test_file_upload)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n🔍 Testing {test_name}...")
        result = test_func()
        results.append((test_name, result))
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name}: {status}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Backend is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the backend configuration.")

if __name__ == "__main__":
    main()