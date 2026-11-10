/**
 * CHILD PRIVACY NOTE (Rule 2, Rule 3, Rule 5):
 * - On-Device Sound Effects Synthesizer via Web Audio API
 * - Generates playful mechanical wheel ticks and celebratory fanfares in-browser.
 * - ZERO external sound downloads, zero tracking, zero network bandwidth.
 */

class SoundEffectsService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled = true;
  private calmMode = false;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  public setCalmMode(calm: boolean): void {
    this.calmMode = calm;
  }

  public isCalmMode(): boolean {
    return this.calmMode;
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Play a short, crisp tactile wheel peg tick sound
   */
  public playTick(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Ignore audio synthesis errors
    }
  }

  /**
   * Play a cheerful 3-note celebration chime on landing
   */
  public playCelebration(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Major chord chime)
      notes.forEach((freq, idx) => {
        const startTime = ctx.currentTime + idx * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch {
      // Ignore
    }
  }
}

export const soundEffects = new SoundEffectsService();
