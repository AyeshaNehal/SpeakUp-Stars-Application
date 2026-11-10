/**
 * CHILD PRIVACY & WELL-BEING NOTE (Rule 1, Rule 2, Rule 5):
 * - Rewards, Streaks, Badges, and Mascot Shop Service
 * - Enforces zero real-money purchases, zero countdown pressure, zero guilt-tripping messages.
 * - Streak Freeze protection so missing a day feels safe and pressure-free.
 * - Stores state in Supabase with Row-Level Security, with sandbox fallback.
 */

import { SparkyTheme } from '../../components/mascot/SparkyMascot';

export type PointReason =
  | 'spin_wheel'
  | 'finish_recording'
  | 'new_category'
  | 'skill_improved'
  | 'daily_practice';

export interface PointAward {
  id: string;
  childId: string;
  points: number;
  reason: PointReason;
  description: string;
  timestamp: string;
}

export interface LevelInfo {
  level: number;
  title: string;
  currentPoints: number;
  currentLevelMin: number;
  nextLevelMin: number;
  pointsToNext: number;
  progressPercent: number;
}

export type BadgeKey =
  | 'first_speech'
  | 'brave_voice'
  | 'story_teller'
  | 'eye_contact_hero'
  | 'streak_7_day'
  | 'topic_explorer_10';

export interface BadgeInfo {
  key: BadgeKey;
  name: string;
  icon: string;
  description: string;
  category: 'courage' | 'skills' | 'consistency' | 'exploration';
  unlocked: boolean;
  unlockedAt?: string;
}

export interface StreakInfo {
  currentStreak: number;
  lastPracticeDate: string | null;
  streakFreezesAvailable: number;
  freezeUsedToday: boolean;
  message: string;
}

export type ShopItemType = 'hat' | 'outfit' | 'theme' | 'background';

export interface ShopItem {
  id: string;
  type: ShopItemType;
  name: string;
  icon: string;
  price: number; // In Star Points (Zero real money)
  description: string;
  isUnlocked: boolean;
  isEquipped: boolean;
}

export interface EquippedCustomization {
  hat?: string | null;
  outfit?: string | null;
  theme: SparkyTheme;
  background?: string | null;
}

// ----------------------------------------------------------------------------
// CATALOG DEFINITIONS
// ----------------------------------------------------------------------------
export const BADGE_CATALOG: Record<BadgeKey, Omit<BadgeInfo, 'unlocked' | 'unlockedAt'>> = {
  first_speech: {
    key: 'first_speech',
    name: 'First Speech',
    icon: '🌟',
    description: 'Stepped up and recorded your very first speech!',
    category: 'courage',
  },
  brave_voice: {
    key: 'brave_voice',
    name: 'Brave Voice',
    icon: '🦁',
    description: 'Spoke with steady courage and finished your target time!',
    category: 'courage',
  },
  story_teller: {
    key: 'story_teller',
    name: 'Story Teller',
    icon: '📚',
    description: 'Practiced speaking for 60 seconds with wonderful flow!',
    category: 'skills',
  },
  eye_contact_hero: {
    key: 'eye_contact_hero',
    name: 'Eye Contact Hero',
    icon: '👀',
    description: 'Maintained great focus connecting with your audience!',
    category: 'skills',
  },
  streak_7_day: {
    key: 'streak_7_day',
    name: '7-Day Streak',
    icon: '🚀',
    description: 'Practiced your voice across 7 joyful days!',
    category: 'consistency',
  },
  topic_explorer_10: {
    key: 'topic_explorer_10',
    name: 'Tried 10 Topics',
    icon: '🧭',
    description: 'Spun the wheel and explored 10 different topics!',
    category: 'exploration',
  },
};

