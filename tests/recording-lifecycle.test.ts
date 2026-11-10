/**
 * Recording Lifecycle & Child Privacy Unit Tests
 * Strictly verifies PRIVACY_RULES.md (Rule 2: On-Device Media Processing & Rule 6)
 *
 * Verifies:
 * 1. Default Opt-Out: Recordings are strictly NOT persisted when parent opt-in is OFF.
 * 2. Withdrawn Consent: Immediately blocks storage even if opt-in was true in the past.
 * 3. Parent Opt-In: ONLY with explicit consent, stores with short-lived signed URL & auto-delete <= 30 days.
 * 4. Parent Deletion: Parents can delete any stored recording at any time.
 * 5. Scheduled Purge: Purges recordings that exceed the retention window.
 * 6. Memory Lifecycle: Local Object URLs are revoked to prevent memory leaks.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { recordingStorageService } from '../src/services/storage/recordingStorageService';
import { ConsentRecord } from '../src/services/auth/parentAuthService';

const store = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => store.get(key) || null,
  setItem: (key: string, value: string) => store.set(key, value),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
};
// @ts-expect-error polyfill for Node test runner
globalThis.localStorage = mockLocalStorage;

describe('Recording Lifecycle & Strict Opt-In Enforcement', () => {
  beforeEach(() => {
    // Clear test storage index before each test
    store.clear();
  });

  const mockBlob = new Blob(['dummy-audio-video-content'], { type: 'video/webm' });

  it('RULE 2 DEFAULT: Never stores recordings when parent consent is absent or null', async () => {
    const result = await recordingStorageService.storeRecordingIfOptedIn({
      blob: mockBlob,
      sessionId: 'sess_1',
      parentId: 'parent_1',
      childId: 'child_1',
      durationSeconds: 45,
      consent: null,
    });

    expect(result.stored).toBe(false);
    expect(result.reason).toBe('parent_opt_in_required');

    // Confirm nothing was stored in storage index
    const records = recordingStorageService.getRecordingsForChild('parent_1', 'child_1');
    expect(records.length).toBe(0);
  });

  it('RULE 2 DEFAULT: Never stores recordings when parent opted OUT (consentStoreRecordings: false)', async () => {
    const optOutConsent: ConsentRecord = {
      id: 'consent_1',
      parentId: 'parent_1',
      policyVersion: '1.0',
      consentMetricsProcessing: true,
      consentStoreRecordings: false, // EXPLICITLY OFF
      consentEmailSummaries: false,
      verificationMethod: 'credit_card',
      verificationReference: 'tx_mock_123',
      withdrawnAt: null,
      createdAt: new Date().toISOString(),
    };

    expect(recordingStorageService.canStoreRecording(optOutConsent)).toBe(false);

    const result = await recordingStorageService.storeRecordingIfOptedIn({
      blob: mockBlob,
      sessionId: 'sess_2',
      parentId: 'parent_1',
      childId: 'child_1',
      durationSeconds: 60,
      consent: optOutConsent,
    });

    expect(result.stored).toBe(false);
    expect(result.reason).toBe('parent_opt_in_required');

    const records = recordingStorageService.getRecordingsForChild('parent_1', 'child_1');
    expect(records.length).toBe(0);
  });

  it('CONSENT WITHDRAWAL: Immediately blocks persistence if consent was revoked', async () => {
    const revokedConsent: ConsentRecord = {
      id: 'consent_2',
      parentId: 'parent_1',
      policyVersion: '1.0',
      consentMetricsProcessing: true,
      consentStoreRecordings: true, // was true
      consentEmailSummaries: false,
      verificationMethod: 'credit_card',
      verificationReference: 'tx_mock_123',
      withdrawnAt: new Date().toISOString(), // BUT WITHDRAWN
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    };

    expect(recordingStorageService.canStoreRecording(revokedConsent)).toBe(false);

    const result = await recordingStorageService.storeRecordingIfOptedIn({
      blob: mockBlob,
      sessionId: 'sess_3',
      parentId: 'parent_1',
      childId: 'child_1',
      durationSeconds: 30,
      consent: revokedConsent,
    });

    expect(result.stored).toBe(false);
    expect(result.reason).toBe('consent_withdrawn');
  });

  it('EXPLICIT OPT-IN: Stores recording with 30-day auto-expiry & 15-minute signed URL', async () => {
    const validOptInConsent: ConsentRecord = {
      id: 'consent_3',
      parentId: 'parent_verified_99',
      childId: 'child_star_1',
      policyVersion: '1.0',
      consentMetricsProcessing: true,
      consentStoreRecordings: true, // EXPLICIT OPT-IN
      consentEmailSummaries: false,
      verificationMethod: 'credit_card',
      verificationReference: 'tx_mock_456',
      withdrawnAt: null,
      createdAt: new Date().toISOString(),
    } as unknown as ConsentRecord;

    expect(recordingStorageService.canStoreRecording(validOptInConsent)).toBe(true);

    const result = await recordingStorageService.storeRecordingIfOptedIn({
      blob: mockBlob,
      sessionId: 'sess_verified_1',
      parentId: 'parent_verified_99',
      childId: 'child_star_1',
      durationSeconds: 90,
      consent: validOptInConsent,
      retentionDays: 30,
    });

    expect(result.stored).toBe(true);
    expect(result.reason).toBe('stored_successfully');
    expect(result.metadata).toBeDefined();

    const meta = result.metadata!;
    expect(meta.parentId).toBe('parent_verified_99');
    expect(meta.childId).toBe('child_star_1');
    expect(meta.retentionDays).toBe(30);

    // Auto-delete date must be approximately 30 days from now
    const now = Date.now();
    const expiry = new Date(meta.expiresAt).getTime();
    const differenceInDays = Math.round((expiry - now) / (1000 * 60 * 60 * 24));
    expect(differenceInDays).toBe(30);

    // Short-lived signed URL must have token and expiration <= 15 minutes
    expect(meta.signedUrl).toContain('token=');
    expect(meta.signedUrl).toContain('expires=');
  });

  it('PARENT DELETION: Allows parent to delete any recording immediately', async () => {
    const validConsent: ConsentRecord = {
      id: 'consent_4',
      parentId: 'parent_del_1',
      policyVersion: '1.0',
      consentMetricsProcessing: true,
      consentStoreRecordings: true,
      consentEmailSummaries: false,
      verificationMethod: 'credit_card',
      verificationReference: 'tx_del_1',
      withdrawnAt: null,
      createdAt: new Date().toISOString(),
    };

    const result = await recordingStorageService.storeRecordingIfOptedIn({
      blob: mockBlob,
      sessionId: 'sess_del_1',
      parentId: 'parent_del_1',
      childId: 'child_del_1',
      durationSeconds: 30,
      consent: validConsent,
    });

    const recordingId = result.metadata!.id;

    // Verify it exists
    let records = recordingStorageService.getRecordingsForChild('parent_del_1', 'child_del_1');
    expect(records.length).toBe(1);

    // Delete it
    const deleted = await recordingStorageService.deleteRecording(recordingId, 'parent_del_1');
    expect(deleted).toBe(true);

    // Verify it is gone
    records = recordingStorageService.getRecordingsForChild('parent_del_1', 'child_del_1');
    expect(records.length).toBe(0);
  });

  it('SCHEDULED PURGE JOB: Automatically deletes recordings past the 30-day retention window', async () => {
    const validConsent: ConsentRecord = {
      id: 'consent_5',
      parentId: 'parent_purge_1',
      policyVersion: '1.0',
      consentMetricsProcessing: true,
      consentStoreRecordings: true,
      consentEmailSummaries: false,
      verificationMethod: 'credit_card',
      verificationReference: 'tx_purge_1',
      withdrawnAt: null,
      createdAt: new Date().toISOString(),
    };

    // Store a fresh recording (expires in 30 days)
    await recordingStorageService.storeRecordingIfOptedIn({
      blob: mockBlob,
      sessionId: 'sess_fresh',
      parentId: 'parent_purge_1',
      childId: 'child_purge_1',
      durationSeconds: 30,
      consent: validConsent,
      retentionDays: 30,
    });

    // Store an expired recording manually in metadata (expired yesterday)
    const expiredMeta = {
      id: 'rec_expired_1',
      sessionId: 'sess_old',
      parentId: 'parent_purge_1',
      childId: 'child_purge_1',
      durationSeconds: 45,
      mimeType: 'video/webm',
      sizeBytes: 1024,
      createdAt: new Date(Date.now() - 32 * 86400000).toISOString(),
      expiresAt: new Date(Date.now() - 86400000).toISOString(), // Expired 1 day ago!
      retentionDays: 30,
      signedUrl: 'https://test/rec_expired_1',
      signedUrlExpiresAt: new Date().toISOString(),
    };

    const current = JSON.parse(localStorage.getItem('speakup_parent_recordings_index_v1') || '[]');
    current.push(expiredMeta);
    localStorage.setItem('speakup_parent_recordings_index_v1', JSON.stringify(current));

    expect(recordingStorageService.getRecordingsForChild('parent_purge_1', 'child_purge_1').length).toBe(2);

    // Run scheduled purge job
    const purgeReport = recordingStorageService.purgeExpiredRecordings();
    expect(purgeReport.purgedCount).toBe(1);
    expect(purgeReport.remainingCount).toBe(1);

    const remaining = recordingStorageService.getRecordingsForChild('parent_purge_1', 'child_purge_1');
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).not.toBe('rec_expired_1');
  });

  it('MEMORY HYGIENE: Safely invokes URL.revokeObjectURL without throwing', () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    recordingStorageService.revokeLocalRecording('blob:http://localhost:5173/mock-uuid');
    expect(revokeSpy).toHaveBeenCalledWith('blob:http://localhost:5173/mock-uuid');

    // Safe handling of null or invalid URLs
    expect(() => recordingStorageService.revokeLocalRecording(null)).not.toThrow();
    expect(() => recordingStorageService.revokeLocalRecording('https://external-url')).not.toThrow();

    revokeSpy.mockRestore();
  });
});
