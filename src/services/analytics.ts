/**
 * CHILD PRIVACY NOTE (Rule 1, 3, 5):
 * - Data used: Coarse aggregate event counter strings (e.g. 'practice_session_started', 'wheel_spun').
 * - Prohibitions: Zero user IDs, zero IP addresses, zero cookies, zero device fingerprinting,
 *   zero personal metadata, zero child transcripts or recordings.
 * - Purpose: Monitor general app stability and feature usage in aggregate without identifying any child.
 * - Processing & Retention: Stored locally as raw counts. If dispatched to an optional self-hosted endpoint,
 *   only anonymous aggregate counts with credentials omitted are sent.
 */

import { privacyLogger } from './logger';

export type AllowedAggregateEvent =
  | 'page_view_home'
  | 'page_view_wheel'
  | 'page_view_record'
  | 'page_view_results'
  | 'page_view_rewards'
  | 'page_view_profile'
  | 'page_view_parent'
  | 'wheel_spun'
  | 'recording_started'
  | 'recording_finished'
  | 'badge_viewed'
  | 'avatar_swapped';

interface AggregateMetricsStore {
  counts: Record<string, number>;
  lastUpdatedDate: string; // YYYY-MM-DD coarse date only
}

const STORAGE_KEY = 'speakup_aggregate_metrics_v1';

class PrivacySafeAnalytics {
  private memoryCounts: Record<string, number> = {};
  private endpoint: string | null = null;

  constructor() {
    this.endpoint = import.meta.env.VITE_PRIVACY_METRICS_ENDPOINT || null;
    this.loadLocalCounts();
  }

  private loadLocalCounts(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: AggregateMetricsStore = JSON.parse(stored);
        this.memoryCounts = parsed.counts || {};
      }
    } catch {
      // LocalStorage unavailable (e.g. strict sandbox); fall back to in-memory only
      this.memoryCounts = {};
    }
  }

  private persistLocalCounts(): void {
    try {
      const store: AggregateMetricsStore = {
        counts: this.memoryCounts,
        lastUpdatedDate: new Date().toISOString().split('T')[0], // Day only, no timestamps
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // Ignore storage write issues
    }
  }

  /**
   * Increments an aggregate-only event counter.
   * STRICT GUARANTEES:
   * 1. No user identifier.
   * 2. No session ID or device fingerprint.
   * 3. No cookies sent (`credentials: 'omit'`).
   * 4. No transcript, text, or personal attributes allowed.
   */
  public track(eventName: AllowedAggregateEvent): void {
    // 1. Increment local count
    this.memoryCounts[eventName] = (this.memoryCounts[eventName] || 0) + 1;
    this.persistLocalCounts();

    privacyLogger.debug(`[Aggregate Counter] ${eventName}: ${this.memoryCounts[eventName]}`);

    // 2. If a self-hosted privacy-safe endpoint is configured, send cookieless aggregate payload
    if (this.endpoint) {
      try {
        fetch(this.endpoint, {
          method: 'POST',
          mode: 'cors',
          credentials: 'omit', // STRICT: No cookies or client credentials
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: eventName,
            // Coarse date only (no precise timestamp or time of day)
            date: new Date().toISOString().split('T')[0],
          }),
        }).catch(() => {
          // Silent catch to prevent network failures from affecting the kid's experience
        });
      } catch {
        // Silent catch
      }
    }
  }

  /**
   * Retrieves current aggregate counts stored on-device (e.g. for Parent Dashboard visibility).
   */
  public getLocalAggregateCounts(): Record<string, number> {
    return { ...this.memoryCounts };
  }

  /**
   * Completely resets all local aggregate counts.
   */
  public clearLocalCounts(): void {
    this.memoryCounts = {};
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}

export const privacyAnalytics = new PrivacySafeAnalytics();
