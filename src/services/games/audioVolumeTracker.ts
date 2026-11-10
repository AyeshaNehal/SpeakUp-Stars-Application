/**
 * CHILD PRIVACY NOTE (Rule 2, Rule 6):
 * - On-Device Audio Volume Tracker for Mini-Games
 * - Uses Web Audio API (AnalyserNode) to track real-time vocal energy.
 * - STRICT GUARANTEE: Raw audio buffers and streams are NEVER recorded, persisted,
 *   or transmitted over the network. All volume calculations occur in ephemeral browser memory.
 */

import { privacyLogger } from '../logger';

export interface VolumeSample {
  rawVolume: number; // 0 to 1
  smoothedVolume: number; // 0 to 1
  state: 'silence' | 'gentle' | 'steady' | 'erupting';
  timestamp: number;
}

export interface VolumeTrackerConfig {
  silenceThreshold?: number; // Below this is ambient noise (default: 0.12)
  steadyThreshold?: number; // Target clear speaking zone (default: 0.30)
  eruptionThreshold?: number; // Confident peak vocal energy (default: 0.65)
  smoothingFactor?: number; // EMA alpha between 0 and 1 (default: 0.25)
}

export class AudioVolumeTracker {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;

  private isRunning = false;
  private animFrameId: number | null = null;
  private smoothedVolume = 0;

  private silenceThreshold: number;
  private steadyThreshold: number;
  private eruptionThreshold: number;
  private smoothingFactor: number;

  private onSampleCallback?: (sample: VolumeSample) => void;

  constructor(config: VolumeTrackerConfig = {}) {
    this.silenceThreshold = config.silenceThreshold ?? 0.12;
    this.steadyThreshold = config.steadyThreshold ?? 0.30;
    this.eruptionThreshold = config.eruptionThreshold ?? 0.65;
    this.smoothingFactor = config.smoothingFactor ?? 0.25;
  }

  /**
   * Initializes microphone stream and AudioContext strictly on user gesture.
   */
  public async start(onSample: (sample: VolumeSample) => void): Promise<boolean> {
    if (this.isRunning) return true;
    this.onSampleCallback = onSample;

    try {
      // Check for browser support
      if (typeof window === 'undefined') return false;

      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) {
        privacyLogger.warn('Web Audio API not supported in this browser.');
        return false;
      }

      if (!navigator?.mediaDevices?.getUserMedia) {
        privacyLogger.warn('Microphone getUserMedia not available.');
        return false;
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false, // Let raw speaking energy register accurately
          autoGainControl: false,
        },
        video: false,
      });

      this.audioContext = new AudioContextClass();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.4;

      this.sourceNode.connect(this.analyser);
      // Analyser is intentionally NOT connected to destination so audio doesn't feedback loop
      this.isRunning = true;
      this.smoothedVolume = 0;

      privacyLogger.info('Microphone audio stream opened for on-device game analysis (ZERO storage).');
      this.tick();
      return true;
    } catch (err) {
      privacyLogger.error('Failed to initialize microphone audio tracker', err);
      this.stop();
      return false;
    }
  }

  /**
   * Real-time audio sample tick using AnalyserNode time-domain data (RMS volume).
   */
  private tick = (): void => {
    if (!this.isRunning || !this.analyser) return;

    const bufferLength = this.analyser.fftSize;
    const timeData = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(timeData);

    // Compute Root-Mean-Square (RMS) amplitude
    let sumSquares = 0;
    for (let i = 0; i < bufferLength; i++) {
      // Normalize from 0..255 to -1..1
      const normalized = (timeData[i] - 128) / 128;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / bufferLength);

    // Dynamic curve scaling: RMS typically ranges 0 to ~0.5 for speech
    const boosted = Math.min(1, rms * 3.5);
    const clampedRaw = boosted < this.silenceThreshold ? 0 : boosted;

    // Exponential Moving Average (EMA) smoothing for silky 3D animations
    this.smoothedVolume =
      this.smoothingFactor * clampedRaw + (1 - this.smoothingFactor) * this.smoothedVolume;

    let state: VolumeSample['state'] = 'silence';
    if (this.smoothedVolume >= this.eruptionThreshold) {
      state = 'erupting';
    } else if (this.smoothedVolume >= this.steadyThreshold) {
      state = 'steady';
    } else if (this.smoothedVolume > 0) {
      state = 'gentle';
    }

    if (this.onSampleCallback) {
      this.onSampleCallback({
        rawVolume: clampedRaw,
        smoothedVolume: Math.round(this.smoothedVolume * 100) / 100,
        state,
        timestamp: Date.now(),
      });
    }

    this.animFrameId = requestAnimationFrame(this.tick);
  };

  /**
   * Stops tracking and immediately frees all microphone hardware resources.
   */
  public stop(): void {
    this.isRunning = false;

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {
        // ignore
      }
      this.sourceNode = null;
    }

    if (this.analyser) {
      try {
        this.analyser.disconnect();
      } catch {
        // ignore
      }
      this.analyser = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.smoothedVolume = 0;
    privacyLogger.info('Microphone stream closed and audio memory cleared.');
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }
}
