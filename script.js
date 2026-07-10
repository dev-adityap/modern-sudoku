

const GameState = {
    solution: [],       
    puzzle: [],         
    userGrid: [],       
    notesGrid: [],      
    
    difficulty: 'medium',
    selectedCell: null,
    notesMode: false,
    
    mistakes: 0,
    maxMistakes: 3,
    hintsUsed: 0,
    
    timer: 0,
    timerInterval: null,
    isPaused: false,
    
    history: [],        
    redoStack: [],     
    
    stats: {
        gamesWon: 0,
        bestTimes: {
            easy: null, medium: null, hard: null, expert: null, master: null
        }
    }
};

const DIFFICULTY_HOLES = {
    easy: 30,
    medium: 40,
    hard: 50,
    expert: 58,
    master: 64
};



const DOM = {
    board: document.getElementById('sudoku-board'),
    themeToggle: document.getElementById('theme-toggle'),
    themeIcon: document.getElementById('theme-icon'),
    difficultySelect: document.getElementById('difficulty-select'),
    
    timerDisplay: document.getElementById('timer'),
    btnPause: document.getElementById('btn-pause'),
    pauseIcon: document.getElementById('pause-icon'),
    pauseOverlay: document.getElementById('pause-overlay'),
    btnResume: document.getElementById('btn-resume'),
    
    mistakeCounter: document.getElementById('mistake-counter'),
    hintCounter: document.getElementById('hint-counter'),
    statGamesWon: document.getElementById('stat-games-won'),
    statBestTime: document.getElementById('stat-best-time'),
    
    btnUndo: document.getElementById('btn-undo'),
    btnRedo: document.getElementById('btn-redo'),
    btnErase: document.getElementById('btn-erase'),
    btnNotes: document.getElementById('btn-notes'),
    notesBadge: document.getElementById('notes-badge'),
    btnHint: document.getElementById('btn-hint'),
    
    numpad: document.getElementById('numpad'),
    
    btnNewGame: document.getElementById('btn-new-game'),
    btnReset: document.getElementById('btn-reset'),
    btnSolve: document.getElementById('btn-solve'),
    
    winModal: document.getElementById('win-modal'),
    btnModalNewGame: document.getElementById('btn-modal-new-game'),
    modalDifficulty: document.getElementById('modal-difficulty'),
    modalTime: document.getElementById('modal-time'),
    modalMistakes: document.getElementById('modal-mistakes'),
    modalHints: document.getElementById('modal-hints'),

    
    startScreen: document.getElementById('start-screen'),
    btnStartGame: document.getElementById('btn-start-game'),
    btnResumeGame: document.getElementById('btn-resume-game'),
    startDifficultySelect: document.getElementById('start-difficulty-select')
}


document.addEventListener('DOMContentLoaded', init);

function init() {
    loadTheme();
    loadStats();
    setupEventListeners();
    
    
    if (hasSavedGame()) {
        DOM.btnResumeGame.classList.remove('hidden');
    }
}


