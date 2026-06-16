import unittest
import re
import os
import json
from scrape_free_lessons import slugify

# Dynamic Tag Classification keywords matching the JS app.js logic
CATEGORY_KEYWORDS = {
  'AI': ['ai', 'agent', 'llm', 'gpt', 'claude', 'prompt', 'rag', 'neural', 'copilot', 'v0', 'evals', 'openclaw', 'learning loops', 'gemini', 'anthropic', 'openai'],
  'Product': ['pm', 'product', 'roadmapping', 'discovery', 'user research', 'product manager', 'strategy', 'metrics', 'roadmap', 'framework', 'agile', 'scrum', 'persona'],
  'Engineering': ['engineer', 'code', 'coding', 'python', 'javascript', 'developer', 'system design', 'scaling', 'architecture', 'git', 'sql', 'database', 'api', 'backend', 'frontend', 'docker', 'webdev'],
  'Design': ['design', 'portfolio', 'ui', 'ux', 'visual', 'interface', 'figma', 'prototyping', 'prototype', 'usability', 'wireframe'],
  'Marketing': ['marketing', 'growth', 'conversion', 'sales', 'branding', 'seo', 'acquisition', 'social media', 'copywriting', 'funnel', 'b2b', 'content strategy'],
  'Leadership': ['leader', 'leadership', 'manage', 'manager', 'managing', 'executive', 'influence', 'career', 'negotiate', 'team', 'okr', 'feedback'],
  'Founders': ['founder', 'startup', 'mvp', 'venture', 'business', 'saas', 'fundraising', 'pitch', 'y combinator', 'monetization', 'solopreneur']
}

def get_tags_for_lesson(title):
    title_lower = title.lower()
    tags = []
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(keyword in title_lower for keyword in keywords):
            tags.push(category) if hasattr(tags, 'push') else tags.append(category)
    if not tags:
        tags.append('General')
    return tags

class TestMavenCurator(unittest.TestCase):
    
    def test_slugify(self):
        """Test that the slugify function correctly formats URLs"""
        self.assertEqual(slugify("OpenClaw Masterclass for PMs"), "openclaw-masterclass-for-pms")
        self.assertEqual(slugify("AI Powered Product Skills!"), "ai-powered-product-skills")
        self.assertEqual(slugify("---Hello World---"), "hello-world")
        self.assertEqual(slugify("Testing 1 2 3"), "testing-1-2-3")

    def test_tag_classification(self):
        """Test that the keyword-based classification tagging works correctly"""
        # Test AI & Product Match
        tags1 = get_tags_for_lesson("OpenClaw Masterclass for PMs")
        self.assertIn("AI", tags1)
        self.assertIn("Product", tags1)
        
        # Test Engineering Match
        tags2 = get_tags_for_lesson("System Design and Python Coding for Developers")
        self.assertIn("Engineering", tags2)
        
        # Test Design Match
        tags3 = get_tags_for_lesson("How to build a beautiful Figma UI Portfolio")
        self.assertIn("Design", tags3)
        
        # Test General Fallback
        tags4 = get_tags_for_lesson("Creative writing 101")
        self.assertEqual(tags4, ["General"])

    def test_database_exists_and_valid(self):
        """Test that the lessons.json file exists and is populated with valid JSON list data"""
        db_path = "lessons.json"
        self.assertTrue(os.path.exists(db_path), "lessons.json database does not exist. Run sync first.")
        
        with open(db_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
        
        # Verify structure of first item
        first_item = data[0]
        self.assertIn("title", first_item)
        self.assertIn("slug", first_item)
        self.assertIn("instructors", first_item)
        self.assertIn("signup_count", first_item)

if __name__ == "__main__":
    unittest.main()
