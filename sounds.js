// Sound effects manager for Nim Game
class SoundManager {
    constructor() {
        this.sounds = {
            move: new Audio('sounds/move.mp3'),
            win: new Audio('sounds/win.mp3'),
            lose: new Audio('sounds/lose.mp3'),
            click: new Audio('sounds/click.mp3')
        };
        this.isMuted = false;

        // Initialize all sounds with low volume
        Object.values(this.sounds).forEach(sound => {
            sound.volume = 0.3;
        });

        // Add error handling for sound loading
        Object.entries(this.sounds).forEach(([key, sound]) => {
            sound.onerror = () => {
                console.warn(`Failed to load sound: ${key}`);
            };
        });
    }

    play(soundName) {
        if (this.isMuted) return;
        const sound = this.sounds[soundName];
        if (sound) {
            // Reset the sound to start and play
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.warn(`Error playing sound ${soundName}:`, error);
            });
        }
    }

    // Method to preload all sounds
    preloadSounds() {
        Object.values(this.sounds).forEach(sound => {
            sound.load();
        });
    }

    // Method to set mute state
    setMuted(muted) {
        this.isMuted = muted;
    }
}

// Create a global instance of the sound manager
const soundManager = new SoundManager();