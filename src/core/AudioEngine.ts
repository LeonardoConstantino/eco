import { SoundThemeId } from '../types';

export class AudioEngine {
  private static instance: AudioEngine | null = null;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentTheme: SoundThemeId = 'default';
  private volume = 0.8;
  private isMuted = false;
  private isInitialized = false;

  private constructor() {
    // Lazy init
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public init(): void {
    if (this.isInitialized && this.ctx && this.ctx.state === 'running') return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.ctx) {
        this.ctx = new AudioContextClass();
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      if (!this.masterGain && this.ctx) {
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }

      this.isInitialized = true;
    } catch {
      // Audio context restricted or unavailable
    }
  }

  public async resumeContext(): Promise<void> {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        // Ignored
      }
    }
  }

  public setSoundTheme(theme: SoundThemeId): void {
    this.currentTheme = theme;
  }

  public getSoundTheme(): SoundThemeId {
    return this.currentTheme;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public isSoundMuted(): boolean {
    return this.isMuted;
  }

  public playNote(freq: number, duration = 0.32, volumeMultiplier = 1.0): void {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const effectiveGain = 0.45 * volumeMultiplier;

    if (this.currentTheme === 'retro') {
      // 8-bit Square Wave with vintage snappiness
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(effectiveGain * 0.4, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration);
    } else if (this.currentTheme === 'crystal') {
      // Ethereal Sine + high harmonic shimmer
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Sub-harmonic / Shimmer oscillator
      const shimmerOsc = this.ctx.createOscillator();
      const shimmerGain = this.ctx.createGain();
      shimmerOsc.type = 'sine';
      shimmerOsc.frequency.setValueAtTime(freq * 2.005, now); // slight chorus detune

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(effectiveGain * 0.6, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + duration * 1.5);

      shimmerGain.gain.setValueAtTime(0, now);
      shimmerGain.gain.linearRampToValueAtTime(effectiveGain * 0.15, now + 0.06);
      shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 1.8);

      osc.connect(gain);
      shimmerOsc.connect(shimmerGain);

      gain.connect(this.masterGain);
      shimmerGain.connect(this.masterGain);

      osc.start(now);
      shimmerOsc.start(now);

      osc.stop(now + duration * 1.5);
      shimmerOsc.stop(now + duration * 1.8);
    } else {
      // Default: Pure Sine with smooth ADSR
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(effectiveGain, now + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration);
    }
  }

  public playError(): void {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.45);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  public playRecordBeat(): void {
    const chord = [261.63, 329.63, 392.00, 523.25];
    chord.forEach((freq, index) => {
      setTimeout(() => {
        this.playNote(freq, 0.45, 0.9);
      }, index * 90);
    });
  }

  public playZenLoopCompletion(): void {
    const notes = [329.63, 392.00, 466.16, 523.25];
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.playNote(freq, 0.6, 0.7);
      }, index * 120);
    });
  }

  public playUiTap(): void {
    this.init();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }
}
