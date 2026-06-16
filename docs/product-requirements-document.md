# Product Requirements Document (PRD)
## Maven Lightning Lesson Curator

**Author:** Product Monkai  
**Date:** June 16, 2026  
**Status:** V1.0 Released | V2.0 In Planning  

---

## 1. Executive Summary & Problem Statement
Maven.com hosts a wealth of free, live, cohort-based **Lightning Lessons** taught by world-class industry leaders. However, discovery is broken: there is no native search, relevance ranking, or granular category filtering. 

**Maven Lightning Lesson Curator** is a lightweight, high-performance curation and discovery engine designed to help professionals instantly discover, search, and rank over 3,400+ free lessons by category and relevance.

---

## 2. Target Audience
- **Lifelong Learners & Professionals**: Product Managers, Software Engineers, Designers, Marketers, and Startup Founders looking for high-quality, free, cohort-based masterclasses to upskill.

---

## 3. Product Features (V1.0 - Completed)

### 3.1. Unified Tag Classification System (Pre-Classification)
- **Engine**: A backend classification rule built in Python that parses lesson titles using strict case-insensitive word-boundary regexes (`\b`) to eliminate partial/substring false matches (e.g. matching "ui" in "build").
- **Tag Capping**: Restricts each lesson to a **maximum of 2 tags** for design cleanliness.
- **Priority Logic**: Sorts matched tags based on a strict priority hierarchy:
  1. `AI`
  2. `Product`
  3. `Design`
  4. `Engineering`
  5. `Marketing`
  6. `Founders`
  7. `Leadership`
- **Fallback**: Matches defaulting to `["General"]` if no keywords match.

### 3.2. Performance-First Architecture
- Shipped the tag classification logic from client-side execution to the backend sync phase, eliminating runtime regex matching overhead for 3,400+ entries.
- Pre-tagged dataset files (`lessons.json` and `maven_free_lessons.csv`) are generated during backend compilation.

### 3.3. Dynamic Category Navigation & Filtering
- Interactive category navigation pills displaying aggregated counts dynamically computed from the dataset (e.g. `AI (1,889)`).
- Quick search filters supporting tag clicks directly on cards to immediately filter the lesson grid.

### 3.4. Relevance & Popularity Sorting
- Search matches ranked by relevance (scoring exact word title matches, substring title matches, and instructor matches) or sorted by popularity (signups), duration, and date.

### 3.5. Detail Modal & Product Hunt Widget
- Interactive cards opening detailed modal views with instructor avatars, dates, durations, and signups.
- Product Hunt featured badge embedded directly in the header.

---

## 4. Technical Constraints
- **Zero Third-Party JS Dependencies**: Served strictly with Vanilla HTML5, CSS3, and JavaScript for optimal page load speed.
- **Backend server**: Built in Python standard libraries (`http.server`) serving as a local sync proxy to bypass Maven CORS blocks during sync.
- **Secure by default**: Disabled public visibility of the "Sync Database" button on production (`productmonkai.com`) while keeping it fully functional on `localhost`.

---

## 5. Future Scope (V2.0 - Conversational Recommender Module)

### 5.1. User Intent Input
- A conversational input interface where a user describes their specific learning goal or career interest in natural language (e.g., *"I'm a PM wanting to learn how to write prompt evaluations for LLM agents"*).

### 5.2. Transcript-Based Semantic Search
- Shift search capabilities from title/instructor metadata matches to semantic search indexing.
- Ingest and index **full lecture video recording transcripts** for all 3,400+ lessons.
- Match user queries to actual spoken concepts and slide content from the lectures.

### 5.3. Smart Recommender Engine
- Recommend a highly curated list of **5 to 10 lessons** that map semantically to the user's request.
- Provide a summary explanation of *why* each lesson is recommended, citing specific timestamps or topics covered in the lecture recording.
