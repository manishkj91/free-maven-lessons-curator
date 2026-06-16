// Global state
let lessons = [];
let activeQuery = '';

// DOM Elements
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const categorySelect = document.getElementById('category-select');
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
const modalDate = document.getElementById('modal-date');
const modalDuration = document.getElementById('modal-duration');
const modalSignups = document.getElementById('modal-signups');
const modalItemId = document.getElementById('modal-item-id');
const modalInstructors = document.getElementById('modal-instructors');
const modalActionBtn = document.getElementById('modal-action-btn');
const modalClose = document.getElementById('modal-close');

// Initial Load
window.addEventListener('DOMContentLoaded', () => {
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
      updatePillsSelection(activeQuery);
      filterAndRender();
    }, 250);
  });

  // Sort and Category Filters
  sortSelect.addEventListener('change', filterAndRender);
  categorySelect.addEventListener('change', filterAndRender);

  // Category Pills
  pillsContainer.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill');
    if (!pill) return;

    // Set active class
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');

    // Update search input and filter
    const query = pill.getAttribute('data-query');
    searchInput.value = query;
    activeQuery = query;
    filterAndRender();
  });

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

// Update pills active states when manual typing
function updatePillsSelection(query) {
  document.querySelectorAll('.pill').forEach(pill => {
    const dataQuery = pill.getAttribute('data-query');
    if (dataQuery.toLowerCase() === query.toLowerCase()) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });
}

// Load data from lessons.json
async function loadData() {
  try {
    const response = await fetch('lessons.json');
    if (!response.ok) {
      throw new Error('Database file not found');
    }
    lessons = await response.json();
    
    // Update stats and display date of lessons file if available
    statsCount.textContent = `Total database: ${lessons.length} lessons loaded`;
    
    // Attempt to read file headers / metadata for last sync time
    const lastModifiedHeader = response.headers.get('Last-Modified');
    if (lastModifiedHeader) {
      const date = new Date(lastModifiedHeader);
      lastSyncTime.textContent = `Last Synced: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    } else {
      lastSyncTime.textContent = 'Last Synced: Local File';
    }
    
    filterAndRender();
  } catch (error) {
    renderEmptyState(true);
  }
}

// Trigger Backend Server Update
async function syncDatabase() {
  // Disable UI and show overlay
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
      // Small timeout to show completion before loading fresh JSON
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
    // TODO(security): Avoid console.error of detailed exception traces, display a clean modal dialog or console trace
    console.warn('Sync failed:', error.message);
    showSyncError();
  }
}

function showSyncError() {
  // Clear grid and display error message
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

// Relevance scoring helper
function calculateRelevance(item, queryTerms) {
  if (queryTerms.length === 0) return 0;
  
  let score = 0;
  const title = item.title.toLowerCase();
  
  // Format instructors for checking
  const instructors = (item.instructors || [])
    .map(inst => inst.name.toLowerCase())
    .join(' ');

  for (const term of queryTerms) {
    // Exact word in title (high weight)
    const titleRegex = new RegExp('\\b' + escapeRegExp(term) + '\\b', 'i');
    if (titleRegex.test(title)) {
      score += 10;
    } else if (title.includes(term)) {
      // Substring match in title
      score += 3;
    }

    // Exact match in instructor name (medium weight)
    const instRegex = new RegExp('\\b' + escapeRegExp(term) + '\\b', 'i');
    if (instRegex.test(instructors)) {
      score += 5;
    } else if (instructors.includes(term)) {
      score += 1;
    }
  }
  return score;
}

// Regex escape helper
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
  const sortBy = sortSelect.value;

  // 1. Filter and compute relevance scores
  let filtered = lessons.map(item => {
    const score = calculateRelevance(item, queryTerms);
    return { ...item, _score: score };
  });

  // Filter by query matches (if query exists, only show items with relevance > 0)
  if (queryTerms.length > 0) {
    filtered = filtered.filter(item => item._score > 0);
  }

  // Filter by lesson type
  if (selectedType !== 'all') {
    filtered = filtered.filter(item => item.item_type === selectedType);
  }

  // 2. Sort results
  filtered.sort((a, b) => {
    if (sortBy === 'relevance' && queryTerms.length > 0) {
      if (b._score !== a._score) {
        return b._score - a._score;
      }
      // Tie-breaker: sort by signups
      return b.signup_count - a.signup_count;
    } else if (sortBy === 'popularity') {
      if (b.signup_count !== a.signup_count) {
        return b.signup_count - a.signup_count;
      }
      return b._score - a._score;
    } else if (sortBy === 'date') {
      const aDate = a.start_datetime ? new Date(a.start_datetime).getTime() : Infinity;
      const bDate = b.start_datetime ? new Date(b.start_datetime).getTime() : Infinity;
      return aDate - bDate; // Soonest first
    } else if (sortBy === 'duration') {
      return b.duration_minutes - a.duration_minutes;
    }
    
    // Default fallback if no search query but sorted by relevance
    return b.signup_count - a.signup_count;
  });

  // 3. Render Cards
  renderCards(filtered);
}

// Render cards strictly using secure DOM methods (no innerHTML)
function renderCards(items) {
  lessonsGrid.replaceChildren();

  // Update stats
  statsCount.textContent = `Found ${items.length} relevant lessons`;

  if (items.length === 0) {
    renderEmptyState(false);
    return;
  }

  // Render a max of 200 items in the page grid for performance
  const displayItems = items.slice(0, 200);

  displayItems.forEach(item => {
    const card = document.createElement('article');
    card.className = 'lesson-card';

    // Top Section
    const cardTop = document.createElement('div');
    cardTop.className = 'card-top';

    const cardBadges = document.createElement('div');
    cardBadges.className = 'card-badges';

    // Signup badge
    const signupBadge = document.createElement('span');
    signupBadge.className = 'badge-signup';
    signupBadge.textContent = `${item.signup_count.toLocaleString()} signups`;
    cardBadges.appendChild(signupBadge);

    // Relevance badge (only if searched)
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

// Format Date helper
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
    : 'No lessons matched your search query. Try broadening your keywords or clicking the tags above.';
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
      // Placeholder initials box
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
  document.body.style.overflow = 'hidden'; // Lock background scroll
}

function closeModal() {
  detailModal.classList.remove('visible');
  document.body.style.overflow = ''; // Unlock scroll
}

// Slugify helper
function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}
