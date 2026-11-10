/**
 * DATA RETENTION & AUTOMATED PURGE JOBS TEST SUITE
 * 
 * Verifies:
 * 1. All retention rules are centrally maintained in `retentionConfig.ts`.
 * 2. Automated deletion of opted-in audio recordings after 30 days.
 * 3. Automated deletion of scrubbed transcripts after 12 months (and parent-adjusted custom intervals).
 * 4. Automatic inactive account governance: warning at 23 months, permanent purge at 24 months.
 * 5. Automatic audit logs purge after 30 days.
 * 6. Unified master job execution and compliant audit logging without child speech content.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  RETENTION_CONFIG,
  getDaysCutoff,
  getMonthsCutoff,
  isValidTranscriptRetention,
  isValidRecordingRetention,
} from '../src/services/retention/retentionConfig';
import {
  dataRetentionService,
  TRANSCRIPT_PURGED_MARKER,
} from '../src/services/retention/dataRetentionService';
import { recordingStorageService } from '../src/services/storage/recordingStorageService';
import { parentDashboardService } from '../src/services/dashboard/parentDashboardService';
import { parentSettingsService } from '../src/services/settings/parentSettingsService';
import { parentAuthService } from '../src/services/auth/parentAuthService';
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

describe('Centralized Retention Configuration', () => {
  it('defines all required retention periods in a single settings file', () => {
    expect(RETENTION_CONFIG.RECORDINGS_DEFAULT_DAYS).toBe(0);
    expect(RETENTION_CONFIG.RECORDINGS_OPT_IN_DAYS).toBe(30);
    expect(RETENTION_CONFIG.TRANSCRIPTS_DEFAULT_MONTHS).toBe(12);
    expect(RETENTION_CONFIG.TRANSCRIPTS_ALLOWED_MONTHS).toEqual([3, 6, 12, 24]);
    expect(RETENTION_CONFIG.INACTIVE_ACCOUNTS_WARNING_MONTHS).toBe(23);
    expect(RETENTION_CONFIG.INACTIVE_ACCOUNTS_PURGE_MONTHS).toBe(24);
    expect(RETENTION_CONFIG.LOGS_RETENTION_DAYS).toBe(30);
    expect(RETENTION_CONFIG.SIGNED_URL_TTL_MINUTES).toBe(15);
  });

  it('correctly calculates days and months cutoff dates', () => {
    const baseDate = new Date('2026-10-20T12:00:00Z');

    const cutoff30Days = getDaysCutoff(30, baseDate);
    expect(cutoff30Days.toISOString().split('T')[0]).toBe('2026-09-20');

    const cutoff12Months = getMonthsCutoff(12, baseDate);
    expect(cutoff12Months.getFullYear()).toBe(2025);
    expect(cutoff12Months.getMonth()).toBe(9); // October (0-indexed 9)
  });

  it('validates parent-adjustable transcript retention options', () => {
    expect(isValidTranscriptRetention(3)).toBe(true);
    expect(isValidTranscriptRetention(6)).toBe(true);
    expect(isValidTranscriptRetention(12)).toBe(true);
    expect(isValidTranscriptRetention(24)).toBe(true);
    expect(isValidTranscriptRetention(99)).toBe(false);
  });

  it('validates allowed recording retention options', () => {
    expect(isValidRecordingRetention(7)).toBe(true);
    expect(isValidRecordingRetention(14)).toBe(true);
    expect(isValidRecordingRetention(30)).toBe(true);
    expect(isValidRecordingRetention(60)).toBe(true);
    expect(isValidRecordingRetention(365)).toBe(false);
  });
});

describe('Job 1: Automatic Deletion of Audio Recordings (30 Days)', () => {
  beforeEach(() => {
    recordingStorageService.clearAllRecordingsForTesting();
  });

  it('purges recordings older than 30 days and syncs speaking session status', async () => {
    const parentId = 'parent_ret_rec_01';
    const childId = 'child_ret_rec_01';

    // 1. Store an active recording with 30-day retention
    const dummyBlob = new Blob(['sample audio bytes'], { type: 'audio/webm' });
    const storageRes = await recordingStorageService.storeRecordingIfOptedIn({
      blob: dummyBlob,
      sessionId: 'sess_rec_test_1',
      parentId,
      childId,
      durationSeconds: 45,
      retentionDays: 30,
      consent: {
        id: 'consent_rec_01',
        parentId,
        policyVersion: '2026.1',
        consentMetricsProcessing: true,
        consentStoreRecordings: true,
        consentEmailSummaries: false,
        verificationMethod: 'credit_card',
        verificationReference: 'ref_123',
        withdrawnAt: null,
        createdAt: new Date().toISOString(),
      },
    });

    expect(storageRes.stored).toBe(true);
    const recordingId = storageRes.metadata!.id;

    // 2. Link recording to a session
    parentDashboardService.recordSession({
      sessionId: 'sess_rec_test_1',
      parentId,
      childId,
      topicTitle: 'My Pet Hamster',
      topicCategory: 'Animals',
      durationSeconds: 45,
      targetDurationSeconds: 60,
      wpm: 80,
      pauseCount: 1,
      fillerWordsCount: 0,
      eyeContactRatio: 0.8,
      smileRatio: 0.7,
      volumeSteadiness: 0.9,
      braveVoiceScore: 88,
      growthLevel: 'Tree',
      scrubbedTranscript: 'I have a tiny pet hamster named [NAME].',
      recordingStored: true,
      recordingId,
    });

    // 3. Simulate day 31 (past the 30-day expiration window)
    const futureDate = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
    const purgeResult = dataRetentionService.purgeExpiredRecordings({ simulatedNow: futureDate });

    expect(purgeResult.purgedCount).toBeGreaterThanOrEqual(1);
    expect(purgeResult.purgedRecordingIds).toContain(recordingId);

    // 4. Verify the session updated recordingStored to false
    const sessions = parentDashboardService.getSessions(childId);
    const matchingSession = sessions.find((s) => s.sessionId === 'sess_rec_test_1');
    expect(matchingSession?.recordingStored).toBe(false);
    expect(matchingSession?.recordingId).toBeUndefined();
  });
});

describe('Job 2: Automatic Deletion of Scrubbed Transcripts (12 Months, Parent-Adjustable)', () => {
  it('purges transcripts older than 12 months while preserving numeric growth metrics', () => {
    const parentId = 'parent_trans_01';
    const childId = 'child_trans_01';

    // Create session 13 months ago
    const thirteenMonthsAgo = new Date();
    thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13);

    const oldSession = parentDashboardService.recordSession({
      sessionId: 'sess_trans_old_13m',
      parentId,
      childId,
      topicTitle: 'Superheroes In Space',
      topicCategory: 'Superheroes',
      durationSeconds: 60,
      targetDurationSeconds: 60,
      wpm: 85,
      pauseCount: 2,
      fillerWordsCount: 1,
      eyeContactRatio: 0.75,
      smileRatio: 0.65,
      volumeSteadiness: 0.85,
      braveVoiceScore: 84,
      growthLevel: 'Flower',
      scrubbedTranscript: 'The superhero flew over [CITY] and helped the [NAME].',
      recordingStored: false,
    });

    // Manually backdate session creation timestamp
    const allSessions = parentDashboardService.getAllSessions();
    const target = allSessions.find((s) => s.id === oldSession.id);
    if (target) {
      target.createdAt = thirteenMonthsAgo.toISOString();
      parentDashboardService.updateSessions(allSessions);
    }

    // Run transcript purge
    const result = dataRetentionService.purgeExpiredTranscripts();
    expect(result.purgedCount).toBeGreaterThanOrEqual(1);
    expect(result.purgedSessionIds).toContain(oldSession.id);

    // Verify transcript is replaced with purge marker
    const updated = parentDashboardService.getAllSessions().find((s) => s.id === oldSession.id);
    expect(updated?.scrubbedTranscript).toBe(TRANSCRIPT_PURGED_MARKER);

    // Verify numeric metrics remain intact for child badges and milestones
    expect(updated?.braveVoiceScore).toBe(84);
    expect(updated?.wpm).toBe(85);
    expect(updated?.growthLevel).toBe('Flower');
  });

  it('respects parent-adjusted transcript retention setting (e.g. 3 months)', () => {
    const parentId = 'parent_trans_custom_3m';
    const childId = 'child_trans_custom_3m';

    // Parent configures 3-month transcript retention
    parentSettingsService.updateSettings({ transcriptRetentionMonths: 3 }, parentId);

    // Session created 4 months ago
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

    const customSession = parentDashboardService.recordSession({
      sessionId: 'sess_trans_custom_4m',
      parentId,
      childId,
      topicTitle: 'My Favorite Dinosaur',
      topicCategory: 'Animals',
      durationSeconds: 50,
      targetDurationSeconds: 60,
      wpm: 78,
      pauseCount: 1,
      fillerWordsCount: 0,
      eyeContactRatio: 0.8,
      smileRatio: 0.7,
      volumeSteadiness: 0.88,
      braveVoiceScore: 86,
      growthLevel: 'Tree',
      scrubbedTranscript: 'The T-Rex ran through [PARK] and roared loud!',
      recordingStored: false,
    });

    const allSessions = parentDashboardService.getAllSessions();
    const target = allSessions.find((s) => s.id === customSession.id);
    if (target) {
      target.createdAt = fourMonthsAgo.toISOString();
      parentDashboardService.updateSessions(allSessions);
    }

    const result = dataRetentionService.purgeExpiredTranscripts();
    expect(result.purgedSessionIds).toContain(customSession.id);

    const updated = parentDashboardService.getAllSessions().find((s) => s.id === customSession.id);
    expect(updated?.scrubbedTranscript).toBe(TRANSCRIPT_PURGED_MARKER);
  });
});

describe('Job 3: Inactive Accounts Governance (23m Warning, 24m Purge)', () => {
  beforeEach(() => {
    dataRetentionService.resetWarningsForTesting();
  });

  it('dispatches 30-day pre-deletion warning notice to parent at 23 months of inactivity', async () => {
    const parentId = `parent_dormant_${Date.now()}`;
    const email = `dormant_${Date.now()}@example.com`;

    // Create dormant parent account dated 23.5 months ago
    const signupRes = await parentAuthService.parentSignUp(email, 'StrongPass123!', '1234');
    expect(signupRes.success).toBe(true);

    const twentyThreeMonthsAgo = new Date();
    twentyThreeMonthsAgo.setMonth(twentyThreeMonthsAgo.getMonth() - 23);
    twentyThreeMonthsAgo.setDate(twentyThreeMonthsAgo.getDate() - 5);

    // Backdate the account createdAt
    parentAuthService.updateParentAccount(signupRes.parent!.id, {
      createdAt: twentyThreeMonthsAgo.toISOString(),
    });

    const result = await dataRetentionService.processInactiveAccounts();
    expect(result.warnedParentIds).toContain(signupRes.parent!.id);
    expect(result.purgedParentIds).not.toContain(signupRes.parent!.id);
  });

  it('permanently deletes account and linked child data at 24 months of inactivity', async () => {
    const email = `expired_${Date.now()}@example.com`;
    const signupRes = await parentAuthService.parentSignUp(email, 'StrongPass123!', '1234');
    const parent = signupRes.parent!;

    // Create child profile
    await parentAuthService.createChildProfile(parent.id, 'Timmy', '6-8', 'mint');

    // Backdate account to 25 months ago
    const twentyFiveMonthsAgo = new Date();
    twentyFiveMonthsAgo.setMonth(twentyFiveMonthsAgo.getMonth() - 25);
    parentAuthService.updateParentAccount(parent.id, {
      createdAt: twentyFiveMonthsAgo.toISOString(),
    });

    const result = await dataRetentionService.processInactiveAccounts();
    expect(result.purgedParentIds).toContain(parent.id);

    // Verify parent account is completely purged
    const allParents = await parentAuthService.getAllParents();
    expect(allParents.find((p) => p.id === parent.id)).toBeUndefined();

    // Verify child profiles are purged
    const children = await parentAuthService.getChildrenForParent(parent.id);
    expect(children.length).toBe(0);
  });
});

describe('Job 4: Automatic Deletion of Audit Logs (30 Days)', () => {
  beforeEach(() => {
    adminAuditLogService.clearAll();
  });

  it('purges access logs older than 30 days while keeping recent logs', () => {
    // 1. Record an access log
    const entry = adminAuditLogService.recordAccess({
      actorId: 'admin_test_01',
      actorRole: 'admin',
      action: 'view_sessions',
      targetResourceType: 'session',
    });

    // 2. Backdate the log entry to 35 days ago
    const thirtyFiveDaysAgo = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
    entry.createdAt = thirtyFiveDaysAgo.toISOString();

    // 3. Record a fresh log today
    const freshEntry = adminAuditLogService.recordAccess({
      actorId: 'admin_test_02',
      actorRole: 'admin',
      action: 'export_data_json',
      targetResourceType: 'parent_account',
    });

    // 4. Run logs purge
    const result = dataRetentionService.purgeExpiredAuditLogs();
    expect(result.purgedCount).toBe(1);
    expect(result.purgedLogIds).toContain(entry.id);

    // 5. Verify fresh log is retained
    const remaining = adminAuditLogService.getAllLogs();
    expect(remaining.some((l) => l.id === freshEntry.id)).toBe(true);
    expect(remaining.some((l) => l.id === entry.id)).toBe(false);
  });
});

describe('Master Retention Engine: Unified Job Execution', () => {
  it('runs all 4 retention jobs in sequence, generates report, and logs audit record', async () => {
    const report = await dataRetentionService.runAllRetentionJobs();

    expect(report.timestamp).toBeDefined();
    expect(typeof report.recordingsPurged).toBe('number');
    expect(typeof report.transcriptsPurged).toBe('number');
    expect(typeof report.inactiveAccountsWarned).toBe('number');
    expect(typeof report.inactiveAccountsPurged).toBe('number');
    expect(typeof report.logsPurged).toBe('number');
    expect(typeof report.totalPurged).toBe('number');

    // Confirm that the retention run itself logged an audit record with ZERO child content
    const logs = adminAuditLogService.getAllLogs();
    const jobLog = logs.find((l) => l.actorId === 'system_retention_job');
    expect(jobLog).toBeDefined();
    expect(jobLog?.action).toBe('delete_session');
  });
});
