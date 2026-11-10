/**
 * DATA RETENTION & AUTOMATED PURGE SERVICE
 * 
 * Enforces automatic scheduled deletion jobs across SpeakUp Stars:
 * 1. Recordings Purge: Discards opted-in audio recordings older than 30 days.
 * 2. Scrubbed Transcripts Purge: Replaces transcripts older than 12 months
 *    (or parent-configured threshold) with a purge marker while preserving numeric metrics.
 * 3. Inactive Accounts Purge: Warns parent at 23 months of inactivity, then permanently
 *    purges the account and all linked child data at 24 months.
 * 4. Audit Logs Purge: Hard-deletes administrative access logs older than 30 days.
 * 
 * Centralized retention thresholds are loaded from `retentionConfig.ts`.
 */

import {
  RETENTION_CONFIG,
  getDaysCutoff,
  getMonthsCutoff,
} from './retentionConfig';
import { recordingStorageService } from '../storage/recordingStorageService';
import { parentDashboardService } from '../dashboard/parentDashboardService';
import { parentSettingsService } from '../settings/parentSettingsService';
import { parentAuthService, ParentAccount } from '../auth/parentAuthService';
import { adminAuditLogService } from '../security/adminAuditLogService';
import { privacyLogger } from '../logger';

export interface RetentionJobOptions {
  simulatedNow?: Date;
}

export interface PurgeRecordingsResult {
  purgedCount: number;
  purgedRecordingIds: string[];
}

export interface PurgeTranscriptsResult {
  purgedCount: number;
  purgedSessionIds: string[];
}

export interface ProcessInactiveAccountsResult {
  warnedCount: number;
  warnedParentIds: string[];
  purgedCount: number;
  purgedParentIds: string[];
}

export interface PurgeLogsResult {
  purgedCount: number;
  purgedLogIds: string[];
}

export interface RetentionExecutionReport {
  timestamp: string;
  recordingsPurged: number;
  transcriptsPurged: number;
  inactiveAccountsWarned: number;
  inactiveAccountsPurged: number;
  logsPurged: number;
  totalPurged: number;
}

export const TRANSCRIPT_PURGED_MARKER = '[EXPIRED_AND_PURGED_UNDER_DATA_RETENTION_POLICY]';

class DataRetentionService {
  private inactivityWarningsSent: Map<string, string> = new Map();

  /**
   * JOB 1: Automatic Deletion of Expired Audio Recordings
   * Defaults to 30 days if opted in (or parent-configured days).
   */
  public purgeExpiredRecordings(options?: RetentionJobOptions): PurgeRecordingsResult {
    const now = options?.simulatedNow || new Date();

    // 1. Storage service purge
    const storageResult = recordingStorageService.purgeExpiredRecordings(now);
    const purgedIds = storageResult.purgedIds || [];

    // 2. Synchronize speaking sessions metadata
    if (purgedIds.length > 0) {
      const allSessions = parentDashboardService.getAllSessions();
      let updated = false;

      const synced = allSessions.map((s) => {
        if (s.recordingId && purgedIds.includes(s.recordingId)) {
          updated = true;
          return {
            ...s,
            recordingStored: false,
            recordingId: undefined,
          };
        }
        return s;
      });

      if (updated) {
        parentDashboardService.updateSessions(synced);
      }
    }

    privacyLogger.info('Data Retention Job 1 [Recordings]: Purged expired recordings.', {
      purgedCount: purgedIds.length,
    });

    return {
      purgedCount: purgedIds.length,
      purgedRecordingIds: purgedIds,
    };
  }

  /**
   * JOB 2: Automatic Deletion of Scrubbed Transcripts
   * Defaults to 12 months (or parent-configured 3, 6, 12, or 24 months).
   * Replaces transcript with non-reversible purge marker, preserving aggregate scores.
   */
  public purgeExpiredTranscripts(options?: RetentionJobOptions): PurgeTranscriptsResult {
    const now = options?.simulatedNow || new Date();
    const allSessions = parentDashboardService.getAllSessions();
    const purgedSessionIds: string[] = [];

    const updatedSessions = allSessions.map((session) => {
      // Skip if already purged or empty
      if (!session.scrubbedTranscript || session.scrubbedTranscript === TRANSCRIPT_PURGED_MARKER) {
        return session;
      }

      // Check parent's configured transcript retention (default: 12 months)
      const settings = parentSettingsService.getSettings(session.parentId);
      const retentionMonths = settings.transcriptRetentionMonths || RETENTION_CONFIG.TRANSCRIPTS_DEFAULT_MONTHS;
      const cutoff = getMonthsCutoff(retentionMonths, now);

      const sessionDate = new Date(session.createdAt);
      if (sessionDate.getTime() < cutoff.getTime()) {
        purgedSessionIds.push(session.id);
        return {
          ...session,
          scrubbedTranscript: TRANSCRIPT_PURGED_MARKER,
        };
      }

      return session;
    });

    if (purgedSessionIds.length > 0) {
      parentDashboardService.updateSessions(updatedSessions);
    }

    privacyLogger.info('Data Retention Job 2 [Transcripts]: Purged expired transcripts.', {
      purgedCount: purgedSessionIds.length,
    });

    return {
      purgedCount: purgedSessionIds.length,
      purgedSessionIds,
    };
  }

