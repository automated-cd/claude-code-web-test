// Game state
let gameData = [];
let currentLevel = 0;
let score = 0;
let assignments = {}; // { "zone-1": "Image component", ... }
let selectedComponent = null;
let componentsLearned = new Set();
let isChecked = false;

// DOM elements
const currentLevelEl = document.getElementById('current-level');
const totalLevelsEl = document.getElementById('total-levels');
const scoreEl = document.getElementById('score');
const difficultyEl = document.getElementById('difficulty');
const appNameEl = document.getElementById('app-name');
const challengeDescEl = document.getElementById('challenge-description');
const mockupContainer = document.getElementById('mockup-container');
const componentsPalette = document.getElementById('components-palette');
const assignmentsList = document.getElementById('assignments-list');
const checkBtn = document.getElementById('check-btn');
const resetBtn = document.getElementById('reset-btn');
const nextBtn = document.getElementById('next-btn');
const feedbackEl = document.getElementById('feedback');
const explanationEl = document.getElementById('explanation');
const navigationEl = document.getElementById('navigation');
const gameContainer = document.getElementById('game-container');
const gameCompleteEl = document.getElementById('game-complete');
const finalScoreEl = document.getElementById('final-score');
const componentsLearnedEl = document.getElementById('components-learned');
const restartBtn = document.getElementById('restart-btn');

// Component colors for chips
const componentColors = {
    'Image component': '#9c27b0',
    'Text label': '#2196f3',
    'Icon button': '#ff9800',
    'Repeating group': '#4caf50',
    'Text with formula': '#e91e63',
    'Input field': '#00bcd4',
    'Action button': '#ff5722',
    'Rating component': '#ffc107',
    'Video player': '#607d8b',
    'Search bar': '#607d8b',
    'Navigation menu': '#607d8b',
    'Audio player': '#607d8b',
    'Dropdown menu': '#607d8b',
    'Checkbox': '#607d8b',
    'Toggle switch': '#607d8b'
};

// Initialize game
async function initGame() {
    try {
        const response = await fetch('data.json');
        gameData = await response.json();
        totalLevelsEl.textContent = gameData.length;
        loadLevel();
    } catch (error) {
        console.error('Error loading game data:', error);
        gameContainer.innerHTML = '<p style="text-align:center;color:#f44336;padding:40px;">Failed to load game data. Please refresh the page.</p>';
    }
}

// Load current level
function loadLevel() {
    if (currentLevel >= gameData.length) {
        showGameComplete();
        return;
    }

    const level = gameData[currentLevel];
    assignments = {};
    selectedComponent = null;
    isChecked = false;

    // Update header info
    currentLevelEl.textContent = currentLevel + 1;
    appNameEl.textContent = level.appName;
    challengeDescEl.textContent = level.description;
    difficultyEl.textContent = level.difficulty;

    // Update difficulty badge color
    if (level.difficulty === 'Beginner') {
        difficultyEl.style.background = '#e8f5e9';
        difficultyEl.style.color = '#2e7d32';
    } else if (level.difficulty === 'Intermediate') {
        difficultyEl.style.background = '#fff3e0';
        difficultyEl.style.color = '#e65100';
    } else {
        difficultyEl.style.background = '#fce4ec';
        difficultyEl.style.color = '#c62828';
    }

    // Hide feedback/explanation/navigation
    feedbackEl.classList.add('hidden');
    explanationEl.classList.add('hidden');
    navigationEl.classList.add('hidden');
    checkBtn.disabled = true;
    resetBtn.disabled = false;

    // Render mockup
    renderMockup(level);

    // Render component palette
    renderPalette(level.availableComponents);

    // Render assignments list
    renderAssignments(level);
}

// ========================================
// MOCKUP RENDERERS
// ========================================

function renderMockup(level) {
    const renderers = {
        'Instagram Post': renderInstagramMockup,
        'Twitter / X Tweet': renderTweetMockup,
        'Weather App': renderWeatherMockup,
        'Chat App (WhatsApp)': renderChatMockup,
        'E-commerce Product Card': renderEcommerceMockup
    };

    const renderer = renderers[level.appName];
    if (renderer) {
        mockupContainer.innerHTML = renderer(level);
    }

    // Attach drop zone event listeners
    setupDropZones();
}

