/**
 * CHILD PRIVACY & REUSABLE GAME FRAMEWORK NOTE (Rule 1, Rule 2, Rule 6):
 * - Mini-Games Section Architecture
 * - Games:
 *   1. Volume Volcano (Voice volume & steadiness) [ACTIVE]
 *   2. Echo Explorer (Pacing & rhythm matching) [COMING SOON]
 *   3. Feelings Catch (Emotion & expression) [COMING SOON]
 *   4. Story Dice (Spontaneous narrative flow) [COMING SOON]
 *   5. Pace Racer (Optimal words-per-minute pacing) [COMING SOON]
 * - STRICT GUARANTEE: All audio processing is on-device only via Web Audio API.
 *   Zero raw audio or recordings are ever stored, persisted, or transmitted.
 */

export type GameId =
  | 'volume_volcano'
  | 'echo_explorer'
  | 'feelings_catch'
  | 'story_dice'
  | 'pace_racer';

export type GameDifficulty = 'easy' | 'medium' | 'hard';
export type GameStatus = 'ready' | 'playing' | 'paused' | 'completed';

export interface MiniGameConfig {
  id: GameId;
  title: string;
  tagline: string;
  description: string;
  icon: string;
  color: string;
  accentBg: string;
  difficulty: GameDifficulty;
  durationSeconds: number;
  isAvailable: boolean;
  skillsTaught: string[];
  recommendedAgeBands: string[];
}

export interface GameSessionMetrics {
  durationSeconds: number;
  averageVolume: number; // 0 to 1
  peakVolume: number;
  steadyVoiceTimeSeconds: number;
  steadyVoiceRatio: number; // 0 to 1
  eruptionCount: number;
  score: number;
  starPointsEarned: number;
}

export interface GameResults {
  gameId: GameId;
  gameTitle: string;
  metrics: GameSessionMetrics;
  growthLevel: 'Seedling' | 'Sprout' | 'Flower' | 'Tree' | 'Star';
  encouragingFeedback: string[];
  mascotPraise: string;
  earnedBadges: string[];
}

export const MINI_GAMES_CATALOG: MiniGameConfig[] = [
  {
    id: 'volume_volcano',
    title: 'Volume Volcano',
    tagline: 'Erupt the volcano with Voice & Typing Power! 🌋',
    description:
      'Type brave words or speak into your mic! Watch the lava fountain erupt with sparks, confetti, and star gems!',
    icon: '🌋',
    color: 'from-amber-500 to-orange-600',
    accentBg: 'bg-orange-50 border-orange-200',
    difficulty: 'easy',
    durationSeconds: 60,
    isAvailable: true,
    skillsTaught: ['Voice Volume', 'Breath Steadiness', 'Typing Courage', 'Vocal Projection'],
    recommendedAgeBands: ['3-5', '6-8', '9-12'],
  },
  {
    id: 'echo_explorer',
    title: 'Echo Explorer',
    tagline: 'Follow Sparky through the crystal echo caves! 💎',
    description:
      'Echo back the rhythm words and tongue twisters to light up magical glowing crystals!',
    icon: '🦇',
    color: 'from-sky-500 to-indigo-600',
    accentBg: 'bg-sky-50 border-sky-200',
    difficulty: 'medium',
    durationSeconds: 60,
    isAvailable: true,
    skillsTaught: ['Speech Cadence', 'Active Listening', 'Rhythm'],
    recommendedAgeBands: ['3-5', '6-8', '9-12'],
  },
  {
    id: 'feelings_catch',
    title: 'Feelings Catch',
    tagline: 'Express joyful, curious, and brave feelings! 🎭',
    description:
      'Catch floating feeling stars by speaking or tapping matching emotional tones—excited, whisper, heroic, or calm!',
    icon: '🎭',
    color: 'from-pink-500 to-rose-600',
    accentBg: 'bg-pink-50 border-pink-200',
    difficulty: 'medium',
    durationSeconds: 60,
    isAvailable: true,
    skillsTaught: ['Vocal Tone', 'Emotional Expression', 'Facial Dynamics'],
    recommendedAgeBands: ['3-5', '6-8', '9-12'],
  },
  {
    id: 'story_dice',
    title: 'Story Dice',
    tagline: 'Roll 3 wild dice and link them in a brave tale! 🎲',
    description:
      'Roll a dragon, a submarine, and an ice cream cone! Weave them into an imaginative mini-story.',
    icon: '🎲',
    color: 'from-purple-500 to-violet-600',
    accentBg: 'bg-purple-50 border-purple-200',
    difficulty: 'hard',
    durationSeconds: 60,
    isAvailable: true,
    skillsTaught: ['Story Structure', 'Creative Flow', 'Confidence'],
    recommendedAgeBands: ['6-8', '9-12'],
  },
  {
    id: 'pace_racer',
    title: 'Pace Racer',
    tagline: 'Race your companion at the perfect conversational speed! 🏎️',
    description:
      'Keep your speech in the sweet green cruise zone to activate turbo nitro boosts and win the race!',
    icon: '🏎️',
    color: 'from-emerald-500 to-teal-600',
    accentBg: 'bg-emerald-50 border-emerald-200',
    difficulty: 'medium',
    durationSeconds: 60,
    isAvailable: true,
    skillsTaught: ['Pacing (WPM)', 'Pause Control', 'Clarity'],
    recommendedAgeBands: ['6-8', '9-12'],
  },
];
