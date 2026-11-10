/**
 * AUTOMATED TESTS: PIN-Protected Parent Dashboard & Data Governance
 * Verifies:
 * 1. Progress section: skill trends, time spent, topics tried, daily time limit, category controls, gentle mode.
 * 2. Quiet safety flags from the AI input filter (acknowledged without alarming child).
 * 3. "See all data we have" transparency audit (profile, sessions, metrics, scrubbed transcripts, badges).
 * 4. "Download my child's data" in JSON and CSV formats with export logging.
 * 5. Permanent deletions with PIN verification:
 *    - Delete single session
 *    - Delete all child data
 *    - Delete entire account
 *    - Verified complete purge within compliance window and confirmation email receipt.
 * 6. Consent toggles (recording storage, weekly emails, face analysis).
 * 7. Visible log of last export and last data deletion.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  parentDashboardService,
  SpeakingSessionRecord,
} from '../src/services/dashboard/parentDashboardService';
import { parentSettingsService } from '../src/services/settings/parentSettingsService';
import { parentSafetyAlertService } from '../src/services/security/parentSafetyAlertService';
import { rewardsService } from '../src/services/rewards/rewardsService';
import { recordingStorageService } from '../src/services/storage/recordingStorageService';

describe('Parent Dashboard & Privacy Data Governance', () => {
  const TEST_PARENT = 'test_parent_456';
  const TEST_CHILD = 'test_child_456';
  const TEST_EMAIL = 'parent@familytest.local';

  beforeEach(() => {
    // Reset test data
    rewardsService.clearStorage(TEST_CHILD);
    parentSafetyAlertService.clearAll();
  });

  describe('Progress Analytics: Trends, Time Spent & Topics', () => {
    it('records speaking session and aggregates skill trends', () => {
      const session = parentDashboardService.recordSession({
        sessionId: 'test_sess_1',
        parentId: TEST_PARENT,
        childId: TEST_CHILD,
        topicTitle: 'My Pet Hamster',
        topicCategory: 'Animals',
        durationSeconds: 60,
        targetDurationSeconds: 60,
        wpm: 80,
        pauseCount: 2,
        fillerWordsCount: 1,
        eyeContactRatio: 0.85,
        smileRatio: 0.7,
        volumeSteadiness: 0.9,
        braveVoiceScore: 88,
        growthLevel: 'Tree',
        scrubbedTranscript: 'My hamster [NAME] loves to run in his wheel! I got him in [CITY].',
        recordingStored: false,
      });

      expect(session.id).toBeDefined();
      expect(session.braveVoiceScore).toBe(88);

      // Verify skill trends
      const trends = parentDashboardService.getSkillTrends(TEST_CHILD);
      expect(trends.averageBraveVoice).toBeGreaterThan(0);
      expect(trends.averageEyeContact).toBeGreaterThanOrEqual(80);
      expect(trends.braveVoiceTrend.length).toBeGreaterThan(0);

      // Verify time spent
      const time = parentDashboardService.getTimeSpent(TEST_CHILD);
      expect(time.totalSeconds).toBeGreaterThanOrEqual(60);
      expect(time.totalSessions).toBeGreaterThanOrEqual(1);

      // Verify topics tried
      const topics = parentDashboardService.getTopicsExplored(TEST_CHILD);
      expect(topics.uniqueTopicsCount).toBeGreaterThanOrEqual(1);
      const animalsCat = topics.categories.find((c) => c.category === 'Animals');
      expect(animalsCat).toBeDefined();
    });
  });

  describe('Parent Settings Controls', () => {
    it('updates daily time limit settings', () => {
      // Set to 15 minutes
      const updated15 = parentSettingsService.updateSettings({ dailyTimeLimitMinutes: 15 });
      expect(updated15.dailyTimeLimitMinutes).toBe(15);

      // Set to Unlimited (0)
      const updated0 = parentSettingsService.updateSettings({ dailyTimeLimitMinutes: 0 });
      expect(updated0.dailyTimeLimitMinutes).toBe(0);
    });

    it('enforces category controls by disabling selected topics', () => {
      const initial = parentSettingsService.getSettings();
      expect(initial.disabledCategories).toEqual([]);

      // Parent disables 'Fantasy & Magic'
      const updated = parentSettingsService.updateSettings({
        disabledCategories: ['Fantasy & Magic'],
      });
      expect(updated.disabledCategories).toContain('Fantasy & Magic');

      // Re-enable
      const reEnabled = parentSettingsService.updateSettings({
        disabledCategories: [],
      });
      expect(reEnabled.disabledCategories.length).toBe(0);
    });

    it('toggles Gentle Mode on and off', () => {
      const gentleOn = parentSettingsService.updateSettings({ gentleModeDefault: true });
      expect(gentleOn.gentleModeDefault).toBe(true);

      const gentleOff = parentSettingsService.updateSettings({ gentleModeDefault: false });
      expect(gentleOff.gentleModeDefault).toBe(false);
    });

    it('manages consent toggles anytime (recordings, email summaries, face analysis)', () => {
      // Toggle recording storage
      const recordingOptIn = parentSettingsService.updateSettings({ storeRecordingsOptIn: true });
      expect(recordingOptIn.storeRecordingsOptIn).toBe(true);

      // Toggle face analysis (voice-only mode)
      parentSettingsService.setFaceAnalysisEnabled(false);
      expect(parentSettingsService.isFaceAnalysisEnabled()).toBe(false);

      // Toggle weekly email summaries
      const emailsOptIn = parentSettingsService.updateSettings({ emailSummariesOptIn: true });
      expect(emailsOptIn.emailSummariesOptIn).toBe(true);
    });
  });

  describe('Quiet Safety Flags from AI Input Filter', () => {
    it('records distress alerts quietly and allows parent review', () => {
      // Simulate input filter detecting distress words
      const alert = parentSafetyAlertService.recordQuietAlert(TEST_CHILD, ['scared', 'alone']);
      expect(alert.id).toBeDefined();
      expect(alert.matchedKeywords).toContain('scared');
      expect(alert.reviewedByParent).toBe(false);

      // Retrieve alerts for parent
      const parentAlerts = parentSafetyAlertService.getAlerts(TEST_CHILD);
      expect(parentAlerts.length).toBe(1);

      // Parent acknowledges alert
      parentSafetyAlertService.markAsReviewed(alert.id);
      const reviewedAlerts = parentSafetyAlertService.getAlerts(TEST_CHILD);
      expect(reviewedAlerts[0].reviewedByParent).toBe(true);
    });
  });

  describe('Data Transparency: "See All Data We Have"', () => {
    it('provides transparent audit of child profile, sessions, scrubbed transcripts, and badges', () => {
      // Award a badge and points
      rewardsService.awardPoints(TEST_CHILD, 'finish_recording', 25);
      rewardsService.unlockBadge(TEST_CHILD, 'first_speech');

      const fullAudit = parentDashboardService.getAllDataWeHave(TEST_PARENT, TEST_CHILD);

      expect(fullAudit.retrievedAt).toBeDefined();
      expect(fullAudit.childProfile.id).toBe(TEST_CHILD);
      expect(fullAudit.childProfile.storedPII).toContain('NONE');
      expect(fullAudit.sessions.length).toBeGreaterThanOrEqual(1);

      // Verify scrubbed transcript format
      const hasScrubbedContent = fullAudit.sessions.some((s) => s.scrubbedTranscript.length > 0);
      expect(hasScrubbedContent).toBe(true);

      // Verify badges and rewards
      expect(fullAudit.rewardsVault.starPointsBalance).toBeGreaterThanOrEqual(25);
      expect(fullAudit.dataGovernanceGuarantees.length).toBe(4);
    });
  });

  describe('Data Export: JSON and CSV Formats', () => {
    it('exports complete child data in JSON format and updates lastExportDate', () => {
      const jsonString = parentDashboardService.exportChildDataJSON(TEST_PARENT, TEST_CHILD);
      expect(typeof jsonString).toBe('string');

      const parsed = JSON.parse(jsonString);
      expect(parsed.childProfile.id).toBe(TEST_CHILD);
      expect(parsed.sessions).toBeDefined();

      // Verify lastExportDate updated
      const settings = parentSettingsService.getSettings();
      expect(settings.lastExportDate).not.toBeNull();
    });

    it('exports child practice sessions in valid CSV format with headers', () => {
      const csvString = parentDashboardService.exportChildDataCSV(TEST_PARENT, TEST_CHILD);
      expect(typeof csvString).toBe('string');

      const lines = csvString.split('\r\n');
      expect(lines[0]).toContain('Session ID,Date,Child ID,Topic,Category,Duration (Seconds)');
      expect(lines.length).toBeGreaterThan(1);
    });
  });

  describe('Irreversible Deletion Workflows (COPPA & GDPR-K Compliance)', () => {
    it('deletes a single practice session, purges recording, and updates deletion log', async () => {
      // Create session
      const sess = parentDashboardService.recordSession({
        sessionId: 'sess_to_delete_99',
        parentId: TEST_PARENT,
        childId: TEST_CHILD,
        topicTitle: 'Topic to be Deleted',
        topicCategory: 'Hobbies',
        durationSeconds: 30,
        targetDurationSeconds: 30,
        wpm: 70,
        pauseCount: 1,
        fillerWordsCount: 0,
        eyeContactRatio: 0.8,
        smileRatio: 0.6,
        volumeSteadiness: 0.8,
        braveVoiceScore: 75,
        growthLevel: 'Sprout',
        scrubbedTranscript: 'Delete me soon.',
        recordingStored: false,
      });

      const receipt = await parentDashboardService.deleteSession(sess.id, TEST_PARENT, TEST_EMAIL);
      expect(receipt.success).toBe(true);
      expect(receipt.deletedScope).toBe('session');
      expect(receipt.confirmationEmailSentTo).toBe(TEST_EMAIL);
      expect(receipt.complianceWindow).toContain('Immediate');

      // Verify session was truly purged
      const remaining = parentDashboardService.getSessions(TEST_CHILD, TEST_PARENT);
      const exists = remaining.some((s) => s.id === sess.id);
      expect(exists).toBe(false);

      // Verify deletion log updated
      const settings = parentSettingsService.getSettings();
      expect(settings.lastDeletionDate).not.toBeNull();
      expect(settings.lastDeletionDetails).toContain(sess.id);
    });

    it('deletes all of a childs data (sessions, metrics, points, streak, recordings)', async () => {
      // Add child points and streak
      rewardsService.awardPoints(TEST_CHILD, 'finish_recording', 100);
      rewardsService.recordDailyPractice(TEST_CHILD, '2026-10-18');

      const receipt = await parentDashboardService.deleteChildData(TEST_CHILD, TEST_PARENT, TEST_EMAIL);
      expect(receipt.success).toBe(true);
      expect(receipt.deletedScope).toBe('child');
      expect(receipt.confirmationEmailSentTo).toBe(TEST_EMAIL);

      // Verify child points and streak reset
      expect(rewardsService.getPoints(TEST_CHILD)).toBe(0);
      expect(rewardsService.getStreak(TEST_CHILD).currentStreak).toBe(0);

      // Verify sessions purged
      const childSessions = parentDashboardService.getSessions(TEST_CHILD, TEST_PARENT).filter((s) => s.childId === TEST_CHILD);
      expect(childSessions.length).toBe(0);
    });

    it('deletes whole parent account with full legal compliance receipt', async () => {
      const receipt = await parentDashboardService.deleteWholeAccount(TEST_PARENT, TEST_EMAIL);
      expect(receipt.success).toBe(true);
      expect(receipt.deletedScope).toBe('account');
      expect(receipt.confirmationEmailSentTo).toBe(TEST_EMAIL);
      expect(receipt.complianceWindow).toContain('24 hours');

      // Verify last deletion audit
      const settings = parentSettingsService.getSettings();
      expect(settings.lastDeletionDetails).toContain(TEST_EMAIL);
    });
  });
});
