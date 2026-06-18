# Design Document: Top Speakers Filter Dropdown

## Goal
Provide a user-friendly way to filter the lessons grid by the top 50 speakers (by total signups) directly from the search bar row.

## Components

### 1. HTML Update (`index.html`)
- Add a new `<select>` dropdown inside the `.search-bar-row` right after the category filter select control:
  ```html
  <select id="speaker-select" class="select-control" aria-label="Filter by speaker">
    <option value="all">All Speakers</option>
  </select>
  ```

### 2. Styling Update (`style.css`)
- Adjust the grid columns configuration of `.search-bar-row` from `1fr auto auto` to `1fr auto auto auto` to fit the third select dropdown.
- Keep the responsive column fallback (`1fr`) on mobile screens unchanged.

### 3. JavaScript Controller Update (`app.js`)
- **Initialize Selector Element**: Bind to the new element `const speakerSelect = document.getElementById('speaker-select')`.
- **Event Listener**: Add a change listener `speakerSelect.addEventListener('change', filterAndRender)`.
- **Dynamic Populate**: Implement `populateSpeakerDropdown()`:
  - Aggregate total signups for each instructor across all lessons.
  - Sort instructors by total signups in descending order, slice the top 50, and sort these top 50 alphabetically.
  - Dynamically populate options in the `#speaker-select` element.
  - Call this function inside `loadData()` after the lessons data is successfully loaded.
- **Filter Results**: Update `filterAndRender()` to check if a speaker is selected and filter `lessons` list accordingly:
  ```javascript
  const selectedSpeaker = speakerSelect.value;
  if (selectedSpeaker !== 'all') {
    filtered = filtered.filter(item => {
      const instructors = item.instructors || [];
      return instructors.some(inst => inst.name === selectedSpeaker);
    });
  }
  ```