export const SHOP_CATALOG: Omit<ShopItem, 'isUnlocked' | 'isEquipped'>[] = [
  // HATS
  { id: 'hat_party_crown', type: 'hat', name: 'Party Crown', icon: '👑', price: 30, description: 'Golden celebration crown for a true superstar!' },
  { id: 'hat_wizard', type: 'hat', name: 'Wizard Hat', icon: '🧙', price: 50, description: 'Star-studded purple hat with magic speaking sparks.' },
  { id: 'hat_space_helmet', type: 'hat', name: 'Space Helmet', icon: '🧑‍🚀', price: 70, description: 'Astronaut bubble helmet for galactic adventures.' },
  { id: 'hat_detective', type: 'hat', name: 'Detective Cap', icon: '🕵️', price: 40, description: 'Curious cap for solving topic mysteries.' },
  { id: 'hat_flower', type: 'hat', name: 'Flower Garland', icon: '🌸', price: 35, description: 'Spring blossom wreath full of joyful smiles.' },

  // OUTFITS
  { id: 'outfit_superhero_cape', type: 'outfit', name: 'Superhero Cape', icon: '🦸', price: 60, description: 'Brave fluttering cape that flows as you speak!' },
  { id: 'outfit_explorer_vest', type: 'outfit', name: 'Explorer Vest', icon: '🧭', price: 45, description: 'Safari pockets ready for exploring new topics.' },
  { id: 'outfit_space_suit', type: 'outfit', name: 'Space Suit', icon: '🚀', price: 80, description: 'Silver astronaut suit with mission patches.' },
  { id: 'outfit_sparkle_scarf', type: 'outfit', name: 'Sparkle Scarf', icon: '🧣', price: 35, description: 'Cozy, fluffy scarf with warm golden threads.' },

  // THEMES / COLORS
  { id: 'theme_sunny', type: 'theme', name: 'Sunny Gold', icon: '☀️', price: 0, description: 'Warm and cheerful golden fur (Sparky Classic).' },
  { id: 'theme_sky', type: 'theme', name: 'Sky Blue', icon: '🌊', price: 25, description: 'Cool ocean waves and calm sky vibes.' },
  { id: 'theme_coral', type: 'theme', name: 'Coral Pink', icon: '🪸', price: 25, description: 'Bright and energetic sunset pink fur.' },
  { id: 'theme_mint', type: 'theme', name: 'Mint Green', icon: '🌿', price: 25, description: 'Fresh spring green with bubbly joy.' },
  { id: 'theme_purple', type: 'theme', name: 'Royal Purple', icon: '🔮', price: 25, description: 'Majestic purple with cosmic charm.' },

  // BACKGROUNDS
  { id: 'bg_cosmos', type: 'background', name: 'Starry Cosmos', icon: '🌌', price: 50, description: 'Deep space with glowing nebulae and stars.' },
  { id: 'bg_meadow', type: 'background', name: 'Rainbow Meadow', icon: '🌈', price: 40, description: 'Gentle green hills under a cheerful rainbow.' },
  { id: 'bg_clouds', type: 'background', name: 'Cloud Kingdom', icon: '☁️', price: 40, description: 'Fluffy golden clouds high up in the sky.' },
  { id: 'bg_jungle', type: 'background', name: 'Dino Jungle', icon: '🌴', price: 60, description: 'Lush tropical trees for brave safari stories.' },
];

// ----------------------------------------------------------------------------
// REWARDS SERVICE
// ----------------------------------------------------------------------------
class RewardsService {
  private readonly STORAGE_PREFIX = 'speakup_rewards_v1_';
  private memoryMap: Map<string, string> = new Map();

