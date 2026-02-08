// Game state
let levels = [];
let currentLevelIndex = 0;
let score = 0;
let totalStars = 0;
let hintsRemaining = 3;
let patternSelected = false;
let patternCorrect = false;
let placedComponents = {}; // { zoneId: componentId }
let levelStartTime = 0;
let submitted = false;
let usedTraps = [];
let patternsLearned = new Set();

// DOM elements
const currentLevelEl = document.getElementById('current-level');
const totalLevelsEl = document.getElementById('total-levels');
const currentModeEl = document.getElementById('current-mode');
const scoreEl = document.getElementById('score');
const starsEl = document.getElementById('stars');
const scenarioTitle = document.getElementById('scenario-title');
const scenarioDescription = document.getElementById('scenario-description');
const scenarioContext = document.getElementById('scenario-context');
const patternSelection = document.getElementById('pattern-selection');
const patternOptions = document.getElementById('pattern-options');
const patternDisplay = document.getElementById('pattern-display');
const patternNameEl = document.getElementById('pattern-name');
const patternTemplateEl = document.getElementById('pattern-template');
const inspectorSection = document.getElementById('inspector-section');
const brokenRequirement = document.getElementById('broken-requirement');
const dropzoneSection = document.getElementById('dropzone-section');
const dropzoneHeading = document.getElementById('dropzone-heading');
const dropZonesContainer = document.getElementById('drop-zones');
const componentBankSection = document.getElementById('component-bank-section');
const componentBank = document.getElementById('component-bank');
const previewSection = document.getElementById('preview-section');
const requirementPreview = document.getElementById('requirement-preview');
const actionsEl = document.getElementById('actions');
const submitBtn = document.getElementById('submit-btn');
const hintBtn = document.getElementById('hint-btn');
const hintsRemainingEl = document.getElementById('hints-remaining');
const feedbackEl = document.getElementById('feedback');
const explanationEl = document.getElementById('explanation');
const navigationEl = document.getElementById('navigation');
const nextBtn = document.getElementById('next-btn');
const gameContainer = document.getElementById('game-container');
const gameCompleteEl = document.getElementById('game-complete');
const finalScoreEl = document.getElementById('final-score');
const patternsListEl = document.getElementById('patterns-list');
const restartBtn = document.getElementById('restart-btn');

// Pattern display names and templates
const patternInfo = {
    'ubiquitous': { name: 'Ubiquitous', template: 'The [system] shall [action]' },
    'event-driven': { name: 'Event-Driven', template: 'WHEN [trigger], the [system] shall [action]' },
    'unwanted': { name: 'Unwanted Behavior', template: 'IF [condition], THEN the [system] shall [action]' },
    'state-driven': { name: 'State-Driven', template: 'WHILE [state], the [system] shall [action]' },
    'optional': { name: 'Optional Feature', template: 'WHERE [feature], the [system] shall [action]' }
};

// Difficulty mode names
const modeNames = {
    'beginner': 'Guided Builder',
    'intermediate': 'Pattern Detective',
    'advanced': 'Quality Inspector'
};

// Drag state
let draggedComponentId = null;
let draggedFromZone = null;

// Initialize game
async function initGame() {
    try {
        const response = await fetch('levels.json');
        levels = await response.json();
        totalLevelsEl.textContent = levels.length;
        loadLevel();
    } catch (error) {
        console.error('Error loading game data:', error);
        document.getElementById('game-container').innerHTML =
            '<p style="text-align:center;padding:40px;color:#e74c3c;">Failed to load game data. Please refresh the page.</p>';
    }
}

