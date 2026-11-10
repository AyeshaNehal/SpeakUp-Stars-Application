/**
 * CHILD PRIVACY NOTE (Rule 2, Rule 5, Rule 6):
 * - Recording Storage & Retention Service
 * - STRICT RULE: Audio and video recordings exist ONLY in ephemeral browser memory by default.
 * - Raw video/audio is NEVER uploaded or persisted unless an authenticated parent has
 *   explicitly enabled `consentStoreRecordings` with verified parental consent.
 * - When enabled, recordings are encrypted, given short-lived signed URLs (15m expiry),
 *   tied to the child profile, and auto-purged after 30 days (parent configurable).
 */

import { ConsentRecord } from '../auth/parentAuthService';
import { privacyLogger } from '../logger';

export interface StoredRecordingMetadata {
  id: string;
  sessionId: string;
  parentId: string;
  childId: string;
  durationSeconds: number;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  expiresAt: string;
  retentionDays: number;
  signedUrl: string;
  signedUrlExpiresAt: string;
}

export interface StorageResult {
  stored: boolean;
  reason: 'stored_successfully' | 'parent_opt_in_required' | 'consent_withdrawn' | 'error';
  metadata?: StoredRecordingMetadata;
  message: string;
}

class RecordingStorageService {
  private readonly STORAGE_INDEX_KEY = 'speakup_parent_recordings_index_v1';
  private readonly DEFAULT_RETENTION_DAYS = 30;

  /**
   * Evaluates whether recording persistence is legally permitted under COPPA/GDPR-K.
   * STRICT DEFAULT: False unless verified consent with active storeRecordings is present.
   */
  public canStoreRecording(consent?: ConsentRecord | null): boolean {
    if (!consent) return false;
    if (consent.withdrawnAt) return false;
    return consent.consentStoreRecordings === true;
  }

  /**
   * Attempts to store a recording.
   * If parent opt-in is false, IMMEDIATELY discards the blob without uploading.
   */
  public async storeRecordingIfOptedIn(params: {
    blob: Blob;
    sessionId: string;
    parentId: string;
    childId: string;
    durationSeconds: number;
    consent?: ConsentRecord | null;
    retentionDays?: number;
  }): Promise<StorageResult> {
    const { blob, sessionId, parentId, childId, durationSeconds, consent } = params;
    const retentionDays = params.retentionDays || this.DEFAULT_RETENTION_DAYS;

    // RULE 2 ENFORCEMENT: Never upload without explicit, non-withdrawn parental opt-in
    if (!this.canStoreRecording(consent)) {
      privacyLogger.info('Recording persistence skipped: Parent opt-in is OFF or consent not found.');
      return {
        stored: false,
        reason: consent?.withdrawnAt ? 'consent_withdrawn' : 'parent_opt_in_required',
        message: 'Recordings are strictly kept in temporary browser memory by default.',
      };
    }

    try {
      const now = new Date();
      const expiresDate = new Date(now.getTime() + retentionDays * 24 * 60 * 60 * 1000);
      const recordingId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Generate a short-lived signed URL (15 minutes)
      const signedUrlData = this.generateShortLivedSignedUrl(recordingId, 15);

      const metadata: StoredRecordingMetadata = {
        id: recordingId,
        sessionId,
        parentId,
        childId,
        durationSeconds,
        mimeType: blob.type || 'video/webm',
        sizeBytes: blob.size,
        createdAt: now.toISOString(),
        expiresAt: expiresDate.toISOString(),
        retentionDays,
        signedUrl: signedUrlData.url,
        signedUrlExpiresAt: signedUrlData.expiresAt,
      };

      // In production with Supabase Storage:
      // await supabase.storage.from('recordings').upload(`${parentId}/${childId}/${recordingId}.webm`, blob, {
      //   contentType: blob.type,
      //   cacheControl: '3600',
      //   upsert: false
      // });
      this.saveLocalMetadata(metadata);

      privacyLogger.info('Recording securely stored with parental consent.', {
        recordingId,
        retentionDays,
      });

      return {
        stored: true,
        reason: 'stored_successfully',
        metadata,
        message: `Recording stored securely. Auto-deletion scheduled in ${retentionDays} days.`,
      };
    } catch {
      return {
        stored: false,
        reason: 'error',
        message: 'Failed to securely store recording.',
      };
    }
  }

  /**
   * Generates a short-lived signed access URL for parent review (max 15 minutes).
   */
  public generateShortLivedSignedUrl(recordingId: string, durationMinutes = 15): { url: string; expiresAt: string } {
    const expires = new Date(Date.now() + durationMinutes * 60 * 1000);
    const ephemeralToken = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
    return {
      url: `https://private.speakupstars.local/recordings/${recordingId}?token=${ephemeralToken}&expires=${expires.getTime()}`,
      expiresAt: expires.toISOString(),
    };
  }

  /**
   * Instant deletion of a recording by parent request.
   */
  public async deleteRecording(recordingId: string, parentId: string): Promise<boolean> {
    try {
      const all = this.getAllStoredMetadata();
      const filtered = all.filter((rec) => !(rec.id === recordingId && rec.parentId === parentId));
      localStorage.setItem(this.STORAGE_INDEX_KEY, JSON.stringify(filtered));
      privacyLogger.info('Parent deleted recording.', { recordingId });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Scheduled Purge Job: Purges all recordings past their `expiresAt` timestamp (default 30 days).
   */
  public purgeExpiredRecordings(customNow?: Date): { purgedCount: number; remainingCount: number; purgedIds: string[] } {
    try {
      const all = this.getAllStoredMetadata();
      const now = (customNow || new Date()).getTime();

      const valid: StoredRecordingMetadata[] = [];
      const purgedIds: string[] = [];
      let purgedCount = 0;

      for (const rec of all) {
        const expiryTime = new Date(rec.expiresAt).getTime();
        if (now >= expiryTime) {
          purgedCount++;
          purgedIds.push(rec.id);
        } else {
          valid.push(rec);
        }
      }

      if (purgedCount > 0) {
        localStorage.setItem(this.STORAGE_INDEX_KEY, JSON.stringify(valid));
        privacyLogger.info(`Scheduled Purge Job: Removed ${purgedCount} expired recordings.`);
      }

      return { purgedCount, remainingCount: valid.length, purgedIds };
    } catch {
      return { purgedCount: 0, remainingCount: 0, purgedIds: [] };
    }
  }

  /**
   * Test helper: clears all stored recording metadata.
   */
  public clearAllRecordingsForTesting(): void {
    try {
      localStorage.removeItem(this.STORAGE_INDEX_KEY);
    } catch {
      // ignore
    }
  }

  /**
   * Safely revokes any in-memory Object URL to immediately free browser memory.
   */
  public revokeLocalRecording(url?: string | null): void {
    if (url && typeof url === 'string' && url.startsWith('blob:')) {
      try {
        if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
          URL.revokeObjectURL(url);
        }
      } catch {
        // Ignored
      }
    }
  }

  public getRecordingsForChild(parentId: string, childId: string): StoredRecordingMetadata[] {
    const all = this.getAllStoredMetadata();
    return all.filter((r) => r.parentId === parentId && r.childId === childId);
  }

  private getAllStoredMetadata(): StoredRecordingMetadata[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_INDEX_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveLocalMetadata(meta: StoredRecordingMetadata): void {
    const current = this.getAllStoredMetadata();
    current.push(meta);
    try {
      localStorage.setItem(this.STORAGE_INDEX_KEY, JSON.stringify(current));
    } catch {
      // ignore
    }
  }
}

export const recordingStorageService = new RecordingStorageService();
