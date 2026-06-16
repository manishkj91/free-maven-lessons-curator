# Free Maven Lessons Curator

An interactive, premium single-page web application to discover, search, and rank over 3,400+ free cohort-based lessons from Maven.com in order of relevance.

## Tech Stack
- **Frontend**: Vanilla HTML5, Vanilla CSS3 (with Outfit/Inter Google fonts & dynamic glassmorphism), and Vanilla ES6+ JavaScript.
- **Backend**: Zero-dependency Python 3 standard library (`http.server` & `urllib`).

---

## Features
- **Relevance-Based Search**: Matches queries (like "AI agents") against lesson titles and instructor names. Results are scored and ranked in real-time.
- **Tie-Breaker Popularity Sort**: For identical search relevance scores, lessons are sorted by signup counts (popularity) so the highest-quality cohort lessons rise to the top.
- **Flexible Sorting**: Sort by Relevance, Most Signups (Popularity), Date (Soonest first), or Duration.
- **Category Quick-Filter Pills**: One-click pills to search for topics like AI Agents, Claude Code, Product Management, System Design, and Coding.
- **In-Memory Querying**: The static JSON database of 3,462 lessons is cached on the client, providing sub-millisecond search speeds with zero network latency.
- **Database Synchronization**: Built-in backend endpoint (`/api/sync`) aggregates all pages of free lessons from `api.maven.com` via server-to-server requests to bypass browser CORS restrictions. Clicking **"Sync Database"** updates the local JSON file.
- **Details Modal**: Interactive modal showing full details, date/time in UTC, durations, signup counts, instructor avatars, and direct links to lessons.

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

Since programmatically creating a repository on your personal access token returned a permission restriction, you can easily create the repository and push manually:

1. Go to [github.com/new](https://github.com/new) and create a public repository named **`free-maven-lessons-curator`** (do not initialize it with a README, gitignore, or license).

2. Link your local repository to GitHub and push your code:
   ```bash
   cd /Users/manishkj/.gemini/antigravity/scratch/free-maven-lessons-curator
   git add .
   git commit -m "Initial commit: build interactive Free Maven Lessons Curator app"
   git branch -M main
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/free-maven-lessons-curator.git
   git push -u origin main
   ```
