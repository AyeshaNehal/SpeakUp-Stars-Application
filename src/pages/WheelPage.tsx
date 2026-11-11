/**
 * CHILD PRIVACY NOTE (Rule 1, Rule 2, Rule 5):
 * - Spin the Wheel Page
 * - Displays an interactive SVG wheel with emoji and short titles.
 * - Filters strictly by child's age band (3-5, 6-8, 9-12) from the 120 curated topics.
 * - Supports Wheel of the Day (+15 bonus Star Points), Seasonal Events,
 *   keyboard Space navigation, reduced-motion preferences, sound toggle, and offline support.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Mic,
  RotateCcw,
  Volume2,
  VolumeX,
  Award,
  Lightbulb,
  Keyboard,
  Star,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { SpinWheelCanvas } from '../components/wheel/SpinWheelCanvas';
import {
  getTopicsByAgeBand,
  getCategories,
  Topic,
  TopicCategory,
} from '../services/topics/topicService';
import { rewardsService } from '../services/rewards/rewardsService';
import { seasonalEventsService } from '../services/events/seasonalEventsService';
import { useAccessibility } from '../context/AccessibilityContext';
import { useI18n } from '../context/I18nContext';
import { useParentAuth } from '../context/ParentAuthContext';
import { AgeGroup } from '../types';

export const WheelPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeChild } = useParentAuth();
  const { soundEffectsEnabled, setSoundEffectsEnabled, reducedMotion } = useAccessibility();
  const { t } = useI18n();
  const context = useOutletContext<{ ageGroup?: AgeGroup }>();
  const ageBand: AgeGroup = context?.ageGroup || '6-8';

  const categories = useMemo(() => getCategories(), []);
  const [selectedCategory, setSelectedCategory] = useState<TopicCategory | 'All'>('All');
  const [isSpinning, setIsSpinning] = useState(false);
  const [reSpinsLeft, setReSpinsLeft] = useState(1);
  const [hasSpun, setHasSpun] = useState(false);

  // Wheel of the Day & Seasonal Events
  const wheelOfTheDay = useMemo(() => seasonalEventsService.getWheelOfTheDay(ageBand), [ageBand]);
  const seasonalEvent = wheelOfTheDay.seasonalEvent;

  // Filter topics for the current age band and selected category
  const filteredTopics = useMemo(() => {
    const cat = selectedCategory === 'All' ? undefined : selectedCategory;
    return getTopicsByAgeBand(ageBand, cat);
  }, [ageBand, selectedCategory]);

  // Landed topic initialized to Wheel of the Day
  const [landedTopic, setLandedTopic] = useState<Topic>(() => {
    return (
      wheelOfTheDay.featuredTopic ||
      filteredTopics[0] || {
        id: 'default',
        title: 'My Favorite Animal',
        category: 'Animals',
        emoji: '🐶',
        minAge: 3,
        maxAge: 5,
        helperPrompts: ['What sound does it make?', 'What does it eat?', 'Why is it your favorite?'],
      }
    );
  });

  // Keep landed topic aligned if category changes before first spin
  useEffect(() => {
    if (!hasSpun && filteredTopics.length > 0) {
      setLandedTopic(filteredTopics[0]);
    }
  }, [filteredTopics, hasSpun]);

  const handleSpinStart = () => {
    setIsSpinning(true);
  };

  const handleSpinEnd = (topic: Topic) => {
    setIsSpinning(false);
    setLandedTopic(topic);
    setHasSpun(true);
    // Award 5 star points for spinning, plus +15 if landed on Wheel of the Day
    const isDaily = topic.id === wheelOfTheDay.featuredTopic.id;
    const pointsToAward = isDaily ? 20 : 5;
    if (activeChild?.id) {
      rewardsService.awardPoints(activeChild.id, 'spin_wheel', pointsToAward);
    }
  };

  const handleReSpin = () => {
    if (reSpinsLeft > 0 && !isSpinning) {
      setReSpinsLeft(reSpinsLeft - 1);
      const spinBtn = document.querySelector('button[aria-label="Spin the wheel button"]') as HTMLButtonElement;
      if (spinBtn) spinBtn.click();
    }
  };

  const handleProceedToPrep = () => {
    navigate('/prep', { state: { topic: landedTopic } });
  };

  const handleSelectWheelOfDay = () => {
    setLandedTopic(wheelOfTheDay.featuredTopic);
    setHasSpun(true);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto select-none">
      {/* Seasonal Event & Wheel of the Day Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Seasonal Banner */}
        <div className={`p-4 rounded-3xl border shadow-xs flex items-center justify-between gap-3 ${seasonalEvent.accentBg}`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-2xl bg-white/70 shadow-xs">
              {seasonalEvent.icon}
            </span>
            <div>
              <div className="text-[11px] font-heading font-black uppercase tracking-wider opacity-85">
                {t('wheel.season')}
              </div>
              <div className="font-heading font-black text-sm sm:text-base leading-tight">
                {seasonalEvent.name}
              </div>
              <div className="text-xs opacity-90">{seasonalEvent.tagline}</div>
            </div>
          </div>
        </div>

        {/* Wheel of the Day Featured Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-slate-950 shadow-md flex items-center justify-between gap-3 border-2 border-white/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/40 flex items-center justify-center text-3xl shadow-xs shrink-0">
              {wheelOfTheDay.featuredTopic.emoji}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-heading font-black text-amber-950 uppercase">
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-900" />
                <span>{t('wheel.today')}</span>
                <span className="bg-white/70 text-slate-900 px-2 py-0.5 rounded-full text-[10px]">
                  {t('wheel.bonus')}
                </span>
              </div>
              <div className="font-heading font-black text-sm sm:text-base leading-tight">
                {wheelOfTheDay.featuredTopic.title}
              </div>
            </div>
          </div>

          <button
            onClick={handleSelectWheelOfDay}
            disabled={isSpinning}
            className="px-3.5 py-2 rounded-2xl bg-slate-950 text-white font-heading font-black text-xs hover:bg-slate-800 transition-all shrink-0 active:scale-95 shadow-sm"
          >
            Choose Today! ⭐
          </button>
        </div>
      </div>

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-800 font-heading font-bold text-xs sm:text-sm px-3.5 py-1 rounded-full mb-1">
            <Sparkles className="w-4 h-4 text-sky-600 animate-spin" />
            <span>Curated Adventure • Ages {ageBand} Tier</span>
          </div>
          <h1 className="text-fluid-title font-heading font-black text-slate-800">
            {t('wheel.title')}
          </h1>
        </div>

        {/* Accessibility & Sound FX Controls */}
        <div className="flex items-center gap-2">
          {/* Keyboard Hint */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-2xl text-xs font-heading font-bold border border-slate-200">
            <Keyboard className="w-4 h-4 text-slate-500" />
            <span>
              Press <kbd className="bg-white px-1.5 py-0.5 rounded border shadow-2xs font-mono">Space</kbd> to Spin
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEffectsEnabled(!soundEffectsEnabled)}
            aria-label={soundEffectsEnabled ? 'Mute wheel sounds' : 'Unmute wheel sounds'}
            className={`
              min-h-[44px] min-w-[44px] px-3.5 rounded-2xl flex items-center gap-2 font-heading font-bold text-xs sm:text-sm
              border transition-all cursor-pointer
              ${
                soundEffectsEnabled
                  ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-xs'
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }
            `}
          >
            {soundEffectsEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Sound On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline">Muted</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-heading font-bold text-slate-500 uppercase tracking-wider">
            Filter Topics:
          </span>
          <span className="text-xs font-bold text-sky-600">
            {filteredTopics.length} topics available (100% Offline Ready)
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            disabled={isSpinning}
            className={`
              px-4 py-2 rounded-2xl text-xs sm:text-sm font-heading font-bold whitespace-nowrap min-h-[44px] transition-all cursor-pointer
              ${
                selectedCategory === 'All'
                  ? 'bg-amber-400 text-amber-950 shadow-sm scale-105'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }
            `}
          >
            ✨ All Categories
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              disabled={isSpinning}
              className={`
                px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-heading font-bold whitespace-nowrap min-h-[44px] transition-all cursor-pointer
                ${
                  selectedCategory === cat
                    ? 'bg-sky-400 text-white shadow-sm scale-105'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Wheel Grid: Phone = Stacked, Laptop = Wheel Left, Card Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
        {/* LEFT / TOP: Big Colorful Wheel */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <SpinWheelCanvas
            topics={filteredTopics}
            isSpinning={isSpinning}
            onSpinStart={handleSpinStart}
            onSpinEnd={handleSpinEnd}
            soundEnabled={soundEffectsEnabled}
          />

          {/* Quick Spin Button under wheel on mobile */}
          <div className="lg:hidden mt-5 w-full max-w-xs flex justify-center">
            <Button
              variant="sunny"
              size="lg"
              fullWidth
              disabled={isSpinning}
              onClick={() => {
                const spinBtn = document.querySelector('button[aria-label="Spin the wheel button"]') as HTMLButtonElement;
                if (spinBtn) spinBtn.click();
              }}
            >
              {isSpinning ? 'Wheel is Spinning...' : 'SPIN THE WHEEL! 🎡'}
            </Button>
          </div>
        </div>

        {/* RIGHT: Landed Topic Revealed Card */}
        <div className="lg:col-span-6 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={landedTopic.id}
              initial={reducedMotion ? { opacity: 0 } : { scale: 0.92, opacity: 0, y: 10 }}
              animate={reducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              aria-live="polite"
            >
              <Card
                variant="white"
                padding="lg"
                className={`
                  border-4 transition-all duration-300 space-y-4 relative overflow-hidden
                  ${hasSpun ? 'border-sunny-300 shadow-xl' : 'border-slate-200'}
                `}
              >
                {/* Landing celebration badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-heading font-black text-sky-800 bg-sky-100 px-3.5 py-1 rounded-full uppercase tracking-wider">
                    {landedTopic.category} • Ages {landedTopic.minAge}-{landedTopic.maxAge}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-heading font-black text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                    <Award className="w-4 h-4 text-amber-500 fill-amber-400" />
                    {landedTopic.id === wheelOfTheDay.featuredTopic.id ? '+40 Stars (Daily Bonus!)' : '+25 Stars'}
                  </span>
                </div>

                {/* Big Topic Hero Title & Emoji */}
                <div className="flex items-center gap-4 py-1">
                  <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-3xl bg-amber-50 border-3 border-amber-200 flex items-center justify-center text-5xl sm:text-6xl shadow-inner flex-shrink-0 animate-kid-float">
                    {landedTopic.emoji}
                  </div>
                  <div>
                    <h3 className="text-fluid-title font-heading font-black text-slate-800 leading-tight">
                      {landedTopic.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">
                      {hasSpun ? '🎉 Your chosen topic has landed!' : 'Spin the wheel to land on your challenge!'}
                    </p>
                  </div>
                </div>

                {/* 3 Idea Bubbles */}
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-heading font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    3 Idea Bubbles:
                  </p>
                  <div className="space-y-2">
                    {landedTopic.helperPrompts.map((prompt, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 font-medium"
                      >
                        <span className="w-5 h-5 rounded-full bg-sunny text-amber-950 flex items-center justify-center text-xs font-heading font-bold flex-shrink-0 mt-0.5 shadow-2xs">
                          {idx + 1}
                        </span>
                        <span>{prompt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons: "Let's do it!" and "Spin again" (Limit 1 re-spin) */}
                <div className="pt-3 space-y-2.5">
                  <Button
                    variant="coral"
                    size="xl"
                    fullWidth
                    disabled={isSpinning}
                    icon={<Mic className="w-7 h-7" />}
                    onClick={handleProceedToPrep}
                  >
                    {t('btn.start')} 🎙️
                  </Button>

                  <div className="flex items-center justify-between gap-3">
                    <Button
                      variant="outline"
                      size="md"
                      fullWidth
                      disabled={isSpinning || reSpinsLeft === 0}
                      icon={<RotateCcw className="w-5 h-5" />}
                      onClick={handleReSpin}
                      className="text-xs sm:text-sm"
                    >
                      {reSpinsLeft > 0 ? 'Spin Again (1 Left) 🔄' : 'No Re-spins Left!'}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/wheel')}
                      className="text-slate-400 text-xs"
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
