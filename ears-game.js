// EARS Requirements Builder Game
let gameData = [];
let currentLevel = 0;
let score = 0;
let totalStars = 0;
let hintsRemaining = 3;
let levelStartTime = 0;
let patternSelected = false;
let submitted = false;
let draggedComponent = null;
let placements = {}; // { zoneId: componentId }
let patternScores = {}; // track scores by pattern type

// DOM references
const currentLevelEl = document.getElementById('current-level');
const totalLevelsEl = document.getElementById('total-levels');
const scoreEl = document.getElementById('score');
const difficultyEl = document.getElementById('difficulty');
const modeEl = document.getElementById('mode');
const starsEl = document.getElementById('stars');
const progressFill = document.getElementById('progress-fill');
const scenarioTitle = document.getElementById('scenario-title');
const scenarioDescription = document.getElementById('scenario-description');
const scenarioContext = document.getElementById('scenario-context');
const brokenReqDiv = document.getElementById('broken-requirement');
const brokenText = document.getElementById('broken-text');
const issuesList = document.getElementById('issues-list');
const issuesItems = document.getElementById('issues-items');
const patternSelection = document.getElementById('pattern-selection');
const patternOptions = document.getElementById('pattern-options');
const templateDisplay = document.getElementById('template-display');
const dropZonesSection = document.getElementById('drop-zones-section');
const builderTitle = document.getElementById('builder-title');
const requirementBuilder = document.getElementById('requirement-builder');
const componentBank = document.getElementById('component-bank');
const componentBankGrid = document.getElementById('component-bank-grid');
const submitBtn = document.getElementById('submit-btn');
const hintBtn = document.getElementById('hint-btn');
const resetBtn = document.getElementById('reset-btn');
const feedbackDiv = document.getElementById('feedback');
const explanationDiv = document.getElementById('explanation');
const constructedReq = document.getElementById('constructed-req');
const navigationDiv = document.getElementById('navigation');
const nextBtn = document.getElementById('next-btn');
const gameComplete = document.getElementById('game-complete');
const gameContainer = document.getElementById('game-container');
const finalScoreEl = document.getElementById('final-score');
const finalStarsEl = document.getElementById('final-stars');
const patternsMastered = document.getElementById('patterns-mastered');
const restartBtn = document.getElementById('restart-btn');

const patternNames = {
    'ubiquitous': 'Ubiquitous',
    'event-driven': 'Event-Driven',
    'unwanted-behavior': 'Unwanted Behavior',
    'state-driven': 'State-Driven',
    'optional-feature': 'Optional Feature'
};

const modeNames = {
    'guided': 'Guided Builder',
    'detective': 'Pattern Detective',
    'inspector': 'Quality Inspector'
};

async function initGame() {
    const response = await fetch('ears-game-data.json');
    gameData = await response.json();
    totalLevelsEl.textContent = gameData.length;
    setupEventListeners();
    loadLevel();
}

function setupEventListeners() {
    submitBtn.addEventListener('click', submitAnswer);
    hintBtn.addEventListener('click', useHint);
    resetBtn.addEventListener('click', resetLevel);
    nextBtn.addEventListener('click', nextLevel);
    restartBtn.addEventListener('click', restartGame);
}

