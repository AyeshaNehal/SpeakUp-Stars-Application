/**
 * CHILD PRIVACY & SAFETY NOTE (Rule 1, Rule 2, Rule 3, Rule 5):
 * - Hardened AI Feedback Pipeline for SpeakUp Stars
 * - Enforces zero raw media or child identity transmission.
 * - Input Harm/Distress Filter: Intercepts distress, halts scoring, creates quiet parent alert.
 * - Output Safety Filter: Blocks appearance, accent, medical, and shaming remarks.
 * - Fallback Safe Templates: 100% kid-safe pre-written praise if LLM errors or fails safety check.
 * - Zero Data Retention provider contract.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { scrubPII } from '../security/piiScrubber';
import { parentSafetyAlertService } from '../security/parentSafetyAlertService';
import { AgeGroup } from '../../types';

export type GrowthLevel = 'Seedling' | 'Sprout' | 'Flower' | 'Tree' | 'Star';

export interface GrowthLevelInfo {
  level: GrowthLevel;
  emoji: string;
  title: string;
  description: string;
  colorClass: string;
  minScore: number;
}

export interface SkillScores {
  voice: number;      // 0-100 (Volume steadiness, breath flow)
  eyeContact: number; // 0-100 (Camera gaze, audience connection)
  clarity: number;    // 0-100 (Flow, minimal fillers)
  story: number;      // 0-100 (Used practice duration, idea coverage)
  energy: number;     // 0-100 (Smile presence, warm expression)
  braveVoiceScore: number; // 0-100 combined speaking skills score (never discouraging)
}

export interface AIFeedbackResult {
  growthLevel: GrowthLevelInfo;
  skillScores: SkillScores;
  praisePoints: string[];     // Exactly 3 things done great
  nextSteps: string[];        // 1-2 constructive things to try next time
  nextChallenge: string;      // Suggested fun next speaking challenge
  sparkyCheer: string;        // Encouraging speech bubble
  isDistressIntervention?: boolean;
  reassuranceMessage?: string;
  wasFilteredOrFallback?: boolean;
}

export interface SpeechFeedbackInput {
  rawTranscript: string;
  childId?: string;
  ageBand: AgeGroup;
  topicTitle: string;
  topicCategory?: string;
  durationSeconds: number;
  targetDuration: number;
  wpm: number;
  pauseCount: number;
  fillerCount: number;
  volumeSteadiness: number;
  eyeContactRatio?: number;
  smileRatio?: number;
  headSteadiness?: number;
  usedMostOfTime: boolean;
  gentleMode?: boolean;
}

// ----------------------------------------------------------------------------
// 1. INPUT FILTER: HARM & DISTRESS PATTERNS
// ----------------------------------------------------------------------------
const DISTRESS_PATTERNS: RegExp[] = [
  /\b(someone|he|she|they|dad|mom|father|mother|brother|sister|teacher|uncle|aunt|cousin)\s+(hurts?|beats?|hits?|punched?|kicked?)\s+me\b/i,
  /\b(feel|feeling)\s+(unsafe|scared|terrified)\s+at\s+home\b/i,
  /\b(want|wish)\s+to\s+(die|disappear|kill\s+myself|hurt\s+myself)\b/i,
  /\b(nobody|no\s+one)\s+feeds\s+me\b/i,
  /\b(locked\s+in|locked\s+me\s+in)\s+(a\s+closet|the\s+room|the\s+basement)\b/i,
  /\b(bad\s+touch|touches?\s+me\s+where|secret\s+touch)\b/i,
  /\b(don't\s+want\s+to\s+live|hate\s+my\s+life)\b/i,
  /\b(threatens?\s+to\s+hurt\s+me|threatened\s+me)\b/i,
  /\b(they\s+starve\s+me|scared\s+to\s+go\s+home)\b/i,
];

// ----------------------------------------------------------------------------
// 2. OUTPUT FILTER: FORBIDDEN CRITERIA (Safety Guardrails)
// ----------------------------------------------------------------------------
const FORBIDDEN_OUTPUT_PATTERNS: RegExp[] = [
  // Appearance / Body / Physical attributes
  /\b(pretty|handsome|cute|ugly|fat|skinny|weight|chubby|hair|skin|body|clothes|outfit|face\s+shape)\b/i,
  // Accent / Dialect / Origin
  /\b(accent|foreign|sound\s+weird|talk\s+strange|broken\s+english|dialect)\b/i,
  // Disability / Medical / Diagnostic
  /\b(stutter|stammer|adhd|autis(m|tic)|disorder|delay|therapy|patholog(y|ist)|medical|retard|handicap)\b/i,
  // Shaming / Negative judgments
  /\b(bad|awful|terrible|horrible|poor|failed|worst|embarrassing|shame|stupid|dumb)\b/i,
  // Solicitation / Contact / Personal Info
  /\b(email\s+me|call\s+me|phone\s+number|address|where\s+do\s+you\s+live|secret|meet\s+up|contact\s+me)\b/i,
];

// ----------------------------------------------------------------------------
// 3. GROWTH LEVEL TIERS (Never Discouraging)
// ----------------------------------------------------------------------------
export const GROWTH_LEVELS: Record<GrowthLevel, GrowthLevelInfo> = {
  Seedling: {
    level: 'Seedling',
    emoji: '🌱',
    title: 'Seedling Speaker',
    description: 'You planted the seeds of your brave voice today!',
    colorClass: 'text-emerald-700 bg-emerald-100 border-emerald-300',
    minScore: 0,
  },
  Sprout: {
    level: 'Sprout',
    emoji: '🌿',
    title: 'Sprout Speaker',
    description: 'Your speaking skills are growing stronger with every practice!',
    colorClass: 'text-teal-700 bg-teal-100 border-teal-300',
    minScore: 21,
  },
  Flower: {
    level: 'Flower',
    emoji: '🌸',
    title: 'Flower Speaker',
    description: 'Blooming with wonderful ideas and clear speech!',
    colorClass: 'text-rose-700 bg-rose-100 border-rose-300',
    minScore: 41,
  },
  Tree: {
    level: 'Tree',
    emoji: '🌳',
    title: 'Mighty Tree Speaker',
    description: 'Standing tall and speaking with proud, steady energy!',
    colorClass: 'text-amber-800 bg-amber-100 border-amber-300',
    minScore: 61,
  },
  Star: {
    level: 'Star',
    emoji: '⭐',
    title: 'Superstar Speaker',
    description: 'Shining brilliantly with your confident, brave voice!',
    colorClass: 'text-amber-900 bg-sunny-200 border-sunny-400',
    minScore: 81,
  },
};

// ----------------------------------------------------------------------------
// 4. PRE-WRITTEN SAFE FALLBACK TEMPLATES BY AGE
// ----------------------------------------------------------------------------
const SAFE_FALLBACK_TEMPLATES: Record<
  AgeGroup,
  {
    praisePool: string[];
    nextStepsPool: string[];
    challengesPool: string[];
  }
> = {
  '3-5': {
    praisePool: [
      'You pressed the button and spoke like a brave explorer! 🚀',
      'Your friendly voice was loud enough for Sparky to hear clearly! 🔊',
      'You shared great words about your favorite topic! 🌟',
      'You brought lots of cheerful energy to our practice room! ☀️',
      'You kept trying from the very beginning to the end! 🎈',
    ],
    nextStepsPool: [
      'Take a big belly breath before sharing your next big idea! 🫧',
      'Try holding your hands in your lap so your body feels calm and ready! 🧸',
      'Try making a silly smile right at the camera next time! 😊',
    ],
    challengesPool: [
      'Next Challenge: Speak like a happy lion for 30 seconds! 🦁',
      'Next Challenge: Tell Sparky 2 of your favorite colors! 🎨',
      'Next Challenge: Try practicing with your favorite toy sitting next to you! 🧸',
    ],
  },
  '6-8': {
    praisePool: [
      'You shared creative ideas with genuine enthusiasm! 💡',
      'Your voice volume was steady and pleasant to listen to! 🎙️',
      'You looked right at the screen, connecting with your audience! 👀',
      'You organized your thoughts nicely around the topic! 📚',
      'You spoke with great bravery and kept going strong! 🌟',
    ],
    nextStepsPool: [
      'Try pausing for 2 seconds between sentences to let your ideas breathe! 🌬️',
      'When you need a moment to think, try smiling instead of saying "um"! ✨',
      'Try adding a little extra excitement when you describe the best part! ⚡',
    ],
    challengesPool: [
      'Next Challenge: Practice speaking for 1 full minute without stopping! ⏱️',
      'Next Challenge: Tell a story with a beginning, middle, and end! 📖',
      'Next Challenge: Add 3 colorful descriptive words to your speech! 🌈',
    ],
  },
  '9-12': {
    praisePool: [
      'You demonstrated strong command of your topic with clear articulation! 🎙️',
      'Your natural pacing allowed your key points to resonate with the listener! ⏱️',
      'Consistent eye contact projected confidence and audience engagement! 🎯',
      'You structured your thoughts effectively and explored interesting angles! 🧠',
      'Great vocal steadiness and genuine passion for what you shared! 🌟',
    ],
    nextStepsPool: [
      'Vary your vocal pitch slightly to emphasize your most compelling point! 📈',
      'Use deliberate pauses before important conclusions to build audience anticipation! ⏸️',
      'Try opening with an intriguing question to hook your audience immediately! 🪝',
    ],
    challengesPool: [
      'Next Challenge: Give a 90-second mini-presentation on an invention! 🚀',
      'Next Challenge: Deliver an inspiring persuasive pitch for a cause you care about! 🌍',
      'Next Challenge: Practice using 3 rhetorical questions during your speech! 🗣️',
    ],
  },
};

// ----------------------------------------------------------------------------
// 5. PLUGGABLE PROVIDER INTERFACE
// ----------------------------------------------------------------------------
export interface SanitizedLLMPayload {
  scrubbedTranscript: string;
  ageBand: AgeGroup;
  topicTitle: string;
  topicCategory?: string;
  durationSeconds: number;
  targetDuration: number;
  wpm: number;
  pauseCount: number;
  fillerCount: number;
  volumeSteadiness: number;
  eyeContactRatio?: number;
  smileRatio?: number;
}

export interface LLMFeedbackResponse {
  praisePoints: string[];
  nextSteps: string[];
  nextChallenge: string;
  sparkyCheer: string;
}

export interface LLMFeedbackProvider {
  name: string;
  zeroDataRetention: boolean;
  generateFeedback(payload: SanitizedLLMPayload): Promise<LLMFeedbackResponse>;
}

/**
 * Built-in Mock Zero-Retention Provider (Guarantees on-device privacy & instant speed)
 */
