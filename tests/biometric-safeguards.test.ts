/**
 * Biometric Safeguards & On-Device Visual Analysis Unit Tests
 * Strictly verifies PRIVACY_RULES.md (Rule 1, Rule 2, Rule 3, Rule 5)
 *
 * Verifies:
 * 1. Function-level guard: Fails if any code tries to persist frames, landmarks, or embeddings.
 * 2. Instant landmark & frame discard: Only temporary scalar numbers are retained.
 * 3. Positive-only signals: Neutral faces are NEVER penalized.
 * 4. Parent control: "Turn off face analysis" (Voice-Only Mode) bypasses camera analysis completely.
 * 5. Parent-facing explanation: Covers all essential privacy guarantees.
 * 6. Performance fallback: Skips analysis safely on slow devices while producing results.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  assertNoBiometricPersistence,
  sanitizeVisualMetrics,
  BiometricStorageViolationError,
} from '../src/services/security/biometricGuards';
import { parentSettingsService, PARENT_EXPLANATION } from '../src/services/settings/parentSettingsService';
import { faceAnalysisService } from '../src/services/vision/faceAnalysisService';
import { speechAnalysisPipeline } from '../src/services/speech/speechAnalysisPipeline';

const store = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => store.get(key) || null,
  setItem: (key: string, value: string) => store.set(key, value),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
};
// @ts-expect-error polyfill for Node test runner
globalThis.localStorage = mockLocalStorage;

describe('Biometric Safeguards & Runtime Anti-Persistence Guard', () => {
  beforeEach(() => {
    store.clear();
  });

  it('FUNCTION GUARD: Throws BiometricStorageViolationError on forbidden biometric keys', () => {
    // Attempting to persist raw landmarks
    expect(() =>
      assertNoBiometricPersistence({
        sessionId: 'test_1',
        landmarks: [{ x: 0.1, y: 0.2, z: 0.3 }],
      })
    ).toThrow(BiometricStorageViolationError);

    // Attempting to persist face embeddings
    expect(() =>
      assertNoBiometricPersistence({
        sessionId: 'test_2',
        faceEmbedding: [0.12, 0.45, -0.88, 0.99],
      })
    ).toThrow(BiometricStorageViolationError);

    // Attempting to persist raw video frames
    expect(() =>
      assertNoBiometricPersistence({
        sessionId: 'test_3',
        rawFrame: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
      })
    ).toThrow(BiometricStorageViolationError);

    // Attempting to persist voiceprints
    expect(() =>
      assertNoBiometricPersistence({
        sessionId: 'test_4',
        voiceprint: [12.4, 45.2, 88.1],
      })
    ).toThrow(BiometricStorageViolationError);
  });

  it('FUNCTION GUARD: Throws on raw coordinate arrays without named keys', () => {
    const rawLandmarkCoordinates = Array.from({ length: 20 }, (_, i) => ({
      x: i * 0.05,
      y: i * 0.05,
      z: 0.01,
    }));

    expect(() => assertNoBiometricPersistence(rawLandmarkCoordinates)).toThrow(
      BiometricStorageViolationError
    );
  });

  it('CLEAN EXTRACTION: Discards landmarks immediately and permits only clean scalar numbers', () => {
    const rawMetrics = {
      faceDetected: true,
      eyeContactRatio: 0.88,
      headSteadiness: 0.92,
      smileEnergy: 0.84,
      sampledFramesCount: 15,
      // Rogue landmark data attached by accident
      rogueLandmarks: [{ x: 1, y: 2 }],
    };

    // sanitizeVisualMetrics extracts ONLY scalar numbers and purges rogue fields
    const sanitized = sanitizeVisualMetrics(rawMetrics);

    expect(sanitized.eyeContactRatio).toBe(0.88);
    expect(sanitized.headSteadiness).toBe(0.92);
    expect(sanitized.smileEnergy).toBe(0.84);
    expect(sanitized.faceDetected).toBe(true);

    // Confirm rogue landmarks field is completely gone
    expect('rogueLandmarks' in sanitized).toBe(false);
    expect(() => assertNoBiometricPersistence(sanitized)).not.toThrow();
  });
});

describe('Positive-Only Visual Scoring & Neutral Face Protection', () => {
  it('POSITIVE-ONLY: A neutral face receives ZERO score deductions', async () => {
    const speech = 'I really like building LEGO castles and spaceships.';

    // Run without visual metrics (baseline)
    const baseline = await speechAnalysisPipeline.analyzeSpeech({
      rawTranscript: speech,
      durationSeconds: 20,
      targetDuration: 30,
      ageBand: '6-8',
      gentleMode: false,
    });

    // Run with a completely neutral / unsmiling face (smile = 0.0, normal eye contact = 0.7)
    const neutralFace = await speechAnalysisPipeline.analyzeSpeech({
      rawTranscript: speech,
      durationSeconds: 20,
      targetDuration: 30,
      ageBand: '6-8',
      gentleMode: false,
      visualMetrics: {
        faceDetected: true,
        eyeContactRatio: 0.7,
        headSteadiness: 0.85,
        smileEnergy: 0.0, // Serious / neutral face
        sampledFramesCount: 10,
        faceAnalysisEnabled: true,
      },
    });

    // Score must NEVER decrease due to a serious or neutral face!
    expect(neutralFace.scores.clarityScore).toBeGreaterThanOrEqual(baseline.scores.clarityScore);
    expect(neutralFace.scores.courageScore).toBeGreaterThanOrEqual(baseline.scores.courageScore);
    expect(neutralFace.scores.overallScore).toBeGreaterThanOrEqual(baseline.scores.overallScore);
  });

  it('POSITIVE-ONLY: Cheerful smile & camera focus grant positive bonuses', async () => {
    const speech = 'I really like building LEGO castles and spaceships.';

    const smilingFace = await speechAnalysisPipeline.analyzeSpeech({
      rawTranscript: speech,
      durationSeconds: 20,
      targetDuration: 30,
      ageBand: '6-8',
      gentleMode: false,
      visualMetrics: {
        faceDetected: true,
        eyeContactRatio: 0.9,
        headSteadiness: 0.95,
        smileEnergy: 0.85, // Big warm smile!
        sampledFramesCount: 10,
        faceAnalysisEnabled: true,
      },
    });

    // Smile triggers the Sunny Smile badge
    expect(smilingFace.unlockedBadgeKey).toBe('badge_sunny_smile');
    expect(smilingFace.scores.courageScore).toBeGreaterThanOrEqual(85);
  });
});

describe('Parent Control: Turn Off Face Analysis (Voice-Only Mode)', () => {
  it('PARENT SETTING: Turning off face analysis bypasses camera analysis completely', () => {
    parentSettingsService.setFaceAnalysisEnabled(false);
    expect(parentSettingsService.isFaceAnalysisEnabled()).toBe(false);

    // Service returns voice-only mode immediately without sampling frames
    const result = faceAnalysisService.stopSession();
    expect(result.faceAnalysisEnabled).toBe(false);
    expect(result.sampledFramesCount).toBe(0);
    expect(result.performanceMessage).toContain('Voice-Only Mode');

    // Reset setting
    parentSettingsService.setFaceAnalysisEnabled(true);
  });

  it('PARENT EXPLANATION: Clearly explains on-device processing and zero face identification', () => {
    const explanation = parentSettingsService.getExplanation();

    expect(explanation.title).toContain('Face');
    expect(explanation.shortSummary).toContain('never saved');

    const combinedText = explanation.bulletPoints.map((b) => `${b.title} ${b.text}`).join(' ');

    // Must mention positive-only signals and never penalizing
    expect(combinedText).toContain('NEVER penalized');
    // Must mention immediate discard
    expect(combinedText).toContain('immediately erased');
    // Must state zero biometric identification
    expect(combinedText).toContain('Zero Biometric Identification');
    expect(combinedText).toContain('recognize or identify');
    // Must mention Voice-Only Mode
    expect(combinedText).toContain('Voice-Only Mode');
  });

  it('PERFORMANCE FALLBACK: Produces encouraging fallback results on slow devices', () => {
    // Manually trigger performance fallback state
    // @ts-expect-error accessing private property for testing
    faceAnalysisService.performanceFallbackActive = true;

    const result = faceAnalysisService.stopSession();
    expect(result.performanceFallbackActive).toBe(true);
    expect(result.performanceMessage).toContain('Performance fallback');
    expect(result.eyeContactRatio).toBeGreaterThanOrEqual(0.8);
    expect(result.headSteadiness).toBeGreaterThanOrEqual(0.8);

    // Confirm no leaked landmarks
    expect(() => assertNoBiometricPersistence(result)).not.toThrow();
  });
});
