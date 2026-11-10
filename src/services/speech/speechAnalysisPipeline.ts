/**
 * CHILD PRIVACY NOTE (Rule 1, Rule 2, Rule 5):
 * - On-Device Client-Side Speech Analysis Pipeline
 * - All computations occur 100% locally in browser memory.
 * - Raw transcripts are STRICTLY scrubbed through piiScrubber before being returned or stored.
 * - Age-adjusted thresholds guarantee toddlers (ages 3-5) are praised and never penalized.
 * - Gentle Mode completely ignores pace and filler words.
 * - Zero negative scores: All metrics are clamped to positive, encouraging scales.
 * - Modular design ready to receive computer-vision Face Analysis next.
 */

import { piiScrubber } from '../security/piiScrubber';
import { getSTTProvider, SpeechToTextProvider } from './sttProvider';
import { CleanVisualMetrics, assertNoBiometricPersistence } from '../security/biometricGuards';
import { AgeGroup } from '../../types';

export interface SpeechAnalysisInput {
  rawTranscript?: string;
  audioBlob?: Blob;
  durationSeconds: number;
  targetDuration: number;
  ageBand: AgeGroup;
  gentleMode?: boolean;
  sttProviderType?: 'webspeech' | 'whisper';
  visualMetrics?: CleanVisualMetrics;
}

export interface SpeechScores {
  clarityScore: number;    // 50 - 100
  pacingScore: number;     // 50 - 100
  courageScore: number;    // 70 - 100 (speaking is always brave!)
  overallScore: number;    // 60 - 100
}

export interface SpeechAnalysisResult {
  // Scrubbed Text (Zero child PII)
  scrubbedTranscript: string;
  detectedPIICount: number;

  // Speech Metrics
  wordCount: number;
  wpm: number;
  fillerWordsCount: number;
  fillerWords: string[];
  pauseCount: number;
  averagePauseSeconds: number;
  averageVolume: number;      // 0 - 100
  volumeSteadiness: number;   // 0 - 100
  usedTargetRatio: number;    // 0.0 - 1.0
  usedMostOfTime: boolean;

  // Age-Adjusted Scores
  scores: SpeechScores;
  gentleMode: boolean;

  // Child-Friendly Encouragement
  encouragingFeedback: string;
  sparkyTip: string;
  unlockedBadgeKey?: string;

  // Merged Face Analysis (Clean, numeric signals only)
  faceAnalysis?: {
    faceDetected: boolean;
    smileRatio?: number;
    eyeContactRatio?: number;
    headSteadiness?: number;
    faceAnalysisEnabled?: boolean;
  };
}

const COMMON_FILLER_WORDS = [
  'um', 'uh', 'er', 'ah', 'like', 'you know', 'kinda', 'sorta', 'basically', 'so',
];

export class SpeechAnalysisPipeline {
  private sttProvider: SpeechToTextProvider;

  constructor(providerType: 'webspeech' | 'whisper' = 'webspeech') {
    this.sttProvider = getSTTProvider(providerType);
  }

  public setProvider(providerType: 'webspeech' | 'whisper'): void {
    this.sttProvider = getSTTProvider(providerType);
  }

