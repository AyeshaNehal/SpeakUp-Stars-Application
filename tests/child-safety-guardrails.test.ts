/**
 * CHILD SAFETY GUARDRAILS TEST SUITE
 *
 * Verifies all child-safety rules:
 * 1. Zero social networking: No chat, comments, public profiles, or friend requests reachable by children.
 * 2. External links strictly gated behind Parent PIN.
 * 3. Speech sharing strictly OFF by default, limited to approved family contacts, requires Parent PIN, and expires in 24 hours.
 * 4. Classroom features are opt-in, nickname-only, and celebrate personal growth instead of ranking kids against each other.
 * 5. Healthy-use features: Parent-set daily time limits, gentle "time to rest your voice" screen, zero guilt-tripping.
 * 6. Push notifications go to parents only and are capped to max 2/week with zero manipulative habit mechanics.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { childSafetyGuardService } from '../src/services/security/childSafetyGuardService';
import { familySharingService } from '../src/services/sharing/familySharingService';
import { growthBoardService } from '../src/services/classroom/growthBoardService';
import { healthyUsageService } from '../src/services/safety/healthyUsageService';
import { parentNotificationService } from '../src/services/notifications/parentNotificationService';

const store = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => store.get(key) || null,
  setItem: (key: string, value: string) => store.set(key, value),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
};
// @ts-expect-error polyfill for Node test runner
globalThis.localStorage = mockLocalStorage;

describe('Child-Safety Guardrails & Protection Suite', () => {
  const parentId = 'parent_safe_001';
  const childId = 'child_safe_001';

  beforeEach(() => {
    store.clear();
  });

  describe('1. Zero Social Networking for Children', () => {
    it('strictly forbids chat, comments, public profiles, and friend requests', () => {
      expect(() => {
        childSafetyGuardService.assertFeatureAllowedForChild('chat');
      }).toThrow(/CHILD SAFETY GUARDRAIL/);

      expect(() => {
        childSafetyGuardService.assertFeatureAllowedForChild('comments');
      }).toThrow(/CHILD SAFETY GUARDRAIL/);

      expect(() => {
        childSafetyGuardService.assertFeatureAllowedForChild('public_profiles');
      }).toThrow(/CHILD SAFETY GUARDRAIL/);

      expect(() => {
        childSafetyGuardService.assertFeatureAllowedForChild('friend_requests');
      }).toThrow(/CHILD SAFETY GUARDRAIL/);
    });

    it('identifies external links and mandates Parent PIN to open them', async () => {
      expect(childSafetyGuardService.isExternalUrl('https://youtube.com')).toBe(true);
      expect(childSafetyGuardService.isExternalUrl('https://example.com/play')).toBe(true);
      expect(childSafetyGuardService.isExternalUrl('/prep')).toBe(false);
      expect(childSafetyGuardService.isExternalUrl('#settings')).toBe(false);

      // Child navigation without PIN is blocked
      const blockedAttempt = await childSafetyGuardService.authorizeExternalLinkAccess(
        'https://wikipedia.org',
        '' // No PIN
      );
      expect(blockedAttempt.allowed).toBe(false);
      expect(blockedAttempt.errorMessage).toContain('PIN is required');

      // Invalid short PIN is blocked
      const invalidPinAttempt = await childSafetyGuardService.authorizeExternalLinkAccess(
        'https://wikipedia.org',
        '12'
      );
      expect(invalidPinAttempt.allowed).toBe(false);

      // Insecure HTTP link is rejected even with PIN
      const insecureAttempt = await childSafetyGuardService.authorizeExternalLinkAccess(
        'http://insecure-site.com',
        '1234'
      );
      expect(insecureAttempt.allowed).toBe(false);
      expect(insecureAttempt.errorMessage).toContain('secure HTTPS');

      // Valid HTTPS with parent PIN passes
      const validAttempt = await childSafetyGuardService.authorizeExternalLinkAccess(
        'https://nationalgeographic.com/kids',
        '1234'
      );
      expect(validAttempt.allowed).toBe(true);
      expect(validAttempt.sanitizedUrl).toBe('https://nationalgeographic.com/kids');
    });
  });

  describe('2. Family-Only Speech Sharing Guardrails', () => {
    it('is strictly OFF by default', () => {
      const isEnabled = familySharingService.isSharingEnabled(parentId);
      expect(isEnabled).toBe(false);
    });

    it('blocks sharing attempts if master sharing toggle is off', async () => {
      const shareResult = await familySharingService.generateFamilyShareLink({
        parentId,
        childId,
        sessionId: 'sess_001',
        contactId: 'contact_grandma_1',
        parentPin: '1234',
      });
      expect(shareResult.success).toBe(false);
      expect(shareResult.error).toContain('disabled');
    });

    it('only permits sharing to parent-approved family contacts with PIN verification', async () => {
      // Parent enables sharing
      familySharingService.setSharingEnabled(parentId, true);
      expect(familySharingService.isSharingEnabled(parentId)).toBe(true);

      // Add Grandma as approved family contact
      const grandma = familySharingService.addApprovedContact(parentId, {
        name: 'Grandma Rose',
        relationship: 'Grandparent',
        email: 'grandma@example.com',
      });
      expect(grandma.id).toBeDefined();

      // Attempt to share with unapproved stranger fails
      const strangerShare = await familySharingService.generateFamilyShareLink({
        parentId,
        childId,
        sessionId: 'sess_001',
        contactId: 'unapproved_stranger_id',
        parentPin: '1234',
      });
      expect(strangerShare.success).toBe(false);
      expect(strangerShare.error).toContain('approved family');

      // Sharing without PIN fails
      const noPinShare = await familySharingService.generateFamilyShareLink({
        parentId,
        childId,
        sessionId: 'sess_001',
        contactId: grandma.id,
        parentPin: '',
      });
      expect(noPinShare.success).toBe(false);
      expect(noPinShare.error).toContain('PIN is required');

      // Valid share with approved contact and PIN succeeds
      const successfulShare = await familySharingService.generateFamilyShareLink({
        parentId,
        childId,
        sessionId: 'sess_001',
        contactId: grandma.id,
        parentPin: '1234',
      });
      expect(successfulShare.success).toBe(true);
      expect(successfulShare.link).toBeDefined();

      // Check 24-hour expiration window
      const link = successfulShare.link!;
      const createdTime = new Date(link.createdAt).getTime();
      const expiresTime = new Date(link.expiresAt).getTime();
      const differenceHours = (expiresTime - createdTime) / (1000 * 60 * 60);
      expect(Math.round(differenceHours)).toBe(24);
    });
  });

  describe('3. Classroom / Growth Board Anti-Ranking Guardrails', () => {
    it('is strictly OPT-IN and disabled by default', () => {
      expect(growthBoardService.isOptedIn(parentId)).toBe(false);
      expect(growthBoardService.getGrowthCelebrations(parentId)).toEqual([]);
    });

    it('strictly forbids competitive ranking or leaderboards sorting kids by score', () => {
      expect(() => {
        growthBoardService.assertNoRankingAttempt({ sortBy: 'score' });
      }).toThrow(/Competitive leaderboards and ranking kids against each other are strictly forbidden/);

      expect(() => {
        growthBoardService.assertNoRankingAttempt({ rankingField: 'rank' });
      }).toThrow(/Competitive leaderboards/);

      expect(() => {
        growthBoardService.assertNoRankingAttempt({ sortBy: 'percentile' });
      }).toThrow(/Competitive leaderboards/);
    });

    it('celebrates personal growth and milestones with nickname only', () => {
      growthBoardService.setOptIn(parentId, true);
      expect(growthBoardService.isOptedIn(parentId)).toBe(true);

      const published = growthBoardService.publishGrowthMilestone(parentId, {
        childId,
        nickname: 'SparkyHero',
        avatar: '🦊',
        currentLevel: 'Sprout',
        milestone: {
          id: 'ms_01',
          title: 'First Brave Speech!',
          description: 'Spoke about Space with great eye contact.',
          celebratedAt: new Date().toISOString(),
          icon: '🚀',
        },
        topicsExploredCount: 3,
        badgesEarnedCount: 2,
      });

      expect(published).toBe(true);
      const entries = growthBoardService.getGrowthCelebrations(parentId);
      expect(entries.length).toBe(1);
      expect(entries[0].nickname).toBe('SparkyHero');
      expect(entries[0].currentLevel).toBe('Sprout');
      expect(entries[0].recentMilestones[0].title).toBe('First Brave Speech!');

      // Rejects real emails as nicknames
      expect(() => {
        growthBoardService.publishGrowthMilestone(parentId, {
          childId: 'child_email',
          nickname: 'kid@school.org',
          avatar: '🐼',
          currentLevel: 'Seedling',
          milestone: {
            id: 'ms_02',
            title: 'Badge',
            description: 'Test',
            celebratedAt: new Date().toISOString(),
            icon: '⭐',
          },
          topicsExploredCount: 1,
          badgesEarnedCount: 1,
        });
      }).toThrow(/Real names or emails are not permitted/);
    });
  });

  describe('4. Healthy Daily Time Limits & Rest Screen', () => {
    it('tracks practice minutes and triggers gentle rest when limit is reached', () => {
      // Default 15-minute daily limit
      const defaultLimit = healthyUsageService.getDailyLimitMinutes(childId);
      expect(defaultLimit).toBe(15);

      // Record 10 minutes practice
      const status1 = healthyUsageService.recordSessionDuration(childId, 600); // 600 seconds = 10 mins
      expect(status1.minutesSpentToday).toBe(10);
      expect(status1.isLimitReached).toBe(false);

      // Record 6 more minutes practice (Total = 16 mins >= 15 min limit)
      const status2 = healthyUsageService.recordSessionDuration(childId, 360);
      expect(status2.minutesSpentToday).toBe(16);
      expect(status2.isLimitReached).toBe(true);
      expect(status2.encouragingMessage).toContain("Let's give it a little cozy rest until tomorrow 🌙");
    });

    it('prohibits manipulative guilt-tripping mechanics or streak fear messages', () => {
      expect(() => {
        healthyUsageService.assertNoGuiltTrippingMechanics("Hurry up, don't let sparky down!");
      }).toThrow(/CHILD SAFETY VIOLATION: Manipulative or guilt-tripping phrasing/);

      expect(() => {
        healthyUsageService.assertNoGuiltTrippingMechanics('Practice now or lose your streak!');
      }).toThrow(/CHILD SAFETY VIOLATION/);

      // Safe, kind phrasing passes
      expect(() => {
        healthyUsageService.assertNoGuiltTrippingMechanics(
          "Great job speaking today! Your voice did wonderful work. Let's rest!"
        );
      }).not.toThrow();
    });

    it('allows parent to extend practice time via PIN', () => {
      const extendedStatus = healthyUsageService.extendTimeForToday(childId, 15);
      expect(extendedStatus.limitMinutes).toBe(30); // 15 + 15 = 30
      expect(extendedStatus.remainingMinutes).toBeGreaterThan(0);
      expect(extendedStatus.isLimitReached).toBe(false);
    });
  });

  describe('5. Parent-Only Push Notifications & Frequency Capping', () => {
    it('strictly forbids sending push notifications directly to children', () => {
      expect(() => {
        parentNotificationService.assertRecipientIsParentOnly('child');
      }).toThrow(/CHILD SAFETY GUARDRAIL: Push notifications cannot be sent directly to children/);

      expect(() => {
        parentNotificationService.assertRecipientIsParentOnly('parent');
      }).not.toThrow();
    });

    it('blocks manipulative habit-forming wording in notifications', () => {
      expect(() => {
        parentNotificationService.assertNonManipulativeContent(
          'Urgent!',
          'Your streak will break in 2 hours! Play now or lose everything!'
        );
      }).toThrow(/CHILD SAFETY GUARDRAIL: Manipulative/);

      expect(() => {
        parentNotificationService.assertNonManipulativeContent(
          'Weekly Summary',
          'Emma practiced 3 times this week and tried Science topics. Great progress!'
        );
      }).not.toThrow();
    });

    it('enforces maximum 2 notifications per week frequency cap', () => {
      // 1st notification succeeds
      const notif1 = parentNotificationService.sendParentNotification(parentId, {
        type: 'weekly_summary',
        title: 'Weekly Speaking Recap',
        body: 'Here is your child’s weekly speaking fun recap.',
      });
      expect(notif1.success).toBe(true);

      // 2nd notification succeeds
      const notif2 = parentNotificationService.sendParentNotification(parentId, {
        type: 'milestone_celebration',
        title: 'New Milestone Unlocked!',
        body: 'Your child earned the Brave Voice badge today.',
      });
      expect(notif2.success).toBe(true);

      // 3rd notification is blocked by weekly frequency cap
      const notif3 = parentNotificationService.sendParentNotification(parentId, {
        type: 'weekly_summary',
        title: 'Extra reminder',
        body: 'Check out the new topics.',
      });
      expect(notif3.success).toBe(false);
      expect(notif3.blockedReason).toContain('Weekly frequency limit reached (Max 2 per week)');
    });
  });
});
