/**
 * CHILD PRIVACY & MOTIVATION NOTE (Rule 1, Rule 2):
 * - Mini-Game Reward & Growth Evaluation Service
 * - Awards star points for mini-game completion (zero real-money, zero guilt).
 * - Updates practice streaks and unlocks courage/bravery badges.
 * - Always kind, encouraging, and growth-oriented (never discouraging).
 */

import { rewardsService } from '../rewards/rewardsService';
import { GameSessionMetrics, GameResults, GameId } from './types';
import { privacyLogger } from '../logger';

class GameRewardService {
  /**
   * Evaluates mini-game performance and awards Star Points.
   */
  public finalizeGameSession(params: {
    childId: string;
    gameId: GameId;
    gameTitle: string;
    metrics: Omit<GameSessionMetrics, 'score' | 'starPointsEarned'>;
  }): GameResults {
    const { childId, gameId, gameTitle, metrics } = params;

    // 1. Calculate Score (0-100)
    // Formula: steady voice percentage + eruption bonus
    const steadyScore = Math.min(60, Math.round(metrics.steadyVoiceRatio * 60));
    const eruptionScore = Math.min(40, metrics.eruptionCount * 8);
    const totalScore = Math.min(100, Math.max(30, steadyScore + eruptionScore)); // Baseline 30 so never discouraging

    // 2. Star Points: Base 15 points + 5 to 15 bonus points
    const bonusPoints = Math.round((totalScore / 100) * 15);
    const starPoints = 15 + bonusPoints;

    // Award points in rewards service
    rewardsService.awardPoints(childId, 'finish_recording', starPoints);
    rewardsService.recordDailyPractice(childId);

    // 3. Growth Level calculation
    let growthLevel: GameResults['growthLevel'] = 'Seedling';
    if (totalScore >= 90) growthLevel = 'Star';
    else if (totalScore >= 75) growthLevel = 'Tree';
    else if (totalScore >= 55) growthLevel = 'Flower';
    else if (totalScore >= 35) growthLevel = 'Sprout';

    // 4. Badges check
    const earnedBadges: string[] = [];
    if (metrics.eruptionCount >= 3) {
      const unlocked = rewardsService.unlockBadge(childId, 'brave_voice');
      if (unlocked) earnedBadges.push('Brave Voice 🦁');
    }

    // 5. Positive, growth-focused feedback
    const encouragingFeedback: string[] = [
      `You kept your voice steady for ${Math.round(metrics.steadyVoiceTimeSeconds)} seconds!`,
      `You triggered ${metrics.eruptionCount} big, beautiful volcanic eruptions!`,
      'Your vocal projection was confident and clear throughout the round.',
    ];

    const mascotPraise =
      metrics.eruptionCount >= 4
        ? 'Sparky was leaping with joy! Your voice was like a superhero roar! 🌋✨'
        : 'Sparky loves how steady and brave you sounded! That was amazing practice!';

    const fullMetrics: GameSessionMetrics = {
      ...metrics,
      score: totalScore,
      starPointsEarned: starPoints,
    };

    privacyLogger.info('Finalized mini-game round and awarded star points.', {
      childId,
      gameId,
      totalScore,
      starPoints,
    });

    return {
      gameId,
      gameTitle,
      metrics: fullMetrics,
      growthLevel,
      encouragingFeedback,
      mascotPraise,
      earnedBadges,
    };
  }
}

export const gameRewardService = new GameRewardService();
