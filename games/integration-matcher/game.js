// Game State
let gameData = [];
let currentLevel = 0;
let score = 0;
let selectedTool = null;

// DOM Elements
const gameInfo = document.getElementById('game-info');
const gameContainer = document.getElementById('game-container');
const feedback = document.getElementById('feedback');
const explanation = document.getElementById('explanation');
const nextButton = document.getElementById('next-button');
const completeScreen = document.getElementById('complete-screen');
const finalScore = document.getElementById('final-score');
const rulesButton = document.getElementById('rules-button');
const closeModalButton = document.getElementById('close-modal');
const rulesModal = document.getElementById('rules-modal');

// Initialize Game
async function initGame() {
    try {
        const response = await fetch('data.json');
        gameData = await response.json();
        loadLevel();
    } catch (error) {
        console.error('Error loading game data:', error);
        gameContainer.innerHTML = '<p>Error loading game. Please refresh the page.</p>';
    }
}

// Load Current Level
function loadLevel() {
    if (currentLevel >= gameData.length) {
        showCompleteScreen();
        return;
    }

    const level = gameData[currentLevel];
    selectedTool = null;

    // Update game info
    gameInfo.innerHTML = `
        <div class="score-panel">
            <div class="stat">
                <span class="stat-label">Level</span>
                <span class="stat-value">${currentLevel + 1} / ${gameData.length}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Score</span>
                <span class="stat-value">${score}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Difficulty</span>
                <span class="stat-value difficulty-badge ${level.difficulty.toLowerCase()}">${level.difficulty}</span>
            </div>
        </div>
    `;

    // Clear and hide feedback
    feedback.style.display = 'none';
    explanation.style.display = 'none';
    nextButton.style.display = 'none';

    // Render level
    gameContainer.innerHTML = `
        <div class="level-header">
            <h2>Match the Goal with the Right Tool</h2>
            <p class="scenario-description">${level.description}</p>
        </div>

        <div class="matching-area">
            <div class="goal-section">
                <h3>Goal</h3>
                <div class="goal-card">
                    <div class="goal-icon">🎯</div>
                    <div class="goal-text">${level.goal}</div>
                </div>
            </div>

            <div class="arrow-section">
                <div class="arrow">→</div>
            </div>

            <div class="tools-section">
                <h3>Select a Tool / Service</h3>
                <div class="tools-grid" id="tools-grid"></div>
            </div>
        </div>

        <div class="action-area">
            <button id="submit-button" class="btn btn-primary" disabled>Submit Answer</button>
            <button id="hint-button" class="btn btn-secondary">Show Hint</button>
        </div>

        <div id="hint-display" class="hint-display" style="display: none;">
            <strong>💡 Hint:</strong> ${getHint(level)}
        </div>
    `;

    // Render tools
    renderTools(level);

    // Add event listeners
    document.getElementById('submit-button').addEventListener('click', checkAnswer);
    document.getElementById('hint-button').addEventListener('click', showHint);
}

// Render Tools Grid
function renderTools(level) {
    const toolsGrid = document.getElementById('tools-grid');
    const shuffledTools = shuffleArray([...level.availableTools]);

    shuffledTools.forEach(tool => {
        const toolCard = document.createElement('div');
        toolCard.className = 'tool-card';
        toolCard.dataset.tool = tool;

        const description = level.toolDescriptions[tool] || '';

        toolCard.innerHTML = `
            <div class="tool-name">${tool}</div>
            <div class="tool-description">${description}</div>
        `;

        toolCard.addEventListener('click', () => selectTool(toolCard, tool));
        toolsGrid.appendChild(toolCard);
    });
}

// Select Tool
function selectTool(card, tool) {
    // Remove previous selection
    document.querySelectorAll('.tool-card').forEach(c => c.classList.remove('selected'));

    // Select new tool
    card.classList.add('selected');
    selectedTool = tool;

    // Enable submit button
    document.getElementById('submit-button').disabled = false;
}

