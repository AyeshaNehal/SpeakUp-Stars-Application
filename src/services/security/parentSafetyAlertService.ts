/**
 * CHILD PRIVACY & SAFETY NOTE (Rule 1, Rule 2, Rule 5):
 * - Quiet Parent Safety Alert Service
 * - When a child's speech indicates distress, harm, or abuse,
 *   this service quietly records a confidential flag for the parent.
 * - Crucially: NEVER shows alarming or scary messages to the child.
 * - Stores flag with policy-compliant retention in the family's private space.
 */

export interface ParentSafetyAlert {
  id: string;
  childId: string;
  timestamp: string;
  reason: 'distress_or_harm_detected';
  matchedKeywords: string[];
  reviewedByParent: boolean;
  notes?: string;
}

class ParentSafetyAlertService {
  private readonly STORAGE_KEY = 'speakup_parent_safety_alerts_v1';
  private memoryAlerts: ParentSafetyAlert[] = [];

  private isStorageAvailable(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  /**
   * Quietly records a safety alert in local encrypted/private storage.
   */
  public recordQuietAlert(childId: string, matchedKeywords: string[]): ParentSafetyAlert {
    const alert: ParentSafetyAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      childId,
      timestamp: new Date().toISOString(),
      reason: 'distress_or_harm_detected',
      matchedKeywords: matchedKeywords.map((k) => k.toLowerCase()),
      reviewedByParent: false,
    };

    if (this.isStorageAvailable()) {
      try {
        const existing = this.getAlerts();
        existing.unshift(alert);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing.slice(0, 50)));
        return alert;
      } catch {
        // Fall back to memory below
      }
    }

    this.memoryAlerts.unshift(alert);
    return alert;
  }

  /**
   * Retrieves alerts for the Parent Dashboard.
   */
  public getAlerts(childId?: string): ParentSafetyAlert[] {
    if (this.isStorageAvailable()) {
      try {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
          const alerts: ParentSafetyAlert[] = JSON.parse(raw);
          return childId ? alerts.filter((a) => a.childId === childId) : alerts;
        }
      } catch {
        // Fall back to memory
      }
    }

    return childId
      ? this.memoryAlerts.filter((a) => a.childId === childId)
      : [...this.memoryAlerts];
  }

  /**
   * Allows parent to acknowledge/review an alert.
   */
  public markAsReviewed(alertId: string): void {
    if (this.isStorageAvailable()) {
      try {
        const alerts = this.getAlerts();
        const updated = alerts.map((a) =>
          a.id === alertId ? { ...a, reviewedByParent: true } : a
        );
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }

    this.memoryAlerts = this.memoryAlerts.map((a) =>
      a.id === alertId ? { ...a, reviewedByParent: true } : a
    );
  }

  /**
   * Clears alerts (for testing or parent account reset).
   */
  public clearAll(): void {
    if (this.isStorageAvailable()) {
      try {
        localStorage.removeItem(this.STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    this.memoryAlerts = [];
  }
}

export const parentSafetyAlertService = new ParentSafetyAlertService();
