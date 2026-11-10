/**
 * CHILD PRIVACY NOTE (Rule 1, Rule 2, Rule 5):
 * - Prep Screen
 * - Displays chosen topic, 3 floating idea bubbles, duration picker, and mascot guidance.
 * - Mascot actively reinforces Privacy Rule 1:
 *   "Sparky says: let's not say our last name, address, or school today!"
 * - Read-aloud TTS uses browser Web Speech API 100% on-device. Zero telemetry.
 */

import React, { useState } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mic,
  Clock,
  Sparkles,
  Volume2,
  VolumeX,
  ShieldCheck,
  RotateCcw,
  Lightbulb,
  Check,
  Smile,
  Star,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { SparkyMascot, SparkyTheme } from '../components/mascot/SparkyMascot';
import { WarmUpModal } from '../components/prep/WarmUpModal';
import { speechHelper } from '../services/speech/tts';
import { soundEffects } from '../services/sound/soundEffects';
import { useParentAuth } from '../context/ParentAuthContext';
import { getRandomTopic, Topic } from '../services/topics/topicService';
import { AgeGroup } from '../types';

export interface DurationOption {
  seconds: number;
  label: string;
  badge: string;
  recommendedFor?: AgeGroup;
}

const DURATION_OPTIONS: DurationOption[] = [
  { seconds: 30, label: '30 sec', badge: 'Quick Spark ⚡', recommendedFor: '3-5' },
  { seconds: 60, label: '1 min', badge: 'Just Right 🌟', recommendedFor: '6-8' },
  { seconds: 90, label: '1 min 30', badge: 'Story Time 📖', recommendedFor: '9-12' },
  { seconds: 120, label: '2 min', badge: 'Superstar 🏆' },
];

export const getDefaultDuration = (ageBand: AgeGroup): number => {
  switch (ageBand) {
    case '3-5':
      return 30;
    case '9-12':
      return 90;
    case '6-8':
    default:
      return 60;
  }
};