// Load current level
function loadLevel() {
    if (currentLevelIndex >= levels.length) {
        showGameComplete();
        return;
    }

    const level = levels[currentLevelIndex];
    submitted = false;
    patternSelected = false;
    patternCorrect = false;
    placedComponents = {};
    usedTraps = [];
    hintsRemaining = 3;
    levelStartTime = Date.now();

    // Update header
    currentLevelEl.textContent = currentLevelIndex + 1;
    currentModeEl.textContent = modeNames[level.difficulty] || level.difficulty;
    hintsRemainingEl.textContent = hintsRemaining;

    // Reset visibility
    patternSelection.classList.add('hidden');
    patternDisplay.classList.add('hidden');
    inspectorSection.classList.add('hidden');
    dropzoneSection.classList.add('hidden');
    componentBankSection.classList.add('hidden');
    previewSection.classList.add('hidden');
    actionsEl.classList.add('hidden');
    feedbackEl.classList.add('hidden');
    explanationEl.classList.add('hidden');
    navigationEl.classList.add('hidden');

    // Load scenario
    scenarioTitle.textContent = level.scenario.title;
    scenarioDescription.textContent = level.scenario.description;
    scenarioContext.textContent = level.scenario.context;

    // Determine mode behavior
    if (level.mode === 'inspector') {
        loadInspectorMode(level);
    } else if (level.difficulty === 'beginner') {
        loadGuidedMode(level);
    } else {
        loadDetectiveMode(level);
    }
}

// Mode 1: Guided Builder (beginner)
function loadGuidedMode(level) {
    patternSelected = true;
    patternCorrect = true;

    // Show pattern info
    const info = patternInfo[level.correctPattern];
    patternNameEl.textContent = info.name;
    patternTemplateEl.textContent = info.template;
    patternDisplay.classList.remove('hidden');

    // Build drop zones and component bank
    buildDropZones(level);
    buildComponentBank(level);

    dropzoneSection.classList.remove('hidden');
    componentBankSection.classList.remove('hidden');
    previewSection.classList.remove('hidden');
    actionsEl.classList.remove('hidden');
    submitBtn.disabled = false;
    hintBtn.disabled = false;

    updatePreview(level);
}

// Mode 2: Pattern Detective (intermediate)
function loadDetectiveMode(level) {
    // Show pattern selection
    patternOptions.innerHTML = '';
    const options = level.patternOptions || Object.keys(patternInfo);

    options.forEach(patternKey => {
        const info = patternInfo[patternKey];
        const btn = document.createElement('div');
        btn.className = 'pattern-option';
        btn.textContent = info.name;
        btn.dataset.pattern = patternKey;
        btn.addEventListener('click', () => selectPattern(patternKey, level));
        patternOptions.appendChild(btn);
    });

    patternSelection.classList.remove('hidden');
}

// Mode 3: Inspector (advanced - fixing broken requirements)
function loadInspectorMode(level) {
    const broken = level.brokenRequirement;

    // Build the broken requirement with clickable parts
    let html = broken.text;
    broken.issues.forEach(issue => {
        html = html.replace(
            issue.brokenText,
            `<span class="broken-part" data-issue-id="${issue.id}" data-fix="${encodeURIComponent(issue.fixText)}">${issue.brokenText}</span>`
        );
    });
    brokenRequirement.innerHTML = html;

    // Add click handlers to broken parts
    brokenRequirement.querySelectorAll('.broken-part').forEach(el => {
        el.addEventListener('dragover', handleDropZoneDragOver);
        el.addEventListener('dragleave', handleDropZoneDragLeave);
        el.addEventListener('drop', handleInspectorDrop);
    });

    inspectorSection.classList.remove('hidden');

    // Build component bank with fixes
    buildComponentBank(level);
    componentBankSection.classList.remove('hidden');
    actionsEl.classList.remove('hidden');
    submitBtn.disabled = false;
    hintBtn.disabled = false;
}

// Select pattern (Mode 2)
function selectPattern(patternKey, level) {
    if (patternSelected) return;

    // Highlight selected
    patternOptions.querySelectorAll('.pattern-option').forEach(btn => {
        btn.classList.remove('selected');
    });
    const selectedBtn = patternOptions.querySelector(`[data-pattern="${patternKey}"]`);
    selectedBtn.classList.add('selected');

    patternSelected = true;
    patternCorrect = (patternKey === level.correctPattern);

    // Show correct/incorrect feedback on pattern buttons
    patternOptions.querySelectorAll('.pattern-option').forEach(btn => {
        btn.style.pointerEvents = 'none';
        if (btn.dataset.pattern === level.correctPattern) {
            btn.classList.add('correct');
        } else if (btn.classList.contains('selected')) {
            btn.classList.add('incorrect');
        }
    });

    // Show pattern feedback
    if (patternCorrect) {
        showTemporaryFeedback('Correct pattern! Now build the requirement.', 'success');
    } else {
        showTemporaryFeedback(
            `Not quite. The correct pattern is ${patternInfo[level.correctPattern].name}. Build with the correct pattern below.`,
            'error'
        );
    }

    // Show drop zones and component bank
    setTimeout(() => {
        buildDropZones(level);
        buildComponentBank(level);

        dropzoneSection.classList.remove('hidden');
        componentBankSection.classList.remove('hidden');
        previewSection.classList.remove('hidden');
        actionsEl.classList.remove('hidden');
        submitBtn.disabled = false;
        hintBtn.disabled = false;

        updatePreview(level);
    }, 800);
}

