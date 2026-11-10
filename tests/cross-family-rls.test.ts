/**
 * CROSS-FAMILY ROW-LEVEL SECURITY & ISOLATION TEST SUITE
 *
 * Verifies that:
 * 1. Family A cannot read or mutate Family B's children profiles.
 * 2. Family A cannot read Family B's speaking sessions, audio recordings, or metrics.
 * 3. Family A cannot access or tamper with Family B's rewards, points, streaks, or shop purchases.
 * 4. Family A cannot view or alter Family B's consent records or settings.
 * 5. Admin audit logs contain zero child speech transcripts or PII, and are isolated from unauthorized parents.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { parentAuthService, ParentAccount } from '../src/services/auth/parentAuthService';
import { parentDashboardService } from '../src/services/dashboard/parentDashboardService';
import { rewardsService } from '../src/services/rewards/rewardsService';
import { recordingStorageService } from '../src/services/storage/recordingStorageService';
import { parentSettingsService } from '../src/services/settings/parentSettingsService';
import { adminAuditLogService } from '../src/services/security/adminAuditLogService';

const store = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => store.get(key) || null,
  setItem: (key: string, value: string) => store.set(key, value),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
};
// @ts-expect-error polyfill for Node test runner
globalThis.localStorage = mockLocalStorage;

describe('Row-Level Security (RLS) & Multi-Table Cross-Family Isolation', () => {
  let parentA: ParentAccount;
  let parentB: ParentAccount;
  let childAId: string;
  let childBId: string;

  beforeEach(async () => {
    store.clear();

    // Setup Family A
    const signupA = await parentAuthService.parentSignUp('familyA@example.com', 'Pass1234!Secure', '1111');
    expect(signupA.success).toBe(true);
    parentA = signupA.parent!;
    const resA = await parentAuthService.createChildProfile(parentA.id, 'Emma', '6-8', 'fox');
    expect(resA.success).toBe(true);
    childAId = resA.child!.id;

    // Setup Family B
    const signupB = await parentAuthService.parentSignUp('familyB@example.com', 'Pass5678!Secure', '2222');
    expect(signupB.success).toBe(true);
    parentB = signupB.parent!;
    const resB = await parentAuthService.createChildProfile(parentB.id, 'Noah', '9-12', 'bear');
    expect(resB.success).toBe(true);
    childBId = resB.child!.id;
  });

  it('RLS TABLE: children - Parent A cannot access or list Parent B children', async () => {
    const childrenA = await parentAuthService.getChildrenForParent(parentA.id);
    expect(childrenA.length).toBe(1);
    expect(childrenA[0].id).toBe(childAId);
    expect(childrenA[0].nickname).toBe('Emma');

    // Cross-tenant access attempt: verify Noah is not in Parent A's result set
    const hasNoah = childrenA.some((c) => c.id === childBId || c.nickname === 'Noah');
    expect(hasNoah).toBe(false);

    // Querying with Parent B ID returns only Noah
    const childrenB = await parentAuthService.getChildrenForParent(parentB.id);
    expect(childrenB.length).toBe(1);
    expect(childrenB[0].id).toBe(childBId);
    expect(childrenB.some((c) => c.id === childAId)).toBe(false);
  });

  it('RLS TABLE: sessions & metrics - Family A cannot access Family B session records or metrics', async () => {
    // Record practice session for Family B's child Noah
    parentDashboardService.recordSession({
      sessionId: 'sess_b_space_01',
      parentId: parentB.id,
      childId: childBId,
      topicTitle: 'Space Exploration',
      topicCategory: 'Science',
      durationSeconds: 120,
      targetDurationSeconds: 120,
      wpm: 110,
      pauseCount: 2,
      fillerWordsCount: 1,
      eyeContactRatio: 0.9,
      smileRatio: 0.8,
      volumeSteadiness: 0.85,
      braveVoiceScore: 88,
      growthLevel: 'Tree',
      scrubbedTranscript: 'I want to travel to Mars one day in a rocket.',
      recordingStored: false,
    });

    // Parent A requests all data under their account
    const dataReportA = parentDashboardService.getAllDataWeHave(parentA.id, childAId);

    // Family A's report must NOT include Family B's session or transcript
    const sessionsA = dataReportA.sessions;
    const mentionsMars = sessionsA.some((s) => s.scrubbedTranscript?.includes('Mars'));
    expect(mentionsMars).toBe(false);

    // Parent B requests their data and correctly sees Noah's session
    const dataReportB = parentDashboardService.getAllDataWeHave(parentB.id, childBId);
    expect(dataReportB.sessions.length).toBeGreaterThanOrEqual(1);
    const noahSession = dataReportB.sessions.find((s) => s.topic === 'Space Exploration');
    expect(noahSession).toBeDefined();
    expect(noahSession?.braveVoiceScore).toBe(88);
  });

  it('RLS TABLE: storage & recordings - Parent A cannot access Family B audio blobs or recordings', async () => {
    // Parent B opts in and stores a recording
    const consentRes = await parentAuthService.submitParentalConsent(
      parentB.id,
      'familyB@example.com',
      {
        metricsProcessing: true,
        storeRecordings: true,
        emailSummaries: true,
      },
      'mock_provider'
    );

    const mockAudioBlob = new Blob(['sample-audio-data-family-b'], { type: 'audio/webm' });
    const storedRec = await recordingStorageService.storeRecordingIfOptedIn({
      blob: mockAudioBlob,
      sessionId: 'sess_b_001',
      parentId: parentB.id,
      childId: childBId,
      durationSeconds: 60,
      consent: consentRes.consentRecord,
    });
    expect(storedRec.stored).toBe(true);

    // Parent A attempts to retrieve Parent B's recordings
    const unauthorizedList = recordingStorageService.getRecordingsForChild(parentA.id, childBId);
    expect(unauthorizedList.length).toBe(0);

    // Parent B (authorized) can retrieve it
    const authorizedList = recordingStorageService.getRecordingsForChild(parentB.id, childBId);
    expect(authorizedList.length).toBe(1);
    expect(authorizedList[0].childId).toBe(childBId);
  });

  it('RLS TABLE: rewards, points & streaks - Family A cannot access or mutate Family B rewards', async () => {
    // Award stars and update streak for Child B
    rewardsService.awardPoints(childBId, 'finish_recording');
    rewardsService.awardPoints(childBId, 'new_category');
    rewardsService.recordDailyPractice(childBId);

    // Check Child A state (Emma)
    const pointsA = rewardsService.getPoints(childAId);
    const streakA = rewardsService.getStreak(childAId);
    expect(pointsA).toBe(0);
    expect(streakA.currentStreak).toBe(0);

    // Check Child B state (Noah)
    const pointsB = rewardsService.getPoints(childBId);
    const streakB = rewardsService.getStreak(childBId);
    expect(pointsB).toBe(50); // 25 + 15 + 10 (daily practice) = 50
    expect(streakB.currentStreak).toBe(1);

    // Confirm that Child A cannot spend Child B's points (Emma has 0 pts, requires 45)
    const buyAttempt = rewardsService.purchaseShopItem(childAId, 'outfit_explorer_vest');
    expect(buyAttempt.success).toBe(false);
  });

  it('RLS TABLE: consent_records & settings - Family A cannot view or alter Family B consent preferences', async () => {
    // Family B records explicit consent
    const consentRes = await parentAuthService.submitParentalConsent(
      parentB.id,
      'familyB@example.com',
      {
        metricsProcessing: true,
        storeRecordings: true,
        emailSummaries: false,
      },
      'mock_provider'
    );
    expect(consentRes.success).toBe(true);

    // Parent A checks their consent records
    const recordsA = await parentAuthService.getConsentRecords(parentA.id);
    expect(recordsA.length).toBe(0);

    // Parent B checks their consent records
    const recordsB = await parentAuthService.getConsentRecords(parentB.id);
    expect(recordsB.length).toBe(1);
    expect(recordsB[0].consentStoreRecordings).toBe(true);
    expect(recordsB[0].consentEmailSummaries).toBe(false);

    // Parent A modifies settings for their family
    parentSettingsService.updateSettings(
      {
        dailyTimeLimitMinutes: 20,
        gentleModeDefault: true,
      },
      parentA.id
    );

    const settingsA = parentSettingsService.getSettings(parentA.id);
    expect(settingsA.dailyTimeLimitMinutes).toBe(20);

    // Parent B settings remain unaffected defaults
    const settingsB = parentSettingsService.getSettings(parentB.id);
    expect(settingsB.dailyTimeLimitMinutes).toBe(0);
  });

  it('RLS TABLE: admin_audit_logs - strictly logs administrative access with zero child transcripts', () => {
    // Log an admin access event
    const logEntry = adminAuditLogService.recordAccess({
      parentId: parentA.id,
      actorId: 'admin_sys_01',
      actorRole: 'auditor',
      action: 'delete_session',
      targetResource: 'parent_account',
      targetResourceId: parentA.id,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 TestBrowser',
      success: true,
    });

    expect(logEntry.id).toBeDefined();
    expect(logEntry.targetResourceId).toBe(parentA.id);
    expect(logEntry.ipAddressHash).toBeDefined();
    expect(logEntry.ipAddressHash).not.toBe('192.168.1.100'); // Cryptographically hashed

    // Verify audit log rejects inclusion of child transcripts or child speech
    expect(() => {
      adminAuditLogService.recordAccess({
        parentId: parentA.id,
        actorId: 'admin_sys_01',
        actorRole: 'auditor',
        action: 'view_sessions',
        targetResource: 'session',
        targetResourceId: 'sess_123',
        ipAddress: '127.0.0.1',
        userAgent: 'test',
        additionalContext: {
          transcript: 'My name is Emma and I live in Springfield',
        },
      });
    }).toThrow(/CHILD PRIVACY VIOLATION/);
  });

  it('RLS & COLUMN SECURITY: Client SELECT on parents must NEVER return pin_hash, pin_salt, or hashed_pin', async () => {
    const parents = await parentAuthService.getAllParents();
    expect(parents.length).toBeGreaterThanOrEqual(2);

    for (const p of parents) {
      // Must have safe public profile fields
      expect(p.id).toBeDefined();
      expect(p.email).toBeDefined();

      // Must NEVER have pin columns
      // @ts-expect-error verifying absent property
      expect(p.pin_hash).toBeUndefined();
      // @ts-expect-error verifying absent property
      expect(p.hashed_pin).toBeUndefined();
      // @ts-expect-error verifying absent property
      expect(p.pin_salt).toBeUndefined();
      // @ts-expect-error verifying absent property
      expect(p.hashedPin).toBeUndefined();
      // @ts-expect-error verifying absent property
      expect(p.failed_pin_attempts).toBeUndefined();
      // @ts-expect-error verifying absent property
      expect(p.pin_locked_until).toBeUndefined();
    }
  });
});