export const PrepPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeChild } = useParentAuth();
  const outletContext = useOutletContext<{ ageGroup?: AgeGroup }>();

  // Resolve child's age band (from activeChild, outlet context, or default 6-8)
  const ageBand: AgeGroup =
    activeChild?.ageBand ||
    (location.state as { ageBand?: AgeGroup })?.ageBand ||
    outletContext?.ageGroup ||
    '6-8';

  // Topic from Wheel navigation or randomly selected for this age band
  const [topic] = useState<Topic>(() => {
    const passedTopic = (location.state as { topic?: Topic })?.topic;
    if (passedTopic) return passedTopic;
    return getRandomTopic(ageBand);
  });

  // Duration picker state (defaulted by age: 3-5 = 30s, 6-8 = 60s, 9-12 = 90s)
  const [selectedDuration, setSelectedDuration] = useState<number>(() =>
    getDefaultDuration(ageBand)
  );

  // Warm-up modal open state
  const [isWarmUpOpen, setIsWarmUpOpen] = useState(false);

  // Read-aloud TTS tracking
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);

  // Mascot theme
  const sparkyTheme: SparkyTheme =
    activeChild?.avatarId &&
    ['sunny', 'sky', 'coral', 'mint', 'purple'].includes(activeChild.avatarId)
      ? (activeChild.avatarId as SparkyTheme)
      : 'sunny';

  const childNickname = activeChild?.nickname || 'Superstar';

  const privacyReminderText =
    "Sparky says: let's not say our last name, address, or school today!";

  const encouragementText = `You've got this, ${childNickname}! There are no wrong answers. Just share your thoughts and have fun!`;

  const handleSpeak = (text: string, id: string) => {
    if (activeSpeechId === id) {
      speechHelper.stop();
      setActiveSpeechId(null);
      return;
    }

    setActiveSpeechId(id);
    speechHelper.speak(text, () => {
      setActiveSpeechId(null);
    });
  };

  const handleDurationSelect = (seconds: number) => {
    setSelectedDuration(seconds);
    soundEffects.playTick();
  };

  const handleReadyToRecord = () => {
    speechHelper.stop();
    soundEffects.playCelebration();
    navigate('/record', {
      state: {
        topic,
        targetDuration: selectedDuration,
      },
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto pb-10">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => {
            speechHelper.stop();
            navigate('/wheel');
          }}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-heading font-bold text-xs sm:text-sm min-h-[44px] px-3 py-1.5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-sky-500" />
          <span>Spin for another topic</span>
        </button>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sunny-100 text-amber-900 border border-amber-300 font-heading font-bold text-xs sm:text-sm">
          <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
          <span>Step 2 of 3: Get Ready to Shine</span>
        </div>
      </div>

      {/* Main Responsive Grid:
          Phone: Stacked (Single column)
          Laptop (lg: 1024px+): Topic on Left (col-span-7), Options on Right (col-span-5)
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LEFT COLUMN: Topic Card + 3 Floating Idea Bubbles + Mascot Safety Bubble */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Topic Showcase Card */}
          <Card
            variant="sunny"
            padding="lg"
            className="border-3 border-amber-300 relative overflow-hidden shadow-md"
          >
            {/* Background sparkle accents */}
            <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-white/30 rounded-full blur-xl pointer-events-none" />

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full bg-white/90 text-amber-900 text-xs font-heading font-black uppercase tracking-wider shadow-2xs border border-amber-200">
                  {topic.category}
                </span>

                <button
                  onClick={() =>
                    handleSpeak(
                      `Topic: ${topic.title}. Three ideas to talk about: ${topic.helperPrompts.join(
                        '. '
                      )}`,
                      'topic-main'
                    )
                  }
                  className="min-h-[44px] px-3 rounded-2xl bg-white/90 hover:bg-white text-amber-950 font-heading font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer border border-amber-200"
                  aria-label="Read topic and ideas aloud"
                >
                  {activeSpeechId === 'topic-main' ? (
                    <VolumeX className="w-4 h-4 text-coral" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-amber-600" />
                  )}
                  <span>Read Topic</span>
                </button>
              </div>

              {/* Topic Title with Big Emoji */}
              <div className="flex items-start sm:items-center gap-4 pt-1">
                <span className="text-5xl sm:text-6xl drop-shadow-sm flex-shrink-0">
                  {topic.emoji}
                </span>
                <div>
                  <h1 className="text-fluid-hero font-heading font-black text-amber-950 leading-tight">
                    {topic.title}
                  </h1>
                  <p className="text-xs sm:text-sm font-bold text-amber-900/80 mt-1">
                    Perfect for ages {topic.minAge} to {topic.maxAge}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* 3 Floating Idea Bubbles Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm sm:text-base font-heading font-black text-slate-700 flex items-center gap-2 uppercase tracking-wider">
                <Lightbulb className="w-5 h-5 text-amber-500 fill-amber-400" />
                <span>3 Floating Idea Bubbles</span>
              </h2>
              <span className="text-xs font-bold text-slate-400">Tap to hear ideas!</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {topic.helperPrompts.map((prompt, idx) => (
                <motion.div
                  key={idx}
                  animate={{
                    y: [0, -6, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 3 + idx * 0.5,
                    ease: 'easeInOut',
                    delay: idx * 0.3,
                  }}
                  whileHover={{ scale: 1.03, y: -8 }}
                  className="relative p-4 rounded-3xl bg-white border-2 border-sky-100 hover:border-sky-300 shadow-sm flex flex-col justify-between space-y-3 transition-colors cursor-pointer group"
                  onClick={() => handleSpeak(prompt, `bubble-${idx}`)}
                >
                  {/* Floating badge */}
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-400 to-cyan-300 text-white font-heading font-black text-xs flex items-center justify-center shadow-xs">
                      #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSpeak(prompt, `bubble-${idx}`);
                      }}
                      className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-sky-50 flex items-center justify-center text-slate-400 group-hover:text-sky-600 transition-colors"
                      aria-label={`Read idea ${idx + 1} aloud`}
                    >
                      {activeSpeechId === `bubble-${idx}` ? (
                        <VolumeX className="w-4 h-4 text-coral" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Prompt Text */}
                  <p className="text-xs sm:text-sm font-heading font-bold text-slate-800 leading-snug">
                    {prompt}
                  </p>

                  <div className="flex items-center gap-1 text-[11px] font-bold text-sky-600/80">
                    <Star className="w-3 h-3 fill-sky-400 text-sky-400" />
                    <span>Spark idea</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mascot Guidance & Privacy Shield Reminder */}
          <div className="bg-gradient-to-br from-sunny-50/70 via-white to-sky-50/60 rounded-4xl p-4 sm:p-6 border-2 border-sunny-200 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              {/* Mascot */}
              <div className="flex-shrink-0">
                <SparkyMascot
                  theme={sparkyTheme}
                  size="md"
                  braveryLevel={4}
                  className="hover:rotate-3 transition-transform"
                />
              </div>

              {/* Encouragement & Safety Speech Bubbles */}
              <div className="flex-1 space-y-3 text-center sm:text-left">
                {/* Speech Bubble 1: Friendly encouragement */}
                <div className="relative bg-white p-3.5 sm:p-4 rounded-3xl border-2 border-amber-200 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs sm:text-sm font-heading font-bold text-slate-800">
                      "{encouragementText}"
                    </p>
                    <button
                      onClick={() => handleSpeak(encouragementText, 'sparky-encourage')}
                      className="w-8 h-8 rounded-full bg-amber-50 hover:bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0 cursor-pointer"
                      aria-label="Read encouragement aloud"
                    >
                      {activeSpeechId === 'sparky-encourage' ? (
                        <VolumeX className="w-4 h-4 text-coral" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Speech Bubble 2: Gentle Privacy Shield Reminder */}
                <div className="relative bg-emerald-50/90 p-3.5 sm:p-4 rounded-3xl border-2 border-emerald-200 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs sm:text-sm font-heading font-black text-emerald-900 leading-snug">
                        {privacyReminderText}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSpeak(privacyReminderText, 'sparky-privacy')}
                      className="w-8 h-8 rounded-full bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center text-emerald-800 flex-shrink-0 cursor-pointer"
                      aria-label="Read safety reminder aloud"
                    >
                      {activeSpeechId === 'sparky-privacy' ? (
                        <VolumeX className="w-4 h-4 text-coral" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Duration Picker + Warm-Up Button + Let's Record CTA */}
        <div className="lg:col-span-5 space-y-6">
          {/* Duration Picker Card */}
          <Card variant="white" padding="lg" className="border-3 border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-sky-500" />
                <h3 className="text-base sm:text-lg font-heading font-black text-slate-800">
                  Speaking Duration
                </h3>
              </div>
              <span className="text-xs font-heading font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
                Age {ageBand} Default
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Pick how long you'd like to practice speaking:
            </p>

            {/* 4 Big Duration Buttons (Grid 2x2, min 56px touch target) */}
            <div className="grid grid-cols-2 gap-3">
              {DURATION_OPTIONS.map((opt) => {
                const isSelected = selectedDuration === opt.seconds;
                const isRecommended = opt.recommendedFor === ageBand;

                return (
                  <motion.button
                    key={opt.seconds}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDurationSelect(opt.seconds)}
                    className={`
                      relative min-h-[64px] p-3 rounded-3xl border-3 flex flex-col items-center justify-center text-center
                      transition-all cursor-pointer select-none
                      ${
                        isSelected
                          ? 'bg-gradient-to-tr from-coral to-rose-400 text-white border-coral-500 shadow-md ring-4 ring-coral-200'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 hover:border-slate-300'
                      }
                    `}
                  >
                    {isRecommended && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-sunny text-amber-950 font-heading font-black text-[10px] uppercase shadow-2xs border border-amber-300">
                        Suggested ⭐
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 font-heading font-black text-lg sm:text-xl">
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      <span>{opt.label}</span>
                    </div>

                    <span
                      className={`text-[11px] font-bold mt-0.5 ${
                        isSelected ? 'text-white/90' : 'text-slate-500'
                      }`}
                    >
                      {opt.badge}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </Card>

          {/* Fun Warm-Up Launcher Card */}
          <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 rounded-4xl p-5 border-3 border-purple-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smile className="w-5 h-5 text-purple-600" />
                <h3 className="font-heading font-black text-slate-800 text-base sm:text-lg">
                  Fun Pre-Speech Warm-Up
                </h3>
              </div>
              <span className="text-[11px] font-heading font-bold text-purple-700 bg-white/80 px-2 py-0.5 rounded-full border border-purple-200">
                Optional
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Shake off jitters with soothing breathing bubbles, funny silly face stretches, and tongue twisters!
            </p>

            <Button
              variant="purple"
              size="lg"
              fullWidth
              icon={<Sparkles className="w-5 h-5" />}
              onClick={() => {
                speechHelper.stop();
                setIsWarmUpOpen(true);
              }}
              className="shadow-sm"
            >
              Start Quick Warm-Up! 🎈
            </Button>
          </div>

          {/* Primary Action Button: "I'm Ready! Record Now" */}
          <div className="pt-2 space-y-3">
            <Button
              variant="coral"
              size="xl"
              fullWidth
              icon={<Mic className="w-7 h-7" />}
              onClick={handleReadyToRecord}
              className="shadow-lg py-5 text-lg sm:text-xl font-heading font-black"
            >
              I'm Ready! Record Now 🎙️
            </Button>

            <div className="text-center">
              <span className="text-xs font-heading font-bold text-slate-400">
                ⏱️ Target Goal: {selectedDuration < 60 ? `${selectedDuration} seconds` : `${selectedDuration / 60} minute${selectedDuration > 60 ? 's' : ''}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Warm-Up Modal */}
      <WarmUpModal
        isOpen={isWarmUpOpen}
        onClose={() => setIsWarmUpOpen(false)}
        ageBand={ageBand}
      />
    </div>
  );
};
