class AudioSystem {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public volume: number = 0.5;
  private bgMusic: HTMLAudioElement | null = null;
  private ambientOsc: OscillatorType | any = null;
  private ambientGain: GainNode | any = null;
  private static readonly START_OFFSET_SECONDS = 15.0;

  constructor() {
    this.bgMusic = new Audio('solarflex-guitar-music-558279.mp3');
    this.bgMusic.loop = false; // Handle looping manually to preserve offset
    this.bgMusic.autoplay = true;
    this.bgMusic.volume = this.volume;

    const setStartTime = () => {
      if (this.bgMusic && this.bgMusic.currentTime < AudioSystem.START_OFFSET_SECONDS) {
        this.bgMusic.currentTime = AudioSystem.START_OFFSET_SECONDS;
      }
    };

    this.bgMusic.addEventListener('loadedmetadata', setStartTime);
    this.bgMusic.addEventListener('canplay', setStartTime);
    
    this.bgMusic.addEventListener('ended', () => {
      if (this.bgMusic) {
        this.bgMusic.currentTime = AudioSystem.START_OFFSET_SECONDS;
        this.bgMusic.play().catch(() => {});
      }
    });

    // Attempt autoplay from offset
    setStartTime();
    this.bgMusic.play().catch(() => {});
  }