function setupEventListeners() {
    
    DOM.btnStartGame.addEventListener('click', () => {
        DOM.startScreen.classList.add('hidden');
        GameState.difficulty = DOM.startDifficultySelect.value;
        DOM.difficultySelect.value = GameState.difficulty;
        startNewGame();
    });

    DOM.btnResumeGame.addEventListener('click', () => {
        DOM.startScreen.classList.add('hidden');
        loadGameState();
        renderBoard();
        updateUI();
        startTimer();
    });

    
    DOM.themeToggle.addEventListener('click', toggleTheme);
    
    
    DOM.difficultySelect.addEventListener('change', (e) => {
        if(confirm("Start a new game with this difficulty? Current progress will be lost.")) {
            GameState.difficulty = e.target.value;
            startNewGame();
        } else {
            
            DOM.difficultySelect.value = GameState.difficulty; 
        }
    });

    
    DOM.board.addEventListener('click', (e) => {
        if (GameState.isPaused) return;
        const cell = e.target.closest('.cell');
        if (cell) handleCellClick(parseInt(cell.dataset.index));
    });

    
    document.addEventListener('keydown', handleKeyboardInput);

    
    DOM.numpad.addEventListener('click', (e) => {
        if (GameState.isPaused) return;
        const btn = e.target.closest('.num-btn');
        if (btn) handleNumberInput(parseInt(btn.dataset.value));
    });

  
    DOM.btnErase.addEventListener('click', eraseCell);
    DOM.btnNotes.addEventListener('click', toggleNotesMode);
    DOM.btnUndo.addEventListener('click', undo);
    DOM.btnRedo.addEventListener('click', redo);
    DOM.btnHint.addEventListener('click', giveHint);
    
    
    DOM.btnPause.addEventListener('click', togglePause);
    DOM.btnResume.addEventListener('click', togglePause);
    
    DOM.btnNewGame.addEventListener('click', () => {
        if(confirm("Are you sure you want to start a new game?")) {
            startNewGame();
        }
    });
    
    DOM.btnReset.addEventListener('click', resetPuzzle);
    DOM.btnSolve.addEventListener('click', revealSolution);
    
    DOM.btnModalNewGame.addEventListener('click', () => {
        DOM.winModal.classList.add('hidden');
      
        DOM.startScreen.classList.remove('hidden');
        DOM.btnResumeGame.classList.add('hidden'); 
    });
}



function startNewGame() {
    GameState.solution = generateSolvedGrid();
    GameState.puzzle = createPuzzle(GameState.solution, DIFFICULTY_HOLES[GameState.difficulty]);
    GameState.userGrid = [...GameState.puzzle];
    GameState.notesGrid = Array.from({ length: 81 }, () => []);
    
    GameState.selectedCell = null;
    GameState.mistakes = 0;
    GameState.hintsUsed = 0;
    GameState.timer = 0;
    GameState.history = [];
    GameState.redoStack = [];
    
    resetTimer();
    startTimer();
    renderBoard();
    updateUI();
    saveGameState();
}

function getRow(index) { return Math.floor(index / 9); }
function getCol(index) { return index % 9; }
function getBox(index) { return Math.floor(getRow(index) / 3) * 3 + Math.floor(getCol(index) / 3); }


function generateSolvedGrid() {
    const grid = new Array(81).fill(0);
    fillGrid(grid);
    return grid;
}


function fillGrid(grid) {
    for (let i = 0; i < 81; i++) {
        if (grid[i] === 0) {
            const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            for (let num of nums) {
                if (isValidPlace(grid, i, num)) {
                    grid[i] = num;
                    if (fillGrid(grid)) return true;
                    grid[i] = 0;
                }
            }
            return false;
        }
    }
    return true;
}

function isValidPlace(grid, index, num) {
    const row = getRow(index);
    const col = getCol(index);
    const box = getBox(index);

    for (let i = 0; i < 81; i++) {
        if (grid[i] === num && (getRow(i) === row || getCol(i) === col || getBox(i) === box)) {
            return false;
        }
    }
    return true;
}

function createPuzzle(solution, holes) {
    const puzzle = [...solution];
    const indices = shuffleArray(Array.from({length: 81}, (_, i) => i));
    
    for (let i = 0; i < holes; i++) {
        puzzle[indices[i]] = 0;
    }
    return puzzle;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}



function handleCellClick(index) {
    GameState.selectedCell = index;
    renderBoard(); 
}

