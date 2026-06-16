# Design Document: Tagging Accuracy Enhancements

## Goal
Improve classification accuracy for free Maven lessons, limit tag counts to a maximum of 2 tags per lesson, and shift the classification logic to the backend/scraping phase (Approach 1) so the dataset files (`lessons.json` and `maven_free_lessons.csv`) are pre-tagged.

## Priority Order for Tags
1. **AI**
2. **Product**
3. **Design**
4. **Engineering**
5. **Marketing**
6. **Founders**
7. **Leadership**

If no tags match, the lesson is tagged as **General**.

## Components

### 1. Classification Engine (Python)
Both `scrape_free_lessons.py` and `server.py` (which handles the live sync endpoint `/api/sync`) will share the same classification logic:
- Check for matching keywords using case-insensitive regexes with word boundaries (`\b`).
- Sort matched categories by the priority order.
- Select the top 2 categories.
- Fallback to `["General"]` if no tags match.

### 2. Dataset Files
- **`lessons.json`**: Each lesson object will contain a `tags` array (e.g. `["AI", "Product"]`).
- **`maven_free_lessons.csv`**: A new `Tags` column containing comma-separated tags (e.g., `AI, Product`).

### 3. Frontend Client (`app.js`)
- Remove the client-side tag classification logic.
- Directly use `item.tags` (defaulting to `["General"]` if missing) for pill counts and rendering.

### 4. Tests (`test_curator.py`)
- Update `test_curator.py` to match the new priority order and classification rules.
- Add assertions verifying that items in `lessons.json` contain the correct pre-computed `tags` field.
