/**
 * CHILD PRIVACY NOTE (Rule 1, Rule 2, Rule 5):
 * - Child Onboarding Flow
 * - Shown after the parent selects a child profile.
 * - Confirms nickname (no real names requested or accepted), selects color theme,
 *   and conducts a 5-emoji daily courage check-in.
 * - Saves only minimal fields allowed in PRIVACY_RULES.md to the database.
 * - Read-aloud runs 100% on-device via native SpeechSynthesis API.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  ArrowRight,
  ArrowLeft,
  Check,
  Star,
} from 'lucide-react';
import { Button } from '../common/Button';
import { SparkyMascot, SparkyTheme } from '../mascot/SparkyMascot';
import { speechHelper } from '../../services/speech/tts';
import { parentAuthService } from '../../services/auth/parentAuthService';
import { AgeGroup } from '../../types';

interface ChildOnboardingModalProps {
  isOpen: boolean;
  childId?: string;
  parentId?: string;
  initialNickname?: string;
  ageBand?: AgeGroup;
  onClose: () => void;
  onCompleted: (result: { nickname: string; theme: SparkyTheme; braveryLevel: number }) => void;
}

const THEMES: Array<{ id: SparkyTheme; name: string; bg: string; border: string; desc: string }> = [
  { id: 'sunny', name: 'Sunny Gold', bg: 'bg-sunny', border: 'border-amber-400', desc: 'Warm & Cheerful' },
  { id: 'sky', name: 'Sky Cosmic', bg: 'bg-sky', border: 'border-sky-400', desc: 'Cool & Curious' },
  { id: 'coral', name: 'Bubblegum Coral', bg: 'bg-coral', border: 'border-rose-400', desc: 'Bubbly & Friendly' },
  { id: 'mint', name: 'Forest Mint', bg: 'bg-mint', border: 'border-emerald-400', desc: 'Fresh & Playful' },
  { id: 'purple', name: 'Magic Purple', bg: 'bg-purple', border: 'border-purple-400', desc: 'Mystical & Dreamy' },
];

const BRAVERY_OPTIONS = [
  { level: 1, emoji: '🐣', label: 'A Little Shy', soundText: 'A little shy today. That is completely okay!' },
  { level: 2, emoji: '🌱', label: 'Warming Up', soundText: 'Warming up! Ready to take a small step.' },
  { level: 3, emoji: '😊', label: 'Happy & Ready', soundText: 'Happy and ready to practice!' },
  { level: 4, emoji: '🦁', label: 'Super Brave!', soundText: 'Super brave like a lion!' },
  { level: 5, emoji: '🚀', label: 'Unstoppable!', soundText: 'Unstoppable superstar! Ready to blast off!' },
];

export const ChildOnboardingModal: React.FC<ChildOnboardingModalProps> = ({
  isOpen,
  childId = '',
  parentId = '',
  initialNickname = '',
  ageBand = '6-8',
  onClose,
  onCompleted,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [nickname, setNickname] = useState(initialNickname);
  const [selectedTheme, setSelectedTheme] = useState<SparkyTheme>('sunny');
  const [braveryLevel, setBraveryLevel] = useState<number>(3);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialNickname) {
      setNickname(initialNickname);
    }
  }, [initialNickname]);

  // Clean up speech on close
  useEffect(() => {
    return () => {
      speechHelper.stop();
    };
  }, []);

  if (!isOpen) return null;

  const isJunior = ageBand === '3-5';

  // Read aloud helper for each screen
  const handleReadAloud = (customText?: string) => {
    let textToSpeak = '';
    if (customText) {
      textToSpeak = customText;
    } else if (step === 1) {
      textToSpeak = isJunior
        ? "Hi! I am Sparky, your furry buddy! Tap the big button to play!"
        : `Hi there! I'm Sparky, your speaking companion! Are you ready to find your voice and earn shiny golden stars?`;
    } else if (step === 2) {
      textToSpeak = `Is ${nickname} your awesome speaking nickname? You can change it if you like!`;
    } else if (step === 3) {
      textToSpeak = `Pick a favorite color for Sparky! Tap the circles to see me transform!`;
    } else if (step === 4) {
      textToSpeak = `How brave do you feel today? Pick the face that matches your mood!`;
    }

    setIsSpeaking(true);
    speechHelper.speak(textToSpeak, () => setIsSpeaking(false));
  };

  // Step 4 Completion: Save to Database
  const handleFinish = async () => {
    setIsSaving(true);
    speechHelper.stop();

    await parentAuthService.completeChildOnboarding(
      childId,
      parentId,
      nickname,
      selectedTheme,
      braveryLevel
    );

    setIsSaving(false);
    onCompleted({
      nickname,
      theme: selectedTheme,
      braveryLevel,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Friendly Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/65 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Responsive Modal Card (Laptop: 2 columns; Phone: stacked) */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 15 }}
        className="
          relative w-full max-w-4xl my-auto
          bg-white rounded-4xl sm:rounded-5xl shadow-2xl border-4 border-sunny-300
          overflow-hidden z-10 flex flex-col max-h-[92vh]
        "
      >
        {/* Top Floating Control Bar */}
        <div className="px-5 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-sunny-100 via-sky-50 to-mint-100 border-b-2 border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-sunny text-amber-950 flex items-center justify-center font-heading font-black text-sm shadow-xs">
              {step}/4
            </span>
            <span className="font-heading font-black text-sm sm:text-base text-slate-800">
              {step === 1 && 'Meet Sparky!'}
              {step === 2 && 'Your Super Nickname'}
              {step === 3 && 'Pick Sparky’s Color'}
              {step === 4 && 'How Brave Are You Today?'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Read Aloud Text-to-Speech Button (min 48px touch target) */}
            <button
              onClick={() => handleReadAloud()}
              aria-label="Read page aloud"
              className={`
                min-h-[48px] min-w-[48px] px-3.5 rounded-2xl flex items-center gap-2 font-heading font-bold text-xs sm:text-sm
                transition-all cursor-pointer border-2
                ${
                  isSpeaking
                    ? 'bg-sunny-300 text-amber-950 border-amber-400 ring-4 ring-sunny-200 animate-pulse'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
                }
              `}
            >
              {isSpeaking ? (
                <VolumeX className="w-5 h-5 text-amber-900" />
              ) : (
                <Volume2 className="w-5 h-5 text-sky-600" />
              )}
              <span className="hidden sm:inline">
                {isSpeaking ? 'Listening...' : 'Read Aloud 📢'}
              </span>
            </button>
          </div>
        </div>

        {/* Modal Main Grid: Laptop (Lg) = Mascot Left, Form Right. Phone = Stacked */}
        <div className="p-5 sm:p-8 lg:p-10 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          {/* LEFT: Cute Interactive Sparky Mascot */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center text-center">
            <div className="relative">
              <SparkyMascot
                theme={selectedTheme}
                braveryLevel={braveryLevel}
                size={isJunior ? 'xl' : 'lg'}
                onClick={() => handleReadAloud()}
              />
              <div className="absolute -bottom-2 bg-white/90 backdrop-blur-xs px-3.5 py-1 rounded-full shadow-md border-2 border-slate-100 font-heading font-black text-xs text-slate-700">
                ✨ Tap Sparky to Hear Voice!
              </div>
            </div>

            <p className="mt-4 font-heading font-black text-lg text-slate-800">
              Sparky
            </p>
            <p className="text-xs text-slate-500 font-bold">
              Your Speaking Confidence Friend
            </p>
          </div>

          {/* RIGHT: Dynamic Screen Content */}
          <div className="lg:col-span-7 space-y-6">
            <AnimatePresence mode="wait">
              {/* SCREEN 1: Welcome */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <span className="text-xs font-heading font-bold text-amber-700 bg-sunny-100 px-3 py-1 rounded-full">
                      Welcome Star Speaker! ⭐
                    </span>
                    <h2 className="text-fluid-title font-heading font-black text-slate-900">
                      {isJunior ? 'Ready to play with Sparky?' : `Welcome, ${nickname}! Ready to shine?`}
                    </h2>
                    <p className="text-fluid-body text-slate-600 font-medium">
                      {isJunior
                        ? 'We will play fun speaking games, spin magical wheels, and collect golden stars together!'
                        : 'Practice speaking with confidence at your own pace. There are no right or wrong answers—just fun ideas and your amazing voice!'}
                    </p>
                  </div>

                  <div className="pt-4">
                    <Button
                      variant="sunny"
                      size={isJunior ? 'xl' : 'lg'}
                      fullWidth
                      iconRight={<ArrowRight className="w-6 h-6" />}
                      onClick={() => {
                        setStep(2);
                        speechHelper.stop();
                      }}
                    >
                      {isJunior ? "LET'S GO! 🚀" : 'Start My Adventure'}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* SCREEN 2: Confirm Nickname */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <h2 className="text-fluid-title font-heading font-black text-slate-900">
                      Check Your Nickname
                    </h2>
                    <p className="text-fluid-body text-slate-600 font-medium">
                      This is the fun name Sparky will call you during practice!
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-heading font-bold text-slate-600 uppercase">
                      Speaking Nickname
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      maxLength={20}
                      className="
                        w-full px-5 py-3.5 rounded-3xl border-3 border-sky-300
                        font-heading font-bold text-xl sm:text-2xl text-slate-800
                        focus:outline-none focus:ring-4 focus:ring-sky-200 min-h-[56px]
                      "
                    />
                    <p className="text-[11px] text-slate-400 font-semibold">
                      💡 Tip: Use a playful nickname like "Star", "Sunny", or "Rocket"!
                    </p>
                  </div>

                  <div className="flex gap-3 pt-3">
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => setStep(1)}
                      icon={<ArrowLeft className="w-5 h-5" />}
                    >
                      Back
                    </Button>
                    <Button
                      variant="sky"
                      size={isJunior ? 'xl' : 'lg'}
                      fullWidth
                      disabled={!nickname.trim()}
                      iconRight={<ArrowRight className="w-5 h-5" />}
                      onClick={() => {
                        setStep(3);
                        speechHelper.stop();
                      }}
                    >
                      Looks Great! 👍
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* SCREEN 3: Pick Avatar Color / Theme */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <h2 className="text-fluid-title font-heading font-black text-slate-900">
                      Pick Sparky's Color!
                    </h2>
                    <p className="text-fluid-body text-slate-600 font-medium">
                      Tap a color below to transform your mascot friend!
                    </p>
                  </div>

                  {/* Color Swatch Tiles (Large min-56px targets) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                    {THEMES.map((themeOption) => {
                      const isSelected = selectedTheme === themeOption.id;
                      return (
                        <button
                          key={themeOption.id}
                          onClick={() => {
                            setSelectedTheme(themeOption.id);
                            handleReadAloud(`Sparky is now ${themeOption.name}!`);
                          }}
                          className={`
                            min-h-[56px] p-3 rounded-3xl border-3 text-left transition-all cursor-pointer
                            flex items-center gap-3 select-none
                            ${
                              isSelected
                                ? `${themeOption.border} ring-4 ring-sunny-300 scale-105 shadow-md bg-white font-black`
                                : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                            }
                          `}
                        >
                          <div className={`w-8 h-8 rounded-2xl ${themeOption.bg} flex-shrink-0 shadow-inner flex items-center justify-center text-white`}>
                            {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                          </div>
                          <div className="truncate">
                            <p className="font-heading font-bold text-xs sm:text-sm truncate">
                              {themeOption.name}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-3 pt-3">
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => setStep(2)}
                      icon={<ArrowLeft className="w-5 h-5" />}
                    >
                      Back
                    </Button>
                    <Button
                      variant="mint"
                      size={isJunior ? 'xl' : 'lg'}
                      fullWidth
                      iconRight={<ArrowRight className="w-5 h-5" />}
                      onClick={() => {
                        setStep(4);
                        speechHelper.stop();
                      }}
                    >
                      Next: Check In! 🌟
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* SCREEN 4: "How Brave Do You Feel Today?" Check-In */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <h2 className="text-fluid-title font-heading font-black text-slate-900">
                      How brave do you feel today?
                    </h2>
                    <p className="text-fluid-body text-slate-600 font-medium">
                      All feelings are welcome here! Tap the face that feels like you:
                    </p>
                  </div>

                  {/* 5 Emoji Face Choices (Large tactile 56px+ touch targets) */}
                  <div className="grid grid-cols-5 gap-2 sm:gap-3 py-2">
                    {BRAVERY_OPTIONS.map((opt) => {
                      const isSelected = braveryLevel === opt.level;
                      return (
                        <button
                          key={opt.level}
                          onClick={() => {
                            setBraveryLevel(opt.level);
                            handleReadAloud(opt.soundText);
                          }}
                          className={`
                            min-h-[64px] sm:min-h-[72px] rounded-3xl p-2 sm:p-3 flex flex-col items-center justify-center
                            transition-all border-3 cursor-pointer select-none
                            ${
                              isSelected
                                ? 'bg-sunny-100 border-sunny-500 scale-110 shadow-lg ring-4 ring-sunny-300'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }
                          `}
                        >
                          <span className="text-3xl sm:text-4xl">{opt.emoji}</span>
                          <span className="text-[10px] sm:text-xs font-heading font-bold text-slate-700 mt-1 text-center truncate max-w-full">
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Feeling Caption */}
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center font-heading font-bold text-xs sm:text-sm text-amber-900">
                    {BRAVERY_OPTIONS.find((b) => b.level === braveryLevel)?.soundText}
                  </div>

                  <div className="flex gap-3 pt-3">
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => setStep(3)}
                      icon={<ArrowLeft className="w-5 h-5" />}
                    >
                      Back
                    </Button>
                    <Button
                      variant="coral"
                      size={isJunior ? 'xl' : 'lg'}
                      fullWidth
                      disabled={isSaving}
                      icon={<Star className="w-6 h-6 fill-yellow-300 text-yellow-300" />}
                      onClick={handleFinish}
                    >
                      {isSaving ? 'Saving to Vault...' : 'Save & Start Speaking! 🎙️'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
