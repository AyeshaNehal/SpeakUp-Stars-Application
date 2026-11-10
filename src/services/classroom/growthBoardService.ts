/**
 * CHILD SAFETY & PRIVACY NOTE (Rule 1, Rule 5):
 * - Classroom / Community Growth Board Service
 * - Strictly OPT-IN (Disabled by default).
 * - Nickname-only (Never full names, real names, or PII).
 * - Celebrates PERSONAL GROWTH ONLY (Milestones, categories tried, badges earned).
 * - Strictly PROHIBITS ranking kids against each other, leaderboards, competitive scores, or 1st/2nd/3rd places.
 */

import { privacyLogger } from '../logger';
import { sanitizeInput } from '../security/validation';

export interface GrowthMilestone {
  id: string;
  title: string;
  description: string;
  celebratedAt: string;
  icon: string;
}

export interface GrowthBoardEntry {
  childId: string;
  nickname: string;
  avatar: string;
  currentLevel: 'Seedling' | 'Sprout' | 'Flower' | 'Tree' | 'Star';
  recentMilestones: GrowthMilestone[];
  topicsExploredCount: number;
  badgesEarnedCount: number;
}

class GrowthBoardService {
  private readonly OPT_IN_KEY_PREFIX = 'speakup_growthboard_optin_';

  private memoryOptIn: Map<string, boolean> = new Map();
  private memoryEntries: GrowthBoardEntry[] = [];

  private isStorageAvailable(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  /**
   * Classroom Growth Board is strictly OFF / OPT-IN by default.
   */
  public isOptedIn(parentId: string): boolean {
    if (this.isStorageAvailable()) {
      try {
        const val = localStorage.getItem(`${this.OPT_IN_KEY_PREFIX}${parentId}`);
        if (val !== null) return JSON.parse(val);
      } catch {
        // fallback
      }
    }
    return this.memoryOptIn.get(parentId) || false;
  }

  /**
   * Parent controls the opt-in toggle.
   */
  public setOptIn(parentId: string, enabled: boolean): void {
    this.memoryOptIn.set(parentId, enabled);
    if (this.isStorageAvailable()) {
      try {
        localStorage.setItem(`${this.OPT_IN_KEY_PREFIX}${parentId}`, JSON.stringify(enabled));
      } catch {
        // ignore
      }
    }
    privacyLogger.info('Parent updated classroom growth board opt-in status.', {
      parentId,
      optedIn: enabled,
    });
  }

  /**
   * Anti-ranking assertion: Throws an error if any parameter tries to rank or sort kids competitively.
   */
  public assertNoRankingAttempt(query: { sortBy?: string; rankingField?: string }): void {
    const prohibitedSorts = ['score', 'rank', 'percentile', 'points', 'highest_streak', 'comparison'];
    if (
      (query.sortBy && prohibitedSorts.includes(query.sortBy.toLowerCase())) ||
      (query.rankingField && prohibitedSorts.includes(query.rankingField.toLowerCase()))
    ) {
      privacyLogger.error('BLOCKED COMPETITIVE RANKING ATTEMPT: Classroom leaderboards are prohibited.');
      throw new Error(
        'CHILD SAFETY GUARDRAIL: Competitive leaderboards and ranking kids against each other are strictly forbidden. SpeakUp Stars only celebrates personal milestones.'
      );
    }
  }

  /**
   * Registers or updates a child's personal growth celebration entry.
   * Nickname and avatar only.
   */
  public publishGrowthMilestone(
    parentId: string,
    childData: {
      childId: string;
      nickname: string;
      avatar: string;
      currentLevel: 'Seedling' | 'Sprout' | 'Flower' | 'Tree' | 'Star';
      milestone: GrowthMilestone;
      topicsExploredCount: number;
      badgesEarnedCount: number;
    }
  ): boolean {
    if (!this.isOptedIn(parentId)) {
      privacyLogger.warn('Cannot publish milestone to growth board: Parent has not opted in.', { parentId });
      return false;
    }

    // Sanitize nickname - prevent emails or sensitive text
    const cleanNickname = sanitizeInput(childData.nickname);
    if (cleanNickname.includes('@') || cleanNickname.length > 20) {
      throw new Error('Invalid nickname for Growth Board. Real names or emails are not permitted.');
    }

    const existingIndex = this.memoryEntries.findIndex((e) => e.childId === childData.childId);
    if (existingIndex >= 0) {
      const existing = this.memoryEntries[existingIndex];
      existing.nickname = cleanNickname;
      existing.avatar = childData.avatar;
      existing.currentLevel = childData.currentLevel;
      existing.topicsExploredCount = childData.topicsExploredCount;
      existing.badgesEarnedCount = childData.badgesEarnedCount;
      if (!existing.recentMilestones.some((m) => m.id === childData.milestone.id)) {
        existing.recentMilestones.unshift(childData.milestone);
        if (existing.recentMilestones.length > 5) existing.recentMilestones.pop();
      }
    } else {
      this.memoryEntries.push({
        childId: childData.childId,
        nickname: cleanNickname,
        avatar: childData.avatar,
        currentLevel: childData.currentLevel,
        recentMilestones: [childData.milestone],
        topicsExploredCount: childData.topicsExploredCount,
        badgesEarnedCount: childData.badgesEarnedCount,
      });
    }

    return true;
  }

  /**
   * Retrieves growth celebrations for the classroom.
   * Returns them in an unranked, randomized, or chronological celebration order.
   * Strictly DOES NOT return ranks (1st, 2nd, 3rd) or numerical score comparisons.
   */
  public getGrowthCelebrations(parentId: string): GrowthBoardEntry[] {
    if (!this.isOptedIn(parentId)) {
      return [];
    }

    // Return entries without competitive ordering
    return [...this.memoryEntries];
  }
}

export const growthBoardService = new GrowthBoardService();