function handleKeyboardInput(e) {
    if (GameState.isPaused || !DOM.pauseOverlay.classList.contains('hidden') || !DOM.startScreen.classList.contains('hidden')) return;
    
    
    if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(parseInt(e.key));
    }
    
    if (e.key === 'Backspace' || e.key === 'Delete') {
        eraseCell();
    }
    
    if (GameState.selectedCell !== null) {
        let row = getRow(GameState.selectedCell);
        let col = getCol(GameState.selectedCell);
        
        if (e.key === 'ArrowUp') row = Math.max(0, row - 1);
        if (e.key === 'ArrowDown') row = Math.min(8, row + 1);
        if (e.key === 'ArrowLeft') col = Math.max(0, col - 1);
        if (e.key === 'ArrowRight') col = Math.min(8, col + 1);
        
        const newIndex = row * 9 + col;
        if (newIndex !== GameState.selectedCell) {
            handleCellClick(newIndex);
        }
    }
}

function handleNumberInput(num) {
    if (GameState.selectedCell === null) return;
    
    const idx = GameState.selectedCell;
    
    if (GameState.puzzle[idx] !== 0) return;

    saveHistoryState();

    if (GameState.notesMode) {
        
        const notes = GameState.notesGrid[idx];
        if (notes.includes(num)) {
            GameState.notesGrid[idx] = notes.filter(n => n !== num);
        } else {
            notes.push(num);
            GameState.notesGrid[idx] = notes.sort((a,b) => a-b);
        }
    } else {
        
        if (GameState.userGrid[idx] === num) return; 
        
        GameState.userGrid[idx] = num;
        GameState.notesGrid[idx] = []; 
        
       
        updateNotesOnPlacement(idx, num);

       
        if (num !== GameState.solution[idx]) {
            GameState.mistakes++;
            if (GameState.mistakes >= GameState.maxMistakes) {
                gameOverLoss();
                return;
            }
        }
    }

    renderBoard();
    updateUI();
    saveGameState();
    checkWinCondition();
}

function updateNotesOnPlacement(index, num) {
    const row = getRow(index);
    const col = getCol(index);
    const box = getBox(index);

    for (let i = 0; i < 81; i++) {
        if (i !== index && GameState.notesGrid[i].length > 0) {
            if (getRow(i) === row || getCol(i) === col || getBox(i) === box) {
                GameState.notesGrid[i] = GameState.notesGrid[i].filter(n => n !== num);
            }
        }
    }
}

function eraseCell() {
    if (GameState.selectedCell === null) return;
    const idx = GameState.selectedCell;
    
  
    if (GameState.puzzle[idx] === 0 && (GameState.userGrid[idx] !== 0 || GameState.notesGrid[idx].length > 0)) {
        saveHistoryState();
        GameState.userGrid[idx] = 0;
        GameState.notesGrid[idx] = [];
        renderBoard();
        updateUI();
        saveGameState();
    }
}

function toggleNotesMode() {
    GameState.notesMode = !GameState.notesMode;
    
    if (GameState.notesMode) {
        DOM.notesBadge.textContent = 'ON';
        DOM.notesBadge.className = 'badge on';
        DOM.btnNotes.style.color = 'var(--primary-color)';
    } else {
        DOM.notesBadge.textContent = 'OFF';
        DOM.notesBadge.className = 'badge off';
        DOM.btnNotes.style.color = 'var(--text-secondary)';
    }
}



function saveHistoryState() {
    GameState.history.push({
        userGrid: [...GameState.userGrid],
        notesGrid: GameState.notesGrid.map(notes => [...notes])
    });
    GameState.redoStack = []; 
    updateUI();
}

function undo() {
    if (GameState.history.length === 0) return;
    
    GameState.redoStack.push({
        userGrid: [...GameState.userGrid],
        notesGrid: GameState.notesGrid.map(notes => [...notes])
    });

    const previousState = GameState.history.pop();
    GameState.userGrid = [...previousState.userGrid];
    GameState.notesGrid = previousState.notesGrid.map(notes => [...notes]);
    
    renderBoard();
    updateUI();
    saveGameState();
}

function redo() {
    if (GameState.redoStack.length === 0) return;
    
    GameState.history.push({
        userGrid: [...GameState.userGrid],
        notesGrid: GameState.notesGrid.map(notes => [...notes])
    });

    const nextState = GameState.redoStack.pop();
    GameState.userGrid = [...nextState.userGrid];
    GameState.notesGrid = nextState.notesGrid.map(notes => [...notes]);
    
    renderBoard();
    updateUI();
    saveGameState();
}



