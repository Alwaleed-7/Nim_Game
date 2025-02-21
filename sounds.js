// Sound effects manager for Nim Game
class SoundManager {
    constructor() {
        this.sounds = {};
        this.isMuted = false;
        this.isInitialized = false;
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        // Define sound configurations
        this.soundConfigs = {
            move: 'sounds/move.mp3',
            win: 'sounds/win.mp3',
            lose: 'sounds/lose.mp3',
            click: 'sounds/click.mp3'
        };

        // Initialize sounds if not on mobile
        if (!this.isMobile) {
            this.initializeSounds();
        } else {
            // Add touch event listeners for mobile devices
            document.addEventListener('touchstart', () => {
                if (!this.isInitialized) {
                    this.initializeSounds();
                }
            }, { once: true });
        }
    }

    initializeSounds() {
        if (this.isInitialized) return;

        // Create Audio objects
        Object.entries(this.soundConfigs).forEach(([key, path]) => {
            this.sounds[key] = new Audio(path);
            this.sounds[key].volume = 0.3;
            // Preload the audio
            this.sounds[key].load();
            this.sounds[key].onerror = () => {
                console.warn(`Failed to load sound: ${key}`);
            };
        });

        this.isInitialized = true;
    }

    play(soundName) {
        if (this.isMuted) return;
        
        // Initialize sounds if not done yet (for mobile)
        if (!this.isInitialized) {
            this.initializeSounds();
        }

        const sound = this.sounds[soundName];
        if (sound) {
            // Create a new Audio instance for each play to handle rapid sound triggers
            const soundClone = sound.cloneNode();
            soundClone.volume = 0.3;
            soundClone.play().catch(error => {
                console.warn(`Error playing sound ${soundName}:`, error);
            });
        }
    }

    // Method to preload all sounds
    preloadSounds() {
        if (!this.isInitialized) {
            this.initializeSounds();
        }
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