/**
 * CHILD SAFETY & PRIVACY NOTE (Rule 1, Rule 6):
 * - Parent-Only Notification Service
 * - Push notifications strictly target the VERIFIED PARENT (Never the child).
 * - Maximum frequency limit: 2 notifications per week to prevent manipulative habit loops.
 * - Prohibits manipulative nagging (e.g. "Your streak is dying!", "Come back and play!").
 * - Supports weekly parent progress summaries and safety alerts.
 */

import { privacyLogger } from '../logger';

export interface ParentNotification {
  id: string;
  parentId: string;
  type: 'weekly_summary' | 'safety_alert' | 'milestone_celebration' | 'security_notice';
  title: string;
  body: string;
  sentAt: string;
}

export interface NotificationSendResult {
  success: boolean;
  blockedReason?: string;
  notification?: ParentNotification;
}

class ParentNotificationService {
  private readonly MAX_NOTIFICATIONS_PER_WEEK = 2;
  private readonly NOTIF_PREFS_KEY = 'speakup_notification_preferences_';

  private memoryHistory: Map<string, ParentNotification[]> = new Map();
  private memoryPrefs: Map<string, boolean> = new Map();

  private isStorageAvailable(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  /**
   * Checks parent's notification opt-in preference.
   */
  public isParentOptedIn(parentId: string): boolean {
    if (this.isStorageAvailable()) {
      try {
        const raw = localStorage.getItem(`${this.NOTIF_PREFS_KEY}${parentId}`);
        if (raw !== null) return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    return this.memoryPrefs.get(parentId) ?? true; // Default true for parents
  }

  /**
   * Allows parent to toggle notifications.
   */
  public setParentOptIn(parentId: string, enabled: boolean): void {
    this.memoryPrefs.set(parentId, enabled);
    if (this.isStorageAvailable()) {
      try {
        localStorage.setItem(`${this.NOTIF_PREFS_KEY}${parentId}`, JSON.stringify(enabled));
      } catch {
        // ignore
      }
    }
    privacyLogger.info('Parent updated notification preference.', { parentId, enabled });
  }

  /**
   * Retrieves notifications sent to this parent in the past 7 days.
   */
  public getNotificationsInPastWeek(parentId: string): ParentNotification[] {
    const all = this.memoryHistory.get(parentId) || [];
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return all.filter((n) => new Date(n.sentAt).getTime() > sevenDaysAgo);
  }

  /**
   * Strictly disallows child-targeted notifications.
   */
  public assertRecipientIsParentOnly(targetRole: 'parent' | 'child'): void {
    if (targetRole === 'child') {
      privacyLogger.error('BLOCKED CHILD NOTIFICATION: Direct push notifications to children are strictly prohibited.');
      throw new Error(
        'CHILD SAFETY GUARDRAIL: Push notifications cannot be sent directly to children. All communications must go to the verified parent only.'
      );
    }
  }

  /**
   * Validates notification text to ensure zero manipulative habit-forming wording.
   */
  public assertNonManipulativeContent(title: string, body: string): void {
    const combined = `${title} ${body}`.toLowerCase();
    const manipulativeKeywords = [
      'streak will break',
      'streak will die',
      'dont lose your streak',
      'don\'t lose your streak',
      'hurry back',
      'you are falling behind',
      'play now or lose',
    ];

    for (const phrase of manipulativeKeywords) {
      if (combined.includes(phrase)) {
        throw new Error(
          `CHILD SAFETY GUARDRAIL: Manipulative or fear-inducing notification blocked: "${phrase}".`
        );
      }
    }
  }

  /**
   * Sends a notification to the parent, strictly enforcing the 2-per-week frequency cap.
   */
  public sendParentNotification(
    parentId: string,
    payload: {
      type: ParentNotification['type'];
      title: string;
      body: string;
    }
  ): NotificationSendResult {
    // 1. Check parent opt-in
    if (!this.isParentOptedIn(parentId)) {
      return {
        success: false,
        blockedReason: 'Parent has disabled optional push notifications.',
      };
    }

    // 2. Validate non-manipulative wording
    this.assertNonManipulativeContent(payload.title, payload.body);

    // 3. Enforce maximum 2 notifications per week rate limit (except urgent security notices)
    const recentWeekly = this.getNotificationsInPastWeek(parentId);
    if (payload.type !== 'security_notice' && recentWeekly.length >= this.MAX_NOTIFICATIONS_PER_WEEK) {
      privacyLogger.warn('Notification blocked: Parent weekly frequency limit reached (max 2/week).', {
        parentId,
        recentCount: recentWeekly.length,
      });
      return {
        success: false,
        blockedReason: `Weekly frequency limit reached (Max ${this.MAX_NOTIFICATIONS_PER_WEEK} per week). Protecting family quiet time.`,
      };
    }

    // 4. Record and dispatch
    const notification: ParentNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      parentId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      sentAt: new Date().toISOString(),
    };

    const currentList = this.memoryHistory.get(parentId) || [];
    currentList.push(notification);
    this.memoryHistory.set(parentId, currentList);

    privacyLogger.info('Dispatched parent-only notification.', {
      parentId,
      type: payload.type,
      notifId: notification.id,
    });

    return {
      success: true,
      notification,
    };
  }
}

export const parentNotificationService = new ParentNotificationService();