// Check Answer
function checkAnswer() {
    const level = gameData[currentLevel];
    const submitButton = document.getElementById('submit-button');
    submitButton.disabled = true;

    // Disable tool selection
    document.querySelectorAll('.tool-card').forEach(card => {
        card.style.pointerEvents = 'none';
    });

    if (selectedTool === level.correctTool) {
        // Correct answer
        score += 10;
        feedback.textContent = '✓ Correct! Well done!';
        feedback.className = 'feedback success';
        feedback.style.display = 'block';

        // Highlight correct answer
        document.querySelectorAll('.tool-card').forEach(card => {
            if (card.dataset.tool === level.correctTool) {
                card.classList.add('correct');
            }
        });
    } else {
        // Wrong answer
        score = Math.max(0, score - 3);
        feedback.textContent = '✗ Not quite right. Try reviewing the explanation.';
        feedback.className = 'feedback error';
        feedback.style.display = 'block';

        // Highlight correct and wrong answers
        document.querySelectorAll('.tool-card').forEach(card => {
            if (card.dataset.tool === level.correctTool) {
                card.classList.add('correct');
            } else if (card.dataset.tool === selectedTool) {
                card.classList.add('wrong');
            }
        });
    }

    // Show explanation
    explanation.innerHTML = level.explanation;
    explanation.style.display = 'block';

    // Update score display
    document.querySelector('.stat-value:nth-child(2)').textContent = score;

    // Show next button
    nextButton.style.display = 'block';
}

// Show Hint
function showHint() {
    const hintDisplay = document.getElementById('hint-display');
    const hintButton = document.getElementById('hint-button');

    hintDisplay.style.display = 'block';
    hintButton.disabled = true;

    // Small penalty for using hint
    score = Math.max(0, score - 2);
    document.querySelector('.stat:nth-of-type(2) .stat-value').textContent = score;
}

// Get Hint
function getHint(level) {
    const hints = {
        'Accept payments': 'Look for a service that specializes in processing credit card payments and handling financial transactions.',
        'Send emails': 'You need a service designed specifically for email delivery with good deliverability rates.',
        'Store files': 'Consider cloud storage services that offer file sharing and collaboration features.',
        'Authenticate users': 'Look for a comprehensive authentication platform that handles multiple login methods and security.',
        'Schedule meetings': 'Find a tool designed specifically for booking appointments and managing availability.',
        'Collect data': 'Consider tools that combine spreadsheet functionality with database features and form capabilities.'
    };
    return hints[level.goal] || 'Think about what the primary purpose of each tool is.';
}

// Next Level
function nextLevel() {
    currentLevel++;
    loadLevel();
}

// Show Complete Screen
function showCompleteScreen() {
    gameContainer.style.display = 'none';
    gameInfo.style.display = 'none';
    completeScreen.style.display = 'block';

    const maxScore = gameData.length * 10;
    const percentage = Math.round((score / maxScore) * 100);

    let message = '';
    if (percentage >= 90) {
        message = '🌟 Outstanding! You\'re an integration expert!';
    } else if (percentage >= 70) {
        message = '🎉 Great job! You know your tools well!';
    } else if (percentage >= 50) {
        message = '👍 Good effort! Keep learning about integrations!';
    } else {
        message = '💪 Nice try! Review the explanations and try again!';
    }

    finalScore.innerHTML = `
        <div class="final-score-content">
            <h2>${message}</h2>
            <div class="score-display">
                <div class="score-large">${score}</div>
                <div class="score-details">out of ${maxScore} points (${percentage}%)</div>
            </div>
            <p>You've learned about essential tools and integrations for modern applications!</p>
        </div>
    `;
}

// Utility: Shuffle Array
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Modal Controls
rulesButton.addEventListener('click', () => {
    rulesModal.style.display = 'flex';
});

closeModalButton.addEventListener('click', () => {
    rulesModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === rulesModal) {
        rulesModal.style.display = 'none';
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && rulesModal.style.display === 'flex') {
        rulesModal.style.display = 'none';
    }
});

// Next button event
nextButton.addEventListener('click', nextLevel);

// Start the game
initGame();
