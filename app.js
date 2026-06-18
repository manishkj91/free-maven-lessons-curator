// Global state
let lessons = [];
let activeQuery = '';
let activeTag = ''; // Filter by tag (e.g. 'AI', 'Product')


// CSS class mapping for tags
const TAG_CLASSES = {
  'AI': 'tag-ai',
  'Product': 'tag-product',
  'Engineering': 'tag-engineering',
  'Design': 'tag-design',
  'Marketing': 'tag-marketing',
  'Leadership': 'tag-leadership',
  'Founders': 'tag-founders',
  'General': 'tag-general'
};

// DOM Elements
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const categorySelect = document.getElementById('category-select');
const speakerSelect = document.getElementById('speaker-select');
const pillsContainer = document.getElementById('pills-container');
const statsCount = document.getElementById('stats-count');
const lastSyncTime = document.getElementById('last-sync-time');
const lessonsGrid = document.getElementById('lessons-grid');
const syncBtn = document.getElementById('sync-btn');
const syncBtnText = document.getElementById('sync-btn-text');
const syncIcon = document.getElementById('sync-icon');
const syncOverlay = document.getElementById('sync-overlay');

// Modal Elements
const detailModal = document.getElementById('detail-modal');
const modalTitle = document.getElementById('modal-title');
const modalTags = document.getElementById('modal-tags');
const modalDate = document.getElementById('modal-date');
const modalDuration = document.getElementById('modal-duration');
const modalSignups = document.getElementById('modal-signups');
const modalItemId = document.getElementById('modal-item-id');
const modalInstructors = document.getElementById('modal-instructors');
const modalActionBtn = document.getElementById('modal-action-btn');
const modalClose = document.getElementById('modal-close');

// Initial Load
window.addEventListener('DOMContentLoaded', () => {
  // Hide sync button if not running locally
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (!isLocal) {
    syncBtn.style.display = 'none';
  }
  
  loadData();
  setupEventListeners();
});

// Setup Events
function setupEventListeners() {
  // Search input with basic debounce
  let debounceTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      activeQuery = e.target.value.trim();
      filterAndRender();
    }, 250);
  });

  // Sort and Category Filters
  sortSelect.addEventListener('change', filterAndRender);
  categorySelect.addEventListener('change', filterAndRender);
  speakerSelect.addEventListener('change', filterAndRender);

  // Sync Database Button
  syncBtn.addEventListener('click', syncDatabase);

  // Modal Close Events
  modalClose.addEventListener('click', closeModal);
  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) closeModal();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