// Build drop zones based on level template
function buildDropZones(level) {
    dropZonesContainer.innerHTML = '';

    level.template.forEach(part => {
        if (part.type === 'static') {
            const span = document.createElement('span');
            span.className = 'static-text';
            span.textContent = part.text;
            dropZonesContainer.appendChild(span);
        } else if (part.type === 'drop') {
            const zone = document.createElement('div');
            zone.className = 'drop-zone';
            zone.dataset.zoneId = part.zoneId;

            const zoneConfig = level.dropZones.find(z => z.id === part.zoneId);
            zone.dataset.accepts = zoneConfig ? zoneConfig.accepts : '';

            const label = document.createElement('span');
            label.className = 'zone-label';
            label.textContent = zoneConfig ? zoneConfig.label : part.zoneId;
            zone.appendChild(label);

            // Drag events for drop zone
            zone.addEventListener('dragover', handleDropZoneDragOver);
            zone.addEventListener('dragleave', handleDropZoneDragLeave);
            zone.addEventListener('drop', handleDropZoneDrop);

            dropZonesContainer.appendChild(zone);
        }
    });
}

// Build component bank
function buildComponentBank(level) {
    componentBank.innerHTML = '';

    const shuffled = shuffleArray([...level.componentBank]);

    shuffled.forEach(comp => {
        const chip = document.createElement('div');
        chip.className = `component ${comp.category}`;
        chip.textContent = comp.text;
        chip.dataset.componentId = comp.id;
        chip.dataset.category = comp.category;
        chip.draggable = true;

        chip.addEventListener('dragstart', handleDragStart);
        chip.addEventListener('dragend', handleDragEnd);

        componentBank.appendChild(chip);
    });
}

// Shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Drag and drop handlers
function handleDragStart(e) {
    if (submitted) return;
    draggedComponentId = e.target.dataset.componentId;
    draggedFromZone = null;

    // Check if dragging from a drop zone
    if (e.target.closest('.drop-zone')) {
        draggedFromZone = e.target.closest('.drop-zone').dataset.zoneId;
    }

    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedComponentId);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedComponentId = null;
    draggedFromZone = null;

    // Remove all drag-over states
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
}

function handleDropZoneDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
}

function handleDropZoneDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDropZoneDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    if (submitted) return;

    const compId = e.dataTransfer.getData('text/plain');
    if (!compId) return;

    const level = levels[currentLevelIndex];
    const zoneId = e.currentTarget.dataset.zoneId;

    // If there was already a component in this zone, return it to the bank
    if (placedComponents[zoneId]) {
        returnComponentToBank(placedComponents[zoneId]);
    }

    // If dragged from another zone, clear that zone
    if (draggedFromZone && draggedFromZone !== zoneId) {
        delete placedComponents[draggedFromZone];
        const oldZone = dropZonesContainer.querySelector(`[data-zone-id="${draggedFromZone}"]`);
        if (oldZone) {
            clearDropZone(oldZone);
        }
    }

    // Place component in zone
    placedComponents[zoneId] = compId;

    // Update zone visual
    const comp = level.componentBank.find(c => c.id === compId);
    if (comp) {
        e.currentTarget.classList.add('filled');
        const existingPlaced = e.currentTarget.querySelector('.placed-component');
        if (existingPlaced) existingPlaced.remove();

        const placedEl = document.createElement('span');
        placedEl.className = `placed-component`;
        placedEl.textContent = comp.text;
        placedEl.draggable = true;
        placedEl.dataset.componentId = compId;
        placedEl.addEventListener('dragstart', handleDragStart);
        placedEl.addEventListener('dragend', handleDragEnd);
        e.currentTarget.appendChild(placedEl);

        // Mark component in bank as placed
        const bankChip = componentBank.querySelector(`[data-component-id="${compId}"]`);
        if (bankChip) bankChip.classList.add('placed');
    }

    updatePreview(level);
}

function handleInspectorDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    if (submitted) return;

    const compId = e.dataTransfer.getData('text/plain');
    if (!compId) return;

    const level = levels[currentLevelIndex];
    const issueId = e.currentTarget.dataset.issueId;
    const comp = level.componentBank.find(c => c.id === compId);

    if (comp) {
        // Place the fix
        placedComponents[issueId] = compId;
        e.currentTarget.textContent = comp.text;
        e.currentTarget.classList.add('fixed');

        // Mark component in bank as placed
        const bankChip = componentBank.querySelector(`[data-component-id="${compId}"]`);
        if (bankChip) bankChip.classList.add('placed');
    }
}

// Return component to bank
function returnComponentToBank(compId) {
    const bankChip = componentBank.querySelector(`[data-component-id="${compId}"]`);
    if (bankChip) bankChip.classList.remove('placed');
}

// Clear a drop zone
function clearDropZone(zone) {
    zone.classList.remove('filled');
    const placed = zone.querySelector('.placed-component');
    if (placed) placed.remove();

    // Re-show label
    const label = zone.querySelector('.zone-label');
    if (label) label.style.display = '';
}

// Update the requirement preview
function updatePreview(level) {
    if (!level.template) return;

    let previewHTML = '';
    level.template.forEach(part => {
        if (part.type === 'static') {
            previewHTML += `<span>${part.text} </span>`;
        } else if (part.type === 'drop') {
            const compId = placedComponents[part.zoneId];
            if (compId) {
                const comp = level.componentBank.find(c => c.id === compId);
                const cssClass = comp ? `preview-${comp.category}` : '';
                previewHTML += `<span class="${cssClass}">${comp ? comp.text : ''} </span>`;
            } else {
                previewHTML += `<span class="preview-empty">[___] </span>`;
            }
        }
    });

    requirementPreview.innerHTML = previewHTML;
}

// Show temporary feedback
function showTemporaryFeedback(message, type) {
    feedbackEl.className = `feedback ${type}`;
    feedbackEl.textContent = message;
    feedbackEl.classList.remove('hidden');

    setTimeout(() => {
        feedbackEl.classList.add('hidden');
    }, 3000);
}

// Show hint
function showHint() {
    if (hintsRemaining <= 0 || submitted) return;

    hintsRemaining--;
    hintsRemainingEl.textContent = hintsRemaining;

    const level = levels[currentLevelIndex];

    if (level.mode === 'inspector') {
        // Inspector hint: highlight a broken part that hasn't been fixed
        const unfixed = brokenRequirement.querySelectorAll('.broken-part:not(.fixed)');
        if (unfixed.length > 0) {
            const target = unfixed[0];
            target.style.boxShadow = '0 0 15px rgba(231, 76, 60, 0.7)';
            const issue = level.brokenRequirement.issues.find(i => i.id === target.dataset.issueId);
            showTemporaryFeedback(`Hint: ${issue ? issue.reason : 'This part needs fixing.'}`, 'hint');
            setTimeout(() => { target.style.boxShadow = ''; }, 3000);
        }
    } else if (!patternSelected) {
        // Hint for pattern selection
        showTemporaryFeedback(
            `Hint: Think about whether this is a one-time event, ongoing state, error condition, or always-on behavior.`,
            'hint'
        );
    } else {
        // Hint for component placement: reveal one correct placement
        const solution = level.solution;
        const unplaced = Object.entries(solution).filter(([zoneId]) => placedComponents[zoneId] !== solution[zoneId]);

        if (unplaced.length > 0) {
            const [zoneId, compId] = unplaced[0];
            const comp = level.componentBank.find(c => c.id === compId);
            const zoneConfig = level.dropZones.find(z => z.id === zoneId);

            // Highlight the correct component in the bank
            const bankChip = componentBank.querySelector(`[data-component-id="${compId}"]`);
            if (bankChip) {
                bankChip.style.boxShadow = '0 0 15px rgba(39, 174, 96, 0.7)';
                setTimeout(() => { bankChip.style.boxShadow = ''; }, 3000);
            }

            showTemporaryFeedback(
                `Hint: "${comp.text}" goes in the ${zoneConfig ? zoneConfig.label : zoneId} slot.`,
                'hint'
            );
        }
    }

    if (hintsRemaining <= 0) {
        hintBtn.disabled = true;
    }
}