export class MockZeroRetentionProvider implements LLMFeedbackProvider {
  public name = 'MockZeroRetentionProvider';
  public zeroDataRetention = true;

  public async generateFeedback(payload: SanitizedLLMPayload): Promise<LLMFeedbackResponse> {
    const age = payload.ageBand;
    const pool = SAFE_FALLBACK_TEMPLATES[age] || SAFE_FALLBACK_TEMPLATES['6-8'];

    // Select dynamic contextual praise
    const praise: string[] = [];
    if (payload.wpm > 30) {
      praise.push(pool.praisePool[0]);
    } else {
      praise.push(pool.praisePool[1]);
    }
    praise.push(pool.praisePool[2]);
    praise.push(pool.praisePool[3] || pool.praisePool[0]);

    // Select dynamic contextual next steps
    const nextSteps: string[] = [];
    if (payload.fillerCount > 2) {
      nextSteps.push(pool.nextStepsPool[1]);
    } else {
      nextSteps.push(pool.nextStepsPool[0]);
    }
    if (pool.nextStepsPool[2]) {
      nextSteps.push(pool.nextStepsPool[2]);
    }

    const nextChallenge = pool.challengesPool[Math.floor(Math.random() * pool.challengesPool.length)];

    return {
      praisePoints: praise.slice(0, 3),
      nextSteps: nextSteps.slice(0, 2),
      nextChallenge,
      sparkyCheer: `You spoke with such brave energy about ${payload.topicTitle}! Sparky is so proud of your practice today! ⭐`,
    };
  }
}

