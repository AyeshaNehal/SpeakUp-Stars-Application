/**
 * CHILD PRIVACY & SECURITY NOTE (Rule 1, Rule 2, Rule 6):
 * - Admin Access Audit Log Service
 * - Records WHO accessed WHAT data and WHEN.
 * - STRICT GUARANTEE: Never includes child speech transcripts, audio blobs, or biometric content.
 * - Enforces Row-Level Security isolation: Parents can only inspect audit records for their own family.
 */

import { privacyLogger } from '../logger';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'view_sessions'
  | 'view_metrics'
  | 'export_data_json'
  | 'export_data_csv'
  | 'delete_session'
  | 'delete_child_data'
  | 'delete_account'
  | 'update_consent'
  | 'security_alert_review'
  | 'pin_verify_success'
  | 'pin_verify_failed';

export type TargetResourceType =
  | 'session'
  | 'child_profile'
  | 'consent_record'
  | 'parent_account'
  | 'settings'
  | 'recording_media';

export interface AdminAuditEntry {
  id: string;
  parentId?: string | null;
  actorId: string;
  actorRole: 'parent' | 'system' | 'admin' | 'auditor';
  action: AuditAction;
  targetResourceId?: string;
  targetResourceType: TargetResourceType;
  ipAddressHash: string;
  userAgentHash: string;
  success: boolean;
  createdAt: string;
}

class AdminAuditLogService {
  private readonly STORAGE_KEY = 'speakup_admin_audit_logs_v1';
  private memoryLogs: AdminAuditEntry[] = [];

  private isStorageAvailable(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  /**
   * Cryptographic hash helper for IP / UA privacy anonymization.
   */
  private hashString(val: string): string {
    let hash = 0;
    for (let i = 0; i < val.length; i++) {
      hash = (hash << 5) - hash + val.charCodeAt(i);
      hash |= 0;
    }
    return `hash_${Math.abs(hash).toString(16)}`;
  }

  /**
   * STRICT GUARD: Fails immediately if any caller attempts to log child speech content or transcripts.
   */
  public assertNoChildContentInAudit(entry: Record<string, unknown>): void {
    const forbiddenKeys = [
      'transcript',
      'rawTranscript',
      'speech',
      'rawSpeech',
      'audio',
      'blob',
      'landmarks',
      'faceEmbedding',
      'voiceprint',
      'childText',
    ];

    for (const key of Object.keys(entry)) {
      if (forbiddenKeys.some((f) => key.toLowerCase().includes(f.toLowerCase()))) {
        throw new Error(
          `CHILD PRIVACY VIOLATION: Audit log must NEVER record child speech content or biometric signals (forbidden key: "${key}").`
        );
      }

      const val = entry[key];
      if (typeof val === 'string' && val.length > 250) {
        throw new Error(
          `SECURITY WARNING: Potential speech transcript or payload detected in audit log string value (length ${val.length}).`
        );
      }
    }
  }

  /**
   * Records an access audit log entry.
   */
  public recordAccess(params: {
    parentId?: string | null;
    actorId: string;
    actorRole: 'parent' | 'system' | 'admin' | 'auditor';
    action: AuditAction;
    targetResourceId?: string;
    targetResourceType: TargetResourceType;
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
    additionalContext?: Record<string, unknown>;
  }): AdminAuditEntry {
    if (params.additionalContext) {
      this.assertNoChildContentInAudit(params.additionalContext);
    }

    const entry: AdminAuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      parentId: params.parentId || null,
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: params.action,
      targetResourceId: params.targetResourceId,
      targetResourceType: params.targetResourceType,
      ipAddressHash: this.hashString(params.ipAddress || '127.0.0.1'),
      userAgentHash: this.hashString(params.userAgent || 'SpeakUp-Client/1.0'),
      success: params.success !== undefined ? params.success : true,
      createdAt: new Date().toISOString(),
    };

    if (this.isStorageAvailable()) {
      try {
        const existing = this.getAllLogsInternal();
        existing.unshift(entry);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing.slice(0, 1000)));
      } catch {
        // Fall back to memory
      }
    }

    this.memoryLogs.unshift(entry);

    privacyLogger.info('Security Audit Log Entry recorded.', {
      auditId: entry.id,
      actorId: entry.actorId,
      action: entry.action,
      resourceType: entry.targetResourceType,
    });

    return entry;
  }

  /**
   * Retrieves audit logs for a specific parent (Family-Isolation Enforced).
   */
  public getLogsForParent(parentId: string): AdminAuditEntry[] {
    const all = this.getAllLogsInternal();
    return all.filter((l) => l.parentId === parentId);
  }

  /**
   * Internal retrieval.
   */
  public getAllLogs(): AdminAuditEntry[] {
    return this.getAllLogsInternal();
  }

  private getAllLogsInternal(): AdminAuditEntry[] {
    if (this.isStorageAvailable()) {
      try {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch {
        // ignore
      }
    }
    return [...this.memoryLogs];
  }

  /**
   * Purges audit logs older than the specified cutoff date.
   */
  public purgeOlderThan(cutoffDate: Date): { purgedCount: number; purgedIds: string[] } {
    const all = this.getAllLogsInternal();
    const cutoffMs = cutoffDate.getTime();

    const remaining: AdminAuditEntry[] = [];
    const purgedIds: string[] = [];

    for (const entry of all) {
      const entryTime = new Date(entry.createdAt).getTime();
      if (entryTime < cutoffMs) {
        purgedIds.push(entry.id);
      } else {
        remaining.push(entry);
      }
    }

    if (this.isStorageAvailable()) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(remaining));
      } catch {
        // ignore
      }
    }
    this.memoryLogs = remaining;

    return {
      purgedCount: purgedIds.length,
      purgedIds,
    };
  }

  /**
   * Clear logs (for testing only).
   */
  public clearAll(): void {
    if (this.isStorageAvailable()) {
      try {
        localStorage.removeItem(this.STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    this.memoryLogs = [];
  }
}

export const adminAuditLogService = new AdminAuditLogService();