// Submit answer
function submitAnswer() {
    if (submitted) return;

    const level = levels[currentLevelIndex];

    if (level.mode === 'inspector') {
        submitInspectorAnswer(level);
    } else {
        submitBuilderAnswer(level);
    }
}

// Submit for builder modes (beginner/intermediate)
function submitBuilderAnswer(level) {
    // Check that all zones are filled
    const allFilled = level.dropZones.every(zone => placedComponents[zone.id]);
    if (!allFilled) {
        showTemporaryFeedback('Please fill all the drop zones before submitting.', 'error');
        return;
    }

    submitted = true;
    submitBtn.disabled = true;
    hintBtn.disabled = true;

    const solution = level.solution;
    const timeSpent = (Date.now() - levelStartTime) / 1000;

    // Calculate score
    let pointsBreakdown = [];
    let totalPoints = 0;

    // Pattern selection points (intermediate mode)
    if (level.difficulty !== 'beginner') {
        const patternPoints = patternCorrect ? 30 : 0;
        totalPoints += patternPoints;
        pointsBreakdown.push({
            label: 'Pattern Selection',
            points: patternPoints,
            max: 30,
            type: patternCorrect ? 'bonus' : 'penalty'
        });
        if (!patternCorrect) {
            pointsBreakdown.push({ label: 'Wrong pattern penalty', points: -20, type: 'penalty' });
            totalPoints -= 20;
        }
    }

    // Component correctness
    let correctCount = 0;
    let trapCount = 0;
    level.dropZones.forEach(zone => {
        const placedId = placedComponents[zone.id];
        const correctId = solution[zone.id];
        const comp = level.componentBank.find(c => c.id === placedId);

        if (placedId === correctId) {
            correctCount++;
        }
        if (comp && comp.isTrap) {
            trapCount++;
            usedTraps.push(comp);
        }
    });

    const componentPoints = correctCount * 10;
    totalPoints += componentPoints;
    pointsBreakdown.push({
        label: `Correct Components (${correctCount}/${level.dropZones.length})`,
        points: componentPoints,
        max: level.dropZones.length * 10,
        type: 'bonus'
    });

    // Trap penalty
    if (trapCount > 0) {
        const trapPenalty = trapCount * -10;
        totalPoints += trapPenalty;
        pointsBreakdown.push({ label: `Trap components used (${trapCount})`, points: trapPenalty, type: 'penalty' });
    }

    // No traps bonus
    if (trapCount === 0 && correctCount === level.dropZones.length) {
        totalPoints += 20;
        pointsBreakdown.push({ label: 'No traps bonus', points: 20, type: 'bonus' });
    }

    // Speed bonus
    if (timeSpent < 60 && correctCount === level.dropZones.length) {
        totalPoints += 10;
        pointsBreakdown.push({ label: 'Speed bonus (<60s)', points: 10, type: 'bonus' });
    }

    // Hint penalty
    const hintsUsed = 3 - hintsRemaining;
    if (hintsUsed > 0) {
        const hintPenalty = hintsUsed * -5;
        totalPoints += hintPenalty;
        pointsBreakdown.push({ label: `Hints used (${hintsUsed})`, points: hintPenalty, type: 'penalty' });
    }

    totalPoints = Math.max(0, totalPoints);
    score += totalPoints;
    scoreEl.textContent = score;

    // Star rating
    const maxPossible = (level.difficulty !== 'beginner' ? 30 : 0) + (level.dropZones.length * 10) + 20 + 10;
    const percentage = (totalPoints / maxPossible) * 100;
    let stars = 0;
    if (percentage >= 91) stars = 3;
    else if (percentage >= 76) stars = 2;
    else if (percentage >= 60) stars = 1;

    totalStars += stars;
    const starDisplay = stars === 3 ? '★★★' : stars === 2 ? '★★☆' : stars === 1 ? '★☆☆' : '☆☆☆';
    starsEl.textContent = starDisplay;

    // Track learned patterns
    if (correctCount === level.dropZones.length) {
        patternsLearned.add(level.correctPattern);
    }

    // Visual feedback on drop zones
    level.dropZones.forEach(zone => {
        const zoneEl = dropZonesContainer.querySelector(`[data-zone-id="${zone.id}"]`);
        if (!zoneEl) return;

        const placedId = placedComponents[zone.id];
        const correctId = solution[zone.id];

        if (placedId === correctId) {
            zoneEl.style.borderColor = '#27ae60';
            zoneEl.style.background = '#d5f5e3';
        } else {
            zoneEl.style.borderColor = '#e74c3c';
            zoneEl.style.background = '#fadbd8';
        }
    });

    // Mark traps in bank
    componentBank.querySelectorAll('.component').forEach(chip => {
        const compId = chip.dataset.componentId;
        const comp = level.componentBank.find(c => c.id === compId);
        if (comp && comp.isTrap) {
            chip.style.border = '2px solid #e74c3c';
            chip.style.opacity = '0.7';
        }
    });

    // Show feedback
    const allCorrect = correctCount === level.dropZones.length && (level.difficulty === 'beginner' || patternCorrect);

    if (allCorrect && trapCount === 0) {
        feedbackEl.className = 'feedback success';
        feedbackEl.textContent = `Excellent! Perfect requirement! (+${totalPoints} points) ${starDisplay}`;
    } else if (correctCount === level.dropZones.length) {
        feedbackEl.className = 'feedback success';
        feedbackEl.textContent = `Good job! Requirement built correctly. (+${totalPoints} points) ${starDisplay}`;
    } else {
        feedbackEl.className = 'feedback error';
        feedbackEl.textContent = `Not quite right. Review the correct components below. (+${totalPoints} points) ${starDisplay}`;
    }
    feedbackEl.classList.remove('hidden');

    // Show explanation
    showExplanation(level, pointsBreakdown, totalPoints);

    // Show navigation
    navigationEl.classList.remove('hidden');
}