/**
 * Live Supabase Edge Function Provider (Anthropic Claude ZDR)
 * Connects securely to the server-side edge function proxy when Supabase is configured.
 */
export class SupabaseEdgeFeedbackProvider implements LLMFeedbackProvider {
  public name = 'SupabaseEdgeFeedbackProvider (Anthropic Claude ZDR)';
  public zeroDataRetention = true;
  private fallback = new MockZeroRetentionProvider();
  private supabase: SupabaseClient | null = null;

  constructor() {
    const url = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : '';
    const key = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : '';
    if (url && key) {
      try {
        this.supabase = createClient(url, key);
      } catch {
        // Fallback to local sandbox provider
      }
    }
  }

  public async generateFeedback(payload: SanitizedLLMPayload): Promise<LLMFeedbackResponse> {
    if (!this.supabase) {
      return this.fallback.generateFeedback(payload);
    }

    try {
      const { data, error } = await this.supabase.functions.invoke('generate-feedback', {
        body: payload,
      });

      if (error || !data || !Array.isArray(data.praisePoints)) {
        return this.fallback.generateFeedback(payload);
      }

      return {
        praisePoints: data.praisePoints.slice(0, 3),
        nextSteps: Array.isArray(data.nextSteps) ? data.nextSteps.slice(0, 2) : ['Keep practicing with courage!'],
        nextChallenge: data.nextChallenge || 'Try another fun story!',
        sparkyCheer: data.sparkyCheer || 'Sparky is cheering for you! ⭐',
      };
    } catch {
      return this.fallback.generateFeedback(payload);
    }
  }
}

