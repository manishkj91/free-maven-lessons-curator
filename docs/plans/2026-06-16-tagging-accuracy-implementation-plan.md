# Tagging Accuracy & Pre-Classification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement pre-classified, high-accuracy tags (maximum of 2 tags per lesson using strict word boundary matching) directly in the dataset files (`lessons.json` and `maven_free_lessons.csv`) and update the frontend UI and Python test suite to use them.

**Architecture:** Integrate the keyword-based tag classifier into the Python sync processes in `server.py` and `scrape_free_lessons.py`. The JS frontend (`app.js`) will read pre-calculated tags directly from the dataset, eliminating client-side classification overhead.

**Tech Stack:** Python 3 (standard libraries `re`, `json`, `csv`, `urllib`), JavaScript (Vanilla HTML5/CSS/JS).

---

### Task 1: Update Python Tagging Classification Logic in Test Suite

**Files:**
- Modify: [test_curator.py](file:///Users/manishkj/.gemini/antigravity/scratch/free-maven-lessons-curator/test_curator.py)

**Step 1: Implement correct regex-based priority classification function in `test_curator.py`**
Modify the `get_tags_for_lesson` and `CATEGORY_KEYWORDS` mapping to match the priority order: `AI` > `Product` > `Design` > `Engineering` > `Marketing` > `Founders` > `Leadership`. Implement case-insensitive regex word boundaries (`\b`).

Code block to write/replace:
```python
# Updated Tag Priority Order: AI > Product > Design > Engineering > Marketing > Founders > Leadership
TAG_PRIORITY = ['AI', 'Product', 'Design', 'Engineering', 'Marketing', 'Founders', 'Leadership']

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
    matched_tags = []
    
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            # Escape regex characters
            escaped_keyword = re.escape(keyword)
            # Use word boundaries to prevent substring matching
            pattern = rf"\b{escaped_keyword}\b"
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
```

**Step 2: Update the assertions in `test_curator.py`**
Verify the test `test_tag_classification` checks the new priority order:
- `"OpenClaw Masterclass for PMs"` should match `AI` and `Product`.
- `"Build Products Like a Forward Deployed Engineer"` should match `Product` and `Engineering`.
- `"Prototype to Production with v0 for PMs"` should match `AI` and `Product`. (Since `AI` > `Product` > `Design`, the third tag `Design` should be dropped).

**Step 3: Run the test suite and verify it fails on missing `tags` fields in the existing JSON dataset**
Add a test case in `test_database_exists_and_valid` that verifies that each item in `lessons.json` contains a `"tags"` field.

Run: `python3 test_curator.py`
Expected: Failure (since the existing `lessons.json` does not have `"tags"` fields yet).

---

### Task 2: Implement Tagging in Python Scraper and Server Sync

**Files:**
- Modify: [scrape_free_lessons.py](file:///Users/manishkj/.gemini/antigravity/scratch/free-maven-lessons-curator/scrape_free_lessons.py)
- Modify: [server.py](file:///Users/manishkj/.gemini/antigravity/scratch/free-maven-lessons-curator/server.py)

**Step 1: Integrate the tagging functions into `scrape_free_lessons.py` and update CSV generation**
Add `get_tags_for_lesson` and its dependencies to `scrape_free_lessons.py`. Modify the CSV writer to add a `"Tags"` column and write the comma-separated tag list.

**Step 2: Integrate the tagging functions into `server.py` and update JSON generation**
Add `get_tags_for_lesson` to `server.py`. In the `/api/sync` handler, modify the fetched items to inject the `"tags"` list before writing to `lessons.json`:
```python
# Before writing:
for item in all_items:
    item["tags"] = get_tags_for_lesson(item.get("title", ""))
```

**Step 3: Run the scraper or sync to generate the tagged dataset**
Run the sync locally by starting the server and hitting `/api/sync`, or run `scrape_free_lessons.py` to regenerate the files.

Run: `python3 scrape_free_lessons.py`
Expected: `maven_free_lessons.csv` is updated with a `Tags` column.

Run the sync using the running python server task:
`curl http://127.0.0.1:8080/api/sync`
Expected: `lessons.json` is successfully updated with the `"tags"` field for all 3,460+ lessons.

**Step 4: Run the test suite again**
Run: `python3 test_curator.py`
Expected: PASS.

---

### Task 3: Simplify Frontend Code and Verify UI

**Files:**
- Modify: [app.js](file:///Users/manishkj/.gemini/antigravity/scratch/free-maven-lessons-curator/app.js)

**Step 1: Remove dynamic classification engine from `app.js`**
Simplify the initialization to use `item.tags` directly:
```javascript
    // Use pre-classified tags from the dataset
    lessons = rawData.map(item => {
      return {
        ...item,
        _tags: item.tags || ['General']
      };
    });
```
Delete the obsolete `getTagsForLesson` helper function and `CATEGORY_KEYWORDS` configuration from `app.js` (keeping only `TAG_CLASSES` for class mappings).

**Step 2: Verify locally in the browser**
Load `http://127.0.0.1:8080` in the browser and verify:
- All counts of categories (AI, Product, Design, etc.) are correct.
- Lessons have at most 2 tags.
- Tag filters and card clicks work exactly as before.

---

### Task 4: Push Changes to GitHub Pages

**Step 1: Commit and push changes**
Push files `app.js`, `scrape_free_lessons.py`, `server.py`, `test_curator.py`, `lessons.json`, and `maven_free_lessons.csv` to git.
Command:
```bash
git add app.js scrape_free_lessons.py server.py test_curator.py lessons.json maven_free_lessons.csv
git commit -m "feat: pre-classify tags on backend, enforce max 2 tags limit with new priority"
git push origin main
```
Note: Ensure git remote URL doesn't leak credentials after push.