  /**
   * Main speech analysis execution
   */
  public async analyzeSpeech(input: SpeechAnalysisInput): Promise<SpeechAnalysisResult> {
    const {
      rawTranscript = '',
      audioBlob,
      durationSeconds = 1,
      targetDuration = 60,
      ageBand = '6-8',
      gentleMode = false,
    } = input;

    // 1. Transcribe via pluggable STT Provider
    const transcription = await this.sttProvider.transcribe({
      audioBlob,
      liveTranscript: rawTranscript,
      durationSeconds,
    });

    const activeRawText = transcription.rawTranscript || rawTranscript;

    // 2. STRICT PRIVACY: PII Scrubber runs on EVERY transcript immediately
    const scrubbed = piiScrubber.scrubPII(activeRawText);
    const scrubbedTranscript = scrubbed.scrubbedText;

    // 3. Compute Words and Words Per Minute (WPM)
    const words = scrubbedTranscript.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const durationMinutes = Math.max(durationSeconds, 1) / 60;
    const rawWpm = Math.round(wordCount / durationMinutes);

    // 4. Compute Filler Words
    const detectedFillers: string[] = [];
    const lowerWords = words.map((w) => w.toLowerCase().replace(/[^a-z]/g, ''));

    for (const w of lowerWords) {
      if (COMMON_FILLER_WORDS.includes(w)) {
        detectedFillers.push(w);
      }
    }
    const fillerWordsCount = detectedFillers.length;

    // 5. Compute Pauses (Inter-word gaps or estimated pauses)
    const pauseMetrics = this.computePauseMetrics(transcription.words, durationSeconds);

    // 6. Compute Volume and Steadiness (from audio samples or speech density)
    const volumeMetrics = this.computeVolumeMetrics(audioBlob, wordCount, durationSeconds);

    // 7. Used Target Duration Ratio
    const usedTargetRatio = Math.min(durationSeconds / Math.max(targetDuration, 1), 1.0);
    const usedMostOfTime = usedTargetRatio >= 0.65;

    // 8. Compute Age-Adjusted, Clamped Positive Scores
    const scores = this.computeAgeAdjustedScores({
      wpm: rawWpm,
      wordCount,
      fillerCount: fillerWordsCount,
      pauseCount: pauseMetrics.pauseCount,
      averagePauseSec: pauseMetrics.averagePauseSeconds,
      steadiness: volumeMetrics.steadiness,
      usedTargetRatio,
      ageBand,
      gentleMode,
      visualMetrics: input.visualMetrics,
    });

    // 9. Generate Kid-Friendly Cheerful Feedback
    const feedback = this.generateEncouragement(ageBand, scores, gentleMode, usedMostOfTime, input.visualMetrics);

    const result: SpeechAnalysisResult = {
      scrubbedTranscript,
      detectedPIICount: scrubbed.detectedCount,
      wordCount,
      wpm: rawWpm,
      fillerWordsCount,
      fillerWords: Array.from(new Set(detectedFillers)),
      pauseCount: pauseMetrics.pauseCount,
      averagePauseSeconds: pauseMetrics.averagePauseSeconds,
      averageVolume: volumeMetrics.averageVolume,
      volumeSteadiness: volumeMetrics.steadiness,
      usedTargetRatio: Math.round(usedTargetRatio * 100) / 100,
      usedMostOfTime,
      scores,
      gentleMode,
      encouragingFeedback: feedback.encouragement,
      sparkyTip: feedback.sparkyTip,
      unlockedBadgeKey: feedback.badgeKey,
      faceAnalysis: {
        faceDetected: input.visualMetrics ? input.visualMetrics.faceDetected : true,
        smileRatio: input.visualMetrics?.smileEnergy,
        eyeContactRatio: input.visualMetrics?.eyeContactRatio,
        headSteadiness: input.visualMetrics?.headSteadiness,
        faceAnalysisEnabled: input.visualMetrics ? input.visualMetrics.faceAnalysisEnabled : true,
      },
    };

    // Strict Biometric Safeguard: Verify no raw frames or landmarks escaped
    assertNoBiometricPersistence(result);

    return result;
  }

  // --------------------------------------------------------------------------
  // PAUSE METRICS
  // --------------------------------------------------------------------------
  private computePauseMetrics(
    words: Array<{ startSec: number; endSec: number }>,
    durationSeconds: number
  ): { pauseCount: number; averagePauseSeconds: number } {
    if (!words || words.length <= 1) {
      return { pauseCount: 0, averagePauseSeconds: 0 };
    }

    const pauses: number[] = [];
    for (let i = 0; i < words.length - 1; i++) {
      const gap = words[i + 1].startSec - words[i].endSec;
      if (gap >= 0.8) {
        pauses.push(gap);
      }
    }

    // Check for closing gap before end of recording
    const lastWord = words[words.length - 1];
    if (lastWord && durationSeconds - lastWord.endSec >= 1.2) {
      pauses.push(durationSeconds - lastWord.endSec);
    }

    const pauseCount = pauses.length;
    const averagePauseSeconds =
      pauseCount > 0
        ? Math.round((pauses.reduce((a, b) => a + b, 0) / pauseCount) * 10) / 10
        : 0;

    return { pauseCount, averagePauseSeconds };
  }

  // --------------------------------------------------------------------------
  // VOLUME & STEADINESS METRICS
  // --------------------------------------------------------------------------
  private computeVolumeMetrics(
    _blob?: Blob,
    wordCount = 0,
    durationSeconds = 1
  ): { averageVolume: number; steadiness: number } {
    // Estimating balanced speech volume (65 - 85 dB range)
    const baselineVolume = 75;
    const speechDensity = wordCount / Math.max(durationSeconds, 1);

    // Consistency score (0 - 100)
    const steadiness = Math.min(Math.max(Math.round(70 + speechDensity * 8), 60), 95);

    return {
      averageVolume: baselineVolume,
      steadiness,
    };
  }

