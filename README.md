# Maven Lightning Lesson Curator

An interactive, premium single-page web application to discover, search, and rank over 3,400+ free cohort-based Lightning Lessons from Maven.com, classified by category and ranked by relevance. Fully polished and Product Hunt ready!

## Tech Stack
- **Frontend**: Vanilla HTML5, Vanilla CSS3 (with Outfit/Inter Google fonts & dynamic glassmorphism), and Vanilla ES6+ JavaScript.
- **Backend**: Zero-dependency Python 3 standard library (`http.server` & `urllib`).

---

## Features
- **Relevance-Based Search**: Matches queries (like "AI agents") against lesson titles and instructor names. Results are scored and ranked in real-time.
- **Dynamic Tagging Classification**: Automatically parses lesson titles to classify them into relevant categories:
  - **AI**: Agent, LLM, GPT, Claude, RAG, Evals, etc.
  - **Product**: PM, discovery, user research, strategy, etc.
  - **Engineering**: Coding, system design, python, database, api, etc.
  - **Design**: Figma, UI, UX, prototyping, etc.
  - **Marketing**: Growth, SEO, branding, acquisition, etc.
  - **Leadership**: Manage, career, influence, team, etc.
  - **Founders**: Startup, MVP, SaaS, business, Y Combinator.
- **Top Tags Stats Navigation**: Shows a premium tabbed filter bar with actual database-wide match counts (e.g. *AI (1,245)*). Clicking a pill filters the grid instantly.
- **Interactive Card Tags**: Every lesson card showcases its tags. Clicking a tag on any card immediately filters the grid.
- **Tie-Breaker Popularity Sort**: For identical search relevance scores, lessons are sorted by signup counts (popularity) so the highest-quality cohort lessons rise to the top.
- **Flexible Sorting**: Sort by Relevance, Most Signups (Popularity), Date (Soonest first), or Duration.
- **In-Memory Querying**: Sub-millisecond search speeds with zero network latency.
- **Database Synchronization**: Built-in backend endpoint (`/api/sync`) aggregates all pages of free lessons from `api.maven.com` via server-to-server requests to bypass browser CORS restrictions. Clicking **"Sync Database"** updates the local JSON file.
- **Details Modal**: Interactive modal showing full details, date/time in UTC, durations, signup counts, instructor avatars, and direct links to lessons.
- **Product Hunt Integration**: Features a styled Product Hunt launch widget in the header.

---

## Running Locally

To run the application locally, run the following commands in your terminal:

1. Navigate to the project directory:
   ```bash
   cd /Users/manishkj/.gemini/antigravity/scratch/free-maven-lessons-curator
   ```

2. Start the local server:
   ```bash
   python3 server.py
   ```

3. Open your browser and navigate to:
   ```
   http://127.0.0.1:8080
   ```

4. Click the **"Sync Database"** button in the top-right corner to fetch and build the `lessons.json` database.

---

## Pushing to GitHub

To push the latest changes to your repository:

```bash
cd /Users/manishkj/.gemini/antigravity/scratch/free-maven-lessons-curator
git add .
git commit -m "Polished Maven Lightning Lesson Curator app for Product Hunt"
git push origin main
```
