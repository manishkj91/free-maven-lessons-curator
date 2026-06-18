# Speaker Filter Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a "Top Speakers" dropdown select filter next to the other filter controls to let users filter the lessons list by the top 50 speakers (by total signup counts) alphabetically.

**Architecture:** Extend the current Vanilla JS filtering engine in `app.js` and modify `.search-bar-row` layout columns in `style.css` and the HTML structure in `index.html`.

**Tech Stack:** HTML5, CSS3, Vanilla JavaScript.

---

### Task 1: Update UI Layout

**Files:**
- Modify: [index.html](file:///Users/manishkj/.gemini/antigravity/scratch/free-maven-lessons-curator/index.html)
- Modify: [style.css](file:///Users/manishkj/.gemini/antigravity/scratch/free-maven-lessons-curator/style.css)

**Step 1: Add HTML select tag for speaker select**
In [index.html](file:///Users/manishkj/.gemini/antigravity/scratch/free-maven-lessons-curator/index.html), insert the select dropdown right after the `#category-select` element.
```html
        <select id="speaker-select" class="select-control" aria-label="Filter by speaker">
          <option value="all">All Speakers</option>
        </select>
```

**Step 2: Adjust search-bar-row grid layout**
In [style.css](file:///Users/manishkj/.gemini/antigravity/scratch/free-maven-lessons-curator/style.css), change the grid template columns of `.search-bar-row` from `1fr auto auto` to `1fr auto auto auto`.
```css
.search-bar-row {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
```

---

### Task 2: Implement Filter Logic in JavaScript

**Files:**
- Modify: [app.js](file:///Users/manishkj/.gemini/antigravity/scratch/free-maven-lessons-curator/app.js)

**Step 1: Define element binding and add event listener**
Add:
```javascript
const speakerSelect = document.getElementById('speaker-select');
```
And add event listener inside `setupEventListeners()`:
```javascript
speakerSelect.addEventListener('change', filterAndRender);
```

**Step 2: Implement dynamic list populator**
Write `populateSpeakerDropdown()` function in `app.js`:
```javascript
function populateSpeakerDropdown() {
  const speakerSignups = {};
  
  lessons.forEach(item => {
    const instructors = item.instructors || [];
    instructors.forEach(inst => {
      const name = inst.name;
      if (name) {
        speakerSignups[name] = (speakerSignups[name] || 0) + (item.signup_count || 0);
      }
    });
  });

  const topSpeakers = Object.entries(speakerSignups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(entry => entry[0]);

  topSpeakers.sort();

  speakerSelect.replaceChildren();
  const defaultOption = document.createElement('option');
  defaultOption.value = 'all';
  defaultOption.textContent = 'All Speakers';
  speakerSelect.appendChild(defaultOption);

  topSpeakers.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    speakerSelect.appendChild(option);
  });
}
```

Call it inside `loadData()` after the lessons map is set up:
```javascript
    populateSpeakerDropdown();
```

**Step 3: Add speaker filter to filterAndRender**
In `filterAndRender()`, extract the select value and apply the filter:
```javascript
  const selectedSpeaker = speakerSelect.value;
  ...
  // Filter by speaker
  if (selectedSpeaker && selectedSpeaker !== 'all') {
    filtered = filtered.filter(item => {
      const instructors = item.instructors || [];
      return instructors.some(inst => inst.name === selectedSpeaker);
    });
  }
```

---

### Task 3: Local Verification & Deployment

**Step 1: Test locally**
- Open `http://localhost:8080` in the browser.
- Verify that the speaker select dropdown has populated with top speakers alphabetically.
- Select a speaker and verify that the lessons grid refreshes to show only their courses.
- Run `python3 test_curator.py` to ensure unit tests still pass successfully.

**Step 2: Commit and push changes**
Commit files: `index.html`, `style.css`, `app.js` and push to main.
```bash
git add index.html style.css app.js
git commit -m "feat: add top speakers dropdown filter in search bar row"
git push origin main
```
