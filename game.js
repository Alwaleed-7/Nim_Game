// Game constants
let CANVAS_WIDTH = 800;
let CANVAS_HEIGHT = 600;
const COLORS = {
    GRAY: '#808080',
    WHITE: '#FFFFFF',
    BLACK: '#000000',
    GREEN: '#228B22',
    BLUE: '#0000FF',
    RED: '#FF0000',
    HOVER: '#4CAF50'
};

// Game settings
let currentLanguage = 'ar';
let currentDirection = 'rtl';
let deviceType = 'pc'; // 'pc' or 'mobile'

function setDeviceType(type) {
    deviceType = type;
    // Adjust canvas size based on device type and window size
    if (type === 'mobile') {
        CANVAS_WIDTH = Math.min(window.innerWidth * 0.98, 800);
        CANVAS_HEIGHT = Math.min(window.innerHeight * 0.95, 1000);
    } else {
        CANVAS_WIDTH = Math.min(window.innerWidth * 0.9, 1000);
        CANVAS_HEIGHT = Math.min(window.innerHeight * 0.9, 800);
    }
    
    // Update canvas size
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    
    // Reset game with new dimensions
    if (game) {
        game.resetGame();
        game.draw();
    }
}

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
        this.gameState = 'selectDevice';
        this.resetGame();
        this.createDeviceButtons();
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
        const buttonWidth = deviceType === 'mobile' ? 180 : 200;
        const buttonHeight = deviceType === 'mobile' ? 45 : 50;
        const spacing = deviceType === 'mobile' ? 20 : 30;
        const startX = (CANVAS_WIDTH - buttonWidth) / 2;
        const startY = deviceType === 'mobile' ? CANVAS_HEIGHT / 3 : CANVAS_HEIGHT / 3;

        this.languageButtons = [
            new Button(startX, startY, buttonWidth, buttonHeight, translations.ar.arabic, COLORS.BLUE),
            new Button(startX, startY + buttonHeight + spacing, buttonWidth, buttonHeight, translations.en.english, COLORS.RED)
        ];
    }

    createDeviceButtons() {
        const buttonWidth = 150;
        const buttonHeight = 50;
        const spacing = 50;
        const totalWidth = buttonWidth * 2 + spacing;
        const startX = (CANVAS_WIDTH - totalWidth) / 2;
        const y = CANVAS_HEIGHT / 2;

        this.deviceButtons = [
            new Button(startX, y, buttonWidth, buttonHeight, 'PC', COLORS.BLUE),
            new Button(startX + buttonWidth + spacing, y, buttonWidth, buttonHeight, 'Mobile', COLORS.GREEN)
        ];
    }

    handleClick(x, y) {
        if (this.isProcessing) return;
        
        if (this.gameState === 'selectDevice') {
            this.deviceButtons.forEach((button, index) => {
                if (button.isPointInside(x, y)) {
                    setDeviceType(index === 0 ? 'pc' : 'mobile');
                    this.gameState = 'selectLanguage';
                    this.draw();
                }
            });
            return;
        }
        
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
        const buttonHeight = deviceType === 'mobile' ? 50 : 50;
        const minButtonWidth = deviceType === 'mobile' ? 60 : 80;
        const maxButtonWidth = deviceType === 'mobile' ? 100 : 150;
        const minSpacing = deviceType === 'mobile' ? 10 : 10;

        if (this.gameState === 'chooseTurn') {
            const buttonWidth = deviceType === 'mobile' ? 180 : 150;
            const spacing = deviceType === 'mobile' ? 30 : 20;
            const totalWidth = buttonWidth * 2 + spacing;
            const startX = (CANVAS_WIDTH - totalWidth) / 2;
            const startY = this.showRules ? CANVAS_HEIGHT - 140 : CANVAS_HEIGHT / 2 + 50;
            
            this.turnButtons = [
                new Button(startX, startY, buttonWidth, buttonHeight, getText('first'), COLORS.BLUE),
                new Button(startX + buttonWidth + spacing, startY, buttonWidth, buttonHeight, getText('second'), COLORS.RED)
            ];
        }

        if (this.gameState === 'playing') {
            const availableWidth = CANVAS_WIDTH * (deviceType === 'mobile' ? 0.95 : 0.9);
            const calculatedWidth = (availableWidth - (this.steps - 1) * minSpacing) / this.steps;
            const buttonWidth = Math.max(minButtonWidth, Math.min(maxButtonWidth, calculatedWidth));
            const spacing = Math.min((CANVAS_WIDTH - buttonWidth * this.steps) / (this.steps - 1), deviceType === 'mobile' ? 25 : 20);
            
            const totalWidth = buttonWidth * this.steps + spacing * (this.steps - 1);
            const startX = (CANVAS_WIDTH - totalWidth) / 2;
            const startY = CANVAS_HEIGHT - (deviceType === 'mobile' ? 120 : 100);
            
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

        if (this.gameState === 'gameOver') {
            const playAgainButtonWidth = deviceType === 'mobile' ? 240 : 200;
            this.playAgainButton = new Button(
                (CANVAS_WIDTH - playAgainButtonWidth) / 2,
                CANVAS_HEIGHT - (deviceType === 'mobile' ? 120 : 100),
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

        if (this.gameState === 'selectDevice') {
            ctx.fillStyle = COLORS.BLACK;
            ctx.font = deviceType === 'mobile' ? '32px Cairo' : '36px Cairo';
            ctx.textAlign = 'center';
            ctx.fillText('Select Device Type', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
            this.deviceButtons.forEach(button => button.draw());
            return;
        }

        if (this.gameState === 'selectLanguage') {
            ctx.fillStyle = COLORS.BLACK;
            ctx.font = deviceType === 'mobile' ? '24px Cairo' : '32px Cairo';
            ctx.textAlign = 'center';
            const langText = translations.en.chooseLanguage + '\n' + translations.ar.chooseLanguage;
            const lines = langText.split('\n');
            lines.forEach((line, index) => {
                ctx.fillText(line, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 5 + (index * (deviceType === 'mobile' ? 40 : 50)));
            });
            this.languageButtons.forEach(button => button.draw());
            return;
        }

        ctx.fillStyle = COLORS.BLACK;
        ctx.font = deviceType === 'mobile' ? '36px Cairo' : '36px Cairo';
        ctx.textAlign = 'center';
        ctx.fillText(getText('title'), CANVAS_WIDTH / 2, deviceType === 'mobile' ? 80 : 70);

        if (this.showRules) {
            const rulesStartY = deviceType === 'mobile' ? 140 : 130;
            const ruleSpacing = deviceType === 'mobile' ? 40 : 45;
            
            ctx.font = deviceType === 'mobile' ? '22px Cairo' : '24px Cairo';
            ctx.fillText(getText('gameRules'), CANVAS_WIDTH / 2, rulesStartY);
            
            ctx.font = deviceType === 'mobile' ? '18px Cairo' : '20px Cairo';
            const wrapText = (text, y) => {
                const maxWidth = CANVAS_WIDTH * 0.85;
                const words = text.split(' ');
                let line = '';
                let currentY = y;
                
                words.forEach(word => {
                    const testLine = line + word + ' ';
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > maxWidth && line !== '') {
                        ctx.fillText(line, CANVAS_WIDTH / 2, currentY);
                        line = word + ' ';
                        currentY += ruleSpacing * 0.6;
                    } else {
                        line = testLine;
                    }
                });
                ctx.fillText(line, CANVAS_WIDTH / 2, currentY);
                return currentY;
            };
            
            let currentY = rulesStartY + ruleSpacing;
            currentY = wrapText(getText('rule1'), currentY) + ruleSpacing * 0.8;
            currentY = wrapText(getText('rule2'), currentY) + ruleSpacing * 0.8;
            currentY = wrapText(getText('rule3'), currentY) + ruleSpacing * 0.8;
            currentY = wrapText(getText('rule4'), currentY) + ruleSpacing * 0.8;
            
            ctx.fillText(`${getText('goal')}: ${this.goal}`, CANVAS_WIDTH / 2, currentY + ruleSpacing * 0.5);
            ctx.fillText(`${getText('maxSteps')}: ${this.steps}`, CANVAS_WIDTH / 2, currentY + ruleSpacing);
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

// Handle window resize
window.addEventListener('resize', () => {
    setDeviceType(deviceType);
});

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