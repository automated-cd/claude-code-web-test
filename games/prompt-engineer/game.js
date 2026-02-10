// Game state
let gameData = [];
let currentLevel = 0;
let score = 0;
let selectedCards = [];
let hintUsed = false;
let techniquesLearned = new Set();

// DOM elements
const currentLevelEl = document.getElementById('current-level');
const totalLevelsEl = document.getElementById('total-levels');
const scoreEl = document.getElementById('score');
const basePromptEl = document.getElementById('base-prompt');
const targetTextEl = document.getElementById('target-text');
const cardsContainer = document.getElementById('cards-container');
const selectedCardsContainer = document.getElementById('selected-cards');
const selectedCountEl = document.getElementById('selected-count');
const submitBtn = document.getElementById('submit-btn');
const hintBtn = document.getElementById('hint-btn');
const nextBtn = document.getElementById('next-btn');
const feedbackEl = document.getElementById('feedback');
const explanationEl = document.getElementById('explanation');
const navigationEl = document.getElementById('navigation');
const gameContainer = document.getElementById('game-container');
const gameCompleteEl = document.getElementById('game-complete');
const finalScoreEl = document.getElementById('final-score');
const techniquesListEl = document.getElementById('techniques-list');
const restartBtn = document.getElementById('restart-btn');

// Technique colors mapping
const techniqueColors = {
    'Role': 'role',
    'Constraint': 'constraint',
    'Format': 'format',
    'Style': 'style',
    'Audience': 'audience',
    'Exemplar': 'exemplar',
    'Step-by-Step': 'step-by-step',
    'Scope': 'scope',
    'Analogy': 'analogy'
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
        alert('Failed to load game data. Please refresh the page.');
    }
}

// Load current level
function loadLevel() {
    if (currentLevel >= gameData.length) {
        showGameComplete();
        return;
    }

    const level = gameData[currentLevel];
    selectedCards = [];
    hintUsed = false;

    // Update UI
    currentLevelEl.textContent = currentLevel + 1;
    basePromptEl.textContent = level.basePrompt;
    targetTextEl.innerHTML = level.targetText;
    feedbackEl.classList.add('hidden');
    explanationEl.classList.add('hidden');
    navigationEl.classList.add('hidden');
    submitBtn.disabled = false;
    hintBtn.disabled = false;

    // Shuffle and render cards
    renderCards(shuffleArray([...level.cards]));
    updateSelectedCards();
}

// Shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Render cards
function renderCards(cards) {
    cardsContainer.innerHTML = '';
    cards.forEach((card, index) => {
        const cardEl = createCardElement(card, index);
        cardsContainer.appendChild(cardEl);
    });
}

// Create card element
function createCardElement(card, index) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.dataset.index = index;

    const techniqueClass = techniqueColors[card.technique] || 'default';

    cardEl.innerHTML = `
        <div class="card-text">${card.text}</div>
        <span class="card-technique badge ${techniqueClass}">${card.technique}</span>
    `;

    cardEl.addEventListener('click', () => toggleCard(index, cardEl));

    return cardEl;
}

// Toggle card selection
function toggleCard(index, cardEl) {
    if (submitBtn.disabled) return; // Don't allow selection after submission

    const cardIndex = selectedCards.indexOf(index);

    if (cardIndex > -1) {
        selectedCards.splice(cardIndex, 1);
        cardEl.classList.remove('selected');
    } else {
        selectedCards.push(index);
        cardEl.classList.add('selected');
    }

    updateSelectedCards();
}

// Update selected cards display
function updateSelectedCards() {
    selectedCountEl.textContent = selectedCards.length;
    selectedCardsContainer.innerHTML = '';

    const level = gameData[currentLevel];
    const shuffledCards = Array.from(cardsContainer.children);

    selectedCards.forEach(index => {
        const card = shuffledCards[index];
        const cardData = getCardDataFromElement(card);

        const selectedCardEl = document.createElement('div');
        selectedCardEl.className = 'selected-card';
        selectedCardEl.innerHTML = `
            <span>${cardData.text}</span>
            <button class="selected-card-remove" onclick="removeSelectedCard(${index})">×</button>
        `;
        selectedCardsContainer.appendChild(selectedCardEl);
    });
}

// Get card data from element
function getCardDataFromElement(cardEl) {
    return {
        text: cardEl.querySelector('.card-text').textContent,
        technique: cardEl.querySelector('.card-technique').textContent
    };
}

// Remove selected card
function removeSelectedCard(index) {
    const cardIndex = selectedCards.indexOf(index);
    if (cardIndex > -1) {
        selectedCards.splice(cardIndex, 1);
        const cardEl = cardsContainer.children[index];
        cardEl.classList.remove('selected');
        updateSelectedCards();
    }
}

