// Sound Manager for Flappy Bird Game
class SoundManager {
    constructor() {
        this.sounds = {};
        this.isMuted = false;
        this.volume = 0.5;
        this.loadSounds();
    }

    // Load all sound effects
    loadSounds() {
        // Create audio elements for different sound effects
        this.sounds = {
            jump: this.createOscillatorSound(200, 100, 0.1), // Bird flap/jump sound
            point: this.createMultiToneSound([523, 659, 784], 300, 0.15), // Point scored sound (C-E-G chord)
            collision: this.createNoiseSound(0.3), // Collision/hit sound
            gameStart: this.createMultiToneSound([330, 440, 550], 400, 0.12), // Game start sound
            gameOver: this.createDescendingToneSound([440, 330, 220, 165], 600, 0.2), // Game over sound
            whoosh: this.createWhooshSound(150, 0.08) // Whoosh sound when passing through pipes
        };
    }

    // Create oscillator-based sound (for jump, point, etc.)
    createOscillatorSound(frequency, duration, volume) {
        return () => {
            if (this.isMuted) return;
            
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume * this.volume, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
        };
    }

    // Create noise sound for collision
    createNoiseSound(duration) {
        return () => {
            if (this.isMuted) return;
            
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const bufferSize = audioContext.sampleRate * duration;
            const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const output = buffer.getChannelData(0);
            
            // Generate white noise
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
            
            const whiteNoise = audioContext.createBufferSource();
            whiteNoise.buffer = buffer;
            
            const gainNode = audioContext.createGain();
            whiteNoise.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            gainNode.gain.setValueAtTime(0.3 * this.volume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
            
            whiteNoise.start(audioContext.currentTime);
            whiteNoise.stop(audioContext.currentTime + duration);
        };
    }

    // Create multi-tone sound (for chords/harmonics)
    createMultiToneSound(frequencies, duration, volume) {
        return () => {
            if (this.isMuted) return;
            
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const gainNode = audioContext.createGain();
            gainNode.connect(audioContext.destination);
            
            frequencies.forEach((freq, index) => {
                const oscillator = audioContext.createOscillator();
                oscillator.connect(gainNode);
                
                oscillator.frequency.value = freq;
                oscillator.type = 'sine';
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + duration / 1000);
            });
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume * this.volume / frequencies.length, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);
        };
    }

    // Create descending tone sound (for game over)
    createDescendingToneSound(frequencies, duration, volume) {
        return () => {
            if (this.isMuted) return;
            
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const gainNode = audioContext.createGain();
            gainNode.connect(audioContext.destination);
            
            const stepDuration = duration / frequencies.length;
            
            frequencies.forEach((freq, index) => {
                const oscillator = audioContext.createOscillator();
                oscillator.connect(gainNode);
                
                oscillator.frequency.value = freq;
                oscillator.type = 'triangle';
                
                const startTime = audioContext.currentTime + (index * stepDuration / 1000);
                const endTime = startTime + stepDuration / 1000;
                
                oscillator.start(startTime);
                oscillator.stop(endTime);
            });
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume * this.volume, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);
        };
    }

    // Create whoosh sound
    createWhooshSound(duration, volume) {
        return () => {
            if (this.isMuted) return;
            
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Sweep from high to low frequency for whoosh effect
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + duration / 1000);
            oscillator.type = 'sawtooth';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume * this.volume, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
        };
    }

    // Play specific sound
    playSound(soundName) {
        if (this.sounds[soundName] && !this.isMuted) {
            try {
                this.sounds[soundName]();
            } catch (error) {
                console.warn('Could not play sound:', soundName, error);
            }
        }
    }

    // Toggle mute
    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    // Set volume (0.0 to 1.0)
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    // Check if muted
    getMuted() {
        return this.isMuted;
    }

    // Get current volume
    getVolume() {
        return this.volume;
    }
}

// Create global sound manager instance
const soundManager = new SoundManager();

// Global functions to play sounds (for easy access)
function playJumpSound() {
    soundManager.playSound('jump');
}

function playPointSound() {
    soundManager.playSound('point');
}

function playCollisionSound() {
    soundManager.playSound('collision');
}

function playGameStartSound() {
    soundManager.playSound('gameStart');
}

function playGameOverSound() {
    soundManager.playSound('gameOver');
}

function playWhooshSound() {
    soundManager.playSound('whoosh');
}

function toggleGameMute() {
    return soundManager.toggleMute();
}

function setGameVolume(volume) {
    soundManager.setVolume(volume);
}