function loadLevel() {
    const level = gameData[currentLevel];
    submitted = false;
    patternSelected = level.patternPreSelected;
    hintsRemaining = 3;
    placements = {};
    levelStartTime = Date.now();

    // Update UI info
    currentLevelEl.textContent = currentLevel + 1;
    scoreEl.textContent = score;
    updateDifficulty(level.difficulty);
    updateMode(level.mode);
    updateStars();
    progressFill.style.width = ((currentLevel) / gameData.length * 100) + '%';

    // Reset visibility
    feedbackDiv.classList.add('hidden');
    explanationDiv.classList.add('hidden');
    constructedReq.classList.add('hidden');
    navigationDiv.classList.add('hidden');
    submitBtn.disabled = true;
    hintBtn.disabled = false;
    hintBtn.innerHTML = 'Hint <span class="hints-remaining">(3)</span>';

    // Load scenario
    scenarioTitle.textContent = level.scenario.title;
    scenarioDescription.textContent = level.scenario.description;
    scenarioContext.textContent = level.scenario.context;

    // Inspector mode: show broken requirement
    if (level.mode === 'inspector') {
        brokenReqDiv.classList.remove('hidden');
        brokenText.textContent = level.brokenRequirement;
        issuesList.classList.remove('hidden');
        issuesItems.innerHTML = '';
        level.issues.forEach(issue => {
            const li = document.createElement('li');
            li.textContent = issue.problem;
            issuesItems.appendChild(li);
        });
        builderTitle.textContent = 'Fix the Requirement';
    } else {
        brokenReqDiv.classList.add('hidden');
        issuesList.classList.add('hidden');
        builderTitle.textContent = level.mode === 'guided' ? 'Step 2: Build the Requirement' : 'Step 2: Build the Requirement';
    }

    // Pattern selection
    renderPatternSelection(level);

    // If pattern pre-selected, show builder immediately
    if (level.patternPreSelected) {
        showBuilder(level);
    } else {
        dropZonesSection.classList.add('hidden');
        componentBank.classList.add('hidden');
        templateDisplay.classList.add('hidden');
    }
}

function updateDifficulty(difficulty) {
    difficultyEl.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    difficultyEl.className = 'value difficulty-badge ' + difficulty;
}

function updateMode(mode) {
    modeEl.textContent = modeNames[mode] || mode;
    modeEl.className = 'value mode-badge ' + mode;
}

function updateStars() {
    starsEl.textContent = getStarDisplay(totalStars, currentLevel);
}

function getStarDisplay(stars, levels) {
    if (levels === 0) return '';
    const maxStars = levels * 3;
    const filled = Math.min(stars, maxStars);
    return filled + '/' + maxStars;
}

function renderPatternSelection(level) {
    patternOptions.innerHTML = '';

    if (level.patternPreSelected) {
        patternSelection.querySelector('h3').textContent = 'Pattern: Pre-selected';
        const badge = document.createElement('span');
        badge.className = 'pattern-pre-selected';
        badge.textContent = patternNames[level.correctPattern];
        patternOptions.appendChild(badge);
        return;
    }

    patternSelection.querySelector('h3').textContent = 'Step 1: Select the EARS Pattern';
    level.patternOptions.forEach(pattern => {
        const btn = document.createElement('button');
        btn.className = 'pattern-btn';
        btn.textContent = patternNames[pattern];
        btn.dataset.pattern = pattern;
        btn.addEventListener('click', () => selectPattern(pattern, level));
        patternOptions.appendChild(btn);
    });
}

