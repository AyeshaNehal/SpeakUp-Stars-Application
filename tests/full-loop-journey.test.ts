/**
 * SpeakUp Stars — Full Loop Journey & Privacy Verification Test Suite
 * 
 * Tests the complete end-to-end flow:
 * 1. Parent signup & PIN setup
 * 2. Verifiable Parental Consent (VPC)
 * 3. Child onboarding (nickname & age band only)
 * 4. Topic selection / Spin the wheel
 * 5. Prep & warm-ups
 * 6. Record (on-device audio/video, hardware release)
 * 7. AI Analysis (harm/distress filter, PII scrubbing, safe output)
 * 8. Results & Brave Voice scoring
 * 9. Rewards & Shop progression
 * 10. Parent Dashboard (PIN gate, data inspection, JSON/CSV export, deletion, retention)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { parentAuthService } from '../src/services/auth/parentAuthService';
import { getTopicsByAgeBand, getRandomTopic } from '../src/services/topics/topicService';
import { speechAnalysisPipeline } from '../src/services/speech/speechAnalysisPipeline';
import { aiFeedbackService } from '../src/services/ai/aiFeedbackService';
import { rewardsService } from '../src/services/rewards/rewardsService';
import { parentDashboardService } from '../src/services/dashboard/parentDashboardService';
import { recordingStorageService } from '../src/services/storage/recordingStorageService';
import { dataRetentionService } from '../src/services/retention/dataRetentionService';
import { scrubPII } from '../src/services/security/piiScrubber';
import { scrubText } from '../src/services/logger';

describe('Full Loop End-to-End Journey & Child Safety Suite', () => {
  const testParentEmail = `parent_${Date.now()}@example.com`;
  const testParentPin = '4826';
  let createdParentId = '';
  let createdChildId = '';

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('Step 1 & 2: Parent Signup and Verifiable Parental Consent (VPC)', async () => {
    // 1. Sign up parent
    const signupRes = await parentAuthService.parentSignUp(
      testParentEmail,
      'SuperSecretP@ss1',
      testParentPin
    );
    expect(signupRes.success).toBe(true);
    expect(signupRes.parent).toBeDefined();
    createdParentId = signupRes.parent!.id;

    // 2. Submit Verifiable Parental Consent (VPC)
    const consentRes = await parentAuthService.submitParentalConsent(
      createdParentId,
      testParentEmail,
      {
        metricsProcessing: true,
        storeRecordings: false, // Default strictly OFF
        emailSummaries: false,
      },
      'signed_econsent'
    );

    expect(consentRes.success).toBe(true);
    expect(consentRes.consentRecord).toBeDefined();
    expect(consentRes.consentRecord?.consentStoreRecordings).toBe(false);
    expect(consentRes.consentRecord?.verificationReference).toMatch(/^VPC-/);
  });

  it('Step 3: Child Onboarding (Strict Data Minimization: Nickname + Age Band only)', async () => {
    const signupRes = await parentAuthService.parentSignUp(
      `parent_step3_${Date.now()}@example.com`,
      'SecurePass123!',
      '1234'
    );
    const parentId = signupRes.parent!.id;

    // Reject invalid inputs (full name, email, or over 30 chars)
    const invalidProfile = await parentAuthService.createChildProfile(
      parentId,
      'Johnathan Smith Jr from Lincoln Elementary school',
      '6-8',
      '🦁'
    );
    expect(invalidProfile.success).toBe(false);

    // Accept valid nickname & age band
    const validProfile = await parentAuthService.createChildProfile(
      parentId,
      'Leo',
      '6-8',
      '🦁'
    );
    expect(validProfile.success).toBe(true);
    expect(validProfile.child?.nickname).toBe('Leo');
    expect(validProfile.child?.ageBand).toBe('6-8');
    createdChildId = validProfile.child!.id;
  });

  it('Step 4 & 5: Spin the Wheel & Prep stage (Curated age-appropriate topics)', () => {
    const topics3to5 = getTopicsByAgeBand('3-5');
    const topics6to8 = getTopicsByAgeBand('6-8');
    const topics9to12 = getTopicsByAgeBand('9-12');

    expect(topics3to5.length).toBeGreaterThanOrEqual(10);
    expect(topics6to8.length).toBeGreaterThanOrEqual(10);
    expect(topics9to12.length).toBeGreaterThanOrEqual(10);

    const topic = getRandomTopic('6-8');
    expect(topic.title).toBeDefined();
    expect(topic.helperPrompts).toBeDefined();
    expect(topic.helperPrompts.length).toBeGreaterThan(0);
  });

  it('Step 6: Recording & Hardware Media Lifecycle (Default zero upload)', async () => {
    const mockAudioBlob = new Blob(['mock audio binary bytes'], { type: 'audio/webm' });

    // When consentStoreRecordings is FALSE (default):
    const unconsentedConsent = {
      id: 'cons_1',
      parentId: 'p1',
      policyVersion: '2026.1',
      consentMetricsProcessing: true,
      consentStoreRecordings: false,
      consentEmailSummaries: false,
      verificationMethod: 'signed_econsent',
      verificationReference: 'VPC-123',
      withdrawnAt: null,
      createdAt: new Date().toISOString(),
    };

    const discardResult = await recordingStorageService.storeRecordingIfOptedIn({
      blob: mockAudioBlob,
      sessionId: 'sess_unconsented_1',
      parentId: 'p1',
      childId: 'c1',
      durationSeconds: 45,
      consent: unconsentedConsent,
    });

    expect(discardResult.stored).toBe(false);
    expect(discardResult.reason).toBe('parent_opt_in_required');

    // When parent explicitly opts in:
    const consentedRecord = {
      ...unconsentedConsent,
      consentStoreRecordings: true,
    };

    const storedResult = await recordingStorageService.storeRecordingIfOptedIn({
      blob: mockAudioBlob,
      sessionId: 'sess_consented_1',
      parentId: 'p1',
      childId: 'c1',
      durationSeconds: 45,
      consent: consentedRecord,
    });

    expect(storedResult.stored).toBe(true);
    expect(storedResult.metadata?.signedUrl).toBeDefined();
  });

  it('Step 7 & 8: Speech Analysis, PII Scrubbing, AI Feedback & Brave Voice Scoring', async () => {
    const rawSpeechWithPII =
      'Hello my name is Alexander Hamilton and I live at 500 Market Street in San Francisco. My school is Jefferson Elementary and I am 8 years old! Today I want to tell you about my trip to Mars!';

    // PII scrubber replaces identifiable data
    const scrubbed = scrubPII(rawSpeechWithPII);
    expect(scrubbed).not.toContain('Alexander Hamilton');
    expect(scrubbed).not.toContain('500 Market Street');
    expect(scrubbed).toContain('[NAME]');
    expect(scrubbed).toContain('[ADDRESS]');

    // Analysis Pipeline computes 5 skill dimensions
    const analysis = await speechAnalysisPipeline.analyzeSpeech({
      rawTranscript: scrubbed,
      durationSeconds: 45,
      targetDuration: 60,
      ageBand: '6-8',
      gentleMode: false,
    });

    expect(analysis.wpm).toBeGreaterThan(0);
    expect(analysis.scores.overallScore).toBeGreaterThanOrEqual(0);
    expect(analysis.scores.overallScore).toBeLessThanOrEqual(100);

    // AI Feedback Service generates encouraging coaching points
    const feedback = await aiFeedbackService.generateFeedback({
      rawTranscript: scrubbed,
      childId: 'child_test_1',
      ageBand: '6-8',
      topicTitle: 'My Trip to Mars',
      durationSeconds: 45,
      targetDuration: 60,
      wpm: analysis.wpm,
      pauseCount: analysis.pauseCount,
      fillerCount: analysis.fillerWordsCount,
      volumeSteadiness: analysis.volumeSteadiness,
      usedMostOfTime: analysis.usedMostOfTime,
    });

    expect(feedback.growthLevel).toBeDefined();
    expect(feedback.praisePoints.length).toBe(3);
    expect(feedback.nextSteps.length).toBeGreaterThanOrEqual(1);
    expect(feedback.sparkyCheer).toBeDefined();
    expect(feedback.isDistressIntervention).toBeFalsy();
  });

  it('Step 9: Gamified Rewards (Star points, streaks, badges, shop)', () => {
    const cid = 'child_gamified_1';

    // Award points
    rewardsService.awardPoints(cid, 'finish_recording', 25);
    rewardsService.awardPoints(cid, 'spin_wheel', 15);
    expect(rewardsService.getPoints(cid)).toBe(40);

    // Unlock badge
    rewardsService.unlockBadge(cid, 'first_speech');
    const badges = rewardsService.getBadges(cid);
    const firstSpeechBadge = badges.find((b) => b.key === 'first_speech');
    expect(firstSpeechBadge?.unlocked).toBe(true);

    // Equip item
    const shopItems = rewardsService.getShopItems(cid);
    const defaultHat = shopItems.find((item) => item.type === 'hat' && item.costPoints === 0);
    if (defaultHat) {
      const equipped = rewardsService.equipItem(cid, defaultHat.id);
      expect(equipped.hat).toBe(defaultHat.id);
    }
  });

  it('Step 10: Parent Dashboard (PIN verification, export, deletion & retention)', async () => {
    const parentId = 'parent_dash_test_1';
    const childId = 'child_dash_test_1';

    // 1. Record session
    const recorded = parentDashboardService.recordSession({
      sessionId: 'sess_audit_test_1',
      parentId,
      childId,
      topicTitle: 'My Superpower',
      durationSeconds: 50,
      targetDurationSeconds: 60,
      wpm: 90,
      pauseCount: 2,
      fillerCount: 1,
      volumeSteadiness: 0.85,
      braveVoiceScore: 88,
      rawTranscript: 'If I had a superpower I would fly to the moon and say hi to the stars.',
      scrubbedTranscript: 'If I had a superpower I would fly to the moon and say hi to the stars.',
      recordingStored: false,
    });

    // 2. Fetch sessions
    const sessions = parentDashboardService.getSessions(childId);
    expect(sessions.length).toBeGreaterThanOrEqual(1);

    // 3. Export JSON & CSV
    const jsonExport = parentDashboardService.exportChildDataJSON(parentId, childId);
    const csvExport = parentDashboardService.exportChildDataCSV(parentId, childId);
    expect(jsonExport).toContain('My Superpower');
    expect(csvExport).toContain('My Superpower');

    // 4. Delete single session
    const delSessionRes = await parentDashboardService.deleteSession(
      recorded.id,
      parentId,
      'parent@example.com'
    );
    expect(delSessionRes.success).toBe(true);
    expect(parentDashboardService.getSessions(childId, parentId).length).toBe(0);

    // 5. Retention Jobs run cleanly
    const retentionReport = await dataRetentionService.runAllRetentionJobs();
    expect(retentionReport.recordingsPurged).toBeGreaterThanOrEqual(0);
    expect(retentionReport.transcriptsPurged).toBeGreaterThanOrEqual(0);
    expect(retentionReport.totalPurged).toBeGreaterThanOrEqual(0);
    expect(retentionReport.timestamp).toBeDefined();
  });

  it('Logger & Privacy Guard: Strictly redacts transcripts, tokens, emails, and IPs', () => {
    const rawLog = 'User test@example.com with token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-ID checked IP 192.168.1.50 and transcript: "My name is Peter"';
    const scrubbed = scrubText(rawLog);

    expect(scrubbed).not.toContain('test@example.com');
    expect(scrubbed).not.toContain('192.168.1.50');
    expect(scrubbed).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    expect(scrubbed).toContain('[REDACTED_EMAIL]');
    expect(scrubbed).toContain('[REDACTED_IP]');
    expect(scrubbed).toContain('[REDACTED_SECRET]');
  });
});
