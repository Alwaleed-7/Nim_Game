// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const COLORS = {
    WHITE: '#FFFFFF',
    BLACK: '#000000',
    GREEN: '#228B22',
    BLUE: '#0000FF',
    RED: '#FF0000',
    HOVER: '#4CAF50'
};

// Language settings
let currentLanguage = 'ar';
let currentDirection = 'rtl';

function setLanguage(lang) {
    currentLanguage = lang;
    currentDirection = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', currentDirection);
    document.title = translations[lang].title;
    game.gameState = 'chooseTurn';
    game.resetGame();
    game.draw(); // Redraw the game
}

function getText(key, params = {}) {
    let text = translations[currentLanguage][key] || key;
    Object.keys(params).forEach(param => {
        text = text.replace(`{${param}}`, params[param]);
    });
    return text;
}

// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Button class
class Button {
    constructor(x, y, width, height, text, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.text = text;
        this.color = color;
        this.isHovered = false;
    }

    draw() {
        ctx.fillStyle = this.isHovered ? COLORS.HOVER : this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = COLORS.WHITE;
        ctx.font = '24px Cairo';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.text, this.x + this.width/2, this.y + this.height/2);
    }

    isPointInside(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }
}

// Game class
class NimGame {
    constructor() {
        this.gameState = 'selectLanguage';
        this.resetGame();
        this.createLanguageButtons();
    }

    resetGame() {
        this.goal = Math.floor(Math.random() * 31) + 40; // 40-70
        this.steps = Math.floor(Math.random() * 5) + 3;  // 3-7
        this.currentPosition = 0;
        this.playerTurn = null;
        this.winner = null;
        this.botLastMove = null;
        this.showRules = true;
        this.isProcessing = false;
        this.createButtons();
    }

    createLanguageButtons() {
        const buttonWidth = 150;
        const buttonHeight = 50;
        const spacing = 50;
        const totalWidth = buttonWidth * 2 + spacing;
        const startX = (CANVAS_WIDTH - totalWidth) / 2;
        const y = CANVAS_HEIGHT / 2;

        this.languageButtons = [
            new Button(startX, y, buttonWidth, buttonHeight, translations.ar.arabic, COLORS.BLUE),
            new Button(startX + buttonWidth + spacing, y, buttonWidth, buttonHeight, translations.en.english, COLORS.RED)
        ];
    }

    handleClick(x, y) {
        if (this.isProcessing) return;
        
        if (this.gameState === 'selectLanguage') {
            this.languageButtons.forEach((button, index) => {
                if (button.isPointInside(x, y)) {
                    setLanguage(index === 0 ? 'ar' : 'en');
                    this.gameState = 'chooseTurn';
                    this.resetGame();
                    this.createButtons();
                }
            });
            return;
        }
        if (this.gameState === 'chooseTurn') {
            this.turnButtons.forEach((button, index) => {
                if (button.isPointInside(x, y)) {
                    this.playerTurn = index === 0;
                    this.gameState = 'playing';
                    this.showRules = false;
                    this.createButtons();
                    if (!this.playerTurn) {
                        this.isProcessing = true;
                        setTimeout(() => {
                            this.makeBotMove();
                            this.playerTurn = true;
                            this.isProcessing = false;
                        }, 1000);
                    }
                }
            });
        }
        else if (this.gameState === 'playing' && this.playerTurn) {
            this.stepButtons.forEach((button, index) => {
                if (button.isPointInside(x, y)) {
                    const move = index + 1;
                    this.makeMove(move);
                    if (this.gameState === 'playing') {
                        this.playerTurn = false;
                        this.isProcessing = true;
                        setTimeout(() => {
                            this.makeBotMove();
                            this.playerTurn = true;
                            this.isProcessing = false;
                        }, 1000);
                    }
                }
            });
        }
        else if (this.gameState === 'gameOver') {
            if (this.playAgainButton.isPointInside(x, y)) {
                this.gameState = 'chooseTurn';
                this.resetGame();
                this.createButtons();
            }
        }
    }

    makeMove(steps) {
        this.currentPosition += steps;
        if (this.currentPosition === this.goal) {
            this.winner = this.playerTurn ? 'player' : 'computer';
            this.gameState = 'gameOver';
            this.createButtons();
        } else if (this.currentPosition > this.goal) {
            this.winner = this.playerTurn ? 'computer' : 'player';
            this.gameState = 'gameOver';
            this.createButtons();
        }
    }

