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
        this.resetGame();
        this.createButtons();
        this.botLastMove = null;
        this.showRules = true;
        this.animationState = null;
        this.animationProgress = 0;
        this.lastMoveAmount = 0;
    }

    resetGame() {
        this.goal = Math.floor(Math.random() * 31) + 40; // 40-70
        this.steps = Math.floor(Math.random() * 5) + 3;  // 3-7
        this.currentPosition = 0;
        this.playerTurn = null;
        this.gameState = 'chooseTurn'; // States: chooseTurn, playing, gameOver
        this.winner = null;
        this.botLastMove = null;
        this.showRules = true;
        this.createButtons();
    }

    createButtons() {
        this.turnButtons = [
            new Button(250, 250, 100, 50, "1", COLORS.BLUE),
            new Button(450, 250, 100, 50, "2", COLORS.RED)
        ];

        this.stepButtons = [];
        for (let i = 0; i < this.steps; i++) {
            this.stepButtons.push(
                new Button(200 + i * 100, 400, 80, 40, String(i + 1), COLORS.GREEN)
            );
        }

        this.playAgainButton = new Button(300, 350, 200, 50, "العب مرة أخرى", COLORS.BLUE);
    }

    makeBotMove() {
        if (this.gameState === 'playing' && !this.animationState) {
            setTimeout(() => {
                if (this.gameState === 'playing') {
                    const stepsEq = (this.goal - this.currentPosition) % (this.steps + 1);
                    const botMove = stepsEq > 0 ? stepsEq : Math.floor(Math.random() * this.steps) + 1;
                    this.botLastMove = botMove;
                    this.animationState = 'bot';
                    this.animationProgress = 0;
                    this.lastMoveAmount = botMove;
                }
            }, 2000);
        }
    }

    draw() {
        // Clear canvas
        ctx.fillStyle = COLORS.WHITE;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Handle animations
        if (this.animationState) {
            this.animationProgress += 0.02;
            if (this.animationState === 'player') {
                this.currentPosition += this.lastMoveAmount;
                this.animationState = null;
                if (this.currentPosition > this.goal) {
                    this.gameState = 'gameOver';
                    this.winner = 'computer';
                } else if (this.currentPosition === this.goal) {
                    this.gameState = 'gameOver';
                    this.winner = 'player';
                } else {
                    this.playerTurn = false;
                    this.makeBotMove();
                }
            } else if (this.animationState === 'bot') {
                this.currentPosition += this.lastMoveAmount;
                this.animationState = null;
                if (this.currentPosition > this.goal) {
                    this.gameState = 'gameOver';
                    this.winner = 'computer';
                } else if (this.currentPosition === this.goal) {
                    this.gameState = 'gameOver';
                    this.winner = 'player';
                } else {
                    this.playerTurn = true;
                }
            }
            this.animationProgress = 0;
        }

        if (this.gameState === 'chooseTurn') {
            if (this.showRules) {
                ctx.fillStyle = COLORS.BLACK;
                ctx.font = '24px Cairo';
                ctx.textAlign = 'right';
                ctx.fillText("قواعد اللعبة:", CANVAS_WIDTH-100, 100);
                ctx.fillText("1. في كل دور، يمكنك التحرك خطوات محددة نحو الهدف", CANVAS_WIDTH-100, 140);
                ctx.fillText("2. الفائز هو من يصل إلى الهدف أولاً", CANVAS_WIDTH-100, 180);
                ctx.fillText("3. اختر خطواتك بحكمة للفوز على الكمبيوتر", CANVAS_WIDTH-100, 220);
                ctx.fillText("4. إذا تجاوزت الرقم المستهدف، ستخسر اللعبة", CANVAS_WIDTH-100, 260);
                
                // Add goal and steps information
                ctx.fillStyle = COLORS.BLUE;
                ctx.fillText(`${this.goal} :الهدف المطلوب الوصول إليه`, CANVAS_WIDTH-100, 300);
                ctx.fillText(`${this.steps} :الحد الأقصى للخطوات المسموحة`, CANVAS_WIDTH-100, 340);
                
                ctx.fillStyle = COLORS.BLACK;
                ctx.font = '32px Cairo';
                ctx.textAlign = 'center';
                ctx.fillText("هل تريد اللعب أولاً أم ثانياً؟", CANVAS_WIDTH/2, 340);
                this.turnButtons.forEach(button => {
                    button.y = 390;
                    button.draw();
                });
            }
        }
        else if (this.gameState === 'playing' || this.gameState === 'gameOver') {
            // Draw progress bar
            ctx.strokeStyle = COLORS.BLACK;
            ctx.strokeRect(100, 100, 600, 30);
            let displayPosition = this.currentPosition;
            
            if (this.animationState) {
                const animationMove = this.lastMoveAmount * this.animationProgress;
                displayPosition = this.currentPosition + animationMove;
            }
            
            const progressWidth = (displayPosition / this.goal) * 600;
            ctx.fillStyle = this.animationState === 'bot' ? COLORS.BLUE : COLORS.GREEN;
            ctx.fillRect(100, 100, progressWidth, 30);

            // Draw game information
            ctx.fillStyle = COLORS.BLACK;
            ctx.font = '24px Cairo';
            ctx.textAlign = 'right';
            ctx.fillText(`${this.currentPosition} :الموقع الحالي`, CANVAS_WIDTH-100, 150);
            ctx.fillText(`${this.goal} :الهدف`, CANVAS_WIDTH-100, 180);
            ctx.fillText(this.playerTurn ? "دورك" : "دور الكمبيوتر", CANVAS_WIDTH-100, 210);
            
            // Display bot's last move
            if (!this.playerTurn || this.botLastMove) {
                ctx.fillStyle = COLORS.BLUE;
                ctx.fillText(`آخر حركة للكمبيوتر: ${this.botLastMove} خطوات`, CANVAS_WIDTH-100, 240);
            }

            if (this.gameState === 'playing' && this.playerTurn) {
                this.stepButtons.forEach(button => button.draw());
            }

            if (this.gameState === 'gameOver') {
                ctx.font = '36px Cairo';
                ctx.textAlign = 'center';
                ctx.fillStyle = this.winner === 'player' ? COLORS.GREEN : COLORS.RED;
                ctx.fillText(
                    this.winner === 'player' ? "لقد فزت!" : "لقد خسرت!",
                    CANVAS_WIDTH/2,
                    300
                );
                this.playAgainButton.draw();
            }
        }
    }

    handleClick(x, y) {
        if (this.gameState === 'chooseTurn') {
            this.turnButtons.forEach((button, index) => {
                if (button.isPointInside(x, y)) {
                    this.playerTurn = index === 0;
                    this.gameState = 'playing';
                    if (!this.playerTurn) {
                        this.makeBotMove();
                        this.playerTurn = true;
                    }
                }
            });
        }
        else if (this.gameState === 'playing' && this.playerTurn) {
            this.stepButtons.forEach((button, index) => {
                if (button.isPointInside(x, y)) {
                    const move = index + 1;
                    this.animationState = 'player';
                    this.animationProgress = 0;
                    this.lastMoveAmount = move;
                }
            });
        }
        else if (this.gameState === 'gameOver') {
            if (this.playAgainButton.isPointInside(x, y)) {
                this.resetGame();
                this.gameState = 'chooseTurn';
            }
        }
    }

    handleMouseMove(x, y) {
        const buttons = [
            ...this.turnButtons,
            ...this.stepButtons,
            this.gameState === 'gameOver' ? this.playAgainButton : null
        ].filter(Boolean);

        buttons.forEach(button => {
            button.isHovered = button.isPointInside(x, y);
        });
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