function renderInstagramMockup(level) {
    return `
        <div class="app-mockup mockup-instagram">
            <div class="ig-header">
                <div class="drop-zone" data-zone="zone-1" data-zone-num="1">
                    <div class="ig-avatar">&#128100;</div>
                </div>
                <div class="drop-zone" data-zone="zone-2" data-zone-num="2">
                    <span class="ig-username">traveler_jane</span>
                </div>
            </div>
            <div class="drop-zone" data-zone="zone-3" data-zone-num="3">
                <div class="ig-photo">&#128247;</div>
            </div>
            <div class="drop-zone" data-zone="zone-4" data-zone-num="4">
                <div class="ig-actions">
                    <span>&#9825;</span>
                    <span>&#128172;</span>
                    <span>&#9993;</span>
                </div>
            </div>
            <div class="ig-likes">1,234 likes</div>
            <div class="drop-zone" data-zone="zone-5" data-zone-num="5">
                <div class="ig-comments">
                    <div class="ig-comment"><strong>traveler_jane</strong> Sunset views from Santorini!</div>
                    <div class="ig-comment"><strong>photo_mike</strong> Amazing shot!</div>
                    <div class="ig-comment-more">View all 56 comments</div>
                </div>
            </div>
            <div class="drop-zone" data-zone="zone-6" data-zone-num="6">
                <div class="ig-timestamp">2 HOURS AGO</div>
            </div>
        </div>
    `;
}