    makeBotMove() {
        let bestMove = 1;
        const remainingSteps = this.goal - this.currentPosition;

        // Try to make a winning move
        for (let i = 1; i <= this.steps; i++) {
            if (this.currentPosition + i === this.goal) {
                bestMove = i;
                break;
            }
        }

        // If no winning move, try to get to a position where (remaining steps) % (max steps + 1) = 0
        if (this.currentPosition + bestMove !== this.goal) {
            let optimalMoves = [];
            for (let i = 1; i <= this.steps; i++) {
                const newPosition = this.currentPosition + i;
                if (newPosition < this.goal && 
                    (this.goal - newPosition) % (this.steps + 1) === 0) {
                    optimalMoves.push(i);
                }
            }
            
            // If optimal moves found, choose randomly from them
            if (optimalMoves.length > 0) {
                bestMove = optimalMoves[Math.floor(Math.random() * optimalMoves.length)];
            } else {
                // If no optimal moves, choose a random valid move
                bestMove = Math.floor(Math.random() * this.steps) + 1;
            }
        }

        this.botLastMove = bestMove;
        this.makeMove(bestMove);
    }

    handleMouseMove(x, y) {
        const buttons = [
            ...(this.gameState === 'selectLanguage' ? this.languageButtons : []),
            ...(this.gameState === 'chooseTurn' ? this.turnButtons : []),
            ...(this.gameState === 'playing' ? this.stepButtons : []),
            this.gameState === 'gameOver' ? this.playAgainButton : null
        ].filter(Boolean);

        buttons.forEach(button => {
            button.isHovered = button.isPointInside(x, y);
        });
    }

    createButtons() {
        const buttonHeight = 50;
        const minButtonWidth = 80; // Minimum width for buttons
        const maxButtonWidth = 150; // Maximum width for buttons
        const minSpacing = 10; // Minimum spacing between buttons

        // Adjust button positions based on game state
        if (this.gameState === 'chooseTurn') {
            const buttonWidth = 150; // Fixed width for turn choice buttons
            const spacing = 20;
            const totalWidth = buttonWidth * 2 + spacing;
            const startX = (CANVAS_WIDTH - totalWidth) / 2;
            const startY = this.showRules ? CANVAS_HEIGHT - 120 : CANVAS_HEIGHT / 2 + 50;
            
            this.turnButtons = [
                new Button(startX, startY, buttonWidth, buttonHeight, getText('first'), COLORS.BLUE),
                new Button(startX + buttonWidth + spacing, startY, buttonWidth, buttonHeight, getText('second'), COLORS.RED)
            ];
        }

        // Create step buttons with adjusted position
        if (this.gameState === 'playing') {
            // Calculate optimal button width based on number of steps
            const availableWidth = CANVAS_WIDTH * 0.9; // Use 90% of canvas width
            const calculatedWidth = (availableWidth - (this.steps - 1) * minSpacing) / this.steps;
            const buttonWidth = Math.max(minButtonWidth, Math.min(maxButtonWidth, calculatedWidth));
            const spacing = Math.min((CANVAS_WIDTH - buttonWidth * this.steps) / (this.steps - 1), 20);
            
            const totalWidth = buttonWidth * this.steps + spacing * (this.steps - 1);
            const startX = (CANVAS_WIDTH - totalWidth) / 2;
            const startY = CANVAS_HEIGHT - 100; // Move buttons closer to bottom
            
            this.stepButtons = Array.from({length: this.steps}, (_, i) => {
                return new Button(
                    startX + (buttonWidth + spacing) * i,
                    startY,
                    buttonWidth,
                    buttonHeight,
                    (i + 1).toString(),
                    COLORS.GREEN
                );
            });
        }

        // Adjust play again button position
        if (this.gameState === 'gameOver') {
            const playAgainButtonWidth = 200;
            this.playAgainButton = new Button(
                (CANVAS_WIDTH - playAgainButtonWidth) / 2,
                CANVAS_HEIGHT - 100,
                playAgainButtonWidth,
                buttonHeight,
                getText('playAgain'),
                COLORS.BLUE
            );
        }
    }