// Submit for inspector mode
function submitInspectorAnswer(level) {
    const issues = level.brokenRequirement.issues;
    const allFixed = issues.every(issue => placedComponents[issue.id]);

    if (!allFixed) {
        showTemporaryFeedback('Please fix all highlighted issues before submitting.', 'error');
        return;
    }

    submitted = true;
    submitBtn.disabled = true;
    hintBtn.disabled = true;

    let correctFixes = 0;
    let totalPoints = 0;
    let pointsBreakdown = [];

    issues.forEach(issue => {
        const placedCompId = placedComponents[issue.id];
        const comp = level.componentBank.find(c => c.id === placedCompId);
        const isCorrectFix = comp && !comp.isTrap;

        if (isCorrectFix) {
            correctFixes++;
        }

        const brokenEl = brokenRequirement.querySelector(`[data-issue-id="${issue.id}"]`);
        if (brokenEl) {
            brokenEl.style.borderColor = isCorrectFix ? '#27ae60' : '#e74c3c';
            brokenEl.style.background = isCorrectFix ? '#d5f5e3' : '#fadbd8';
            brokenEl.style.borderStyle = 'solid';
        }
    });

    const fixPoints = correctFixes * 20;
    totalPoints += fixPoints;
    pointsBreakdown.push({
        label: `Correct fixes (${correctFixes}/${issues.length})`,
        points: fixPoints,
        max: issues.length * 20,
        type: 'bonus'
    });

    // No wrong fixes bonus
    if (correctFixes === issues.length) {
        totalPoints += 20;
        pointsBreakdown.push({ label: 'All issues fixed correctly', points: 20, type: 'bonus' });
        patternsLearned.add(level.correctPattern);
    }

    // Hint penalty
    const hintsUsed = 3 - hintsRemaining;
    if (hintsUsed > 0) {
        const hintPenalty = hintsUsed * -5;
        totalPoints += hintPenalty;
        pointsBreakdown.push({ label: `Hints used (${hintsUsed})`, points: hintPenalty, type: 'penalty' });
    }

    totalPoints = Math.max(0, totalPoints);
    score += totalPoints;
    scoreEl.textContent = score;

    // Star rating for inspector
    const maxPossible = (issues.length * 20) + 20;
    const percentage = (totalPoints / maxPossible) * 100;
    let stars = 0;
    if (percentage >= 91) stars = 3;
    else if (percentage >= 76) stars = 2;
    else if (percentage >= 60) stars = 1;

    totalStars += stars;
    const starDisplay = stars === 3 ? '★★★' : stars === 2 ? '★★☆' : stars === 1 ? '★☆☆' : '☆☆☆';
    starsEl.textContent = starDisplay;

    if (correctFixes === issues.length) {
        feedbackEl.className = 'feedback success';
        feedbackEl.textContent = `All issues fixed! (+${totalPoints} points) ${starDisplay}`;
    } else {
        feedbackEl.className = 'feedback error';
        feedbackEl.textContent = `${correctFixes}/${issues.length} issues fixed correctly. (+${totalPoints} points) ${starDisplay}`;
    }
    feedbackEl.classList.remove('hidden');

    showExplanation(level, pointsBreakdown, totalPoints);
    navigationEl.classList.remove('hidden');
}

