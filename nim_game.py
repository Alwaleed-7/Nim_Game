import pygame
import random
import sys

# Initialize Pygame
pygame.init()

# Constants
WINDOW_WIDTH = 800
WINDOW_HEIGHT = 600
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
GREEN = (34, 139, 34)
BLUE = (0, 0, 255)
RED = (255, 0, 0)

# Create the window
screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
pygame.display.set_caption('لعبة نيم')

# Font initialization
try:
    pygame.font.init()
    font = pygame.font.SysFont('Arial', 36)
    ARBIC_FONTS = ['Traditional Arabic', 'Arial', 'Segoe UI', 'Times New Roman']
    ARABIC_FONT = None
    for font_name in ARBIC_FONTS:
        try:
            ARABIC_FONT = pygame.font.SysFont(font_name, 32)
            if ARABIC_FONT:
                break
        except Exception as e:
            print(f"Error loading font {font_name}: {e}")
            continue
    if not ARABIC_FONT:
        ARABIC_FONT = pygame.font.SysFont('Arial', 32)  # Fallback to Arial
except Exception as e:
    print(f"Error initializing fonts: {e}")
    pygame.quit()
    sys.exit(1)

class Button:
    def __init__(self, x, y, width, height, text, color):
        self.rect = pygame.Rect(x, y, width, height)
        self.text = text
        self.color = color
        self.is_hovered = False

    def draw(self, surface):
        color = (self.color[0] - 30, self.color[1] - 30, self.color[2] - 30) if self.is_hovered else self.color
        pygame.draw.rect(surface, color, self.rect)
        text_surface = font.render(self.text, True, WHITE)
        text_rect = text_surface.get_rect(center=self.rect.center)
        surface.blit(text_surface, text_rect)

    def handle_event(self, event):
        if event.type == pygame.MOUSEMOTION:
            self.is_hovered = self.rect.collidepoint(event.pos)
        elif event.type == pygame.MOUSEBUTTONDOWN:
            if self.is_hovered:
                return True
        return False

class NimGame:
    def __init__(self):
        self.reset_game()
        # Create step buttons
        self.step_buttons = []
        self.create_step_buttons()
        self.turn_buttons = [
            Button(250, 250, 100, 50, "1", BLUE),
            Button(450, 250, 100, 50, "2", RED)
        ]

    def reset_game(self):
        self.goal = random.randint(40, 70)
        self.steps = random.randint(3, 7)
        self.current_position = 0
        self.player_turn = None
        self.game_state = 'choose_turn'  # States: 'choose_turn', 'playing', 'game_over'
        self.winner = None
        self.create_step_buttons()

    def create_step_buttons(self):
        self.step_buttons = []
        for i in range(self.steps):
            self.step_buttons.append(
                Button(200 + i * 100, 400, 80, 40, str(i + 1), GREEN)
            )

    def make_bot_move(self):
        steps_eq = (self.goal - self.current_position) % (self.steps + 1)
        if steps_eq > 0:
            bot_move = steps_eq
        else:
            bot_move = random.randint(1, self.steps)
        self.current_position += bot_move
        return bot_move

    def draw(self, screen):
        screen.fill(WHITE)

        if self.game_state == 'choose_turn':
            # Render Arabic text with proper positioning
            text = ARABIC_FONT.render("هل تريد اللعب أولاً أم ثانياً؟", True, BLACK)
            text_rect = text.get_rect(center=(WINDOW_WIDTH/2, 200))
            screen.blit(text, text_rect)
            for button in self.turn_buttons:
                button.draw(screen)

        elif self.game_state in ['playing', 'game_over']:
            # Draw progress bar
            pygame.draw.rect(screen, BLACK, (100, 100, 600, 30), 2)
            progress_width = (self.current_position / self.goal) * 600
            pygame.draw.rect(screen, GREEN, (100, 100, progress_width, 30))

            # Draw game information
            # Render game status text with proper RTL alignment
            position_text = ARABIC_FONT.render(f"{self.current_position} :الموقع الحالي", True, BLACK)
            goal_text = ARABIC_FONT.render(f"{self.goal} :الهدف", True, BLACK)
            turn_text = ARABIC_FONT.render("دورك" if self.player_turn else "دور الكمبيوتر", True, BLACK)

            # Right-align the text
            position_rect = position_text.get_rect(right=WINDOW_WIDTH-100, top=150)
            goal_rect = goal_text.get_rect(right=WINDOW_WIDTH-100, top=180)
            turn_rect = turn_text.get_rect(right=WINDOW_WIDTH-100, top=210)

            screen.blit(position_text, position_rect)
            screen.blit(goal_text, goal_rect)
            screen.blit(turn_text, turn_rect)

            if self.game_state == 'playing' and self.player_turn:
                for button in self.step_buttons:
                    button.draw(screen)

            if self.game_state == 'game_over':
                # Render game result with proper positioning
                result_text = ARABIC_FONT.render(
                    "لقد فزت!" if self.winner == 'player' else "لقد خسرت!",
                    True,
                    GREEN if self.winner == 'player' else RED
                )
                result_rect = result_text.get_rect(center=(WINDOW_WIDTH/2, 300))
                screen.blit(result_text, result_rect)
                
                # Draw play again button
                pygame.draw.rect(screen, BLUE, (300, 350, 200, 50))
                play_again_text = ARABIC_FONT.render("العب مرة أخرى", True, WHITE)
                play_again_rect = play_again_text.get_rect(center=(WINDOW_WIDTH/2, 375))
                screen.blit(play_again_text, play_again_rect)

        pygame.display.flip()

    def handle_event(self, event):
        if self.game_state == 'choose_turn':
            for i, button in enumerate(self.turn_buttons):
                if button.handle_event(event):
                    self.player_turn = (i == 0)
                    self.game_state = 'playing'
                    if not self.player_turn:  # If computer goes first
                        bot_move = self.make_bot_move()

        elif self.game_state == 'playing' and self.player_turn:
            for i, button in enumerate(self.step_buttons):
                if button.handle_event(event):
                    move = i + 1
                    self.current_position += move
                    
                    if self.current_position >= self.goal:
                        self.game_state = 'game_over'
                        self.winner = 'player'
                    else:
                        self.player_turn = False
                        # Bot's turn
                        bot_move = self.make_bot_move()
                        if self.current_position >= self.goal:
                            self.game_state = 'game_over'
                            self.winner = 'computer'
                        else:
                            self.player_turn = True

        elif self.game_state == 'game_over':
            if event.type == pygame.MOUSEBUTTONDOWN:
                play_again_rect = pygame.Rect(300, 350, 200, 50)
                if play_again_rect.collidepoint(event.pos):
                    self.reset_game()
                    self.game_state = 'choose_turn'

def main():
    game = NimGame()
    clock = pygame.time.Clock()

    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            game.handle_event(event)

        game.draw(screen)
        clock.tick(60)

if __name__ == "__main__":
    main()