  private isStorageAvailable(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private getStore<T>(key: string, defaultVal: T): T {
    const fullKey = this.STORAGE_PREFIX + key;
    if (this.isStorageAvailable()) {
      try {
        const raw = localStorage.getItem(fullKey);
        if (raw) return JSON.parse(raw);
      } catch {
        // fallback to memory
      }
    }
    const mem = this.memoryMap.get(fullKey);
    return mem !== undefined ? JSON.parse(mem) : defaultVal;
  }

  private setStore<T>(key: string, val: T): void {
    const fullKey = this.STORAGE_PREFIX + key;
    const json = JSON.stringify(val);
    this.memoryMap.set(fullKey, json);
    if (this.isStorageAvailable()) {
      try {
        localStorage.setItem(fullKey, json);
      } catch {
        // ignore
      }
    }
  }

  public clearStorage(childId?: string): void {
    if (childId) {
      const keys = [`points_${childId}`, `streak_${childId}`, `badges_${childId}`, `shop_unlocked_${childId}`, `equipped_${childId}`];
      for (const k of keys) {
        const fullKey = this.STORAGE_PREFIX + k;
        this.memoryMap.delete(fullKey);
        if (this.isStorageAvailable()) {
          try {
            localStorage.removeItem(fullKey);
          } catch {
            // ignore
          }
        }
      }
    } else {
      this.memoryMap.clear();
      if (this.isStorageAvailable()) {
        try {
          localStorage.clear();
        } catch {
          // ignore
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // POINTS & LEVEL CALCULATION
  // --------------------------------------------------------------------------
  public getPoints(childId: string): number {
    const history = this.getStore<PointAward[]>(`points_${childId}`, []);
    return history.reduce((sum, item) => sum + item.points, 0);
  }

  public getPointsHistory(childId: string): PointAward[] {
    return this.getStore<PointAward[]>(`points_${childId}`, []);
  }

  public awardPoints(childId: string, reason: PointReason, customPoints?: number): PointAward {
    const pointsMap: Record<PointReason, { pts: number; desc: string }> = {
      spin_wheel: { pts: 5, desc: 'Spun the Topic Wheel!' },
      finish_recording: { pts: 25, desc: 'Completed a Speaking Session!' },
      new_category: { pts: 15, desc: 'Explored a Brand New Category!' },
      skill_improved: { pts: 10, desc: 'Skill Growth Bonus!' },
      daily_practice: { pts: 10, desc: 'Daily Practice Star!' },
    };

    const cfg = pointsMap[reason] || { pts: 10, desc: 'Speaking Star Award!' };
    const points = customPoints !== undefined ? customPoints : cfg.pts;

    const award: PointAward = {
      id: `pt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      childId,
      points,
      reason,
      description: cfg.desc,
      timestamp: new Date().toISOString(),
    };

    const history = this.getStore<PointAward[]>(`points_${childId}`, []);
    history.unshift(award);
    this.setStore(`points_${childId}`, history);

    return award;
  }

  public deductPoints(childId: string, amount: number, description: string): boolean {
    const current = this.getPoints(childId);
    if (current < amount) return false;

    const award: PointAward = {
      id: `pt_spend_${Date.now()}`,
      childId,
      points: -amount,
      reason: 'daily_practice',
      description,
      timestamp: new Date().toISOString(),
    };

    const history = this.getStore<PointAward[]>(`points_${childId}`, []);
    history.unshift(award);
    this.setStore(`points_${childId}`, history);
    return true;
  }

  public getLevelInfo(totalPoints: number): LevelInfo {
    // Level tiers curve for kids
    // Level 1: 0 to 50 (Star Cadet)
    // Level 2: 50 to 120 (Voice Explorer)
    // Level 3: 120 to 220 (Story Weaver)
    // Level 4: 220 to 350 (Sky Soarer)
    // Level 5: 350 to 500 (Superstar Speaker)
    const levelTiers = [
      { level: 1, title: 'Star Cadet 🌟', min: 0, max: 50 },
      { level: 2, title: 'Voice Explorer 🧭', min: 50, max: 120 },
      { level: 3, title: 'Story Weaver 📚', min: 120, max: 220 },
      { level: 4, title: 'Sky Soarer 🚀', min: 220, max: 350 },
      { level: 5, title: 'Superstar Speaker 🌟', min: 350, max: 500 },
    ];

    for (const tier of levelTiers) {
      if (totalPoints < tier.max) {
        const range = tier.max - tier.min;
        const currentWithin = totalPoints - tier.min;
        const progressPercent = Math.min(100, Math.max(0, Math.round((currentWithin / range) * 100)));
        return {
          level: tier.level,
          title: tier.title,
          currentPoints: totalPoints,
          currentLevelMin: tier.min,
          nextLevelMin: tier.max,
          pointsToNext: tier.max - totalPoints,
          progressPercent,
        };
      }
    }

    // Max tier reached
    return {
      level: 5,
      title: 'Superstar Speaker 🌟',
      currentPoints: totalPoints,
      currentLevelMin: 350,
      nextLevelMin: 500,
      pointsToNext: 0,
      progressPercent: 100,
    };
  }

  // --------------------------------------------------------------------------
  // DAILY STREAK & STREAK FREEZE
  // --------------------------------------------------------------------------
  public getStreak(childId: string, referenceDate?: string): StreakInfo {
    const raw = this.getStore<{
      currentStreak: number;
      lastPracticeDate: string | null;
      streakFreezesAvailable: number;
      freezeUsedDates: string[];
    }>(`streak_${childId}`, {
      currentStreak: 0,
      lastPracticeDate: null,
      streakFreezesAvailable: 1, // Default 1 friendly streak freeze
      freezeUsedDates: [],
    });

    const todayStr = referenceDate || new Date().toISOString().split('T')[0];
    const isFreezeUsedToday = raw.freezeUsedDates.includes(todayStr);

    return {
      currentStreak: raw.currentStreak,
      lastPracticeDate: raw.lastPracticeDate,
      streakFreezesAvailable: raw.streakFreezesAvailable,
      freezeUsedToday: isFreezeUsedToday,
      message: raw.currentStreak > 1
        ? `${raw.currentStreak} Days of Brave Speaking! 🔥`
        : 'Day 1: Great start to your practice streak! 🌟',
    };
  }

  public recordDailyPractice(childId: string, practiceDateStr?: string): StreakInfo {
    const today = practiceDateStr || new Date().toISOString().split('T')[0];
    const currentStreakData = this.getStore<{
      currentStreak: number;
      lastPracticeDate: string | null;
      streakFreezesAvailable: number;
      freezeUsedDates: string[];
    }>(`streak_${childId}`, {
      currentStreak: 0,
      lastPracticeDate: null,
      streakFreezesAvailable: 1,
      freezeUsedDates: [],
    });

    if (currentStreakData.lastPracticeDate === today) {
      // Already recorded practice today
      return this.getStreak(childId, today);
    }

    if (!currentStreakData.lastPracticeDate) {
      // First practice ever
      currentStreakData.currentStreak = 1;
      currentStreakData.lastPracticeDate = today;
    } else {
      const lastDate = new Date(currentStreakData.lastPracticeDate);
      const currentDate = new Date(today);
      const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

      if (diffDays === 1) {
        // Consecutive day
        currentStreakData.currentStreak += 1;
        currentStreakData.lastPracticeDate = today;
      } else if (diffDays === 2 && currentStreakData.streakFreezesAvailable > 0) {
        // Missed exactly 1 day — ACTIVATE STREAK FREEZE!
        currentStreakData.streakFreezesAvailable -= 1;
        currentStreakData.freezeUsedDates.push(today);
        currentStreakData.currentStreak += 1; // Preserve streak
        currentStreakData.lastPracticeDate = today;
      } else {
        // Missed more than 1 day or no freeze available: Restart kindly without guilt-tripping
        currentStreakData.currentStreak = 1;
        currentStreakData.lastPracticeDate = today;
      }
    }

    this.setStore(`streak_${childId}`, currentStreakData);

    // Award daily practice points
    this.awardPoints(childId, 'daily_practice');

    // Check for 7-day streak badge
    if (currentStreakData.currentStreak >= 7) {
      this.unlockBadge(childId, 'streak_7_day');
    }

    return this.getStreak(childId, today);
  }

  // --------------------------------------------------------------------------
  // BADGES SYSTEM
  // --------------------------------------------------------------------------
  public getBadges(childId: string): BadgeInfo[] {
    const unlockedMap = this.getStore<Record<string, string>>(`badges_${childId}`, {});

    return Object.values(BADGE_CATALOG).map((b) => ({
      ...b,
      unlocked: Boolean(unlockedMap[b.key]),
      unlockedAt: unlockedMap[b.key],
    }));
  }

  public unlockBadge(childId: string, badgeKey: BadgeKey): { newlyUnlocked: boolean; badge: BadgeInfo } {
    const unlockedMap = this.getStore<Record<string, string>>(`badges_${childId}`, {});
    const newlyUnlocked = !unlockedMap[badgeKey];

    if (newlyUnlocked) {
      unlockedMap[badgeKey] = new Date().toISOString();
      this.setStore(`badges_${childId}`, unlockedMap);
      // Award 20 star bonus for new badge
      this.awardPoints(childId, 'skill_improved', 20);
    }

    const badgeCatalogItem = BADGE_CATALOG[badgeKey] || BADGE_CATALOG.first_speech;
    return {
      newlyUnlocked,
      badge: {
        ...badgeCatalogItem,
        unlocked: true,
        unlockedAt: unlockedMap[badgeKey],
      },
    };
  }

  // --------------------------------------------------------------------------
  // MASCOT REWARD SHOP
  // --------------------------------------------------------------------------
  public getShopItems(childId: string): ShopItem[] {
    const unlockedIds = this.getStore<string[]>(`shop_unlocked_${childId}`, ['theme_sunny']);
    const equipped = this.getEquippedCustomizations(childId);

    return SHOP_CATALOG.map((item) => {
      const isUnlocked = item.price === 0 || unlockedIds.includes(item.id);
      let isEquipped = false;

      if (item.type === 'hat') isEquipped = equipped.hat === item.id;
      if (item.type === 'outfit') isEquipped = equipped.outfit === item.id;
      if (item.type === 'theme') isEquipped = equipped.theme === item.id.replace('theme_', '');
      if (item.type === 'background') isEquipped = equipped.background === item.id;

      return {
        ...item,
        isUnlocked,
        isEquipped,
      };
    });
  }

  public purchaseShopItem(
    childId: string,
    itemId: string
  ): { success: boolean; message: string; error?: string; item?: ShopItem } {
    const item = SHOP_CATALOG.find((i) => i.id === itemId);
    if (!item) return { success: false, message: 'Item not found in catalog.', error: 'Item not found in catalog.' };

    const unlockedIds = this.getStore<string[]>(`shop_unlocked_${childId}`, ['theme_sunny']);
    if (unlockedIds.includes(itemId)) {
      // Already unlocked: equip directly
      this.equipShopItem(childId, itemId);
      return {
        success: true,
        message: `${item.name} equipped!`,
        item: { ...item, isUnlocked: true, isEquipped: true },
      };
    }

    const points = this.getPoints(childId);
    if (points < item.price) {
      const needed = item.price - points;
      const msg = `You need ${needed} more Star Points to unlock ${item.name}! Practice speaking to earn more! 🌟`;
      return {
        success: false,
        message: msg,
        error: msg,
      };
    }

    // Deduct points safely
    const success = this.deductPoints(childId, item.price, `Unlocked ${item.name}`);
    if (!success) {
      return { success: false, message: 'Could not complete unlock.', error: 'Could not complete unlock.' };
    }

    unlockedIds.push(itemId);
    this.setStore(`shop_unlocked_${childId}`, unlockedIds);

    // Auto-equip newly unlocked item
    this.equipShopItem(childId, itemId);

    return {
      success: true,
      message: `Hooray! You unlocked and equipped ${item.name}! 🎉`,
      item: { ...item, isUnlocked: true, isEquipped: true },
    };
  }

  public getEquippedCustomizations(childId: string): EquippedCustomization {
    return this.getStore<EquippedCustomization>(`equipped_${childId}`, {
      hat: null,
      outfit: null,
      theme: 'sunny',
      background: null,
    });
  }

  public equipShopItem(
    childId: string,
    itemId: string
  ): { success: boolean; equipped: EquippedCustomization; error?: string; message?: string } {
    const item = SHOP_CATALOG.find((i) => i.id === itemId);
    const equipped = this.getEquippedCustomizations(childId);

    if (!item) {
      return { success: false, equipped, error: 'Item not found in catalog.' };
    }

    const unlockedIds = this.getStore<string[]>(`shop_unlocked_${childId}`, ['theme_sunny']);
    const isUnlocked = item.price === 0 || unlockedIds.includes(itemId);

    if (!isUnlocked) {
      return {
        success: false,
        equipped,
        error: 'This item is locked! Earn Star Points to unlock it. 🌟',
      };
    }

    if (item.type === 'hat') {
      equipped.hat = equipped.hat === itemId ? null : itemId; // Toggle on/off
    } else if (item.type === 'outfit') {
      equipped.outfit = equipped.outfit === itemId ? null : itemId;
    } else if (item.type === 'theme') {
      equipped.theme = (item.id.replace('theme_', '') as SparkyTheme) || 'sunny';
    } else if (item.type === 'background') {
      equipped.background = equipped.background === itemId ? null : itemId;
    }

    this.setStore(`equipped_${childId}`, equipped);
    return {
      success: true,
      equipped,
      message: `${item.name} equipped!`,
    };
  }
}

export const rewardsService = new RewardsService();
