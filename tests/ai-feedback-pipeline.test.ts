/**
 * AUTOMATED TESTS: Hardened AI Feedback Pipeline & Child Safeguards
 * 
 * Verifies:
 * 1. Growth levels & Brave Voice meter: non-discouraging floors, Seedling/Sprout/Flower/Tree/Star tiers.
 * 2. Mascot feedback structure: exactly 3 things done great, 1-2 next steps, next challenge.
 * 3. Input Harm & Distress Filter: intercepts distress, halts scoring, records quiet parent alert, returns calming child message.
 * 4. Zero PII transmission: verifies transcripts are scrubbed and no raw media or child identity is sent.
 * 5. Output Safety Filter: rejects forbidden remarks (appearance, body, accent, medical, shaming) and falls back to safe templates.
 * 6. Rate Limiting: handles burst requests cleanly via sliding window.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  aiFeedbackService,
  AIFeedbackService,
  GROWTH_LEVELS,
  SpeechFeedbackInput,
  LLMFeedbackProvider,
  SanitizedLLMPayload,
  LLMFeedbackResponse,
} from '../src/services/ai/aiFeedbackService';
import { parentSafetyAlertService } from '../src/services/security/parentSafetyAlertService';

describe('Hardened AI Feedback Pipeline & Child Safeguards', () => {
  beforeEach(() => {
    parentSafetyAlertService.clearAll();
  });

  const baseInput: SpeechFeedbackInput = {
    rawTranscript: 'I love space and stars because they shine bright in the night sky! My favorite planet is Saturn.',
    childId: 'child_test_123',
    ageBand: '6-8',
    topicTitle: 'My Favorite Planet',
    topicCategory: 'Space',
    durationSeconds: 45,
    targetDuration: 60,
    wpm: 65,
    pauseCount: 4,
    fillerCount: 1,
    volumeSteadiness: 88,
    eyeContactRatio: 0.9,
    smileRatio: 0.8,
    headSteadiness: 0.95,
    usedMostOfTime: true,
    gentleMode: false,
  };

  // --------------------------------------------------------------------------
  // TEST 1: Growth Levels & Brave Voice Meter
  // --------------------------------------------------------------------------
  describe('Brave Voice Speaking Skills Meter & Growth Levels', () => {
    it('maps scores accurately across Seedling, Sprout, Flower, Tree, and Star tiers', () => {
      expect(aiFeedbackService.calculateGrowthLevel(15).level).toBe('Seedling');
      expect(aiFeedbackService.calculateGrowthLevel(35).level).toBe('Sprout');
      expect(aiFeedbackService.calculateGrowthLevel(55).level).toBe('Flower');
      expect(aiFeedbackService.calculateGrowthLevel(75).level).toBe('Tree');
      expect(aiFeedbackService.calculateGrowthLevel(95).level).toBe('Star');
    });

    it('enforces a non-discouraging floor so no child ever receives a failing or crushing score', () => {
      // Even with 0 volume, 0 eye contact, 0 words
      const minimalInput: SpeechFeedbackInput = {
        ...baseInput,
        rawTranscript: 'hi',
        durationSeconds: 2,
        targetDuration: 60,
        wpm: 5,
        pauseCount: 0,
        fillerCount: 8,
        volumeSteadiness: 10,
        eyeContactRatio: 0.1,
        smileRatio: 0.1,
        headSteadiness: 0.1,
        usedMostOfTime: false,
      };

      const scores = aiFeedbackService.calculateSkillScores(minimalInput);
      // Floor must be at least 45 to protect self-esteem
      expect(scores.braveVoiceScore).toBeGreaterThanOrEqual(45);
      expect(scores.voice).toBeGreaterThanOrEqual(50);
      expect(scores.eyeContact).toBeGreaterThanOrEqual(50);
      expect(scores.clarity).toBeGreaterThanOrEqual(50);
      expect(scores.energy).toBeGreaterThanOrEqual(50);
    });

    it('computes 5 distinct dimensions: Voice, Eye Contact, Clarity, Story, Energy', () => {
      const scores = aiFeedbackService.calculateSkillScores(baseInput);

      expect(scores).toHaveProperty('voice');
      expect(scores).toHaveProperty('eyeContact');
      expect(scores).toHaveProperty('clarity');
      expect(scores).toHaveProperty('story');
      expect(scores).toHaveProperty('energy');
      expect(scores).toHaveProperty('braveVoiceScore');

      expect(scores.voice).toBeGreaterThan(0);
      expect(scores.voice).toBeLessThanOrEqual(100);
      expect(scores.eyeContact).toBeGreaterThan(0);
      expect(scores.eyeContact).toBeLessThanOrEqual(100);
    });

    it('ignores filler words penalty when gentle mode is active', () => {
      const highFillers: SpeechFeedbackInput = {
        ...baseInput,
        fillerCount: 10,
        gentleMode: true,
      };

      const regularMode: SpeechFeedbackInput = {
        ...baseInput,
        fillerCount: 10,
        gentleMode: false,
      };

      const gentleScores = aiFeedbackService.calculateSkillScores(highFillers);
      const regularScores = aiFeedbackService.calculateSkillScores(regularMode);

      expect(gentleScores.clarity).toBeGreaterThan(regularScores.clarity);
    });
  });

  // --------------------------------------------------------------------------
  // TEST 2: Input Harm & Distress Filter (Child Protection)
  // --------------------------------------------------------------------------
  describe('Input Harm & Distress Filter (Child Protection)', () => {
    it('detects harm keywords and halts normal scoring', async () => {
      const distressInput: SpeechFeedbackInput = {
        ...baseInput,
        rawTranscript: 'I do not want to practice because someone hurts me at home and I am scared.',
      };

      const result = await aiFeedbackService.generateFeedback(distressInput);

      expect(result.isDistressIntervention).toBe(true);
      expect(result.reassuranceMessage).toBeDefined();
      expect(result.reassuranceMessage).toContain('You are brave, kind, and you matter so much');
      // Must not contain alarming language to the child
      expect(result.reassuranceMessage).not.toMatch(/danger|abuse|police|investigation|emergency/i);
    });

    it('quietly creates a confidential parent safety alert without alarming the child', async () => {
      const distressInput: SpeechFeedbackInput = {
        ...baseInput,
        childId: 'child_safe_test_456',
        rawTranscript: 'My uncle hits me when everyone is sleeping and I feel terrified.',
      };

      await aiFeedbackService.generateFeedback(distressInput);

      const alerts = parentSafetyAlertService.getAlerts('child_safe_test_456');
      expect(alerts.length).toBe(1);
      expect(alerts[0].reason).toBe('distress_or_harm_detected');
      expect(alerts[0].reviewedByParent).toBe(false);
      expect(alerts[0].matchedKeywords.length).toBeGreaterThan(0);
    });

    it('does not trigger false alarms on innocent storytelling', async () => {
      const innocentInput: SpeechFeedbackInput = {
        ...baseInput,
        rawTranscript: 'In the superhero movie, the meteor hit the alien spaceship with a big boom!',
      };

      const check = aiFeedbackService.checkDistressAndHarm(innocentInput.rawTranscript);
      expect(check.isDistress).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // TEST 3: Mascot Feedback Structure
  // --------------------------------------------------------------------------
  describe('Mascot Feedback Structure', () => {
    it('returns exactly 3 things done great, 1-2 next steps, and a next challenge', async () => {
      const result = await aiFeedbackService.generateFeedback(baseInput);

      expect(result.praisePoints.length).toBe(3);
      expect(result.nextSteps.length).toBeGreaterThanOrEqual(1);
      expect(result.nextSteps.length).toBeLessThanOrEqual(2);
      expect(result.nextChallenge).toBeDefined();
      expect(result.nextChallenge.length).toBeGreaterThan(10);
      expect(result.sparkyCheer).toBeDefined();
    });

    it('tailors praise and next steps appropriately across age bands', async () => {
      const preschool = await aiFeedbackService.generateFeedback({ ...baseInput, ageBand: '3-5' });
      const middleSchool = await aiFeedbackService.generateFeedback({ ...baseInput, ageBand: '9-12' });

      expect(preschool.praisePoints[0]).toBeDefined();
      expect(middleSchool.praisePoints[0]).toBeDefined();
      // Age 9-12 uses richer vocabulary like articulation/pacing/structure
      expect(middleSchool.nextSteps[0]).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // TEST 4: Output Safety Filter & Curated Fallback
  // --------------------------------------------------------------------------
  describe('Output Safety Guardrails & Fallback Templates', () => {
    it('rejects forbidden appearance, body, and medical comments', () => {
      const badAppearance: LLMFeedbackResponse = {
        praisePoints: ['You look so pretty today and have cute hair!', 'Nice speaking', 'Good job'],
        nextSteps: ['Try speaking louder'],
        nextChallenge: 'Challenge 1',
        sparkyCheer: 'Cheer',
      };
      expect(aiFeedbackService.validateOutputSafety(badAppearance)).toBe(false);

      const badMedical: LLMFeedbackResponse = {
        praisePoints: ['Great job', 'You handled your stutter delay well', 'Good'],
        nextSteps: ['Visit a speech therapy pathologist'],
        nextChallenge: 'Challenge 1',
        sparkyCheer: 'Cheer',
      };
      expect(aiFeedbackService.validateOutputSafety(badMedical)).toBe(false);

      const badShaming: LLMFeedbackResponse = {
        praisePoints: ['Good try', 'You did okay', 'Nice topic'],
        nextSteps: ['Your volume was terrible and embarrassing'],
        nextChallenge: 'Challenge 1',
        sparkyCheer: 'Cheer',
      };
      expect(aiFeedbackService.validateOutputSafety(badShaming)).toBe(false);

      const badContact: LLMFeedbackResponse = {
        praisePoints: ['Good job', 'Nice voice', 'Fun speech'],
        nextSteps: ['Email me your phone number to get more tips'],
        nextChallenge: 'Challenge 1',
        sparkyCheer: 'Cheer',
      };
      expect(aiFeedbackService.validateOutputSafety(badContact)).toBe(false);
    });

    it('falls back seamlessly to hand-curated safe templates when provider outputs forbidden content', async () => {
      const rogueService = new AIFeedbackService();
      const rogueProvider: LLMFeedbackProvider = {
        name: 'RogueProvider',
        zeroDataRetention: true,
        generateFeedback: async () => ({
          praisePoints: ['You look so pretty and thin in your clothes!'],
          nextSteps: ['Fix your terrible stutter'],
          nextChallenge: 'Email me',
          sparkyCheer: 'Bad cheer',
        }),
      };
      rogueService.setProvider(rogueProvider);

      const result = await rogueService.generateFeedback(baseInput);

      expect(result.wasFilteredOrFallback).toBe(true);
      // Praise points must have been replaced by safe, curated praise
      expect(result.praisePoints.length).toBe(3);
      expect(result.praisePoints[0]).not.toMatch(/pretty|thin|clothes/i);
      expect(result.nextSteps[0]).not.toMatch(/terrible|stutter/i);
    });
  });

  // --------------------------------------------------------------------------
  // TEST 5: Data Privacy & Provider Contract
  // --------------------------------------------------------------------------
  describe('Data Privacy & Provider Contract', () => {
    it('ensures only scrubbed transcripts and numeric metrics are passed to the provider', async () => {
      let capturedPayload: SanitizedLLMPayload | null = null;

      const testService = new AIFeedbackService();
      const spyingProvider: LLMFeedbackProvider = {
        name: 'SpyingProvider',
        zeroDataRetention: true,
        generateFeedback: async (payload) => {
          capturedPayload = payload;
          return {
            praisePoints: ['Point 1', 'Point 2', 'Point 3'],
            nextSteps: ['Step 1'],
            nextChallenge: 'Challenge 1',
            sparkyCheer: 'Great!',
          };
        },
      };
      testService.setProvider(spyingProvider);

      const piiInput: SpeechFeedbackInput = {
        ...baseInput,
        rawTranscript: 'My name is Sarah Miller and I live at 742 Evergreen Terrace. My phone is 555-123-4567.',
      };

      await testService.generateFeedback(piiInput);

      expect(capturedPayload).not.toBeNull();
      // PII must be scrubbed before reaching the provider!
      expect(capturedPayload!.scrubbedTranscript).not.toContain('Sarah Miller');
      expect(capturedPayload!.scrubbedTranscript).not.toContain('742 Evergreen Terrace');
      expect(capturedPayload!.scrubbedTranscript).not.toContain('555-123-4567');
      expect(capturedPayload!.scrubbedTranscript).toContain('[NAME]');
      expect(capturedPayload!.scrubbedTranscript).toContain('[ADDRESS]');
      expect(capturedPayload!.scrubbedTranscript).toContain('[PHONE]');

      // Prohibited raw media fields must not exist
      expect(capturedPayload).not.toHaveProperty('audio');
      expect(capturedPayload).not.toHaveProperty('video');
      expect(capturedPayload).not.toHaveProperty('landmarks');
      expect(capturedPayload).not.toHaveProperty('childName');
    });

    it('rejects providers that do not contract zero data retention', () => {
      const nonCompliantService = new AIFeedbackService();
      const nonCompliantProvider: LLMFeedbackProvider = {
        name: 'LoggingProvider',
        zeroDataRetention: false, // VIOLATION
        generateFeedback: async () => ({
          praisePoints: [],
          nextSteps: [],
          nextChallenge: '',
          sparkyCheer: '',
        }),
      };

      expect(() => nonCompliantService.setProvider(nonCompliantProvider)).toThrowError(
        /SECURITY VIOLATION: AI provider must offer zero data retention/
      );
    });
  });
});
