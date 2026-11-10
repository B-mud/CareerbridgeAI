#!/usr/bin/env python3
"""
Setup script for AI components
Downloads required models and data for the AI analyzer
"""

import subprocess
import sys
import os

def install_spacy_model():
    """Install spaCy English model"""
    try:
        print("Installing spaCy English model...")
        subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_sm"], 
                      check=True, capture_output=True)
        print("✓ spaCy model installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"⚠ Warning: Could not install spaCy model: {e}")
        print("  The system will work with reduced NLP capabilities")

def download_nltk_data():
    """Download required NLTK data"""
    try:
        import nltk
        print("Downloading NLTK data...")
        
        # Download required datasets
        datasets = ['punkt', 'stopwords', 'wordnet', 'averaged_perceptron_tagger']
        for dataset in datasets:
            try:
                nltk.download(dataset, quiet=True)
                print(f"✓ Downloaded {dataset}")
            except Exception as e:
                print(f"⚠ Warning: Could not download {dataset}: {e}")
        
    except ImportError:
        print("⚠ Warning: NLTK not installed, skipping NLTK data download")

def verify_installation():
    """Verify AI components are working"""
    try:
        from app.ai_analyzer import AISkillExtractor, TextProcessor, SkillMatcher
        
        print("\nTesting AI components...")
        
        # Test text processing
        processor = TextProcessor()
        sample_text = "I have 3 years of experience with Python, JavaScript, and React. I've worked with AWS and Docker."
        cleaned = processor.clean_text(sample_text)
        print(f"✓ Text processing: {len(cleaned)} characters processed")
        
        # Test skill extraction with error handling
        try:
            extractor = AISkillExtractor()
            skills = extractor.extract_skills_ai(sample_text)
            print(f"✓ Skill extraction: {len(skills['detected_skills'])} skills detected")
            
            # Test skill matching
            matcher = SkillMatcher()
            gap_analysis = matcher.analyze_skill_gap(
                skills['detected_skills'], 
                skills['skill_scores']
            )
            print(f"✓ Skill matching: {gap_analysis['overall_match_score']}% match score")
            
            print("\n🎉 All AI components are working correctly!")
            return True
            
        except Exception as e:
            print(f"⚠ AI extraction error: {e}")
            print("✓ Basic components working, advanced AI features may be limited")
            return False
        
    except Exception as e:
        print(f"\n❌ AI component test failed: {e}")
        print("The system will fall back to keyword-based analysis")
        return False

def main():
    """Main setup function"""
    print("Setting up AI Career Mentor AI components...\n")
    
    # Install spaCy model
    install_spacy_model()
    
    # Download NLTK data
    download_nltk_data()
    
    # Verify installation
    print("\n" + "="*50)
    success = verify_installation()
    
    if success:
        print("\n✅ AI setup completed successfully!")
        print("The resume analyzer will use advanced AI capabilities.")
    else:
        print("\n⚠️  AI setup completed with warnings.")
        print("The resume analyzer will use basic keyword matching.")
        print("\nTo enable full AI features:")
        print("1. Run: install_spacy.bat (Windows) or pip install spacy")
        print("2. Run: python -m spacy download en_core_web_sm")
        print("3. Run: python setup_ai.py again")
    
    print("\nYou can now start the server with: python main.py")

if __name__ == "__main__":
    main()