    draw() {
        // Clear canvas
        ctx.fillStyle = COLORS.WHITE;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        if (this.gameState === 'selectLanguage') {
            // Draw language selection with more spacing
            ctx.fillStyle = COLORS.BLACK;
            ctx.font = '32px Cairo';
            ctx.textAlign = 'center';
            ctx.fillText(translations.en.chooseLanguage + ' / ' + translations.ar.chooseLanguage, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 4);
            this.languageButtons.forEach(button => button.draw());
            return;
        }

        // Draw game title with more space at top
        ctx.fillStyle = COLORS.BLACK;
        ctx.font = '32px Cairo';
        ctx.textAlign = 'center';
        ctx.fillText(getText('title'), CANVAS_WIDTH / 2, 60);

        // Draw game rules if needed with increased spacing
        if (this.showRules) {
            const rulesStartY = 120; // Start rules higher up
            const ruleSpacing = 40; // Reduced spacing between rules
            ctx.font = '20px Cairo'; // Slightly smaller font for better readability
            
            // Draw rules title with larger font
            ctx.font = '26px Cairo';
            ctx.fillText(getText('gameRules'), CANVAS_WIDTH / 2, rulesStartY);
            
            // Draw rules with normal font
            ctx.font = '20px Cairo';
            ctx.fillText(getText('rule1'), CANVAS_WIDTH / 2, rulesStartY + ruleSpacing);
            ctx.fillText(getText('rule2'), CANVAS_WIDTH / 2, rulesStartY + ruleSpacing * 2);
            ctx.fillText(getText('rule3'), CANVAS_WIDTH / 2, rulesStartY + ruleSpacing * 3);
            ctx.fillText(getText('rule4'), CANVAS_WIDTH / 2, rulesStartY + ruleSpacing * 4);
            
            // Draw game parameters with slightly increased spacing
            ctx.fillText(`${getText('goal')}: ${this.goal}`, CANVAS_WIDTH / 2, rulesStartY + ruleSpacing * 5);
            ctx.fillText(`${getText('maxSteps')}: ${this.steps}`, CANVAS_WIDTH / 2, rulesStartY + ruleSpacing * 5.8);
        }

        if (this.gameState === 'chooseTurn') {
            const turnChoiceY = this.showRules ? CANVAS_HEIGHT - 200 : CANVAS_HEIGHT / 2;
            ctx.font = '24px Cairo';
            ctx.fillText(getText('turnChoice'), CANVAS_WIDTH / 2, turnChoiceY);
            this.turnButtons.forEach(button => button.draw());
        } else if (this.gameState === 'playing' || this.gameState === 'gameOver') {
            // Draw progress slider with adjusted position
            const sliderY = this.showRules ? 350 : 250;
            const sliderHeight = 30;
            const sliderWidth = CANVAS_WIDTH * 0.8;
            const sliderX = (CANVAS_WIDTH - sliderWidth) / 2;

            // Draw background
            ctx.fillStyle = COLORS.WHITE;
            ctx.fillRect(sliderX, sliderY, sliderWidth, sliderHeight);
            ctx.strokeStyle = COLORS.BLACK;
            ctx.strokeRect(sliderX, sliderY, sliderWidth, sliderHeight);

            // Draw progress
            const progress = this.currentPosition / this.goal;
            ctx.fillStyle = COLORS.GREEN;
            ctx.fillRect(sliderX, sliderY, sliderWidth * progress, sliderHeight);

            // Draw game information with increased spacing
            const infoStartY = sliderY + 70;
            const infoSpacing = 40;
            ctx.font = '22px Cairo';
            ctx.fillStyle = COLORS.BLACK;
            
            ctx.fillText(`${getText('goal')}: ${this.goal}`, CANVAS_WIDTH / 2, infoStartY);
            ctx.fillText(`${getText('currentPosition')}: ${this.currentPosition}`, CANVAS_WIDTH / 2, infoStartY + infoSpacing);
            ctx.fillText(`${getText('maxSteps')}: ${this.steps}`, CANVAS_WIDTH / 2, infoStartY + infoSpacing * 2);

            if (this.botLastMove !== null) {
                ctx.fillText(
                    getText('computerLastMove', {steps: this.botLastMove}),
                    CANVAS_WIDTH / 2,
                    infoStartY + infoSpacing * 3
                );
            }

            if (this.gameState === 'playing') {
                ctx.fillText(
                    this.playerTurn ? getText('yourTurn') : getText('computerTurn'),
                    CANVAS_WIDTH / 2,
                    infoStartY + infoSpacing * 4
                );
                this.stepButtons.forEach(button => button.draw());
            } else if (this.gameState === 'gameOver') {
                ctx.fillText(
                    this.winner === 'player' ? getText('youWon') : getText('youLost'),
                    CANVAS_WIDTH / 2,
                    infoStartY + infoSpacing * 4
                );
                this.playAgainButton.draw();
            }
        }
    }
}

// Game initialization
const game = new NimGame();

// Event listeners
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    game.handleClick(x, y);
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    game.handleMouseMove(x, y);
});

// Game loop
function gameLoop() {
    game.draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();