function renderTweetMockup(level) {
    return `
        <div class="app-mockup mockup-tweet">
            <div class="tweet-header">
                <div class="drop-zone" data-zone="zone-1" data-zone-num="1">
                    <div class="tweet-avatar">&#128038;</div>
                </div>
                <div class="tweet-content">
                    <div class="tweet-name-row">
                        <div class="drop-zone" data-zone="zone-2" data-zone-num="2" style="display:inline-block">
                            <span class="tweet-display-name">Tech Daily</span>
                        </div>
                        <div class="drop-zone" data-zone="zone-3" data-zone-num="3" style="display:inline-block">
                            <span class="tweet-handle">@techdaily</span>
                        </div>
                    </div>
                    <div class="drop-zone" data-zone="zone-4" data-zone-num="4">
                        <div class="tweet-text">
                            Just shipped a major update to our app! New features include dark mode,
                            improved search, and better performance across the board. Let us know
                            what you think! &#127881;
                        </div>
                    </div>
                    <div class="drop-zone" data-zone="zone-5" data-zone-num="5">
                        <div class="tweet-actions">
                            <span class="tweet-action">&#128172; 42</span>
                            <span class="tweet-action">&#128257; 156</span>
                            <span class="tweet-action">&#9825; 1.2K</span>
                            <span class="tweet-action">&#8599;</span>
                        </div>
                    </div>
                    <div class="drop-zone" data-zone="zone-6" data-zone-num="6">
                        <div class="tweet-like-count">
                            <strong>1,247</strong> Likes &middot; <strong>156</strong> Reposts
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderWeatherMockup(level) {
    return `
        <div class="app-mockup mockup-weather">
            <div class="drop-zone" data-zone="zone-1" data-zone-num="1">
                <div class="weather-city">San Francisco, CA</div>
            </div>
            <div class="drop-zone" data-zone="zone-2" data-zone-num="2">
                <div class="weather-temp">72&deg;F</div>
            </div>
            <div class="drop-zone" data-zone="zone-3" data-zone-num="3">
                <div class="weather-icon">&#9925;</div>
                <div class="weather-desc">Partly Cloudy</div>
            </div>
            <div class="drop-zone" data-zone="zone-4" data-zone-num="4">
                <div class="weather-forecast">
                    <div class="forecast-day">
                        <div class="day-name">Mon</div>
                        <div class="day-icon">&#9728;&#65039;</div>
                        <div class="day-temp">75&deg;</div>
                    </div>
                    <div class="forecast-day">
                        <div class="day-name">Tue</div>
                        <div class="day-icon">&#9925;</div>
                        <div class="day-temp">68&deg;</div>
                    </div>
                    <div class="forecast-day">
                        <div class="day-name">Wed</div>
                        <div class="day-icon">&#127783;&#65039;</div>
                        <div class="day-temp">62&deg;</div>
                    </div>
                    <div class="forecast-day">
                        <div class="day-name">Thu</div>
                        <div class="day-icon">&#127783;&#65039;</div>
                        <div class="day-temp">59&deg;</div>
                    </div>
                    <div class="forecast-day">
                        <div class="day-name">Fri</div>
                        <div class="day-icon">&#9728;&#65039;</div>
                        <div class="day-temp">71&deg;</div>
                    </div>
                </div>
            </div>
            <div class="drop-zone" data-zone="zone-5" data-zone-num="5">
                <div class="weather-updated">Last updated: 3 minutes ago</div>
            </div>
        </div>
    `;
}

function renderChatMockup(level) {
    return `
        <div class="app-mockup mockup-chat">
            <div class="chat-header">
                <div class="drop-zone" data-zone="zone-1" data-zone-num="1">
                    <div class="chat-avatar">&#128100;</div>
                </div>
                <div class="drop-zone" data-zone="zone-2" data-zone-num="2">
                    <div class="chat-contact-name">Alice Johnson</div>
                </div>
            </div>
            <div class="drop-zone" data-zone="zone-3" data-zone-num="3">
                <div class="chat-messages">
                    <div class="chat-bubble received">
                        Hey! Are we still meeting at 3pm? &#128522;
                        <div class="drop-zone" data-zone="zone-6" data-zone-num="6" style="position:relative;">
                            <div class="bubble-time">2:41 PM</div>
                        </div>
                    </div>
                    <div class="chat-bubble sent">
                        Yes! I'll be there. Just finishing up some work.
                        <div class="bubble-time">2:43 PM</div>
                    </div>
                    <div class="chat-bubble received">
                        Great, see you at the coffee shop!
                        <div class="bubble-time">2:44 PM</div>
                    </div>
                    <div class="chat-bubble sent">
                        Sounds good! &#128077;
                        <div class="bubble-time">2:45 PM</div>
                    </div>
                </div>
            </div>
            <div class="chat-input-bar">
                <div class="drop-zone" data-zone="zone-4" data-zone-num="4" style="flex:1">
                    <div class="chat-input">Type a message...</div>
                </div>
                <div class="drop-zone" data-zone="zone-5" data-zone-num="5">
                    <div class="chat-send-btn">&#10148;</div>
                </div>
            </div>
        </div>
    `;
}

function renderEcommerceMockup(level) {
    return `
        <div class="app-mockup mockup-ecommerce">
            <div class="drop-zone" data-zone="zone-1" data-zone-num="1">
                <div class="product-image">&#127911;</div>
            </div>
            <div class="product-info">
                <div class="drop-zone" data-zone="zone-2" data-zone-num="2">
                    <div class="product-name">Premium Wireless Noise-Cancelling Headphones</div>
                </div>
                <div class="drop-zone" data-zone="zone-3" data-zone-num="3">
                    <div class="product-price">
                        $79.99
                        <span class="original-price">$129.99</span>
                    </div>
                </div>
                <div class="product-rating">
                    <div class="drop-zone" data-zone="zone-4" data-zone-num="4">
                        <span class="stars">&#9733;&#9733;&#9733;&#9733;&#9734;</span>
                    </div>
                    <div class="drop-zone" data-zone="zone-6" data-zone-num="6">
                        <span class="review-count">2,847 reviews</span>
                    </div>
                </div>
                <div class="drop-zone" data-zone="zone-5" data-zone-num="5">
                    <div class="add-to-cart">Add to Cart</div>
                </div>
            </div>
        </div>
    `;
}

// ========================================
// DROP ZONE & DRAG/DROP HANDLING
// ========================================

function setupDropZones() {
    const zones = mockupContainer.querySelectorAll('.drop-zone');

    zones.forEach(zone => {
        // Click handling
        zone.addEventListener('click', function (e) {
            e.stopPropagation();
            if (isChecked) return;

            const zoneId = this.dataset.zone;

            // If a component is selected in the palette, assign it
            if (selectedComponent) {
                assignComponent(zoneId, selectedComponent);
                clearPaletteSelection();
            } else {
                // Highlight this zone as active
                clearActiveZones();
                this.classList.add('active');
            }
        });

        // Drag-and-drop handling
        zone.addEventListener('dragover', function (e) {
            e.preventDefault();
            if (isChecked) return;
            this.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', function () {
            this.classList.remove('drag-over');
        });

        zone.addEventListener('drop', function (e) {
            e.preventDefault();
            if (isChecked) return;
            this.classList.remove('drag-over');

            const componentType = e.dataTransfer.getData('text/plain');
            if (componentType) {
                assignComponent(this.dataset.zone, componentType);
                clearPaletteSelection();
            }
        });
    });
}

function clearActiveZones() {
    mockupContainer.querySelectorAll('.drop-zone.active').forEach(z => z.classList.remove('active'));
}

// ========================================
// COMPONENT PALETTE
// ========================================

function renderPalette(components) {
    componentsPalette.innerHTML = '';

    components.forEach(comp => {
        const label = document.createElement('div');
        label.className = 'component-label';
        label.textContent = comp;
        label.dataset.type = comp;
        label.draggable = true;

        // Drag start
        label.addEventListener('dragstart', function (e) {
            e.dataTransfer.setData('text/plain', comp);
            this.classList.add('dragging');
        });

        label.addEventListener('dragend', function () {
            this.classList.remove('dragging');
        });

        // Click to select
        label.addEventListener('click', function () {
            if (isChecked) return;

            // If already selected, deselect
            if (selectedComponent === comp && this.classList.contains('selected')) {
                clearPaletteSelection();
                return;
            }

            clearPaletteSelection();
            selectedComponent = comp;
            this.classList.add('selected');

            // If there's an active zone, assign immediately
            const activeZone = mockupContainer.querySelector('.drop-zone.active');
            if (activeZone) {
                assignComponent(activeZone.dataset.zone, comp);
                clearPaletteSelection();
                clearActiveZones();
            }
        });

        componentsPalette.appendChild(label);
    });
}

function clearPaletteSelection() {
    selectedComponent = null;
    componentsPalette.querySelectorAll('.component-label.selected').forEach(l => l.classList.remove('selected'));
}

// ========================================
// ASSIGNMENT MANAGEMENT
// ========================================

function assignComponent(zoneId, componentType) {
    const level = gameData[currentLevel];
    const zone = level.zones.find(z => z.id === zoneId);
    if (!zone) return;

    assignments[zoneId] = componentType;

    // Update the zone visual on the mockup
    updateZoneVisual(zoneId, componentType);

    // Update assignments list
    renderAssignments(level);

    // Check if all zones are assigned
    updateCheckButton(level);
}

function removeAssignment(zoneId) {
    delete assignments[zoneId];

    const zoneEl = mockupContainer.querySelector(`[data-zone="${zoneId}"]`);
    if (zoneEl) {
        zoneEl.classList.remove('assigned');
        const existingLabel = zoneEl.querySelector('.zone-label');
        if (existingLabel) existingLabel.remove();
    }

    const level = gameData[currentLevel];
    renderAssignments(level);
    updateCheckButton(level);
}

function updateZoneVisual(zoneId, componentType) {
    const zoneEl = mockupContainer.querySelector(`[data-zone="${zoneId}"]`);
    if (!zoneEl) return;

    // Remove old label if exists
    const existingLabel = zoneEl.querySelector('.zone-label');
    if (existingLabel) existingLabel.remove();

    // Add assigned class and label
    zoneEl.classList.add('assigned');
    zoneEl.classList.remove('active');

    const label = document.createElement('span');
    label.className = 'zone-label';
    label.textContent = componentType;
    zoneEl.appendChild(label);
}

function renderAssignments(level) {
    assignmentsList.innerHTML = '';

    level.zones.forEach(zone => {
        const row = document.createElement('div');
        row.className = 'assignment-row';

        const assigned = assignments[zone.id];

        row.innerHTML = `
            <span class="assignment-zone-num">${zone.id.replace('zone-', '')}</span>
            <span class="assignment-zone-label">${zone.label}</span>
            <span class="assignment-arrow">&rarr;</span>
            <span class="assignment-value ${assigned ? '' : 'empty'}">${assigned || '?'}</span>
            ${assigned && !isChecked ? '<button class="assignment-clear" data-zone="' + zone.id + '">&times;</button>' : ''}
        `;

        assignmentsList.appendChild(row);
    });

    // Attach clear button listeners
    assignmentsList.querySelectorAll('.assignment-clear').forEach(btn => {
        btn.addEventListener('click', function () {
            removeAssignment(this.dataset.zone);
        });
    });
}

function updateCheckButton(level) {
    const allAssigned = level.zones.every(z => assignments[z.id]);
    checkBtn.disabled = !allAssigned;
}

// ========================================
// CHECK ANSWER
// ========================================

function checkAnswer() {
    const level = gameData[currentLevel];
    isChecked = true;

    let correct = 0;
    const total = level.zones.length;

    level.zones.forEach(zone => {
        const assigned = assignments[zone.id];
        const isCorrect = assigned === zone.correctComponent;

        // Update mockup zone visuals
        const zoneEl = mockupContainer.querySelector(`[data-zone="${zone.id}"]`);
        if (zoneEl) {
            zoneEl.classList.remove('assigned', 'active');
            zoneEl.classList.add(isCorrect ? 'correct' : 'incorrect');
        }

        // Update assignment row
        const rows = assignmentsList.querySelectorAll('.assignment-row');
        const zoneIndex = level.zones.indexOf(zone);
        if (rows[zoneIndex]) {
            rows[zoneIndex].classList.add(isCorrect ? 'correct' : 'incorrect');

            if (!isCorrect) {
                const valueEl = rows[zoneIndex].querySelector('.assignment-value');
                if (valueEl) {
                    valueEl.innerHTML = `<s>${assigned}</s> &rarr; ${zone.correctComponent}`;
                }
            }
        }

        if (isCorrect) {
            correct++;
            componentsLearned.add(zone.correctComponent);
        }

        // Remove clear buttons
        const clearBtn = rows[zoneIndex] ? rows[zoneIndex].querySelector('.assignment-clear') : null;
        if (clearBtn) clearBtn.remove();
    });

    // Calculate points
    const points = correct * 20;
    score += points;
    scoreEl.textContent = score;

    // Show feedback
    if (correct === total) {
        feedbackEl.className = 'feedback success';
        feedbackEl.textContent = `Perfect! You identified all ${total} components correctly! (+${points} points)`;
    } else if (correct >= total / 2) {
        feedbackEl.className = 'feedback partial';
        feedbackEl.textContent = `Good effort! ${correct}/${total} correct. (+${points} points) Review the corrections above.`;
    } else {
        feedbackEl.className = 'feedback error';
        feedbackEl.textContent = `${correct}/${total} correct. (+${points} points) Study the component types and try the next challenge!`;
    }
    feedbackEl.classList.remove('hidden');

    // Show explanation
    explanationEl.innerHTML = `
        <h3>Component Breakdown</h3>
        <p>${level.explanation}</p>
    `;
    explanationEl.classList.remove('hidden');

    // Show navigation
    navigationEl.classList.remove('hidden');

    // Disable interaction
    checkBtn.disabled = true;
    resetBtn.disabled = true;
}

// ========================================
// RESET & NAVIGATION
// ========================================

function resetLevel() {
    assignments = {};
    selectedComponent = null;
    isChecked = false;

    clearPaletteSelection();
    clearActiveZones();

    const level = gameData[currentLevel];
    renderMockup(level);
    renderAssignments(level);

    checkBtn.disabled = true;
    feedbackEl.classList.add('hidden');
    explanationEl.classList.add('hidden');
    navigationEl.classList.add('hidden');
}

function nextLevel() {
    currentLevel++;
    loadLevel();
}

function showGameComplete() {
    gameContainer.classList.add('hidden');
    gameCompleteEl.classList.remove('hidden');
    finalScoreEl.textContent = score;

    // Show learned components
    componentsLearnedEl.innerHTML = '';
    Array.from(componentsLearned).sort().forEach(comp => {
        const chip = document.createElement('span');
        chip.className = 'component-chip';
        chip.textContent = comp;
        chip.style.background = componentColors[comp] || '#667eea';
        componentsLearnedEl.appendChild(chip);
    });
}

function restartGame() {
    currentLevel = 0;
    score = 0;
    componentsLearned.clear();
    scoreEl.textContent = score;
    gameCompleteEl.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    loadLevel();
}

// ========================================
// EVENT LISTENERS
// ========================================

checkBtn.addEventListener('click', checkAnswer);
resetBtn.addEventListener('click', resetLevel);
nextBtn.addEventListener('click', nextLevel);
restartBtn.addEventListener('click', restartGame);

// Click on empty area deselects
document.addEventListener('click', function (e) {
    if (!e.target.closest('.drop-zone') && !e.target.closest('.component-label')) {
        clearPaletteSelection();
        clearActiveZones();
    }
});

// Start game
initGame();