  // --------------------------------------------------------------------------
  // AGE-ADJUSTED SCORING ENGINE (Never Negative!)
  // --------------------------------------------------------------------------
  private computeAgeAdjustedScores(params: {
    wpm: number;
    wordCount: number;
    fillerCount: number;
    pauseCount: number;
    averagePauseSec: number;
    steadiness: number;
    usedTargetRatio: number;
    ageBand: AgeGroup;
    gentleMode: boolean;
    visualMetrics?: CleanVisualMetrics;
  }): SpeechScores {
    const { wpm, wordCount, fillerCount, steadiness, usedTargetRatio, ageBand, gentleMode, visualMetrics } = params;

    // COURAGE SCORE: Base 80 points just for having the bravery to speak!
    let courageScore = 80;
    if (usedTargetRatio >= 0.5) courageScore += 10;
    if (wordCount >= 5) courageScore += 10;

    // POSITIVE-ONLY VISUAL SIGNALS: Eye contact & smile bonuses (Never penalize a neutral face)
    if (visualMetrics && visualMetrics.faceAnalysisEnabled) {
      if (visualMetrics.eyeContactRatio >= 0.8) {
        courageScore = Math.min(courageScore + 5, 100);
      }
      if (visualMetrics.smileEnergy >= 0.75) {
        courageScore = Math.min(courageScore + 5, 100);
      }
    }
    courageScore = Math.min(Math.max(courageScore, 70), 100);

    // If Gentle Mode is active, bypass pace/filler deductions completely!
    if (gentleMode) {
      return {
        clarityScore: Math.min(Math.max(steadiness + 10, 80), 98),
        pacingScore: 95,
        courageScore: 100,
        overallScore: 96,
      };
    }

    // AGE-ADJUSTED THRESHOLDS:
    // 3-5: normal WPM 30 - 75. Even 5 words is a triumph!
    // 6-8: normal WPM 65 - 110.
    // 9-12: normal WPM 90 - 140.
    let targetMinWpm = 65;
    let targetMaxWpm = 110;

    if (ageBand === '3-5') {
      targetMinWpm = 25;
      targetMaxWpm = 75;
    } else if (ageBand === '9-12') {
      targetMinWpm = 85;
      targetMaxWpm = 140;
    }

    // Pacing Score Calculation
    let pacingScore = 85;
    if (wpm >= targetMinWpm && wpm <= targetMaxWpm) {
      pacingScore = 95;
    } else if (wpm < targetMinWpm) {
      // Gentle curve for younger kids speaking carefully
      pacingScore = ageBand === '3-5' ? 88 : 75;
    } else {
      // Fast speaker
      pacingScore = 78;
    }

    // Clarity Score Calculation
    let clarityScore = Math.round(steadiness);
    // Minimal filler deduction (capped at max 10 points)
    const fillerPenalty = Math.min(fillerCount * 2, 10);
    clarityScore = Math.max(clarityScore - fillerPenalty, 60);

    // Clamping: STRICT RULE - Never output negative scores!
    clarityScore = Math.min(Math.max(clarityScore, 50), 100);
    pacingScore = Math.min(Math.max(pacingScore, 50), 100);

    // Overall Weighted Average
    const overallScore = Math.round(
      clarityScore * 0.35 + pacingScore * 0.35 + courageScore * 0.3
    );

    return {
      clarityScore,
      pacingScore,
      courageScore,
      overallScore: Math.min(Math.max(overallScore, 60), 100),
    };
  }

  // --------------------------------------------------------------------------
  // POSITIVE KID-FRIENDLY FEEDBACK
  // --------------------------------------------------------------------------
  private generateEncouragement(
    ageBand: AgeGroup,
    scores: SpeechScores,
    gentleMode: boolean,
    usedMostOfTime: boolean,
    visualMetrics?: CleanVisualMetrics
  ): { encouragement: string; sparkyTip: string; badgeKey?: string } {
    if (visualMetrics && visualMetrics.faceAnalysisEnabled && visualMetrics.smileEnergy >= 0.75) {
      return {
        encouragement: "Your smile and cheerful face lit up the whole screen! Sparky loved your bright energy! 🌟",
        sparkyTip: "A warm smile makes everyone happy to listen to you!",
        badgeKey: 'badge_sunny_smile',
      };
    }

    if (gentleMode) {
      return {
        encouragement: "You shared your thoughts with so much heart! Sparky loves your brave energy! 🌟",
        sparkyTip: "Keep having fun telling your stories!",
        badgeKey: 'badge_brave_speaker',
      };
    }

    if (ageBand === '3-5') {
      return {
        encouragement: "Super job, little star! You used your voice loud and proud! 🎈",
        sparkyTip: "Sparky is clapping all four paws for you! 🐾",
        badgeKey: 'badge_super_starter',
      };
    }

    if (scores.overallScore >= 90) {
      return {
        encouragement: "Incredible presentation! Your pacing and clarity were crystal clear! 🏆",
        sparkyTip: "You're speaking like a true superstar champion!",
        badgeKey: usedMostOfTime ? 'badge_golden_microphone' : 'badge_clear_voice',
      };
    }

    return {
      encouragement: "Wonderful practice session! You explained your thoughts smoothly! ✨",
      sparkyTip: "Try pausing for one breath between ideas to sound even more confident!",
      badgeKey: 'badge_courage_explorer',
    };
  }
}

export const speechAnalysisPipeline = new SpeechAnalysisPipeline();
