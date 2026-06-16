import unittest
import re
import os
import json
from scrape_free_lessons import slugify

# Updated Tag Priority Order: AI > Product > Design > Engineering > Marketing > Founders > Leadership
TAG_PRIORITY = ['AI', 'Product', 'Design', 'Engineering', 'Marketing', 'Founders', 'Leadership']

CATEGORY_KEYWORDS = {
  'AI': ['ai', 'agent', 'llm', 'gpt', 'claude', 'prompt', 'rag', 'neural', 'copilot', 'v0', 'evals', 'openclaw', 'learning loops', 'gemini', 'anthropic', 'openai'],
  'Product': ['pm', 'pms', 'product', 'products', 'roadmapping', 'discovery', 'user research', 'product manager', 'strategy', 'metrics', 'roadmap', 'framework', 'agile', 'scrum', 'persona'],
  'Design': ['design', 'portfolio', 'ui', 'ux', 'visual', 'interface', 'figma', 'prototyping', 'prototype', 'usability', 'wireframe'],
  'Engineering': ['engineer', 'code', 'coding', 'python', 'javascript', 'developer', 'system design', 'scaling', 'architecture', 'git', 'sql', 'database', 'api', 'backend', 'frontend', 'docker', 'webdev'],
  'Marketing': ['marketing', 'growth', 'conversion', 'sales', 'branding', 'seo', 'acquisition', 'social media', 'copywriting', 'funnel', 'b2b', 'content strategy'],
  'Founders': ['founder', 'startup', 'mvp', 'venture', 'business', 'saas', 'fundraising', 'pitch', 'y combinator', 'monetization', 'solopreneur'],
  'Leadership': ['leader', 'leadership', 'manage', 'manager', 'managing', 'executive', 'influence', 'career', 'negotiate', 'team', 'okr', 'feedback']
}

def get_tags_for_lesson(title):
    title_lower = title.lower()
    matched_tags = []
    
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            # Escape regex characters
            escaped_keyword = re.escape(keyword)
            # Use word boundaries to prevent substring matching
            # Support optional trailing 's' for plurals (e.g. pm -> pms, product -> products)
            pattern = rf"\b{escaped_keyword}s?\b"
            if re.search(pattern, title_lower):
                matched_tags.append(category)
                break
                
    # Sort by priority
    matched_tags.sort(key=lambda t: TAG_PRIORITY.index(t) if t in TAG_PRIORITY else 999)
    
    # Take max 2 tags
    final_tags = matched_tags[:2]
    if not final_tags:
        final_tags = ['General']
        
    return final_tags

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
        self.assertEqual(tags1, ["AI", "Product"])
        
        # Test Product & Engineering Match
        tags2 = get_tags_for_lesson("Build Products Like a Forward Deployed Engineer")
        self.assertEqual(tags2, ["Product", "Engineering"])
        
        # Test AI & Product Match (Design is dropped due to max 2 limit and priority)
        tags3 = get_tags_for_lesson("Prototype to Production with v0 for PMs")
        self.assertEqual(tags3, ["AI", "Product"])
        
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
        
        # Verify structure of all items
        for item in data:
            self.assertIn("title", item)
            self.assertIn("slug", item)
            self.assertIn("instructors", item)
            self.assertIn("signup_count", item)
            self.assertIn("tags", item, f"Lesson '{item.get('title')}' is missing tags field")

if __name__ == "__main__":
    unittest.main()