// ----------------------------------------------------------------------------
// 6. MAIN HARDENED AI FEEDBACK SERVICE
// ----------------------------------------------------------------------------
export class AIFeedbackService {
  private provider: LLMFeedbackProvider;
  private requestHistory: number[] = [];
  private readonly MAX_REQUESTS_PER_MINUTE = 6;

  constructor() {
    const url = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : '';
    if (url) {
      this.provider = new SupabaseEdgeFeedbackProvider();
    } else {
      this.provider = new MockZeroRetentionProvider();
    }
  }

  /**
   * Allows plugging in another zero-retention backend provider.
   */
  public setProvider(provider: LLMFeedbackProvider): void {
    if (!provider.zeroDataRetention) {
      throw new Error('SECURITY VIOLATION: AI provider must offer zero data retention.');
    }
    this.provider = provider;
  }

  /**
   * Main analysis pipeline:
   * 1. Runs Input Filter (detects harm/distress).
   * 2. Sanitizes payload (PII scrub, strip audio/video/identifiers).
   * 3. Calculates 5-dimension skill scores & non-discouraging Brave Voice score.
   * 4. Enforces rate limits.
   * 5. Calls LLM Provider.
   * 6. Runs Output Filter (blocks bad words, shaming, appearance, fallback to safe templates).
   */
  public async generateFeedback(input: SpeechFeedbackInput): Promise<AIFeedbackResult> {
    // ------------------------------------------------------------------------
    // STEP 1: INPUT FILTER (Harm & Distress Detection)
    // ------------------------------------------------------------------------
    const distressCheck = this.checkDistressAndHarm(input.rawTranscript);
    if (distressCheck.isDistress) {
      // Quietly record for parent
      parentSafetyAlertService.recordQuietAlert(
        input.childId || 'active_child',
        distressCheck.matchedKeywords
      );

      // Return gentle, supportive reassurance to the child — NO NORMAL SCORING
      return {
        growthLevel: GROWTH_LEVELS.Star,
        skillScores: {
          voice: 100,
          eyeContact: 100,
          clarity: 100,
          story: 100,
          energy: 100,
          braveVoiceScore: 100,
        },
        praisePoints: [
          'You were so brave to speak and share your thoughts today! 🌟',
          'Sparky is always in your corner and loves hearing your voice! 💛',
          'You are kind, unique, and deeply loved! ✨',
        ],
        nextSteps: [
          'Remember: It is always great to talk with a grown-up you trust! 🤝',
        ],
        nextChallenge: 'Sparky says: Take a nice deep breath and remember how special you are! 🫧',
        sparkyCheer: 'Sparky loves you and is giving you a huge warm star hug! ⭐',
        isDistressIntervention: true,
        reassuranceMessage:
          'Thank you for speaking today. You are brave, kind, and you matter so much. Sparky is always cheering for you! 🌟',
      };
    }

    // ------------------------------------------------------------------------
    // STEP 2: CALCULATE 5-DIMENSION SKILL SCORES & BRAVE VOICE GROWTH
    // ------------------------------------------------------------------------
    const skillScores = this.calculateSkillScores(input);
    const growthLevel = this.calculateGrowthLevel(skillScores.braveVoiceScore);

    // ------------------------------------------------------------------------
    // STEP 3: SANITIZE INPUT (Strip all identifiers, audio, and video)
    // ------------------------------------------------------------------------
    const sanitizedTranscript = scrubPII(input.rawTranscript);
    const payload: SanitizedLLMPayload = {
      scrubbedTranscript: sanitizedTranscript,
      ageBand: input.ageBand,
      topicTitle: input.topicTitle,
      topicCategory: input.topicCategory,
      durationSeconds: input.durationSeconds,
      targetDuration: input.targetDuration,
      wpm: input.wpm,
      pauseCount: input.pauseCount,
      fillerCount: input.fillerCount,
      volumeSteadiness: input.volumeSteadiness,
      eyeContactRatio: input.eyeContactRatio,
      smileRatio: input.smileRatio,
    };

    // ------------------------------------------------------------------------
    // STEP 4: RATE LIMITING (Sliding Window)
    // ------------------------------------------------------------------------
    const now = Date.now();
    this.requestHistory = this.requestHistory.filter((t) => now - t < 60000);
    if (this.requestHistory.length >= this.MAX_REQUESTS_PER_MINUTE) {
      // Rate limited: immediately return safe fallback without crashing
      const fallback = this.getFallbackTemplate(input.ageBand, input.topicTitle);
      return {
        growthLevel,
        skillScores,
        ...fallback,
        wasFilteredOrFallback: true,
      };
    }
    this.requestHistory.push(now);

    // ------------------------------------------------------------------------
    // STEP 5: INVOKE PROVIDER & RUN OUTPUT FILTER
    // ------------------------------------------------------------------------
    try {
      const rawFeedback = await this.provider.generateFeedback(payload);

      // Validate output through Output Filter
      const isValid = this.validateOutputSafety(rawFeedback);
      if (!isValid) {
        // Output violation detected: gracefully fall back to curated template
        const fallback = this.getFallbackTemplate(input.ageBand, input.topicTitle);
        return {
          growthLevel,
          skillScores,
          ...fallback,
          wasFilteredOrFallback: true,
        };
      }

      return {
        growthLevel,
        skillScores,
        praisePoints: rawFeedback.praisePoints.slice(0, 3),
        nextSteps: rawFeedback.nextSteps.slice(0, 2),
        nextChallenge: rawFeedback.nextChallenge,
        sparkyCheer: rawFeedback.sparkyCheer,
        wasFilteredOrFallback: false,
      };
    } catch {
      // On any provider failure: use safe template
      const fallback = this.getFallbackTemplate(input.ageBand, input.topicTitle);
      return {
        growthLevel,
        skillScores,
        ...fallback,
        wasFilteredOrFallback: true,
      };
    }
  }

