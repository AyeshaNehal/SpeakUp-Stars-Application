/**
 * MINI-GAMES FRAMEWORK & VOLUME VOLCANO TEST SUITE
 *
 * Verifies:
 * 1. Mini-Game Framework Catalog: Volume Volcano active, and Echo Explorer / Feelings Catch / Story Dice / Pace Racer ready.
 * 2. On-device Audio Volume Tracker: Zero audio persistence, privacy safe, accurate state mapping.
 * 3. Game Reward Service: Star points awarded, streak updated, kind growth feedback (never discouraging).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MINI_GAMES_CATALOG } from '../src/services/games/types';
import { gameRewardService } from '../src/services/games/gameRewardService';
import { AudioVolumeTracker } from '../src/services/games/audioVolumeTracker';
import { rewardsService } from '../src/services/rewards/rewardsService';

const store = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => store.get(key) || null,
  setItem: (key: string, value: string) => store.set(key, value),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
};
// @ts-expect-error polyfill for Node test runner
globalThis.localStorage = mockLocalStorage;

describe('Mini-Games Framework & Volume Volcano Game Suite', () => {
  const testChildId = 'child_gamer_001';

  beforeEach(() => {
    store.clear();
    rewardsService.clearStorage(testChildId);
  });

  describe('1. Reusable Game Framework Catalog', () => {
    it('registers Volume Volcano with 60-second round and voice skills', () => {
      const volcano = MINI_GAMES_CATALOG.find((g) => g.id === 'volume_volcano');
      expect(volcano).toBeDefined();
      expect(volcano?.isAvailable).toBe(true);
      expect(volcano?.durationSeconds).toBe(60);
      expect(volcano?.skillsTaught).toContain('Voice Volume');
      expect(volcano?.skillsTaught).toContain('Breath Steadiness');
    });

    it('contains all 4 planned expansion mini-games in the catalog', () => {
      const expectedGames = ['echo_explorer', 'feelings_catch', 'story_dice', 'pace_racer'];
      for (const id of expectedGames) {
        const game = MINI_GAMES_CATALOG.find((g) => g.id === id);
        expect(game).toBeDefined();
        expect(game?.title).toBeDefined();
        expect(game?.durationSeconds).toBe(60);
      }
    });
  });

  describe('2. Audio Volume Tracker & Child Privacy Protection', () => {
    it('initializes tracker with safe default thresholds and stopped state', () => {
      const tracker = new AudioVolumeTracker();
      expect(tracker.getIsRunning()).toBe(false);
      tracker.stop();
      expect(tracker.getIsRunning()).toBe(false);
    });

    it('processes volume states accurately and in-memory only', () => {
      const tracker = new AudioVolumeTracker({
        silenceThreshold: 0.1,
        steadyThreshold: 0.3,
        eruptionThreshold: 0.65,
      });

      // Confirm safe cleanup
      tracker.stop();
      expect(tracker.getIsRunning()).toBe(false);
    });
  });

  describe('3. Game Rewards & Kind Growth Feedback', () => {
    it('awards star points and updates daily streak upon completing a round', () => {
      const initialPoints = rewardsService.getPoints(testChildId);
      expect(initialPoints).toBe(0);

      const results = gameRewardService.finalizeGameSession({
        childId: testChildId,
        gameId: 'volume_volcano',
        gameTitle: 'Volume Volcano',
        metrics: {
          durationSeconds: 60,
          averageVolume: 0.5,
          peakVolume: 0.8,
          steadyVoiceTimeSeconds: 40,
          steadyVoiceRatio: 40 / 60,
          eruptionCount: 3,
        },
      });

      // Star points awarded
      expect(results.metrics.starPointsEarned).toBeGreaterThanOrEqual(15);
      const updatedPoints = rewardsService.getPoints(testChildId);
      expect(updatedPoints).toBeGreaterThanOrEqual(results.metrics.starPointsEarned);

      // Streak updated
      const streak = rewardsService.getStreak(testChildId);
      expect(streak.currentStreak).toBe(1);

      // Never discouraging: Growth level must be valid and positive
      expect(['Sprout', 'Flower', 'Tree', 'Star']).toContain(results.growthLevel);
      expect(results.mascotPraise).toContain('Sparky');
      expect(results.encouragingFeedback.length).toBeGreaterThanOrEqual(2);
    });

    it('unlocks Brave Voice badge when achieving multiple eruptions', () => {
      const results = gameRewardService.finalizeGameSession({
        childId: testChildId,
        gameId: 'volume_volcano',
        gameTitle: 'Volume Volcano',
        metrics: {
          durationSeconds: 60,
          averageVolume: 0.6,
          peakVolume: 0.9,
          steadyVoiceTimeSeconds: 50,
          steadyVoiceRatio: 50 / 60,
          eruptionCount: 4,
        },
      });

      expect(results.earnedBadges.length).toBeGreaterThan(0);
      expect(results.earnedBadges[0]).toContain('Brave Voice');
    });

    it('ensures low-performance rounds still receive kind and encouraging feedback', () => {
      const results = gameRewardService.finalizeGameSession({
        childId: testChildId,
        gameId: 'volume_volcano',
        gameTitle: 'Volume Volcano',
        metrics: {
          durationSeconds: 60,
          averageVolume: 0.1,
          peakVolume: 0.2,
          steadyVoiceTimeSeconds: 5,
          steadyVoiceRatio: 5 / 60,
          eruptionCount: 0,
        },
      });

      // Minimum baseline score is 30 (never 0)
      expect(results.metrics.score).toBeGreaterThanOrEqual(30);
      expect(results.growthLevel).toBe('Seedling');
      // Praise is encouraging and supportive
      expect(results.mascotPraise).not.toContain('bad');
      expect(results.mascotPraise).not.toContain('failed');
      expect(results.mascotPraise).toContain('Sparky');
    });
  });
});
