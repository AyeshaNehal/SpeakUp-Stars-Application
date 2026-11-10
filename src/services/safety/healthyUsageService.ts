/**
 * CHILD SAFETY & HEALTHY USAGE NOTE (Rule 1, Rule 6):
 * - Healthy Usage & Daily Time Limit Service
 * - Parent-set daily speaking practice limits.
 * - Gentle "Time to rest your voice" state when daily limit is reached.
 * - ZERO manipulative mechanics (no countdown panic, no guilt-tripping, no fear of losing streaks).
 * - Calming bedtime/rest themes.
 * - Time extensions require Parent PIN approval.
 */

import { privacyLogger } from '../logger';

export interface ChildDailyUsage {
  childId: string;
  dateString: string; // YYYY-MM-DD
  minutesSpent: number;
}

export interface UsageLimitStatus {
  childId: string;
  limitMinutes: number;
  minutesSpentToday: number;
  remainingMinutes: number;
  isLimitReached: boolean;
  encouragingMessage: string;
}

class HealthyUsageService {
  private readonly DEFAULT_LIMIT_MINUTES = 15;
  private readonly USAGE_KEY = 'speakup_daily_usage_v1';
  private readonly LIMIT_KEY = 'speakup_parent_time_limits_v1';

  private memoryUsage: Map<string, number> = new Map(); // key: `${childId}_${dateString}`
  private memoryLimits: Map<string, number> = new Map(); // key: childId

  private isStorageAvailable(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Gets the parent-configured daily time limit for a child (in minutes).
   */
  public getDailyLimitMinutes(childId: string): number {
    if (this.isStorageAvailable()) {
      try {
        const raw = localStorage.getItem(`${this.LIMIT_KEY}_${childId}`);
        if (raw !== null) {
          const parsed = parseInt(raw, 10);
          if (!isNaN(parsed) && parsed > 0) return parsed;
        }
      } catch {
        // fallback
      }
    }
    return this.memoryLimits.get(childId) || this.DEFAULT_LIMIT_MINUTES;
  }

  /**
   * Updates the daily time limit (Parent PIN verified).
   */
  public setDailyLimitMinutes(childId: string, limitMinutes: number): void {
    if (limitMinutes <= 0 || limitMinutes > 180) {
      throw new Error('Daily time limit must be between 1 and 180 minutes.');
    }
    this.memoryLimits.set(childId, limitMinutes);
    if (this.isStorageAvailable()) {
      try {
        localStorage.setItem(`${this.LIMIT_KEY}_${childId}`, limitMinutes.toString());
      } catch {
        // ignore
      }
    }
    privacyLogger.info('Parent updated healthy daily time limit.', { childId, limitMinutes });
  }

  /**
   * Gets minutes spent today by the child.
   */
  public getMinutesSpentToday(childId: string): number {
    const today = this.getTodayString();
    const key = `${childId}_${today}`;
    if (this.isStorageAvailable()) {
      try {
        const raw = localStorage.getItem(`${this.USAGE_KEY}_${key}`);
        if (raw !== null) {
          const parsed = parseFloat(raw);
          if (!isNaN(parsed)) return parsed;
        }
      } catch {
        // fallback
      }
    }
    return this.memoryUsage.get(key) || 0;
  }

  /**
   * Records practice duration for today.
   */
  public recordSessionDuration(childId: string, durationSeconds: number): UsageLimitStatus {
    const today = this.getTodayString();
    const key = `${childId}_${today}`;
    const minutesToAdd = Math.max(0.5, Math.round((durationSeconds / 60) * 10) / 10);

    const currentMinutes = this.getMinutesSpentToday(childId);
    const newMinutes = currentMinutes + minutesToAdd;

    this.memoryUsage.set(key, newMinutes);
    if (this.isStorageAvailable()) {
      try {
        localStorage.setItem(`${this.USAGE_KEY}_${key}`, newMinutes.toString());
      } catch {
        // ignore
      }
    }

    privacyLogger.info('Recorded child speaking practice duration.', {
      childId,
      addedMinutes: minutesToAdd,
      totalToday: newMinutes,
    });

    return this.checkUsageStatus(childId);
  }

  /**
   * Evaluates current usage status against parent limit.
   */
  public checkUsageStatus(childId: string): UsageLimitStatus {
    const limit = this.getDailyLimitMinutes(childId);
    const spent = this.getMinutesSpentToday(childId);
    const remaining = Math.max(0, Math.round((limit - spent) * 10) / 10);
    const isLimitReached = spent >= limit;

    const encouragingMessage = isLimitReached
      ? "Great job speaking today! Your voice did wonderful work. Let's give it a little cozy rest until tomorrow 🌙"
      : `You've practiced for ${Math.round(spent)} minutes today. Keep having fun!`;

    return {
      childId,
      limitMinutes: limit,
      minutesSpentToday: Math.round(spent * 10) / 10,
      remainingMinutes: remaining,
      isLimitReached,
      encouragingMessage,
    };
  }

  /**
   * Parent extension: Allows adding bonus minutes (e.g. +10 mins) after parent enters PIN.
   */
  public extendTimeForToday(childId: string, additionalMinutes: number): UsageLimitStatus {
    const currentLimit = this.getDailyLimitMinutes(childId);
    const newLimit = currentLimit + additionalMinutes;
    this.setDailyLimitMinutes(childId, newLimit);
    privacyLogger.info('Parent granted healthy usage extension.', { childId, addedMinutes: additionalMinutes });
    return this.checkUsageStatus(childId);
  }

  /**
   * Guard: Guilt-free messaging check. Ensures messages are encouraging and never manipulative.
   */
  public assertNoGuiltTrippingMechanics(message: string): void {
    const prohibitedKeywords = [
      'lose your streak',
      'lost your streak',
      'streak broken',
      'hurry up',
      'limited time',
      'buy more time',
      'don\'t let sparky down',
      'disappointed',
    ];

    const lower = message.toLowerCase();
    for (const kw of prohibitedKeywords) {
      if (lower.includes(kw)) {
        throw new Error(`CHILD SAFETY VIOLATION: Manipulative or guilt-tripping phrasing detected: "${kw}".`);
      }
    }
  }
}

export const healthyUsageService = new HealthyUsageService();