  /**
   * Scans text for indicators of distress, abuse, or violence.
   */
  public checkDistressAndHarm(transcript: string): { isDistress: boolean; matchedKeywords: string[] } {
    const text = transcript.toLowerCase();
    const matched: string[] = [];

    for (const pattern of DISTRESS_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        matched.push(match[0]);
      }
    }

    return {
      isDistress: matched.length > 0,
      matchedKeywords: matched,
    };
  }

  /**
   * Output Safety Filter: Rejects any LLM output containing forbidden remarks.
   */
  public validateOutputSafety(feedback: LLMFeedbackResponse): boolean {
    const allText = [
      ...feedback.praisePoints,
      ...feedback.nextSteps,
      feedback.nextChallenge,
      feedback.sparkyCheer,
    ].join(' ');

    for (const pattern of FORBIDDEN_OUTPUT_PATTERNS) {
      if (pattern.test(allText)) {
        return false;
      }
    }

    if (feedback.praisePoints.length === 0 || feedback.nextSteps.length === 0) {
      return false;
    }

    return true;
  }

  /**
   * Computes 5-dimension skill scores with non-discouraging floors.
   */
  public calculateSkillScores(input: SpeechFeedbackInput): SkillScores {
    // 1. Voice (Volume consistency + natural pause count)
    const baseVoice = Math.round(input.volumeSteadiness * 0.7 + Math.min(10, input.pauseCount) * 3);
    const voice = Math.max(50, Math.min(100, baseVoice));

    // 2. Eye Contact (Screen gaze ratio)
    const eyeRatio = input.eyeContactRatio !== undefined ? input.eyeContactRatio : 0.85;
    const eyeContact = Math.max(50, Math.min(100, Math.round(eyeRatio * 100)));

    // 3. Clarity (Filler word control + smooth flow)
    let clarityPenalty = input.fillerCount * 5;
    if (input.gentleMode) clarityPenalty = 0; // Gentle Mode ignores filler words
    const clarity = Math.max(50, Math.min(100, Math.round(95 - clarityPenalty)));

    // 4. Story (Duration pacing & usage of time)
    const durationRatio = Math.min(1.2, input.durationSeconds / Math.max(1, input.targetDuration));
    const story = Math.max(55, Math.min(100, Math.round(durationRatio * 85 + (input.usedMostOfTime ? 15 : 0))));

    // 5. Energy (Smile ratio + steady presence)
    const smileRatio = input.smileRatio !== undefined ? input.smileRatio : 0.75;
    const headSteadiness = input.headSteadiness !== undefined ? input.headSteadiness : 0.9;
    const energy = Math.max(50, Math.min(100, Math.round(smileRatio * 50 + headSteadiness * 50)));

    // Combined Brave Voice Speaking Skills score (Never discouraging; floor at 45)
    const braveVoiceScore = Math.max(
      45,
      Math.min(100, Math.round(voice * 0.2 + eyeContact * 0.2 + clarity * 0.2 + story * 0.2 + energy * 0.2))
    );

    return {
      voice,
      eyeContact,
      clarity,
      story,
      energy,
      braveVoiceScore,
    };
  }

  /**
   * Maps 0-100 score to Growth Level.
   */
  public calculateGrowthLevel(score: number): GrowthLevelInfo {
    if (score >= 81) return GROWTH_LEVELS.Star;
    if (score >= 61) return GROWTH_LEVELS.Tree;
    if (score >= 41) return GROWTH_LEVELS.Flower;
    if (score >= 21) return GROWTH_LEVELS.Sprout;
    return GROWTH_LEVELS.Seedling;
  }

  /**
   * Returns curated safe fallback feedback.
   */
  public getFallbackTemplate(ageBand: AgeGroup, topicTitle: string): LLMFeedbackResponse {
    const pool = SAFE_FALLBACK_TEMPLATES[ageBand] || SAFE_FALLBACK_TEMPLATES['6-8'];
    return {
      praisePoints: [pool.praisePool[0], pool.praisePool[1], pool.praisePool[2]],
      nextSteps: [pool.nextStepsPool[0], pool.nextStepsPool[1]],
      nextChallenge: pool.challengesPool[0],
      sparkyCheer: `You spoke with such brave energy about ${topicTitle}! Sparky is super proud of your speaking growth! ⭐`,
    };
  }
}

export const aiFeedbackService = new AIFeedbackService();