// Show hint
function showHint() {
    if (hintUsed) return;

    hintUsed = true;
    const level = gameData[currentLevel];

    // Highlight one correct card
    const correctIndices = getCorrectIndices();
    if (correctIndices.length > 0) {
        const randomCorrect = correctIndices[Math.floor(Math.random() * correctIndices.length)];
        const cardEl = cardsContainer.children[randomCorrect];
        cardEl.style.boxShadow = '0 0 20px rgba(76, 175, 80, 0.6)';

        setTimeout(() => {
            cardEl.style.boxShadow = '';
        }, 3000);
    }

    score = Math.max(0, score - 10);
    scoreEl.textContent = score;

    feedbackEl.className = 'feedback';
    feedbackEl.textContent = '💡 Hint used! One correct card is highlighted. (-10 points)';
    feedbackEl.classList.remove('hidden');

    setTimeout(() => {
        feedbackEl.classList.add('hidden');
    }, 3000);
}

// Get correct card indices in current shuffled order
function getCorrectIndices() {
    const level = gameData[currentLevel];
    const currentCards = Array.from(cardsContainer.children);
    const correctIndices = [];

    currentCards.forEach((cardEl, index) => {
        const cardText = cardEl.querySelector('.card-text').textContent;
        const originalIndex = level.cards.findIndex(c => c.text === cardText);

        if (level.solution.includes(originalIndex)) {
            correctIndices.push(index);
        }
    });

    return correctIndices;
}

// Submit answer
function submitAnswer() {
    if (selectedCards.length === 0) {
        alert('Please select at least one card!');
        return;
    }

    const level = gameData[currentLevel];
    const currentCards = Array.from(cardsContainer.children);

    // Map selected indices to original card indices
    const selectedOriginalIndices = selectedCards.map(index => {
        const cardText = currentCards[index].querySelector('.card-text').textContent;
        return level.cards.findIndex(c => c.text === cardText);
    });

    // Check if answer is correct
    const correctSolution = [...level.solution].sort((a, b) => a - b);
    const userSolution = [...selectedOriginalIndices].sort((a, b) => a - b);

    const isCorrect = JSON.stringify(correctSolution) === JSON.stringify(userSolution);

    // Disable interaction
    submitBtn.disabled = true;
    hintBtn.disabled = true;

    // Highlight cards
    currentCards.forEach((cardEl, index) => {
        const cardText = cardEl.querySelector('.card-text').textContent;
        const originalIndex = level.cards.findIndex(c => c.text === cardText);
        const cardData = level.cards[originalIndex];

        if (selectedCards.includes(index)) {
            if (correctSolution.includes(originalIndex)) {
                cardEl.classList.add('correct');
                techniquesLearned.add(cardData.technique);
            } else {
                cardEl.classList.add(cardData.isTrap ? 'trap' : 'incorrect');
            }
        } else if (correctSolution.includes(originalIndex)) {
            cardEl.style.opacity = '0.5';
        }
    });

    // Show feedback
    if (isCorrect) {
        const points = hintUsed ? 50 : 100;
        score += points;
        scoreEl.textContent = score;

        feedbackEl.className = 'feedback success';
        feedbackEl.textContent = `✅ Excellent! You've mastered this prompt! (+${points} points)`;

        // Collect techniques from correct cards
        correctSolution.forEach(idx => {
            techniquesLearned.add(level.cards[idx].technique);
        });
    } else {
        feedbackEl.className = 'feedback error';
        feedbackEl.textContent = '❌ Not quite right. Review the correct cards (highlighted in green) and the explanation below.';
    }

    feedbackEl.classList.remove('hidden');

    // Show explanation
    explanationEl.innerHTML = `
        <h3>Explanation</h3>
        <p>${level.explanation}</p>
    `;
    explanationEl.classList.remove('hidden');

    // Show next button
    navigationEl.classList.remove('hidden');
}

// Go to next level
function nextLevel() {
    currentLevel++;
    loadLevel();
}

// Show game complete screen
function showGameComplete() {
    gameContainer.classList.add('hidden');
    gameCompleteEl.classList.remove('hidden');
    finalScoreEl.textContent = score;

    // Show learned techniques
    techniquesListEl.innerHTML = '';
    Array.from(techniquesLearned).sort().forEach(technique => {
        const li = document.createElement('li');
        const techniqueClass = techniqueColors[technique] || 'default';
        li.innerHTML = `<span class="badge ${techniqueClass}">${technique}</span>`;
        techniquesListEl.appendChild(li);
    });
}

// Restart game
function restartGame() {
    currentLevel = 0;
    score = 0;
    techniquesLearned.clear();
    scoreEl.textContent = score;
    gameCompleteEl.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    loadLevel();
}

// Event listeners
submitBtn.addEventListener('click', submitAnswer);
hintBtn.addEventListener('click', showHint);
nextBtn.addEventListener('click', nextLevel);
restartBtn.addEventListener('click', restartGame);

// Start game
initGame();