  public init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    // Play background music if enabled starting at 0.15s
    if (this.enabled && this.bgMusic) {
      if (this.bgMusic.currentTime < AudioSystem.START_OFFSET_SECONDS) {
        this.bgMusic.currentTime = AudioSystem.START_OFFSET_SECONDS;
      }
      if (this.bgMusic.paused) {
        this.bgMusic.play().catch(() => {});
      }
    }
    this.startAmbientDrone();
  }

  private startAmbientDrone() {
    if (!this.ctx || this.ambientOsc) return;
    
    // Create a continuous low drone
    this.ambientOsc = this.ctx.createOscillator();
    this.ambientOsc.type = 'sine';
    this.ambientOsc.frequency.value = 55; // Low A
    
    // Add some modulation
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1; // Slow modulation
    
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 5;
    
    lfo.connect(lfoGain);
    lfoGain.connect(this.ambientOsc.frequency);
    lfo.start();

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = this.enabled ? this.volume * 0.6 : 0;
    
    this.ambientOsc.connect(this.ambientGain);
    this.ambientGain.connect(this.ctx.destination);
    this.ambientOsc.start();
  }

  public toggleMute(): boolean {
    this.enabled = !this.enabled;
    if (this.bgMusic) {
      if (!this.enabled) {
        this.bgMusic.pause();
      } else {
        if (this.bgMusic.currentTime < AudioSystem.START_OFFSET_SECONDS) {
          this.bgMusic.currentTime = AudioSystem.START_OFFSET_SECONDS;
        }
        this.bgMusic.play().catch(() => {});
      }
    }
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(this.enabled ? this.volume * 0.6 : 0, this.ctx.currentTime, 0.5);
    }
    return this.enabled;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.bgMusic) {
      this.bgMusic.volume = this.volume;
    }
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(this.enabled ? this.volume * 0.6 : 0, this.ctx.currentTime, 0.1);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public speak(text: string, interrupt = false) {
    // Voice disabled
  }

  public playTypeHit(combo: number = 0) {
    if (!this.enabled || !this.ctx) return;
    
    // Pentatonic scale for "autotune" typing effect
    const pentatonic = [
      261.63, 293.66, 329.63, 392.00, 440.00, // C4, D4, E4, G4, A4
      523.25, 587.33, 659.25, 783.99, 880.00, // C5, D5, E5, G5, A5
      1046.50, 1174.66, 1318.51, 1567.98, 1760.00, // C6, D6, E6, G6, A6
      2093.00, 2349.32 // C7, D7
    ];
    
    const index = Math.min(Math.max(combo - 1, 0), pentatonic.length - 1);
    const freq = pentatonic[index];
    
    this.playKeyboardClick(freq, 0.2); // Increased volume
  }

  public playButtonClick() {
    this.init(); // Initialize audio context and start music on first click
    if (!this.enabled || !this.ctx) return;
    this.playKeyboardClick(500, 0.8);
  }

  public playButtonHover() {
    if (!this.enabled || !this.ctx) return;
    this.playKeyboardClick(300, 0.3);
  }

  public playTypeMiss() {
    if (!this.enabled || !this.ctx) return;
    this.playTone(150, 'sawtooth', 0.1, 0.3);
    this.playKeyboardClick(200, 0.3);
  }

  public playEnemyDestroyed() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Unique "Digital Crystal Shatter + Point Score" sound

    // 1. Spark/Shatter noise (Crisp high-frequency burst)
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(3000, now);
    noiseFilter.Q.value = 1.5;
    
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(1.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);

    // 2. Electronic crunch (Fast descending square wave for impact)
    const crunchOsc = this.ctx.createOscillator();
    const crunchGain = this.ctx.createGain();
    crunchOsc.type = 'square';
    crunchOsc.frequency.setValueAtTime(800, now);
    crunchOsc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
    
    crunchGain.gain.setValueAtTime(0.5, now);
    crunchGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    crunchOsc.connect(crunchGain);
    crunchGain.connect(this.ctx.destination);
    crunchOsc.start(now);
    crunchOsc.stop(now + 0.2);

    // 3. Satisfying Arcade Chime (A Major Chord - A5, C#6, E6)
    // This makes the "destruction" feel like a reward
    this.playToneAtTime(880.00, 'sine', now, 0.2, 0.4);
    this.playToneAtTime(1108.73, 'sine', now, 0.25, 0.4);
    this.playToneAtTime(1318.51, 'sine', now, 0.3, 0.4);
  }

  public playPowerup(type: string) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (type === 'shield') {
       this.playToneAtTime(300, 'sine', now, 0.1, 0.3);
       this.playToneAtTime(500, 'sine', now + 0.1, 0.2, 0.3);
       this.speak('Shield active', true);
    } else if (type === 'bomb') {
       this.playNoise(0.5, 0.6);
       this.speak('Detonation', true);
    } else if (type === 'freeze') {
       this.playToneAtTime(800, 'sine', now, 0.2, 0.3);
       this.playToneAtTime(700, 'sine', now+0.1, 0.2, 0.3);
       this.speak('System frozen', true);
    } else if (type === 'double') {
       this.playToneAtTime(400, 'square', now, 0.1, 0.3);
       this.playToneAtTime(600, 'square', now+0.1, 0.1, 0.3);
       this.playToneAtTime(800, 'square', now+0.2, 0.2, 0.3);
       this.speak('Double points', true);
    }
  }

  public playLevelUp(level: number) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.playToneAtTime(400, 'square', now, 0.1, 0.3);
    this.playToneAtTime(500, 'square', now + 0.1, 0.1, 0.3);
    this.playToneAtTime(600, 'square', now + 0.2, 0.2, 0.3);
    setTimeout(() => {
        this.speak(`Level ${level} complete`, true);
    }, 400);
  }

  public playGameOver() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.playToneAtTime(300, 'sawtooth', now, 0.3, 0.4);
    this.playToneAtTime(250, 'sawtooth', now + 0.3, 0.3, 0.4);
    this.playToneAtTime(200, 'sawtooth', now + 0.6, 0.6, 0.4);
    setTimeout(() => {
        this.speak('System failure', true);
    }, 100);
  }

  public playGameStart() {
      if (!this.enabled || !this.ctx) return;
      this.playToneAtTime(400, 'sine', this.ctx.currentTime, 0.1, 0.3);
      this.playToneAtTime(600, 'sine', this.ctx.currentTime + 0.1, 0.2, 0.3);
      setTimeout(() => {
          this.speak('System online', true);
      }, 300);
  }

  private playTone(freq: number, type: OscillatorType, duration: number, vol: number) {
    if (!this.ctx) return;
    this.playToneAtTime(freq, type, this.ctx.currentTime, duration, vol);
  }

  private playToneAtTime(freq: number, type: OscillatorType, startTime: number, duration: number, vol: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private playNoise(duration: number, vol: number) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    noise.start();
  }

  private playKeyboardClick(freq: number, vol: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Thud
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.2, now + 0.03);
    
    oscGain.gain.setValueAtTime(vol, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.03);

    // Click (noise)
    const bufferSize = this.ctx.sampleRate * 0.02;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 3000;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(vol * 0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    
    noise.start(now);
  }
}

export const audio = new AudioSystem();

if (typeof window !== 'undefined') {
  const initAudioOnInteraction = () => {
    audio.init();
    document.removeEventListener('click', initAudioOnInteraction);
    document.removeEventListener('keydown', initAudioOnInteraction);
  };
  
  document.addEventListener('click', initAudioOnInteraction, { once: true });
  document.addEventListener('keydown', initAudioOnInteraction, { once: true });
}