function renderBoard() {
    DOM.board.innerHTML = '';
    
    let selRow = GameState.selectedCell !== null ? getRow(GameState.selectedCell) : -1;
    let selCol = GameState.selectedCell !== null ? getCol(GameState.selectedCell) : -1;
    let selBox = GameState.selectedCell !== null ? getBox(GameState.selectedCell) : -1;
    let selValue = GameState.selectedCell !== null ? GameState.userGrid[GameState.selectedCell] : 0;

    for (let i = 0; i < 81; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;

        const val = GameState.userGrid[i];
        const isFixed = GameState.puzzle[i] !== 0;

        
        if (isFixed) {
            cell.classList.add('fixed');
            cell.textContent = val;
        } else if (val !== 0) {
            cell.classList.add('player-input');
            cell.textContent = val;
            if (val !== GameState.solution[i]) {
                cell.classList.add('error');
            }
        } else {
            if (GameState.notesGrid[i].length > 0) {
                cell.appendChild(createNotesGrid(GameState.notesGrid[i]));
            }
        }

        
        if (GameState.selectedCell !== null) {
            if (i === GameState.selectedCell) {
                cell.classList.add('selected');
            } else if (getRow(i) === selRow || getCol(i) === selCol || getBox(i) === selBox) {
                cell.classList.add('highlighted');
            }
            
            
            if (val !== 0 && val === selValue && !cell.classList.contains('error')) {
                cell.classList.add('same-number');
            }
        }

        DOM.board.appendChild(cell);
    }
}

function createNotesGrid(notesArray) {
    const grid = document.createElement('div');
    grid.className = 'notes-grid';
    for (let i = 1; i <= 9; i++) {
        const span = document.createElement('span');
        span.className = 'note-num';
        if (notesArray.includes(i)) {
            span.textContent = i;
        }
        grid.appendChild(span);
    }
    return grid;
}



function giveHint() {
    if (GameState.selectedCell === null) return;
    const idx = GameState.selectedCell;
    
    if (GameState.puzzle[idx] === 0 && GameState.userGrid[idx] !== GameState.solution[idx]) {
        saveHistoryState();
        GameState.userGrid[idx] = GameState.solution[idx];
        GameState.notesGrid[idx] = [];
        GameState.hintsUsed++;
        updateNotesOnPlacement(idx, GameState.solution[idx]);
        
        renderBoard();
        updateUI();
        saveGameState();
        checkWinCondition();
    }
}

function resetPuzzle() {
    if(confirm("Are you sure you want to clear all your progress?")) {
        saveHistoryState(); 
        GameState.userGrid = [...GameState.puzzle];
        GameState.notesGrid = Array.from({ length: 81 }, () => []);
        GameState.selectedCell = null;
        renderBoard();
        saveGameState();
    }
}

function revealSolution() {
    if(confirm("Give up and reveal the solution?")) {
        GameState.userGrid = [...GameState.solution];
        GameState.notesGrid = Array.from({ length: 81 }, () => []);
        renderBoard();
        stopTimer();
        localStorage.removeItem('sudokuGameState');
    }
}

function checkWinCondition() {
    let isComplete = true;
    for (let i = 0; i < 81; i++) {
        if (GameState.userGrid[i] === 0 || GameState.userGrid[i] !== GameState.solution[i]) {
            isComplete = false;
            break;
        }
    }

    if (isComplete) {
        handleWin();
    }
}

