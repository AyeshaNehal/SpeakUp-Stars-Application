/**
 * CHILD WELL-BEING & HEALTHY DIGITAL HABITS (Rule 1, Rule 6):
 * - Screen-Time & Vocal Rest Reminder Service
 * - Triggers gentle reminder after continuous session time (default: 15 mins).
 * - Encourages drinking water and relaxing vocal cords.
 * - ZERO guilt-tripping mechanics or streak loss warnings.
 */

export interface ScreenTimeState {
  sessionStartTimestamp: number;
  activeSeconds: number;
  isReminderDue: boolean;
  dismissedUntilTimestamp: number;
}

class ScreenTimeReminderService {
  private readonly DEFAULT_LIMIT_SECONDS = 15 * 60; // 15 minutes continuous practice
  private sessionStart = Date.now();
  private dismissedUntil = 0;

  public resetSession(): void {
    this.sessionStart = Date.now();
    this.dismissedUntil = 0;
  }

  public checkReminder(limitSeconds = this.DEFAULT_LIMIT_SECONDS): boolean {
    const now = Date.now();
    if (now < this.dismissedUntil) return false;

    const elapsedSeconds = (now - this.sessionStart) / 1000;
    return elapsedSeconds >= limitSeconds;
  }

  public snoozeReminder(minutes = 5): void {
    this.dismissedUntil = Date.now() + minutes * 60 * 1000;
  }
}

export const screenTimeReminderService = new ScreenTimeReminderService();