// Load data from lessons.json
async function loadData() {
  try {
    const response = await fetch('lessons.json');
    if (!response.ok) {
      throw new Error('Database file not found');
    }
    const rawData = await response.json();
    
    // Use pre-classified tags from the dataset
    lessons = rawData.map(item => {
      return {
        ...item,
        _tags: item.tags || ['General']
      };
    });
    
    populateSpeakerDropdown();
    
    // Update last sync timestamp
    const lastModifiedHeader = response.headers.get('Last-Modified');
    if (lastModifiedHeader) {
      const date = new Date(lastModifiedHeader);
      lastSyncTime.textContent = `Last Synced: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    } else {
      lastSyncTime.textContent = 'Last Synced: Local File';
    }
    
    // Render top category pills dynamically with counts
    renderCategoryPills();
    filterAndRender();
  } catch (error) {
    renderEmptyState(true);
  }
}

// Populate speaker filter dropdown with top 50 speakers sorted alphabetically
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

// Trigger Backend Server Update
async function syncDatabase() {
  syncBtn.disabled = true;
  syncBtnText.textContent = 'Syncing...';
  syncIcon.classList.add('spin');
  syncOverlay.classList.add('visible');

  try {
    const response = await fetch('/api/sync');
    if (!response.ok) {
      throw new Error('Failed to update server database');
    }
    const result = await response.json();
    if (result.status === 'success') {
      setTimeout(() => {
        syncOverlay.classList.remove('visible');
        syncBtn.disabled = false;
        syncBtnText.textContent = 'Sync Database';
        syncIcon.classList.remove('spin');
        loadData();
      }, 1000);
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    syncOverlay.classList.remove('visible');
    syncBtn.disabled = false;
    syncBtnText.textContent = 'Sync Database';
    syncIcon.classList.remove('spin');
    console.warn('Sync failed:', error.message);
    showSyncError();
  }
}

function showSyncError() {
  lessonsGrid.replaceChildren();
  const box = document.createElement('div');
  box.className = 'state-message';
  
  const h3 = document.createElement('h3');
  h3.textContent = 'Database Sync Failed';
  box.appendChild(h3);

  const p = document.createElement('p');
  p.textContent = 'We encountered an error while trying to retrieve updated lessons from Maven.com. Please check your network connection and try again.';
  box.appendChild(p);

  const button = document.createElement('button');
  button.textContent = 'Retry Sync';
  button.addEventListener('click', syncDatabase);
  box.appendChild(button);

  lessonsGrid.appendChild(box);
}


// Calculate tag stats and render the filter pills
function renderCategoryPills() {
  // Count how many items match each tag
  const tagCounts = {
    'All': lessons.length
  };
  
  // Initialize counts using TAG_CLASSES keys
  Object.keys(TAG_CLASSES).forEach(tag => {
    tagCounts[tag] = 0;
  });
  
  // Count
  lessons.forEach(item => {
    item._tags.forEach(tag => {
      if (tagCounts[tag] !== undefined) {
        tagCounts[tag]++;
      }
    });
  });

  // Re-build navigation container
  pillsContainer.replaceChildren();

  // 1. "All Lessons" pill
  const allPill = document.createElement('button');
  allPill.className = `pill ${activeTag === '' ? 'active' : ''}`;
  allPill.setAttribute('data-tag', '');
  
  const allLabel = document.createElement('span');
  allLabel.textContent = 'All Lessons';
  allPill.appendChild(allLabel);
  
  const allCount = document.createElement('span');
  allCount.className = 'pill-count';
  allCount.textContent = tagCounts['All'].toLocaleString();
  allPill.appendChild(allCount);

  allPill.addEventListener('click', () => handleTagClick(''));
  pillsContainer.appendChild(allPill);

  // 2. Category pills
  const categoriesList = Object.keys(TAG_CLASSES);
  categoriesList.forEach(tag => {
    const count = tagCounts[tag] || 0;
    if (count === 0) return; // Skip empty tags

    const pill = document.createElement('button');
    pill.className = `pill ${activeTag === tag ? 'active' : ''}`;
    pill.setAttribute('data-tag', tag);

    const label = document.createElement('span');
    label.textContent = tag;
    pill.appendChild(label);

    const badge = document.createElement('span');
    badge.className = 'pill-count';
    badge.textContent = count.toLocaleString();
    pill.appendChild(badge);

    pill.addEventListener('click', () => handleTagClick(tag));
    pillsContainer.appendChild(pill);
  });
}

function handleTagClick(tag) {
  activeTag = tag;
  
  // Update active pill UI class
  document.querySelectorAll('#pills-container .pill').forEach(pill => {
    const pillTag = pill.getAttribute('data-tag');
    if (pillTag === tag) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  filterAndRender();
}

// Relevance scoring helper
function calculateRelevance(item, queryTerms) {
  if (queryTerms.length === 0) return 0;
  
  let score = 0;
  const title = item.title.toLowerCase();
  
  const instructors = (item.instructors || [])
    .map(inst => inst.name.toLowerCase())
    .join(' ');

  for (const term of queryTerms) {
    // Exact word in title
    const titleRegex = new RegExp('\\b' + escapeRegExp(term) + '\\b', 'i');
    if (titleRegex.test(title)) {
      score += 10;
    } else if (title.includes(term)) {
      // Substring match
      score += 3;
    }

    // Exact match in instructor name
    const instRegex = new RegExp('\\b' + escapeRegExp(term) + '\\b', 'i');
    if (instRegex.test(instructors)) {
      score += 5;
    } else if (instructors.includes(term)) {
      score += 1;
    }
  }
  return score;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Main filter, rank, and render engine
function filterAndRender() {
  if (lessons.length === 0) {
    renderEmptyState(true);
    return;
  }

  const queryTerms = activeQuery.toLowerCase().split(/\s+/).filter(t => t.length > 0);
  const selectedType = categorySelect.value;
  const selectedSpeaker = speakerSelect.value;
  const sortBy = sortSelect.value;

  // 1. Map scores
  let filtered = lessons.map(item => {
    const score = calculateRelevance(item, queryTerms);
    return { ...item, _score: score };
  });

  // Filter by tag if selected
  if (activeTag !== '') {
    filtered = filtered.filter(item => item._tags.includes(activeTag));
  }

  // Filter by text search query matches
  if (queryTerms.length > 0) {
    filtered = filtered.filter(item => item._score > 0);
  }

  // Filter by lesson type selector
  if (selectedType !== 'all') {
    filtered = filtered.filter(item => item.item_type === selectedType);
  }

  // Filter by speaker
  if (selectedSpeaker && selectedSpeaker !== 'all') {
    filtered = filtered.filter(item => {
      const instructors = item.instructors || [];
      return instructors.some(inst => inst.name === selectedSpeaker);
    });
  }

  // 2. Sort results
  filtered.sort((a, b) => {
    if (sortBy === 'relevance' && queryTerms.length > 0) {
      if (b._score !== a._score) {
        return b._score - a._score;
      }
      return b.signup_count - a.signup_count;
    } else if (sortBy === 'popularity') {
      if (b.signup_count !== a.signup_count) {
        return b.signup_count - a.signup_count;
      }
      return b._score - a._score;
    } else if (sortBy === 'date') {
      const aDate = a.start_datetime ? new Date(a.start_datetime).getTime() : Infinity;
      const bDate = b.start_datetime ? new Date(b.start_datetime).getTime() : Infinity;
      return aDate - bDate;
    } else if (sortBy === 'duration') {
      return b.duration_minutes - a.duration_minutes;
    }
    return b.signup_count - a.signup_count; // Popularity fallback
  });

  // 3. Render Cards
  renderCards(filtered);
}

// Render cards using secure DOM methods (no innerHTML)
function renderCards(items) {
  lessonsGrid.replaceChildren();

  // Update stats counts
  statsCount.textContent = `Found ${items.length} relevant lessons`;

  if (items.length === 0) {
    renderEmptyState(false);
    return;
  }

  // Slice to render up to 200 items in the page grid for performance
  const displayItems = items.slice(0, 200);

  displayItems.forEach(item => {
    const card = document.createElement('article');
    card.className = 'lesson-card';

    // Top Section
    const cardTop = document.createElement('div');
    cardTop.className = 'card-top';

    const cardBadges = document.createElement('div');
    cardBadges.className = 'card-badges';

    const signupBadge = document.createElement('span');
    signupBadge.className = 'badge-signup';
    signupBadge.textContent = `${item.signup_count.toLocaleString()} signups`;
    cardBadges.appendChild(signupBadge);

    if (item._score > 0) {
      const relevanceBadge = document.createElement('span');
      relevanceBadge.className = 'badge-relevance';
      relevanceBadge.textContent = `Score: ${item._score}`;
      cardBadges.appendChild(relevanceBadge);
    }
    cardTop.appendChild(cardBadges);

    // Title
    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = item.title;
    cardTop.appendChild(title);

    // Instructors
    const authors = document.createElement('div');
    authors.className = 'card-authors';
    const instructorNames = (item.instructors || []).map(inst => inst.name).join(', ');
    authors.textContent = `By ${instructorNames || 'Maven Experts'}`;
    cardTop.appendChild(authors);
    
    // Classified Card Tags Row
    const cardTagsRow = document.createElement('div');
    cardTagsRow.className = 'card-tags';
    item._tags.forEach(tag => {
      const tagSpan = document.createElement('span');
      tagSpan.className = `lesson-tag ${TAG_CLASSES[tag] || 'tag-general'}`;
      tagSpan.textContent = tag;
      
      // Allow filtering by clicking on card tag badges
      tagSpan.addEventListener('click', (e) => {
        e.stopPropagation(); // Avoid triggering card details click
        handleTagClick(tag);
      });
      cardTagsRow.appendChild(tagSpan);
    });
    cardTop.appendChild(cardTagsRow);

    card.appendChild(cardTop);

    // Bottom Section
    const cardBottom = document.createElement('div');
    cardBottom.className = 'card-bottom';

    // Info
    const cardInfo = document.createElement('div');
    cardInfo.className = 'card-info';

    // Duration item
    const durationItem = document.createElement('div');
    durationItem.className = 'info-item';
    
    const clockSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    clockSvg.setAttribute('width', '12');
    clockSvg.setAttribute('height', '12');
    clockSvg.setAttribute('viewBox', '0 0 24 24');
    clockSvg.setAttribute('fill', 'none');
    clockSvg.setAttribute('stroke', 'currentColor');
    clockSvg.setAttribute('stroke-width', '2');
    const clockCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    clockCircle.setAttribute('cx', '12');
    clockCircle.setAttribute('cy', '12');
    clockCircle.setAttribute('r', '10');
    clockSvg.appendChild(clockCircle);
    const clockPoly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    clockPoly.setAttribute('points', '12 6 12 12 16 14');
    clockSvg.appendChild(clockPoly);
    durationItem.appendChild(clockSvg);

    const durationText = document.createElement('span');
    durationText.textContent = `${item.duration_minutes} mins`;
    durationItem.appendChild(durationText);
    cardInfo.appendChild(durationItem);

    // Date item
    const dateItem = document.createElement('div');
    dateItem.className = 'info-item';

    const calSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    calSvg.setAttribute('width', '12');
    calSvg.setAttribute('height', '12');
    calSvg.setAttribute('viewBox', '0 0 24 24');
    calSvg.setAttribute('fill', 'none');
    calSvg.setAttribute('stroke', 'currentColor');
    calSvg.setAttribute('stroke-width', '2');
    const calRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    calRect.setAttribute('x', '3');
    calRect.setAttribute('y', '4');
    calRect.setAttribute('width', '18');
    calRect.setAttribute('height', '18');
    calRect.setAttribute('rx', '2');
    calRect.setAttribute('ry', '2');
    calSvg.appendChild(calRect);
    dateItem.appendChild(calSvg);

    const dateText = document.createElement('span');
    dateText.textContent = formatDate(item.start_datetime);
    dateItem.appendChild(dateText);
    cardInfo.appendChild(dateItem);

    cardBottom.appendChild(cardInfo);

    // Link/Action Button
    const linkBtn = document.createElement('button');
    linkBtn.className = 'card-link';
    linkBtn.textContent = 'Details';
    linkBtn.addEventListener('click', () => openModal(item));
    cardBottom.appendChild(linkBtn);

    card.appendChild(cardBottom);
    lessonsGrid.appendChild(card);
  });
}

function formatDate(dateStr) {
  if (!dateStr) return 'TBA';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

// Display empty message
function renderEmptyState(isMissingDb) {
  lessonsGrid.replaceChildren();

  const box = document.createElement('div');
  box.className = 'state-message';

  const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  iconSvg.setAttribute('width', '48');
  iconSvg.setAttribute('height', '48');
  iconSvg.setAttribute('viewBox', '0 0 24 24');
  iconSvg.setAttribute('fill', 'none');
  iconSvg.setAttribute('stroke', 'currentColor');
  iconSvg.setAttribute('stroke-width', '2');
  const alertCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  alertCircle.setAttribute('cx', '12');
  alertCircle.setAttribute('cy', '12');
  alertCircle.setAttribute('r', '10');
  iconSvg.appendChild(alertCircle);
  const alertLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  alertLine.setAttribute('x1', '12');
  alertLine.setAttribute('y1', '8');
  alertLine.setAttribute('x2', '12');
  alertLine.setAttribute('y2', '12');
  iconSvg.appendChild(alertLine);
  box.appendChild(iconSvg);

  const h3 = document.createElement('h3');
  h3.textContent = isMissingDb ? 'Database Empty' : 'No Lessons Found';
  box.appendChild(h3);

  const p = document.createElement('p');
  p.textContent = isMissingDb 
    ? 'It seems your local lessons.json file does not exist. Click "Sync Database" to fetch the latest free lessons directly from Maven.com.'
    : 'No lessons matched your search query. Try switching tags or broadening your keywords.';
  box.appendChild(p);

  if (isMissingDb) {
    const button = document.createElement('button');
    button.textContent = 'Sync Database Now';
    button.addEventListener('click', syncDatabase);
    box.appendChild(button);
  }

  lessonsGrid.appendChild(box);
}

// Modal management
function openModal(item) {
  modalTitle.textContent = item.title;
  
  // Format Date and Details
  if (item.start_datetime) {
    const d = new Date(item.start_datetime);
    modalDate.textContent = d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' UTC';
  } else {
    modalDate.textContent = 'To Be Announced';
  }
  
  modalDuration.textContent = `${item.duration_minutes} Minutes`;
  modalSignups.textContent = `${item.signup_count.toLocaleString()} Signups`;
  modalItemId.textContent = `#${item.item_id}`;

  // Render modal tags
  modalTags.replaceChildren();
  item._tags.forEach(tag => {
    const tagSpan = document.createElement('span');
    tagSpan.className = `lesson-tag ${TAG_CLASSES[tag] || 'tag-general'}`;
    tagSpan.textContent = tag;
    tagSpan.addEventListener('click', () => {
      closeModal();
      handleTagClick(tag);
    });
    modalTags.appendChild(tagSpan);
  });

  // Instructors
  modalInstructors.replaceChildren();
  (item.instructors || []).forEach(inst => {
    const row = document.createElement('div');
    row.className = 'instructor-item';

    if (inst.image_url) {
      const img = document.createElement('img');
      img.className = 'instructor-img';
      img.setAttribute('src', inst.image_url);
      img.setAttribute('alt', inst.name);
      row.appendChild(img);
    } else {
      const div = document.createElement('div');
      div.className = 'instructor-img';
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.justifyContent = 'center';
      div.style.fontSize = '0.8rem';
      div.style.fontWeight = 'bold';
      div.style.background = 'rgba(255,255,255,0.05)';
      div.textContent = inst.name.split(' ').map(n => n[0]).join('').slice(0, 2);
      row.appendChild(div);
    }

    const name = document.createElement('span');
    name.className = 'instructor-name';
    name.textContent = inst.name;
    row.appendChild(name);

    modalInstructors.appendChild(row);
  });

  // Action Button Link
  const slugifiedTitle = slugify(item.title);
  const directLink = `https://maven.com/p/${item.slug}/${slugifiedTitle}`;
  modalActionBtn.setAttribute('href', directLink);

  // Show Modal
  detailModal.classList.add('visible');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  detailModal.classList.remove('visible');
  document.body.style.overflow = '';
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}
