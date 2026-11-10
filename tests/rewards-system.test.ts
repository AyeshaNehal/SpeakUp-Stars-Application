/**
 * AUTOMATED TESTS: Rewards, Streaks, Badges, and Reward Shop System
 * Verifies:
 * 1. Star points awarding & deduction (spinning, recording, category, skills).
 * 2. Level calculation and XP progress bar computation.
 * 3. Daily practice streak tracking & Streak Freeze protection (missed day preserved without guilt).
 * 4. Badges unlocking (First Speech, Brave Voice, Story Teller, Eye Contact Hero, 7-Day Streak, Topic Explorer 10).
 * 5. Reward Shop: Purchasing items with points, insufficient points rejection, equipping items on mascot.
 * 6. Zero real-money verification and child well-being guards.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  rewardsService,
  BADGE_CATALOG,
  SHOP_CATALOG,
} from '../src/services/rewards/rewardsService';

describe('Rewards & Progression System', () => {
  const TEST_CHILD = 'child_test_reward_123';

  beforeEach(() => {
    // Clear storage for test child
    rewardsService.clearStorage(TEST_CHILD);
  });

  describe('Star Points & Levels', () => {
    it('starts with 0 points and calculates Level 1 Star Cadet', () => {
      const points = rewardsService.getPoints(TEST_CHILD);
      expect(points).toBe(0);

      const level = rewardsService.getLevelInfo(points);
      expect(level.level).toBe(1);
      expect(level.title).toBe('Star Cadet 🌟');
      expect(level.currentLevelMin).toBe(0);
      expect(level.nextLevelMin).toBe(50);
      expect(level.progressPercent).toBe(0);
    });

    it('awards points correctly for different activities', () => {
      // Spin the wheel (+5)
      rewardsService.awardPoints(TEST_CHILD, 'spin_wheel', 5);
      expect(rewardsService.getPoints(TEST_CHILD)).toBe(5);

      // Finish recording (+25)
      rewardsService.awardPoints(TEST_CHILD, 'finish_recording', 25);
      expect(rewardsService.getPoints(TEST_CHILD)).toBe(30);

      // Daily practice default points (+10)
      rewardsService.awardPoints(TEST_CHILD, 'daily_practice');
      expect(rewardsService.getPoints(TEST_CHILD)).toBe(40);

      // Skill improved (+20)
      rewardsService.awardPoints(TEST_CHILD, 'skill_improved', 20);
      expect(rewardsService.getPoints(TEST_CHILD)).toBe(60);

      // Points history audit
      const history = rewardsService.getPointsHistory(TEST_CHILD);
      expect(history.length).toBe(4);
      expect(history[0].reason).toBe('skill_improved');
    });

    it('advances levels as points increase', () => {
      // 60 points -> Level 2: Voice Explorer (50 to 120 pts)
      const level2 = rewardsService.getLevelInfo(60);
      expect(level2.level).toBe(2);
      expect(level2.title).toBe('Voice Explorer 🧭');
      expect(level2.currentLevelMin).toBe(50);
      expect(level2.nextLevelMin).toBe(120);
      expect(level2.progressPercent).toBe(Math.round(((60 - 50) / (120 - 50)) * 100));

      // 400 points -> Level 5: Superstar Speaker (300 to 450 pts)
      const level5 = rewardsService.getLevelInfo(400);
      expect(level5.level).toBe(5);
      expect(level5.title).toBe('Superstar Speaker 🌟');
    });
  });

  describe('Daily Streaks & Streak Freeze Protection', () => {
    it('starts streak at 1 on first practice', () => {
      const streak = rewardsService.recordDailyPractice(TEST_CHILD, '2026-10-01');
      expect(streak.currentStreak).toBe(1);
      expect(streak.lastPracticeDate).toBe('2026-10-01');
      expect(streak.streakFreezesAvailable).toBe(1);
      expect(streak.freezeUsedToday).toBe(false);
    });

    it('does not duplicate streak count if practiced twice in the same day', () => {
      rewardsService.recordDailyPractice(TEST_CHILD, '2026-10-01');
      const streak2 = rewardsService.recordDailyPractice(TEST_CHILD, '2026-10-01');
      expect(streak2.currentStreak).toBe(1);
    });

    it('increments streak on consecutive practice days', () => {
      rewardsService.recordDailyPractice(TEST_CHILD, '2026-10-01');
      const streakDay2 = rewardsService.recordDailyPractice(TEST_CHILD, '2026-10-02');
      expect(streakDay2.currentStreak).toBe(2);

      const streakDay3 = rewardsService.recordDailyPractice(TEST_CHILD, '2026-10-03');
      expect(streakDay3.currentStreak).toBe(3);
    });

    it('ACTIVATES STREAK FREEZE when 1 day is missed, preserving the streak without guilt', () => {
      rewardsService.recordDailyPractice(TEST_CHILD, '2026-10-01');
      rewardsService.recordDailyPractice(TEST_CHILD, '2026-10-02'); // Streak = 2

      // Child missed 2026-10-03! Returns on 2026-10-04 (2-day jump)
      const streakAfterMissed = rewardsService.recordDailyPractice(TEST_CHILD, '2026-10-04');

      // Streak Freeze protected them!
      expect(streakAfterMissed.currentStreak).toBe(3); // Streak preserved and increased!
      expect(streakAfterMissed.streakFreezesAvailable).toBe(0); // Freeze used
      expect(streakAfterMissed.freezeUsedToday).toBe(true);
    });

    it('resets kindly to 1 without guilt-tripping if missed multiple days without freeze', () => {
      rewardsService.recordDailyPractice(TEST_CHILD, '2026-10-01'); // Day 1
      // Misses 5 days (jump to 2026-10-06)
      const streak = rewardsService.recordDailyPractice(TEST_CHILD, '2026-10-06');
      expect(streak.currentStreak).toBe(1);
      expect(streak.message).toContain('Great start');
    });

    it('automatically unlocks 7-Day Streak badge when reaching 7 days', () => {
      for (let i = 1; i <= 7; i++) {
        const dayStr = `2026-10-${i.toString().padStart(2, '0')}`;
        rewardsService.recordDailyPractice(TEST_CHILD, dayStr);
      }
      const badges = rewardsService.getBadges(TEST_CHILD);
      const streakBadge = badges.find((b) => b.key === 'streak_7_day');
      expect(streakBadge?.unlocked).toBe(true);
    });
  });

  describe('Badges System', () => {
    it('contains all 6 core badges', () => {
      const keys = Object.keys(BADGE_CATALOG);
      expect(keys).toContain('first_speech');
      expect(keys).toContain('brave_voice');
      expect(keys).toContain('story_teller');
      expect(keys).toContain('eye_contact_hero');
      expect(keys).toContain('streak_7_day');
      expect(keys).toContain('topic_explorer_10');
    });

    it('unlocks badges and awards bonus stars', () => {
      const initialPoints = rewardsService.getPoints(TEST_CHILD);
      const unlockResult = rewardsService.unlockBadge(TEST_CHILD, 'story_teller');

      expect(unlockResult.newlyUnlocked).toBe(true);
      expect(unlockResult.badge.unlocked).toBe(true);

      // Bonus points awarded (+20)
      const newPoints = rewardsService.getPoints(TEST_CHILD);
      expect(newPoints).toBe(initialPoints + 20);

      // Calling unlock again should not be newlyUnlocked
      const duplicateResult = rewardsService.unlockBadge(TEST_CHILD, 'story_teller');
      expect(duplicateResult.newlyUnlocked).toBe(false);
    });
  });

  describe('Reward Shop & Mascot Customizations', () => {
    it('has free sunny theme unlocked by default and other items locked', () => {
      const items = rewardsService.getShopItems(TEST_CHILD);
      const sunnyItem = items.find((i) => i.id === 'theme_sunny');
      expect(sunnyItem?.isUnlocked).toBe(true);

      const crown = items.find((i) => i.id === 'hat_party_crown');
      expect(crown?.isUnlocked).toBe(false);
      expect(crown?.price).toBe(30);
    });

    it('rejects purchase if star points are insufficient', () => {
      // Child only has 10 points, crown costs 30
      rewardsService.awardPoints(TEST_CHILD, 'spin_wheel', 10);
      const res = rewardsService.purchaseShopItem(TEST_CHILD, 'hat_party_crown');
      expect(res.success).toBe(false);
      expect(res.error).toContain('need 20 more');
    });

    it('successfully purchases an item with star points and equips it', () => {
      // Give child 50 star points
      rewardsService.awardPoints(TEST_CHILD, 'finish_recording', 50);

      const purchaseRes = rewardsService.purchaseShopItem(TEST_CHILD, 'hat_party_crown');
      expect(purchaseRes.success).toBe(true);
      expect(purchaseRes.item?.isUnlocked).toBe(true);
      expect(purchaseRes.item?.isEquipped).toBe(true);

      // Points deducted: 50 - 30 = 20
      expect(rewardsService.getPoints(TEST_CHILD)).toBe(20);

      // Check equipped accessories
      const equipped = rewardsService.getEquippedCustomizations(TEST_CHILD);
      expect(equipped.hat).toBe('hat_party_crown');
    });

    it('can equip and unequip unlocked items across categories', () => {
      // Give child 200 star points
      rewardsService.awardPoints(TEST_CHILD, 'finish_recording', 200);

      // Buy wizard hat and superhero cape
      rewardsService.purchaseShopItem(TEST_CHILD, 'hat_wizard');
      rewardsService.purchaseShopItem(TEST_CHILD, 'outfit_superhero_cape');

      let equipped = rewardsService.getEquippedCustomizations(TEST_CHILD);
      expect(equipped.hat).toBe('hat_wizard');
      expect(equipped.outfit).toBe('outfit_superhero_cape');

      // Unequip hat by toggling
      rewardsService.equipShopItem(TEST_CHILD, 'hat_wizard');
      equipped = rewardsService.getEquippedCustomizations(TEST_CHILD);
      expect(equipped.hat).toBeNull();
      expect(equipped.outfit).toBe('outfit_superhero_cape'); // Outfit remains intact
    });

    it('disallows equipping locked items', () => {
      const res = rewardsService.equipShopItem(TEST_CHILD, 'hat_space_helmet');
      expect(res.success).toBe(false);
      expect(res.error).toContain('locked');
    });

    it('verifies zero real-money or in-app purchase properties exist', () => {
      // Security audit of the entire shop catalog
      SHOP_CATALOG.forEach((item) => {
        expect(typeof item.price).toBe('number');
        expect(item.price).toBeGreaterThanOrEqual(0);
        // Ensure no currency symbols other than Star Points
        expect(item.description).not.toContain('$');
        expect(item.description).not.toContain('USD');
        expect(item.description).not.toContain('buy now');
        expect(item.description).not.toContain('sale');
      });
    });
  });
});