// Show explanation panel
function showExplanation(level, pointsBreakdown, totalPoints) {
    let html = '<h3>Analysis</h3>';
    html += `<p>${level.explanation}</p>`;

    // Points breakdown
    html += '<div class="points-breakdown">';
    pointsBreakdown.forEach(row => {
        const sign = row.points >= 0 ? '+' : '';
        html += `<div class="points-row ${row.type}">${row.label}: <strong>${sign}${row.points}</strong></div>`;
    });
    html += `<div class="points-row total">Total: <strong>+${totalPoints}</strong></div>`;
    html += '</div>';

    // Show trap warnings
    if (usedTraps.length > 0) {
        usedTraps.forEach(trap => {
            html += `<div class="trap-warning">⚠️ Trap: "${trap.text}" — ${trap.reason}</div>`;
        });
    }

    // For inspector mode, show issue details
    if (level.mode === 'inspector') {
        level.brokenRequirement.issues.forEach(issue => {
            html += `<div class="trap-warning">Issue: "${issue.brokenText}" → "${issue.fixText}" — ${issue.reason}</div>`;
        });
    }

    explanationEl.innerHTML = html;
    explanationEl.classList.remove('hidden');
}

// Next level
function nextLevel() {
    currentLevelIndex++;
    loadLevel();
}

// Show game complete
function showGameComplete() {
    gameContainer.classList.add('hidden');
    gameCompleteEl.classList.remove('hidden');
    finalScoreEl.textContent = score;

    patternsListEl.innerHTML = '';
    const allPatterns = ['ubiquitous', 'event-driven', 'unwanted', 'state-driven', 'optional'];
    allPatterns.forEach(pattern => {
        const info = patternInfo[pattern];
        const li = document.createElement('li');
        const mastered = patternsLearned.has(pattern);
        li.innerHTML = `<span class="badge ${pattern}">${info.name}</span> ${mastered ? '✓ Mastered' : '— Keep practicing'}`;
        patternsListEl.appendChild(li);
    });
}

// Restart game
function restartGame() {
    currentLevelIndex = 0;
    score = 0;
    totalStars = 0;
    patternsLearned.clear();
    scoreEl.textContent = score;
    starsEl.textContent = '-';
    gameCompleteEl.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    loadLevel();
}

// Event listeners
submitBtn.addEventListener('click', submitAnswer);
hintBtn.addEventListener('click', showHint);
nextBtn.addEventListener('click', nextLevel);
restartBtn.addEventListener('click', restartGame);

// Allow dropping back to component bank (to remove from zone)
componentBank.addEventListener('dragover', (e) => {
    if (submitted) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
});

componentBank.addEventListener('drop', (e) => {
    if (submitted) return;
    e.preventDefault();

    const compId = e.dataTransfer.getData('text/plain');
    if (!compId || !draggedFromZone) return;

    // Remove from zone
    delete placedComponents[draggedFromZone];
    const zone = dropZonesContainer.querySelector(`[data-zone-id="${draggedFromZone}"]`);
    if (zone) clearDropZone(zone);

    // Return to bank
    returnComponentToBank(compId);

    const level = levels[currentLevelIndex];
    updatePreview(level);
});

// Start game
initGame();