function handleWin() {
    stopTimer();
    GameState.stats.gamesWon++;
    
    const diff = GameState.difficulty;
    if (!GameState.stats.bestTimes[diff] || GameState.timer < GameState.stats.bestTimes[diff]) {
        GameState.stats.bestTimes[diff] = GameState.timer;
    }
    
    saveStats();
    updateLocalStatsUI();
    
    DOM.modalDifficulty.textContent = diff.charAt(0).toUpperCase() + diff.slice(1);
    DOM.modalTime.textContent = formatTime(GameState.timer);
    DOM.modalMistakes.textContent = `${GameState.mistakes} / ${GameState.maxMistakes}`;
    DOM.modalHints.textContent = GameState.hintsUsed;
    
    DOM.winModal.classList.remove('hidden');
    localStorage.removeItem('sudokuGameState');
}

function gameOverLoss() {
    stopTimer();
    alert(`Game Over! You made ${GameState.maxMistakes} mistakes.`);
    revealSolution();
}



function startTimer() {
    if (GameState.timerInterval) clearInterval(GameState.timerInterval);
    GameState.timerInterval = setInterval(() => {
        if (!GameState.isPaused) {
            GameState.timer++;
            DOM.timerDisplay.textContent = formatTime(GameState.timer);
            if (GameState.timer % 5 === 0) saveGameState();
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(GameState.timerInterval);
}

function resetTimer() {
    stopTimer();
    DOM.timerDisplay.textContent = '00:00';
}

function togglePause() {
    GameState.isPaused = !GameState.isPaused;
    if (GameState.isPaused) {
        DOM.pauseIcon.textContent = 'play_arrow';
        DOM.pauseOverlay.classList.remove('hidden');
    } else {
        DOM.pauseIcon.textContent = 'pause';
        DOM.pauseOverlay.classList.add('hidden');
    }
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}



function updateUI() {
    DOM.mistakeCounter.textContent = `${GameState.mistakes} / ${GameState.maxMistakes}`;
    DOM.hintCounter.textContent = GameState.hintsUsed;
    DOM.timerDisplay.textContent = formatTime(GameState.timer);
    DOM.difficultySelect.value = GameState.difficulty;
    
    DOM.btnUndo.disabled = GameState.history.length === 0;
    DOM.btnRedo.disabled = GameState.redoStack.length === 0;
}

function updateLocalStatsUI() {
    DOM.statGamesWon.textContent = GameState.stats.gamesWon;
    
    const currDiffTime = GameState.stats.bestTimes[GameState.difficulty];
    DOM.statBestTime.textContent = currDiffTime ? formatTime(currDiffTime) : '--:--';
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    DOM.themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
    localStorage.setItem('sudokuTheme', isDark ? 'dark' : 'light');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('sudokuTheme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        DOM.themeIcon.textContent = 'light_mode';
    }
}

function saveGameState() {
    const saveObj = {
        solution: GameState.solution,
        puzzle: GameState.puzzle,
        userGrid: GameState.userGrid,
        notesGrid: GameState.notesGrid,
        difficulty: GameState.difficulty,
        mistakes: GameState.mistakes,
        hintsUsed: GameState.hintsUsed,
        timer: GameState.timer
    };
    localStorage.setItem('sudokuGameState', JSON.stringify(saveObj));
}

function hasSavedGame() {
    return localStorage.getItem('sudokuGameState') !== null;
}

function loadGameState() {
    const saved = localStorage.getItem('sudokuGameState');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            GameState.solution = data.solution;
            GameState.puzzle = data.puzzle;
            GameState.userGrid = data.userGrid;
            GameState.notesGrid = data.notesGrid;
            GameState.difficulty = data.difficulty;
            GameState.mistakes = data.mistakes;
            GameState.hintsUsed = data.hintsUsed;
            GameState.timer = data.timer;
            return true;
        } catch (e) {
            console.error("Failed to load saved game.", e);
            return false;
        }
    }
    return false;
}

function saveStats() {
    localStorage.setItem('sudokuStats', JSON.stringify(GameState.stats));
}

function loadStats() {
    const saved = localStorage.getItem('sudokuStats');
    if (saved) {
        try {
            GameState.stats = JSON.parse(saved);
        } catch(e) {}
    }
    updateLocalStatsUI();
}