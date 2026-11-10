/**
 * Speech Analysis Pipeline Unit Tests
 * Verifies:
 * 1. Speech-to-text transcript computation (WPM, fillers, pauses, volume steadiness, duration ratio)
 * 2. Age-adjusted thresholds (preschoolers 3-5 praised for short speech)
 * 3. Gentle mode (ignores pacing and filler penalties)
 * 4. Strictly non-negative scores (clamped positive values)
 * 5. Automatic PII scrubbing on all outputs
 * 6. Pluggable STT provider architecture
 */

import { describe, it, expect } from 'vitest';
import { SpeechAnalysisPipeline } from '../src/services/speech/speechAnalysisPipeline';

describe('Speech Analysis Pipeline & Age Adjustments', () => {
  const pipeline = new SpeechAnalysisPipeline();

  it('computes WPM, filler words, pauses, and time utilization accurately', async () => {
    const transcript =
      'I like lions because they are strong. Um, like they have big paws and they roar very loud. Uh, that is all.';

    const result = await pipeline.analyzeSpeech({
      rawTranscript: transcript,
      durationSeconds: 30,
      targetDuration: 30,
      ageBand: '6-8',
      gentleMode: false,
    });

    // 21 words in 30 seconds (0.5 mins) = ~42 WPM
    expect(result.wpm).toBeGreaterThan(30);
    expect(result.wpm).toBeLessThan(60);

    // Filler words detected (um, like, uh)
    expect(result.fillerWordsCount).toBeGreaterThanOrEqual(2);
    expect(result.fillerWords).toContain('um');
    expect(result.fillerWords).toContain('like');

    // Time ratio: 30s / 30s = 1.0 (100% time used)
    expect(result.usedTargetRatio).toBe(1.0);
    expect(result.usedMostOfTime).toBe(true);

    // Non-negative scores
    expect(result.scores.clarityScore).toBeGreaterThanOrEqual(50);
    expect(result.scores.pacingScore).toBeGreaterThanOrEqual(50);
    expect(result.scores.courageScore).toBeGreaterThanOrEqual(70);
    expect(result.scores.overallScore).toBeGreaterThanOrEqual(60);
  });

  it('AGE-ADJUSTED: Praises a 3-year-old child for a short 6-word speech', async () => {
    const toddlerSpeech = 'I love my little blue car.';

    const result = await pipeline.analyzeSpeech({
      rawTranscript: toddlerSpeech,
      durationSeconds: 15,
      targetDuration: 30,
      ageBand: '3-5',
      gentleMode: false,
    });

    // Word count is small, but for 3-5 it should receive encouraging high marks
    expect(result.scores.courageScore).toBeGreaterThanOrEqual(80);
    expect(result.scores.pacingScore).toBeGreaterThanOrEqual(80);
    expect(result.scores.overallScore).toBeGreaterThanOrEqual(75);
    expect(result.encouragingFeedback).toContain('little star');
  });

  it('GENTLE MODE: Completely ignores pacing and filler words', async () => {
    const nervousSpeech =
      'Um, like, er, I think, um, like cats are nice, you know, um, yeah.';

    const standardResult = await pipeline.analyzeSpeech({
      rawTranscript: nervousSpeech,
      durationSeconds: 20,
      targetDuration: 60,
      ageBand: '6-8',
      gentleMode: false,
    });

    const gentleResult = await pipeline.analyzeSpeech({
      rawTranscript: nervousSpeech,
      durationSeconds: 20,
      targetDuration: 60,
      ageBand: '6-8',
      gentleMode: true,
    });

    // In gentle mode, pacing is set to 95 and overall score is maximum celebratory
    expect(gentleResult.scores.pacingScore).toBe(95);
    expect(gentleResult.scores.courageScore).toBe(100);
    expect(gentleResult.scores.overallScore).toBeGreaterThanOrEqual(standardResult.scores.overallScore);
    expect(gentleResult.encouragingFeedback).toContain('brave energy');
  });

  it('NEVER OUTPUT NEGATIVE SCORES: Clamps scores to positive bounds even for 0-word empty sessions', async () => {
    const emptySpeech = '';

    const result = await pipeline.analyzeSpeech({
      rawTranscript: emptySpeech,
      durationSeconds: 5,
      targetDuration: 60,
      ageBand: '9-12',
      gentleMode: false,
    });

    expect(result.scores.clarityScore).toBeGreaterThanOrEqual(50);
    expect(result.scores.pacingScore).toBeGreaterThanOrEqual(50);
    expect(result.scores.courageScore).toBeGreaterThanOrEqual(70);
    expect(result.scores.overallScore).toBeGreaterThanOrEqual(60);
  });

  it('AUTOMATIC PII SCRUBBING: Replaces sensitive names and schools inside pipeline output', async () => {
    const rawSpeech =
      'My name is Sophia and I go to Oakridge Elementary School in London.';

    const result = await pipeline.analyzeSpeech({
      rawTranscript: rawSpeech,
      durationSeconds: 20,
      targetDuration: 30,
      ageBand: '6-8',
    });

    expect(result.scrubbedTranscript).toContain('[NAME]');
    expect(result.scrubbedTranscript).toContain('[SCHOOL]');
    expect(result.scrubbedTranscript).toContain('[CITY]');
    expect(result.scrubbedTranscript).not.toContain('Sophia');
    expect(result.scrubbedTranscript).not.toContain('Oakridge Elementary School');
    expect(result.scrubbedTranscript).not.toContain('London');
    expect(result.detectedPIICount).toBeGreaterThanOrEqual(3);
  });

  it('MODULAR STT PROVIDERS: Easily swaps from WebSpeech to Whisper provider', async () => {
    const customPipeline = new SpeechAnalysisPipeline('whisper');
    const result = await customPipeline.analyzeSpeech({
      rawTranscript: 'Speaking about planets and galaxies.',
      durationSeconds: 15,
      targetDuration: 30,
      ageBand: '9-12',
    });

    expect(result.wordCount).toBe(5);
    expect(result.faceAnalysis).toBeDefined();
    expect(result.faceAnalysis?.faceDetected).toBe(true);
  });
});
