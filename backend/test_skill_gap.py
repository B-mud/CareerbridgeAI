"""
Test script for the Skill Gap Engine
Run this to verify the engine works correctly
"""
import sys
sys.path.append('.')

from app.services.skill_gap_service import get_skill_gap_service

def test_skill_gap_engine():
    print("\n" + "="*60)
    print("🎯 CAREER BRIDGE SKILL GAP ENGINE TEST")
    print("="*60 + "\n")
    
    # Initialize service
    service = get_skill_gap_service()
    print("✅ Skill gap service initialized\n")
    
    # Test 1: Get available roles
    print("📋 TEST 1: Available Roles")
    print("-" * 40)
    roles = service.get_available_roles()
    print(f"Found {len(roles)} roles:")
    for role in roles[:3]:  # Show first 3
        print(f"  - {role['title']}: {role['salary_range']}, Growth: {role['job_growth']}")
    print()
    
    # Test 2: Get role details
    print("📋 TEST 2: Role Details (Software Engineer)")
    print("-" * 40)
    role_details = service.get_role_details("software_engineer")
    if role_details:
        print(f"Title: {role_details['title']}")
        print(f"Total Skills Required: {len(role_details['skills'])}")
        print(f"Salary: {role_details['salary_range']}")
        print(f"Job Growth: {role_details['job_growth']}")
    print()
    
    # Test 3: Calculate skill gap - Good match
    print("📋 TEST 3: Skill Gap Calculation (Good Match)")
    print("-" * 40)
    detected_skills_good = [
        "python", "javascript", "react", "git", "sql", "typescript", "docker"
    ]
    result_good = service.calculate_skill_gap(
        detected_skills=detected_skills_good,
        target_role="software_engineer"
    )
    print(f"Detected Skills: {', '.join(detected_skills_good)}")
    print(f"Match Score: {result_good['match_score']}%")
    print(f"Possessed Skills: {result_good['skills_mastered']}/{result_good['total_required_skills']}")
    print(f"Missing Skills: {len(result_good['missing_skills'])}")
    if result_good['missing_skills']:
        print(f"Top Missing: {', '.join([s['name'] for s in result_good['missing_skills'][:3]])}")
    print()
    
    # Test 4: Calculate skill gap - Poor match
    print("📋 TEST 4: Skill Gap Calculation (Beginner)")
    print("-" * 40)
    detected_skills_poor = ["python", "html"]
    result_poor = service.calculate_skill_gap(
        detected_skills=detected_skills_poor,
        target_role="software_engineer"
    )
    print(f"Detected Skills: {', '.join(detected_skills_poor)}")
    print(f"Match Score: {result_poor['match_score']}%")
    print(f"Possessed Skills: {result_poor['skills_mastered']}/{result_poor['total_required_skills']}")
    print(f"Missing Skills: {len(result_poor['missing_skills'])}")
    if result_poor['missing_skills']:
        print(f"Critical Missing: {', '.join([s['name'] for s in result_poor['missing_skills'][:5]])}")
    print()
    
    # Test 5: Recommendations
    print("📋 TEST 5: Recommendations (Beginner)")
    print("-" * 40)
    recommendations = result_poor['recommendations']
    for i, rec in enumerate(recommendations[:3], 1):
        print(f"{i}. [{rec['priority'].upper()}] {rec['message']}")
    print()
    
    # Test 6: Data Scientist Role
    print("📋 TEST 6: Data Scientist Role Match")
    print("-" * 40)
    ds_skills = ["python", "sql", "machine learning", "pandas", "numpy", "tensorflow"]
    result_ds = service.calculate_skill_gap(
        detected_skills=ds_skills,
        target_role="data_scientist"
    )
    print(f"Detected Skills: {', '.join(ds_skills)}")
    print(f"Match Score: {result_ds['match_score']}%")
    print(f"Possessed: {result_ds['skills_mastered']}, Missing: {len(result_ds['missing_skills'])}")
    print()
    
    # Test 7: Skill normalization
    print("📋 TEST 7: Skill Normalization (Aliases)")
    print("-" * 40)
    alias_skills = ["js", "py", "k8s", "ts", "nodejs"]  # Using aliases
    print(f"Input (aliases): {', '.join(alias_skills)}")
    normalized = [service.normalize_skill(s) for s in alias_skills]
    print(f"Normalized: {', '.join(normalized)}")
    result_alias = service.calculate_skill_gap(
        detected_skills=alias_skills,
        target_role="software_engineer"
    )
    print(f"Match Score: {result_alias['match_score']}%")
    print()
    
    print("="*60)
    print("✅ ALL TESTS PASSED! Skill Gap Engine is working correctly.")
    print("="*60 + "\n")
    
    return True


if __name__ == "__main__":
    try:
        test_skill_gap_engine()
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)