  /**
   * JOB 3: Automatic Inactive Account Governance
   * Warns parent at 23 months of total dormancy, then permanently deletes account at 24 months.
   */
  public async processInactiveAccounts(
    options?: RetentionJobOptions
  ): Promise<ProcessInactiveAccountsResult> {
    const now = options?.simulatedNow || new Date();
    const parents = await parentAuthService.getAllParents();
    const allSessions = parentDashboardService.getAllSessions();

    const warnedParentIds: string[] = [];
    const purgedParentIds: string[] = [];

    const warningCutoff = getMonthsCutoff(RETENTION_CONFIG.INACTIVE_ACCOUNTS_WARNING_MONTHS, now);
    const purgeCutoff = getMonthsCutoff(RETENTION_CONFIG.INACTIVE_ACCOUNTS_PURGE_MONTHS, now);

    for (const parent of parents) {
      // Find latest activity timestamp for this family
      const parentSessions = allSessions.filter((s) => s.parentId === parent.id);
      let latestActivityMs = new Date(parent.createdAt).getTime();

      for (const s of parentSessions) {
        const sTime = new Date(s.createdAt).getTime();
        if (sTime > latestActivityMs) {
          latestActivityMs = sTime;
        }
      }

      if (parentSettingsService.hasCustomSettings(parent.id)) {
        const settings = parentSettingsService.getSettings(parent.id);
        if (settings?.updatedAt) {
          const setTime = new Date(settings.updatedAt).getTime();
          if (setTime > latestActivityMs) {
            latestActivityMs = setTime;
          }
        }
      }

      // 1. Purge condition (>= 24 months inactive)
      if (latestActivityMs < purgeCutoff.getTime()) {
        await parentDashboardService.deleteWholeAccount(parent.id, parent.email || 'parent@example.com');
        await parentAuthService.deleteParentAccount(parent.id);
        this.inactivityWarningsSent.delete(parent.id);
        purgedParentIds.push(parent.id);
        continue;
      }

      // 2. Warning condition (>= 23 months and < 24 months)
      if (latestActivityMs < warningCutoff.getTime()) {
        if (!this.inactivityWarningsSent.has(parent.id)) {
          this.dispatchInactivityWarningEmail(parent, latestActivityMs);
          this.inactivityWarningsSent.set(parent.id, now.toISOString());
          warnedParentIds.push(parent.id);
        }
      }
    }

    privacyLogger.info('Data Retention Job 3 [Inactive Accounts]: Processed inactive accounts.', {
      warnedCount: warnedParentIds.length,
      purgedCount: purgedParentIds.length,
    });

    return {
      warnedCount: warnedParentIds.length,
      warnedParentIds,
      purgedCount: purgedParentIds.length,
      purgedParentIds,
    };
  }

  /**
   * Simulates dispatching an inactivity warning email to the parent.
   */
  private dispatchInactivityWarningEmail(parent: ParentAccount, lastActivityMs: number): void {
    const lastActiveDate = new Date(lastActivityMs).toISOString().split('T')[0];
    privacyLogger.info('Dispatched 30-day pre-deletion inactivity warning notice to parent.', {
      parentId: parent.id,
      recipient: '[REDACTED_EMAIL]',
      lastActiveDate,
      purgeWindowDays: 30,
      complianceNotice: 'Under COPPA and GDPR-K data limitation, dormant accounts are purged after 24 months.',
    });
  }

  /**
   * JOB 4: Automatic Deletion of Expired Audit Logs
   * Purges administrative access logs older than 30 days.
   */
  public purgeExpiredAuditLogs(options?: RetentionJobOptions): PurgeLogsResult {
    const now = options?.simulatedNow || new Date();
    const cutoff = getDaysCutoff(RETENTION_CONFIG.LOGS_RETENTION_DAYS, now);

    const result = adminAuditLogService.purgeOlderThan(cutoff);

    privacyLogger.info('Data Retention Job 4 [Audit Logs]: Purged expired access logs.', {
      purgedCount: result.purgedCount,
    });

    return {
      purgedCount: result.purgedCount,
      purgedLogIds: result.purgedIds,
    };
  }

  /**
   * MASTER RUN: Executes all 4 retention jobs in unified sequence.
   */
  public async runAllRetentionJobs(
    options?: RetentionJobOptions
  ): Promise<RetentionExecutionReport> {
    const now = options?.simulatedNow || new Date();

    const recResult = this.purgeExpiredRecordings(options);
    const transResult = this.purgeExpiredTranscripts(options);
    const accountResult = await this.processInactiveAccounts(options);
    const logResult = this.purgeExpiredAuditLogs(options);

    const totalPurged =
      recResult.purgedCount +
      transResult.purgedCount +
      accountResult.purgedCount +
      logResult.purgedCount;

    const report: RetentionExecutionReport = {
      timestamp: now.toISOString(),
      recordingsPurged: recResult.purgedCount,
      transcriptsPurged: transResult.purgedCount,
      inactiveAccountsWarned: accountResult.warnedCount,
      inactiveAccountsPurged: accountResult.purgedCount,
      logsPurged: logResult.purgedCount,
      totalPurged,
    };

    // Log administrative audit entry (STRICT: Zero child speech content)
    adminAuditLogService.recordAccess({
      actorId: 'system_retention_job',
      actorRole: 'system',
      action: 'delete_session',
      targetResourceType: 'settings',
      additionalContext: {
        jobRun: true,
        totalItemsPurged: totalPurged,
      },
    });

    return report;
  }

  /**
   * Helper for tests to inspect warning map.
   */
  public getInactivityWarningsMap(): Map<string, string> {
    return this.inactivityWarningsSent;
  }

  public resetWarningsForTesting(): void {
    this.inactivityWarningsSent.clear();
  }
}

export const dataRetentionService = new DataRetentionService();
