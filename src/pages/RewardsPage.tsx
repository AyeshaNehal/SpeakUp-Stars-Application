/**
 * CHILD PRIVACY & SAFETY NOTE (Rule 1, Rule 2, Rule 5):
 * - Rewards Page & Mascot Reward Shop
 * - Displays:
 *   1. Star Points balance & Levels with progress bar.
 *   2. Daily Streak counter with Streak Freeze protection indicator.
 *   3. Badges Showcase (unlocked bright, locked greyed out with kid-friendly instructions).
 *   4. Mascot Reward Shop (hats, outfits, colors, backgrounds).
 *   5. Live Mascot Dressing Room Preview where Sparky updates in real-time.
 * - Zero real-money purchases, zero countdown timers, zero guilt-tripping.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Star,
  Lock,
  Check,
  Shield,
  ShoppingBag,
  Award,
  Flame,
  Sparkle,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { ProgressBar } from '../components/common/ProgressBar';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { SparkyMascot } from '../components/mascot/SparkyMascot';
import {
  rewardsService,
  BadgeInfo,
  ShopItem,
  ShopItemType,
  EquippedCustomization,
  LevelInfo,
  StreakInfo,
} from '../services/rewards/rewardsService';
import { soundEffects } from '../services/sound/soundEffects';
import { useParentAuth } from '../context/ParentAuthContext';

export const RewardsPage: React.FC = () => {
  const { activeChild } = useParentAuth();
  const childId = activeChild?.id || 'guest_child';

  // Active Tab: 'badges' | 'shop'
  const [activeTab, setActiveTab] = useState<'badges' | 'shop'>('shop');
  const [shopCategory, setShopCategory] = useState<ShopItemType>('hat');

  // Rewards State
  const [totalPoints, setTotalPoints] = useState<number>(() => rewardsService.getPoints(childId));
  const [levelInfo, setLevelInfo] = useState<LevelInfo>(() => rewardsService.getLevelInfo(totalPoints));
  const [streakInfo, setStreakInfo] = useState<StreakInfo>(() => rewardsService.getStreak(childId));
  const [badges, setBadges] = useState<BadgeInfo[]>(() => rewardsService.getBadges(childId));
  const [shopItems, setShopItems] = useState<ShopItem[]>(() => rewardsService.getShopItems(childId));
  const [equipped, setEquipped] = useState<EquippedCustomization>(() =>
    rewardsService.getEquippedCustomizations(childId)
  );

  // Badge Inspection Modal
  const [selectedBadge, setSelectedBadge] = useState<BadgeInfo | null>(null);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Synchronize points and shop items whenever childId changes
  useEffect(() => {
    refreshData();
  }, [childId]);

  const refreshData = () => {
    const pts = rewardsService.getPoints(childId);
    setTotalPoints(pts);
    setLevelInfo(rewardsService.getLevelInfo(pts));
    setStreakInfo(rewardsService.getStreak(childId));
    setBadges(rewardsService.getBadges(childId));
    setShopItems(rewardsService.getShopItems(childId));
    setEquipped(rewardsService.getEquippedCustomizations(childId));
  };

  // Trigger celebration confetti when clicking an unlocked badge
  const handleBadgeClick = (badge: BadgeInfo) => {
    setSelectedBadge(badge);
    if (badge.unlocked) {
      soundEffects.playCelebration();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    } else {
      soundEffects.playTick();
    }
  };

  // Purchase / Equip Shop Item
  const handleItemAction = (item: ShopItem) => {
    if (item.isUnlocked) {
      // Toggle Equip
      const res = rewardsService.equipShopItem(childId, item.id);
      if (res.success) {
        setEquipped({ ...res.equipped });
        soundEffects.playCelebration();
        showToast(res.message || `${item.name} equipped! ✨`);
      } else {
        showToast(res.error || 'Could not equip item.');
      }
    } else {
      // Purchase
      const res = rewardsService.purchaseShopItem(childId, item.id);
      if (res.success) {
        soundEffects.playCelebration();
        try {
          confetti({
            particleCount: 75,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
        showToast(res.message);
      } else {
        soundEffects.playTick();
        showToast(res.message);
      }
    }
    refreshData();
  };

  const showToast = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 3500);
  };

  const filteredShopItems = shopItems.filter((i) => i.type === shopCategory);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 select-none">
      {/* ------------------------------------------------------------------ */}
      {/* 1. TOP HEADER BANNER (Points, Daily Streak & Level Progress)       */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-4xl bg-gradient-to-r from-sunny-200 via-amber-200 to-rose-200 p-6 sm:p-8 border-3 border-amber-300 shadow-lg relative overflow-hidden">
        {/* Subtle decorative sparkles in background */}
        <div className="absolute top-2 right-4 text-3xl opacity-30 select-none">✨</div>
        <div className="absolute bottom-3 left-10 text-2xl opacity-25 select-none">⭐</div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Hero Text */}
          <div className="md:col-span-7 space-y-3">
            <div className="inline-flex items-center gap-2 bg-white/90 px-3.5 py-1 rounded-full text-xs font-heading font-black text-amber-950 border border-amber-300 shadow-2xs">
              <Trophy className="w-4 h-4 text-amber-600 animate-bounce" />
              <span>Rewards & Dressing Room</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 tracking-tight">
              Star Vault & Mascot Shop! 🌟
            </h1>
            <p className="text-sm sm:text-base text-slate-800 font-medium max-w-lg leading-relaxed">
              Earn Star Points by practicing your voice. Use them to customize Sparky with fun hats, superhero capes, and colorful fur!
            </p>

            {/* Streak & Streak Freeze Shield Pill */}
            <div className="pt-1 flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/90 border-2 border-amber-400 text-amber-950 text-xs sm:text-sm font-heading font-black shadow-xs">
                <Flame className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
                <span>{streakInfo.currentStreak} Day Streak</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-teal-50 border-2 border-teal-300 text-teal-900 text-xs sm:text-sm font-heading font-black shadow-xs" title="Missing a day won't break your streak!">
                <Shield className="w-4 h-4 text-teal-600 fill-teal-500" />
                <span>{streakInfo.streakFreezesAvailable > 0 ? '1 Streak Shield Ready 🛡️' : 'Streak Protected'}</span>
              </div>
            </div>
          </div>

          {/* Right Status Card: Banked Stars & Level Progress Bar */}
          <div className="md:col-span-5 flex justify-center md:justify-end">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 text-center shadow-xl border-3 border-amber-300 w-full max-w-xs space-y-3">
              <div>
                <span className="text-[11px] font-heading font-black text-slate-400 uppercase tracking-wider block">
                  Banked Star Points
                </span>
                <div className="text-3xl sm:text-4xl font-heading font-black text-amber-600 flex items-center justify-center gap-2 mt-0.5">
                  <Star className="w-8 h-8 fill-amber-400 text-amber-500 animate-spin-slow" />
                  <span>{totalPoints}</span>
                </div>
              </div>

              {/* Level Progress */}
              <div className="pt-1 space-y-1.5 text-left border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-heading font-black">
                  <span className="text-purple-900 bg-purple-100 px-2 py-0.5 rounded-md">
                    Level {levelInfo.level}: {levelInfo.title}
                  </span>
                  <span className="text-slate-500 font-bold text-[11px]">
                    {levelInfo.currentPoints} / {levelInfo.nextLevelMin} XP
                  </span>
                </div>
                <ProgressBar
                  value={levelInfo.progressPercent}
                  variant="sunny"
                  size="sm"
                  label=""
                />
                <p className="text-[10px] text-slate-400 font-medium text-center pt-0.5">
                  {levelInfo.pointsToNext} more stars to reach Level {levelInfo.level + 1}!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* NOTIFICATION TOAST BAR                                            */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {statusNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-3.5 bg-sunny-400 text-amber-950 rounded-2xl border-2 border-amber-500 font-heading font-black text-center text-sm shadow-md"
          >
            {statusNotification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------ */}
      {/* 2. NAVIGATION TABS (Shop vs Badges)                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab('shop');
            soundEffects.playTick();
          }}
          className={`
            min-h-[48px] px-6 py-2.5 rounded-full font-heading font-black text-sm sm:text-base transition-all flex items-center gap-2 cursor-pointer shadow-xs border-2
            ${
              activeTab === 'shop'
                ? 'bg-gradient-to-r from-sunny-300 to-amber-300 text-amber-950 border-amber-400 shadow-md scale-105'
                : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200'
            }
          `}
        >
          <ShoppingBag className="w-5 h-5 text-amber-700" />
          <span>Reward Shop 🛍️</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('badges');
            soundEffects.playTick();
          }}
          className={`
            min-h-[48px] px-6 py-2.5 rounded-full font-heading font-black text-sm sm:text-base transition-all flex items-center gap-2 cursor-pointer shadow-xs border-2
            ${
              activeTab === 'badges'
                ? 'bg-gradient-to-r from-purple-300 to-indigo-300 text-purple-950 border-purple-400 shadow-md scale-105'
                : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200'
            }
          `}
        >
          <Award className="w-5 h-5 text-purple-700" />
          <span>Badges Vault 🏆 ({badges.filter((b) => b.unlocked).length} / {badges.length})</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. TAB 1: REWARD SHOP & LIVE MASCOT DRESSING ROOM PREVIEW           */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'shop' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Live Mascot Dressing Room Stage */}
          <div className="lg:col-span-5 space-y-4">
            <Card
              variant="white"
              padding="lg"
              className="border-3 border-amber-300/80 text-center space-y-4 shadow-md sticky top-6"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-heading font-black text-amber-900 uppercase tracking-wider bg-sunny-100 px-3 py-1 rounded-full border border-amber-200">
                  Dressing Room
                </span>
                <span className="text-xs font-heading font-bold text-slate-500">
                  Equipped & Live
                </span>
              </div>

              {/* The Live Mascot View with Equipped Accessories */}
              <div className="py-4 flex justify-center items-center">
                <SparkyMascot
                  theme={equipped.theme}
                  size="xl"
                  braveryLevel={5}
                  equippedHat={equipped.hat}
                  equippedOutfit={equipped.outfit}
                  equippedBackground={equipped.background}
                />
              </div>

              <div className="space-y-1">
                <h3 className="font-heading font-black text-lg text-slate-800">
                  Sparky the Mascot
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {equipped.hat || equipped.outfit || equipped.background
                    ? 'Looking super stylish! Ready for your next speech!'
                    : 'Tap any unlocked item on the right to equip Sparky!'}
                </p>
              </div>

              {/* Zero-Money Child Privacy Assurance */}
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-left flex items-start gap-2.5">
                <Sparkle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-900 font-medium leading-relaxed">
                  <strong>Kid-Safe Guarantee:</strong> 100% free with practice points. Zero real-money microtransactions, zero countdown pressure.
                </p>
              </div>
            </Card>
          </div>

          {/* Right Column: Shop Items Grid by Category */}
          <div className="lg:col-span-7 space-y-4">
            {/* Category Filter Chips */}
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { type: 'hat', label: 'Hats 👑' },
                  { type: 'outfit', label: 'Outfits 🦸' },
                  { type: 'theme', label: 'Colors 🎨' },
                  { type: 'background', label: 'Scenes 🌌' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.type}
                  onClick={() => {
                    setShopCategory(cat.type);
                    soundEffects.playTick();
                  }}
                  className={`
                    min-h-[44px] px-4 py-1.5 rounded-full font-heading font-black text-xs sm:text-sm border-2 transition-all cursor-pointer shadow-2xs
                    ${
                      shopCategory === cat.type
                        ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200'
                    }
                  `}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredShopItems.map((item) => {
                const canAfford = totalPoints >= item.price;

                return (
                  <Card
                    key={item.id}
                    variant={item.isEquipped ? 'sunny' : 'white'}
                    padding="md"
                    className={`
                      border-3 transition-all flex flex-col justify-between space-y-3
                      ${item.isEquipped ? 'border-amber-400 ring-2 ring-amber-200 shadow-md' : 'border-slate-200 shadow-2xs'}
                    `}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-3xl shadow-inner">
                        {item.icon}
                      </div>
                      <div>
                        {item.isEquipped ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-heading font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            Equipped
                          </span>
                        ) : item.isUnlocked ? (
                          <span className="text-[11px] font-heading font-black text-sky-800 bg-sky-100 border border-sky-300 px-2.5 py-0.5 rounded-full">
                            Unlocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-heading font-black text-amber-950 bg-sunny-200 border border-sunny-400 px-2.5 py-0.5 rounded-full">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                            {item.price} Stars
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="font-heading font-black text-base text-slate-800">
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {item.description}
                      </p>
                    </div>

                    {/* Action Button */}
                    <Button
                      variant={item.isEquipped ? 'outline' : item.isUnlocked ? 'mint' : canAfford ? 'coral' : 'ghost'}
                      size="sm"
                      fullWidth
                      onClick={() => handleItemAction(item)}
                      disabled={!item.isUnlocked && !canAfford}
                    >
                      {item.isEquipped
                        ? 'Unequip'
                        : item.isUnlocked
                        ? 'Equip ✨'
                        : canAfford
                        ? `Unlock (${item.price} ⭐)`
                        : `Need ${item.price - totalPoints} more ⭐`}
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 4. TAB 2: BADGES SHOWCASE VAULT (Unlocked bright, locked greyed)   */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'badges' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-heading font-black text-xl text-slate-800">
              Speaking Badges & Honors
            </h2>
            <span className="text-xs font-heading font-bold text-slate-500">
              Tap any badge to celebrate!
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
            {badges.map((badge) => (
              <Card
                key={badge.key}
                variant={badge.unlocked ? 'white' : 'subtle'}
                isInteractive
                padding="md"
                onClick={() => handleBadgeClick(badge)}
                className={`
                  text-center flex flex-col items-center justify-between p-5 min-h-[200px] transition-all cursor-pointer
                  ${
                    badge.unlocked
                      ? 'border-3 border-amber-300 shadow-md hover:scale-102 hover:border-amber-400'
                      : 'opacity-55 border-dashed border-2 border-slate-300 bg-slate-50/80 grayscale'
                  }
                `}
              >
                <div className="relative">
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-md border-2 ${
                    badge.unlocked ? 'bg-gradient-to-tr from-sunny-100 to-amber-100 border-amber-300' : 'bg-slate-200 border-slate-300'
                  }`}>
                    {badge.icon}
                  </div>
                  {!badge.unlocked && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center shadow-md">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <div className="space-y-1 mt-2">
                  <h4 className="font-heading font-black text-base text-slate-900">
                    {badge.name}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium line-clamp-2">
                    {badge.description}
                  </p>
                </div>

                <div className="pt-2">
                  {badge.unlocked ? (
                    <span className="text-[11px] font-heading font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full">
                      ✓ Unlocked!
                    </span>
                  ) : (
                    <span className="text-[11px] font-heading font-bold text-slate-500 bg-slate-200 px-3 py-1 rounded-full">
                      🔒 Keep Practicing!
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 5. BADGE CELEBRATION MODAL                                         */}
      {/* ------------------------------------------------------------------ */}
      {selectedBadge && (
        <Modal
          isOpen={Boolean(selectedBadge)}
          onClose={() => setSelectedBadge(null)}
          title={selectedBadge.unlocked ? 'Badge Accomplished! 🏆' : 'Badge In Progress 🔒'}
          maxWidth="sm"
          footer={
            <Button
              variant={selectedBadge.unlocked ? 'coral' : 'outline'}
              size="md"
              fullWidth
              onClick={() => setSelectedBadge(null)}
            >
              {selectedBadge.unlocked ? 'Awesome! 🌟' : 'I Can Do It! 💪'}
            </Button>
          }
        >
          <div className="text-center space-y-4 py-2">
            <div className={`w-24 h-24 mx-auto rounded-3xl flex items-center justify-center text-5xl shadow-xl border-3 ${
              selectedBadge.unlocked ? 'bg-gradient-to-tr from-sunny to-amber-300 border-white ring-4 ring-sunny-200 animate-bounce' : 'bg-slate-200 border-slate-300'
            }`}>
              {selectedBadge.icon}
            </div>

            <div className="space-y-1">
              <h3 className="font-heading font-black text-xl text-slate-900">
                {selectedBadge.name}
              </h3>
              <p className="text-sm text-slate-600 font-medium">
                {selectedBadge.description}
              </p>
            </div>

            {selectedBadge.unlocked ? (
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 font-bold">
                ⭐ Earned and proud! Keep speaking up with bravery!
              </div>
            ) : (
              <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 text-xs text-slate-700 font-medium">
                💡 <strong>How to unlock:</strong> Practice your speech sessions and try new topics to unlock this star badge!
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
