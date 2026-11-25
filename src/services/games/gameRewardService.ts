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

    // Dynamic mascot name
    const mascotId = (typeof localStorage !== 'undefined' ? localStorage.getItem('speakup_selected_mascot') : null) || 'sparky';
    const mascotNames: Record<string, string> = {
      sparky: 'Sparky the Dragon 🐉',
      pip: 'Pip the Penguin 🐧',
      luna: 'Luna the Owl 🦉',
      dash: 'Dash the Cheetah 🐆',
      barnaby: 'Barnaby the Bear 🐻',
    };
    const mascotName = mascotNames[mascotId] || 'Your Mascot Friend';

    // 5. Positive, game-specific growth feedback
    let encouragingFeedback: string[] = [];
    let mascotPraise = '';

    switch (gameId) {
      case 'volume_volcano':
        encouragingFeedback = [
          `You sustained steady power for ${Math.round(metrics.steadyVoiceTimeSeconds)} seconds!`,
          `You triggered ${metrics.eruptionCount} fiery magma eruptions!`,
          'Your vocal projection and typing courage were radiant!',
        ];
        mascotPraise = `${mascotName} was dancing with joy! Your voice erupted with pure courage! 🌋✨`;
        break;

      case 'echo_explorer':
        encouragingFeedback = [
          `You lit up ${metrics.eruptionCount} glowing crystal caverns!`,
          `You echoed rhythm words with clarity for ${Math.round(metrics.steadyVoiceTimeSeconds)}s!`,
          'Your pronunciation and rhythm lighted up the entire cave!',
        ];
        mascotPraise = `${mascotName} loved your crystal-clear echoes! You sounded fantastic! 💎✨`;
        break;

      case 'feelings_catch':
        encouragingFeedback = [
          `You expressed and caught ${metrics.eruptionCount} feeling stars!`,
          `You practiced emotional inflection for ${Math.round(metrics.steadyVoiceTimeSeconds)} seconds!`,
          'Your vocal tone was warm, expressive, and lively!',
        ];
        mascotPraise = `${mascotName} felt every bit of wonder and joy in your voice! 🎭💖`;
        break;

      case 'story_dice':
        encouragingFeedback = [
          `You spun ${metrics.eruptionCount} imaginative stories!`,
          `You spoke creatively for ${Math.round(metrics.steadyVoiceTimeSeconds)} seconds!`,
          'You connected characters, locations, and magical items with ease!',
        ];
        mascotPraise = `${mascotName} is mesmerized by your storytelling imagination! 🎲🌟`;
        break;

      case 'pace_racer':
        encouragingFeedback = [
          `You fired up ${metrics.eruptionCount} conversational nitro boosts!`,
          `You held the green cruise zone for ${Math.round(metrics.steadyVoiceTimeSeconds)} seconds!`,
          'Your reading tempo was steady, confident, and easy to follow!',
        ];
        mascotPraise = `${mascotName} is cheering at the finish line! Perfect steady speed! 🏎️🏁`;
        break;

      default:
        encouragingFeedback = [
          `You practiced speaking for ${Math.round(metrics.steadyVoiceTimeSeconds)} seconds!`,
          'Your voice was steady, joyful, and confident.',
        ];
        mascotPraise = `${mascotName} is so proud of your wonderful practice! ⭐`;
    }

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