function selectPattern(pattern, level) {
    if (submitted) return;

    // Remove previous selection
    document.querySelectorAll('.pattern-btn').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Mark selected
    const selectedBtn = document.querySelector(`.pattern-btn[data-pattern="${pattern}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('selected');
    }

    patternSelected = true;

    // Show builder using the CORRECT pattern's template (not the selected one)
    // But we show drop zones based on the level configuration
    showBuilder(level);
}

function showBuilder(level) {
    // Show template
    templateDisplay.classList.remove('hidden');
    templateDisplay.textContent = 'Template: ' + level.template;

    // Show drop zones
    dropZonesSection.classList.remove('hidden');
    renderDropZones(level);

    // Show component bank
    componentBank.classList.remove('hidden');
    renderComponentBank(level);
}

function renderDropZones(level) {
    requirementBuilder.innerHTML = '';

    // Parse template and create interleaved static text + drop zones
    const template = level.template;
    const parts = template.split(/\{(\w+)\}/g);

    parts.forEach((part, index) => {
        if (index % 2 === 0) {
            // Static text
            if (part.trim()) {
                const span = document.createElement('span');
                span.className = 'static-text';
                span.textContent = part;
                requirementBuilder.appendChild(span);
            }
        } else {
            // Drop zone
            const zone = level.dropZones.find(z => z.id === part);
            if (!zone) return;

            const zoneEl = document.createElement('div');
            zoneEl.className = 'drop-zone empty';
            zoneEl.dataset.zoneId = zone.id;
            zoneEl.dataset.accepts = zone.accepts;

            const label = document.createElement('span');
            label.className = 'zone-label';
            label.textContent = zone.label;
            zoneEl.appendChild(label);

            // Inspector mode: pre-fill broken zones
            if (level.mode === 'inspector' && zone.broken === false && zone.currentValue) {
                zoneEl.classList.remove('empty');
                zoneEl.classList.add('filled', 'fixed');
                const content = document.createElement('span');
                content.className = 'zone-content';
                content.textContent = zone.currentValue;
                zoneEl.appendChild(content);
                // Mark this zone as pre-filled (not droppable)
                zoneEl.dataset.prefilled = 'true';
            } else if (level.mode === 'inspector' && zone.broken === true) {
                zoneEl.classList.remove('empty');
                zoneEl.classList.add('broken');
                const content = document.createElement('span');
                content.className = 'zone-content';
                content.textContent = zone.currentValue;
                zoneEl.appendChild(content);
                // This zone needs fixing
                setupDropZoneListeners(zoneEl);
            } else {
                // Normal empty zone with hint
                if (zone.hint && level.mode === 'guided') {
                    const hint = document.createElement('span');
                    hint.className = 'zone-hint';
                    hint.textContent = zone.hint;
                    zoneEl.appendChild(hint);
                }
                setupDropZoneListeners(zoneEl);
            }

            // Click to remove placed component
            zoneEl.addEventListener('click', () => {
                if (submitted) return;
                if (zoneEl.dataset.prefilled === 'true') return;
                removePlacement(zone.id, zoneEl, level);
            });

            requirementBuilder.appendChild(zoneEl);
        }
    });
}

function setupDropZoneListeners(zoneEl) {
    zoneEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (submitted) return;
        if (zoneEl.dataset.prefilled === 'true') return;

        const accepts = zoneEl.dataset.accepts;
        if (draggedComponent && canDrop(draggedComponent, accepts)) {
            zoneEl.classList.add('drag-over');
            zoneEl.classList.remove('invalid-drag-over');
        } else {
            zoneEl.classList.add('invalid-drag-over');
            zoneEl.classList.remove('drag-over');
        }
    });

    zoneEl.addEventListener('dragleave', () => {
        zoneEl.classList.remove('drag-over', 'invalid-drag-over');
    });

    zoneEl.addEventListener('drop', (e) => {
        e.preventDefault();
        zoneEl.classList.remove('drag-over', 'invalid-drag-over');
        if (submitted) return;
        if (zoneEl.dataset.prefilled === 'true') return;

        if (!draggedComponent) return;

        const accepts = zoneEl.dataset.accepts;
        if (canDrop(draggedComponent, accepts)) {
            placeComponent(zoneEl.dataset.zoneId, draggedComponent.id, zoneEl);
        } else {
            zoneEl.classList.add('shake');
            setTimeout(() => zoneEl.classList.remove('shake'), 500);
        }
    });
}

function canDrop(component, accepts) {
    // Keywords can go in any keyword slot
    if (component.category === 'keyword' && accepts === 'keyword') return true;
    // Triggers and conditions are somewhat interchangeable in drop zones
    if (component.category === 'trigger' && (accepts === 'trigger' || accepts === 'condition')) return true;
    if (component.category === 'condition' && (accepts === 'condition' || accepts === 'trigger')) return true;
    if (component.category === 'system' && accepts === 'system') return true;
    if (component.category === 'action' && accepts === 'action') return true;
    return false;
}

function placeComponent(zoneId, componentId, zoneEl) {
    const level = gameData[currentLevel];
    const component = level.componentBank.find(c => c.id === componentId);
    if (!component) return;

    // If something was already here, free it
    if (placements[zoneId]) {
        const oldChip = document.querySelector(`.component-chip[data-id="${placements[zoneId]}"]`);
        if (oldChip) oldChip.classList.remove('placed');
    }

    // If this component was placed elsewhere, free that zone
    for (const [z, cId] of Object.entries(placements)) {
        if (cId === componentId && z !== zoneId) {
            delete placements[z];
            const otherZone = document.querySelector(`.drop-zone[data-zone-id="${z}"]`);
            if (otherZone && otherZone.dataset.prefilled !== 'true') {
                resetZoneDisplay(otherZone, level);
            }
        }
    }

    placements[zoneId] = componentId;

    // Update zone display
    zoneEl.classList.remove('empty', 'broken');
    zoneEl.classList.add('filled', component.category, 'snap-in');
    setTimeout(() => zoneEl.classList.remove('snap-in'), 300);

    // Clear zone content and re-add label + new content
    const label = zoneEl.querySelector('.zone-label');
    zoneEl.innerHTML = '';
    if (label) zoneEl.appendChild(label);

    const content = document.createElement('span');
    content.className = 'zone-content';
    content.textContent = component.text;
    zoneEl.appendChild(content);

    // Mark chip as placed
    const chip = document.querySelector(`.component-chip[data-id="${componentId}"]`);
    if (chip) chip.classList.add('placed');

    checkAllZonesFilled(level);
}

function removePlacement(zoneId, zoneEl, level) {
    if (!placements[zoneId]) return;

    const componentId = placements[zoneId];
    delete placements[zoneId];

    // Free the chip
    const chip = document.querySelector(`.component-chip[data-id="${componentId}"]`);
    if (chip) chip.classList.remove('placed');

    // Reset zone
    resetZoneDisplay(zoneEl, level);
    submitBtn.disabled = true;
}

function resetZoneDisplay(zoneEl, level) {
    const zoneId = zoneEl.dataset.zoneId;
    const zone = level.dropZones.find(z => z.id === zoneId);

    zoneEl.className = 'drop-zone empty';
    const label = zoneEl.querySelector('.zone-label');
    zoneEl.innerHTML = '';

    if (label) {
        zoneEl.appendChild(label);
    } else {
        const newLabel = document.createElement('span');
        newLabel.className = 'zone-label';
        newLabel.textContent = zone ? zone.label : '';
        zoneEl.appendChild(newLabel);
    }

    if (zone && zone.hint && level.mode === 'guided') {
        const hint = document.createElement('span');
        hint.className = 'zone-hint';
        hint.textContent = zone.hint;
        zoneEl.appendChild(hint);
    }
}

function checkAllZonesFilled(level) {
    const fillableZones = level.dropZones.filter(z => {
        if (level.mode === 'inspector' && z.broken === false) return false;
        return true;
    });

    const allFilled = fillableZones.every(z => placements[z.id]);
    submitBtn.disabled = !allFilled || !patternSelected;
}

function renderComponentBank(level) {
    componentBankGrid.innerHTML = '';

    // Group by category
    const categories = {};
    level.componentBank.forEach(comp => {
        if (!categories[comp.category]) categories[comp.category] = [];
        categories[comp.category].push(comp);
    });

    const categoryOrder = ['keyword', 'trigger', 'condition', 'system', 'action'];
    const categoryLabels = {
        'keyword': 'Keywords',
        'trigger': 'Events / Triggers',
        'condition': 'Conditions / States',
        'system': 'Systems',
        'action': 'Actions'
    };

    categoryOrder.forEach(cat => {
        if (!categories[cat]) return;

        const group = document.createElement('div');
        group.className = 'category-group';

        const label = document.createElement('span');
        label.className = 'category-label';
        label.textContent = categoryLabels[cat];
        group.appendChild(label);

        componentBankGrid.appendChild(group);

        categories[cat].forEach(comp => {
            const chip = document.createElement('div');
            chip.className = 'component-chip ' + comp.category;
            chip.textContent = comp.text;
            chip.dataset.id = comp.id;
            chip.draggable = true;

            chip.addEventListener('dragstart', (e) => {
                if (submitted) { e.preventDefault(); return; }
                draggedComponent = comp;
                chip.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });

            chip.addEventListener('dragend', () => {
                chip.classList.remove('dragging');
                draggedComponent = null;
                document.querySelectorAll('.drag-over, .invalid-drag-over').forEach(el => {
                    el.classList.remove('drag-over', 'invalid-drag-over');
                });
            });

            // Also support click-to-place
            chip.addEventListener('click', () => {
                if (submitted || chip.classList.contains('placed')) return;
                clickPlaceComponent(comp);
            });

            componentBankGrid.appendChild(chip);
        });
    });
}

function clickPlaceComponent(component) {
    const level = gameData[currentLevel];
    // Find first empty zone that accepts this category
    const zones = document.querySelectorAll('.drop-zone');
    for (const zoneEl of zones) {
        if (zoneEl.dataset.prefilled === 'true') continue;
        const zoneId = zoneEl.dataset.zoneId;
        const accepts = zoneEl.dataset.accepts;
        if (!placements[zoneId] && canDrop(component, accepts)) {
            placeComponent(zoneId, component.id, zoneEl);
            return;
        }
    }
}

function submitAnswer() {
    if (submitted) return;
    submitted = true;
    submitBtn.disabled = true;
    hintBtn.disabled = true;

    const level = gameData[currentLevel];
    let levelScore = 0;
    let patternPoints = 0;
    let componentPoints = 0;
    let bonusPoints = 0;
    let trapPenalty = 0;
    let usedTraps = [];
    let correctComponents = 0;
    let totalComponents = 0;

    // Check pattern selection (if applicable)
    if (!level.patternPreSelected) {
        const selectedPattern = document.querySelector('.pattern-btn.selected');
        if (selectedPattern && selectedPattern.dataset.pattern === level.correctPattern) {
            patternPoints = 30;
            selectedPattern.classList.add('correct');
        } else {
            if (selectedPattern) selectedPattern.classList.add('incorrect');
            // Highlight correct
            const correctBtn = document.querySelector(`.pattern-btn[data-pattern="${level.correctPattern}"]`);
            if (correctBtn) correctBtn.classList.add('correct');
        }
    } else {
        patternPoints = 30; // Auto-awarded for pre-selected
    }

    // Check component placements
    const fillableZones = level.dropZones.filter(z => {
        if (level.mode === 'inspector' && z.broken === false) return false;
        return true;
    });

    totalComponents = fillableZones.length;

    fillableZones.forEach(zone => {
        const placedId = placements[zone.id];
        const correctId = level.solution[zone.id];
        const zoneEl = document.querySelector(`.drop-zone[data-zone-id="${zone.id}"]`);

        if (placedId === correctId) {
            correctComponents++;
            componentPoints += 10;
            if (zoneEl) zoneEl.classList.add('correct-zone');
        } else {
            if (zoneEl) zoneEl.classList.add('incorrect-zone');
            // Check if trap was used
            const comp = level.componentBank.find(c => c.id === placedId);
            if (comp && comp.isTrap) {
                trapPenalty += 10;
                usedTraps.push(comp);
            }
        }
    });

    // No traps bonus
    if (usedTraps.length === 0 && correctComponents === totalComponents) {
        bonusPoints = 20;
    }

    // Speed bonus
    const elapsed = (Date.now() - levelStartTime) / 1000;
    if (elapsed < 60 && correctComponents === totalComponents) {
        bonusPoints += 10;
    }

    // Hint penalty
    const hintsUsed = 3 - hintsRemaining;
    const hintPenalty = hintsUsed * 5;

    levelScore = Math.max(0, patternPoints + componentPoints + bonusPoints - trapPenalty - hintPenalty);
    score += levelScore;
    scoreEl.textContent = score;

    // Track pattern score
    if (!patternScores[level.correctPattern]) {
        patternScores[level.correctPattern] = { total: 0, earned: 0 };
    }
    patternScores[level.correctPattern].total += 100;
    patternScores[level.correctPattern].earned += levelScore;

    // Stars
    let stars = 0;
    if (levelScore >= 91) stars = 3;
    else if (levelScore >= 76) stars = 2;
    else if (levelScore >= 60) stars = 1;
    totalStars += stars;
    updateStars();

    // Show feedback
    const isAllCorrect = correctComponents === totalComponents && patternPoints === 30;
    showFeedback(levelScore, patternPoints, componentPoints, bonusPoints, trapPenalty, hintPenalty, usedTraps, stars, isAllCorrect);
    showExplanation(level);
    showConstructedRequirement(level);

    // Show navigation
    navigationDiv.classList.remove('hidden');
    if (currentLevel >= gameData.length - 1) {
        nextBtn.textContent = 'View Results';
    } else {
        nextBtn.textContent = 'Next Level';
    }
}

function showFeedback(levelScore, patternPoints, componentPoints, bonusPoints, trapPenalty, hintPenalty, usedTraps, stars, isAllCorrect) {
    feedbackDiv.classList.remove('hidden', 'correct', 'incorrect', 'partial');

    let starText = '';
    for (let i = 0; i < 3; i++) {
        starText += i < stars ? '\u2B50' : '\u2606';
    }

    let feedbackClass = 'correct';
    let title = 'Excellent!';
    if (!isAllCorrect && levelScore >= 60) {
        feedbackClass = 'partial';
        title = 'Good Effort!';
    } else if (levelScore < 60) {
        feedbackClass = 'incorrect';
        title = 'Keep Practicing!';
    }

    feedbackDiv.classList.add(feedbackClass);

    let html = `<h4>${title} ${starText} (${levelScore} points)</h4>`;
    html += '<div class="score-breakdown">';
    html += `<div class="${patternPoints > 0 ? 'points-positive' : 'points-negative'}">Pattern Selection: +${patternPoints} pts</div>`;
    html += `<div class="${componentPoints > 0 ? 'points-positive' : 'points-negative'}">Correct Components: +${componentPoints} pts</div>`;
    if (bonusPoints > 0) {
        html += `<div class="points-positive">Bonus (no traps/speed): +${bonusPoints} pts</div>`;
    }
    if (trapPenalty > 0) {
        html += `<div class="points-negative">Trap Penalty: -${trapPenalty} pts</div>`;
    }
    if (hintPenalty > 0) {
        html += `<div class="points-negative">Hint Penalty: -${hintPenalty} pts</div>`;
    }
    html += '</div>';

    if (usedTraps.length > 0) {
        html += '<div class="trap-warnings">';
        usedTraps.forEach(trap => {
            html += `<div class="trap-warning-item">\u26A0\uFE0F "${trap.text}" - ${trap.reason}</div>`;
        });
        html += '</div>';
    }

    feedbackDiv.innerHTML = html;
}

function showExplanation(level) {
    explanationDiv.classList.remove('hidden');
    explanationDiv.innerHTML = `<h4>Why ${patternNames[level.correctPattern]}?</h4><p>${level.explanation}</p>`;
}

function showConstructedRequirement(level) {
    constructedReq.classList.remove('hidden');

    // Build the correct requirement
    const template = level.template;
    const parts = template.split(/\{(\w+)\}/g);
    let html = '<strong>Correct Requirement:</strong><br>';

    parts.forEach((part, index) => {
        if (index % 2 === 0) {
            html += part;
        } else {
            const zone = level.dropZones.find(z => z.id === part);
            const correctId = level.solution[part];
            let comp = level.componentBank.find(c => c.id === correctId);

            // For inspector mode, some zones might not be in solution (pre-filled)
            if (!comp && zone && zone.currentValue && !zone.broken) {
                html += `<span class="${zone.accepts}-highlight">${zone.currentValue}</span>`;
            } else if (comp) {
                html += `<span class="${comp.category}-highlight">${comp.text}</span>`;
            }
        }
    });

    constructedReq.innerHTML = html;
}

function useHint() {
    if (hintsRemaining <= 0 || submitted) return;

    const level = gameData[currentLevel];
    hintsRemaining--;
    hintBtn.innerHTML = `Hint <span class="hints-remaining">(${hintsRemaining})</span>`;
    if (hintsRemaining <= 0) hintBtn.disabled = true;

    const hintLevel = 3 - hintsRemaining; // 1, 2, or 3

    if (hintLevel === 1) {
        // Hint 1: General guidance about the pattern
        showTemporaryMessage(getPatternHint(level));
    } else if (hintLevel === 2) {
        // Hint 2: Highlight the correct pattern if not selected
        if (!level.patternPreSelected) {
            const correctBtn = document.querySelector(`.pattern-btn[data-pattern="${level.correctPattern}"]`);
            if (correctBtn) {
                correctBtn.style.boxShadow = '0 0 12px rgba(76, 175, 80, 0.5)';
                correctBtn.style.borderColor = '#4caf50';
                setTimeout(() => {
                    correctBtn.style.boxShadow = '';
                    if (!correctBtn.classList.contains('selected')) {
                        correctBtn.style.borderColor = '';
                    }
                }, 3000);
            }
        } else {
            // Show one correct component
            revealOneCorrectComponent(level);
        }
    } else if (hintLevel === 3) {
        // Hint 3: Show one correct component placement
        revealOneCorrectComponent(level);
    }
}

function getPatternHint(level) {
    const hints = {
        'ubiquitous': 'Think about whether this requirement applies all the time, without any specific trigger or condition.',
        'event-driven': 'Look for a specific event or trigger that causes the system to respond. Is there a clear moment something happens?',
        'state-driven': 'Consider whether this is about an ongoing state or condition. Does the behavior continue as long as the state persists?',
        'unwanted-behavior': 'Is this about handling an error, fault, or undesirable condition? Think about exception handling.',
        'optional-feature': 'Does this requirement only apply when a certain feature or option is included or enabled?'
    };
    return hints[level.correctPattern] || 'Think carefully about the scenario.';
}

function revealOneCorrectComponent(level) {
    const solution = level.solution;
    // Find a zone that doesn't have the correct placement
    for (const [zoneId, correctCompId] of Object.entries(solution)) {
        if (placements[zoneId] !== correctCompId) {
            // Highlight the correct chip
            const chip = document.querySelector(`.component-chip[data-id="${correctCompId}"]`);
            if (chip) {
                chip.style.boxShadow = '0 0 12px rgba(76, 175, 80, 0.6)';
                chip.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    chip.style.boxShadow = '';
                    chip.style.transform = '';
                }, 3000);
            }
            return;
        }
    }
}

function showTemporaryMessage(msg) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#333;color:white;padding:16px 24px;border-radius:8px;z-index:1000;font-size:0.95rem;max-width:500px;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
    overlay.textContent = msg;
    document.body.appendChild(overlay);
    setTimeout(() => {
        overlay.style.transition = 'opacity 0.5s';
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 500);
    }, 3000);
}

function resetLevel() {
    if (submitted) return;
    const level = gameData[currentLevel];
    placements = {};

    // Reset all chips
    document.querySelectorAll('.component-chip').forEach(chip => {
        chip.classList.remove('placed');
    });

    // Reset all zones
    renderDropZones(level);
    submitBtn.disabled = true;
}

function nextLevel() {
    currentLevel++;
    if (currentLevel >= gameData.length) {
        showGameComplete();
    } else {
        loadLevel();
    }
}

function showGameComplete() {
    gameContainer.classList.add('hidden');
    gameComplete.classList.remove('hidden');

    finalScoreEl.textContent = score;

    const maxScore = gameData.length * 100;
    const percentage = Math.round((score / maxScore) * 100);
    let finalStarCount = 0;
    if (percentage >= 90) finalStarCount = 3;
    else if (percentage >= 75) finalStarCount = 2;
    else if (percentage >= 50) finalStarCount = 1;

    let starHTML = '';
    for (let i = 0; i < 3; i++) {
        starHTML += i < finalStarCount ? '\u2B50' : '\u2606';
    }
    finalStarsEl.textContent = starHTML;

    // Pattern mastery breakdown
    let masteryHTML = '<h3>Patterns Mastered</h3>';
    for (const [pattern, scores] of Object.entries(patternScores)) {
        const pct = scores.total > 0 ? Math.round((scores.earned / scores.total) * 100) : 0;
        masteryHTML += `<div class="pattern-mastery-item">
            <span class="pattern-name">${patternNames[pattern]}</span>
            <span class="pattern-score">${pct}%</span>
        </div>`;
    }
    patternsMastered.innerHTML = masteryHTML;

    progressFill.style.width = '100%';
}

function restartGame() {
    currentLevel = 0;
    score = 0;
    totalStars = 0;
    patternScores = {};
    gameComplete.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    loadLevel();
}

// Initialize
initGame();
