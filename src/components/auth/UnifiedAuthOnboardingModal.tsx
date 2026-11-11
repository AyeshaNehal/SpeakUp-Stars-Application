/**
 * SPEAKUP STARS: UNIFIED AUTH & NEW USER ONBOARDING
 * Flow:
 * 1. Login with Google OR Create new ID & Password (Supabase Auth / Sandbox)
 * 2. Ask Age Option (Age bands 3-5, 6-8, 9-12 and specific age 3-12)
 * 3. Choose Character Option (Sparky, Pip, Luna, Dash, Barnaby)
 * 4. Start from scratch! 0 points, 0 streak, clean slate.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Lock,
  Mail,
  Zap,
} from 'lucide-react';
import { Button } from '../common/Button';
import { useParentAuth } from '../../context/ParentAuthContext';
import { MascotCompanion, ALL_MASCOTS, MascotId } from '../mascot/MascotCompanion';
import { AgeGroup } from '../../types';
import confetti from 'canvas-confetti';

interface UnifiedAuthOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

export const UnifiedAuthOnboardingModal: React.FC<UnifiedAuthOnboardingModalProps> = ({
  isOpen,
  onClose,
  onCompleted,
}) => {
  const {
    parent,
    signInWithGoogle,
    signInWithEmailPassword,
    signUpParent,
    createChild,
    resetAllToScratch,
  } = useParentAuth();

  // Wizard Steps: 1 = Auth/Login, 2 = Ask Age, 3 = Choose Character & Nickname, 4 = Ready From Scratch!
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');

  // Auth Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [parentPin, setParentPin] = useState('1234');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Profile Inputs
  const [selectedAgeBand, setSelectedAgeBand] = useState<AgeGroup>('6-8');
  const [exactAge, setExactAge] = useState<number>(7);
  const [selectedMascot, setSelectedMascot] = useState<MascotId>('sparky');
  const [childNickname, setChildNickname] = useState('');

  if (!isOpen) return null;

  // --------------------------------------------------------------------------
  // STEP 1: AUTH ACTIONS
  // --------------------------------------------------------------------------
  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setIsLoading(true);
    const res = await signInWithGoogle();
    setIsLoading(false);
    if (res.success) {
      setStep(2);
    } else {
      setErrorMsg(res.message || 'Google Sign-in failed. Please try again.');
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');

    if (authMode === 'signup') {
      const res = await signUpParent(email, password, parentPin || '1234');
      setIsLoading(false);
      if (res.success) {
        setStep(2);
      } else {
        setErrorMsg(res.message || 'Account creation failed.');
      }
    } else {
      const res = await signInWithEmailPassword(email, password);
      setIsLoading(false);
      if (res.success) {
        setStep(2);
      } else {
        setErrorMsg(res.message || 'Sign in failed. Check credentials.');
      }
    }
  };

  const handleGuestQuickStart = async () => {
    setIsLoading(true);
    setErrorMsg('');
    // Instant guest / sandbox account
    const guestEmail = `guest_${Date.now()}@speakupstars.local`;
    const res = await signUpParent(guestEmail, 'GuestPass123!', '1234');
    setIsLoading(false);
    if (res.success) {
      setStep(2);
    } else {
      setStep(2); // Proceed directly to age/character in sandbox
    }
  };

  // --------------------------------------------------------------------------
  // STEP 2: AGE SELECTION
  // --------------------------------------------------------------------------
  const handleAgeSelect = (band: AgeGroup, numAge: number) => {
    setSelectedAgeBand(band);
    setExactAge(numAge);
    setErrorMsg('');
    setStep(3);
  };

  // --------------------------------------------------------------------------
  // STEP 3: CHARACTER & NICKNAME COMPLETE -> RESET FROM SCRATCH
  // --------------------------------------------------------------------------
  const handleFinishOnboarding = async () => {
    if (!childNickname.trim()) {
      setErrorMsg('Please give your speaker a fun nickname!');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    // Ensure state starts 100% from scratch
    resetAllToScratch();

    // Re-create the freshly selected child profile
    const avatarEmoji =
      selectedMascot === 'sparky'
        ? '🐉'
        : selectedMascot === 'pip'
        ? '🐧'
        : selectedMascot === 'luna'
        ? '🦉'
        : selectedMascot === 'dash'
        ? '🐆'
        : '🐻';

    await createChild(childNickname.trim(), selectedAgeBand, avatarEmoji, selectedMascot);

    // Save exact mascot & age choice in local storage
    localStorage.setItem('speakup_selected_mascot', selectedMascot);
    localStorage.setItem('speakup_child_nickname', childNickname.trim());
    localStorage.setItem('speakup_child_age', String(exactAge));

    setIsLoading(false);
    setStep(4);

    // Fire joyful celebratory confetti!
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD12E', '#38BDF8', '#FF6B6B', '#34D399', '#A78BFA'],
      });
    } catch {
      // Ignore
    }
  };

  const activeMascotObj = ALL_MASCOTS.find((m) => m.id === selectedMascot) || ALL_MASCOTS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="relative w-full max-w-xl bg-white rounded-3xl sm:rounded-4xl p-6 sm:p-8 shadow-2xl border-4 border-amber-300 max-h-[92vh] overflow-y-auto"
      >
        {/* Step Indicator Progress Bar */}
        <div className="flex items-center justify-between gap-2 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                step >= s ? 'bg-gradient-to-r from-sunny to-amber-500' : 'bg-slate-100'
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border-2 border-rose-200 rounded-2xl text-rose-700 text-xs sm:text-sm font-bold flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ================================================================= */}
          {/* STEP 1: LOGIN WITH GOOGLE OR ID & PASSWORD                        */}
          {/* ================================================================= */}
          {step === 1 && (
            <motion.div
              key="step-auth"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-5"
            >
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 rounded-2xl bg-sunny-100 text-amber-700 text-2xl shadow-inner">
                  ⭐
                </div>
                <h2 className="text-2xl sm:text-3xl font-heading font-black text-slate-800">
                  Welcome to SpeakUp Stars!
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                  Log in or create your parent account to save your child's speaking adventures.
                </p>
              </div>

              {/* 1. Continue with Google Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl border-2 border-slate-200 hover:border-sky-400 bg-white hover:bg-sky-50/50 text-slate-700 font-heading font-black text-base transition-all shadow-sm active:scale-98 cursor-pointer"
              >
                {/* Google "G" Logo SVG */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-slate-200" />
                <span className="bg-white px-3 text-xs font-bold text-slate-400 uppercase tracking-wider absolute">
                  or with email & password
                </span>
              </div>

              {/* 2. Email & Password Form */}
              <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Parent Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="parent@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-400 focus:outline-none text-sm font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-400 focus:outline-none text-sm font-medium"
                      required
                    />
                  </div>
                </div>

                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Set 4-Digit Parent PIN (for settings & data controls)
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={parentPin}
                      onChange={(e) => setParentPin(e.target.value)}
                      placeholder="1234"
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-400 focus:outline-none text-sm font-medium tracking-widest"
                      required
                    />
                  </div>
                )}

                <Button
                  variant="sunny"
                  size="md"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 font-heading font-black"
                >
                  {isLoading
                    ? 'Connecting...'
                    : authMode === 'signup'
                    ? 'Create Account & Continue 🚀'
                    : 'Sign In 🔑'}
                </Button>
              </form>

              {/* Mode Toggle & Guest Instant Play */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 pt-1">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
                  className="font-bold text-amber-600 hover:underline"
                >
                  {authMode === 'signup'
                    ? 'Already have an account? Sign In'
                    : 'New here? Create Parent ID'}
                </button>

                <button
                  type="button"
                  onClick={handleGuestQuickStart}
                  className="font-bold text-sky-600 hover:underline flex items-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Instant Guest Play</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* STEP 2: ASK AGE OPTION                                            */}
          {/* ================================================================= */}
          {step === 2 && (
            <motion.div
              key="step-age"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6 text-center"
            >
              <div className="space-y-2">
                {parent?.email && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-800 shadow-xs mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Signed in: <strong>{parent.email}</strong></span>
                  </div>
                )}
                <span className="text-3xl block">🎂</span>
                <h2 className="text-2xl sm:text-3xl font-heading font-black text-slate-800">
                  How Old Is Your Superstar?
                </h2>
                <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto">
                  We adapt topics, speech difficulty, and mascot encouragement to your child's age band!
                </p>
              </div>

              {/* 3 Main Age Bands */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {[
                  {
                    band: '3-5' as AgeGroup,
                    icon: '🎈',
                    label: 'Ages 3–5',
                    sub: 'Little Explorers',
                    desc: 'Short, playful prompts & animal sounds',
                    bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900',
                    defaultAge: 4,
                  },
                  {
                    band: '6-8' as AgeGroup,
                    icon: '🚀',
                    label: 'Ages 6–8',
                    sub: 'Rising Stars',
                    desc: 'Fun storytelling, games & brave speech',
                    bg: 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-900',
                    defaultAge: 7,
                  },
                  {
                    band: '9-12' as AgeGroup,
                    icon: '🌟',
                    label: 'Ages 9–12',
                    sub: 'Master Speakers',
                    desc: 'Creative debates, leadership & eloquence',
                    bg: 'bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-900',
                    defaultAge: 10,
                  },
                ].map((tier) => (
                  <button
                    key={tier.band}
                    type="button"
                    onClick={() => handleAgeSelect(tier.band, tier.defaultAge)}
                    className={`p-4 rounded-3xl border-3 text-left transition-all hover:scale-103 cursor-pointer flex flex-col justify-between h-44 shadow-sm ${tier.bg}`}
                  >
                    <div>
                      <div className="text-3xl mb-1">{tier.icon}</div>
                      <div className="font-heading font-black text-lg">{tier.label}</div>
                      <div className="text-xs font-bold opacity-80">{tier.sub}</div>
                    </div>
                    <p className="text-xs font-medium leading-relaxed opacity-90">{tier.desc}</p>
                  </button>
                ))}
              </div>

              {/* Specific Age Number Selector */}
              <div className="pt-2">
                <p className="text-xs font-bold text-slate-500 mb-2">Or select exact age:</p>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
                    const band: AgeGroup = num <= 5 ? '3-5' : num <= 8 ? '6-8' : '9-12';
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleAgeSelect(band, num)}
                        className={`w-10 h-10 rounded-2xl font-heading font-black text-sm flex items-center justify-center transition-all cursor-pointer border-2 ${
                          exactAge === num
                            ? 'bg-amber-400 border-amber-500 text-amber-950 scale-110 shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* STEP 3: CHOOSE CHARACTER OPTION & NICKNAME                         */}
          {/* ================================================================= */}
          {step === 3 && (
            <motion.div
              key="step-character"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-5"
            >
              <div className="text-center space-y-1">
                <span className="text-3xl">{activeMascotObj.emoji}</span>
                <h2 className="text-2xl sm:text-3xl font-heading font-black text-slate-800">
                  Choose Your Speaking Mascot!
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Your loyal companion will cheer you on and guide your speech journey.
                </p>
              </div>

              {/* Mascot Selector Carousel Grid */}
              <div className="grid grid-cols-5 gap-2">
                {ALL_MASCOTS.map((m) => {
                  const isSelected = selectedMascot === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMascot(m.id)}
                      className={`p-2 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50 shadow-md scale-105'
                          : 'border-slate-200 bg-white hover:bg-slate-50 opacity-80'
                      }`}
                    >
                      <div className="text-2xl sm:text-3xl">{m.emoji}</div>
                      <span className="font-heading font-black text-xs text-slate-800 leading-tight">
                        {m.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Mascot Hero Preview */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-gradient-to-br from-amber-50 via-sunny-50 to-orange-50 p-4 rounded-3xl border-2 border-amber-200">
                <MascotCompanion
                  mascotId={selectedMascot}
                  size="md"
                  showDialogue={true}
                  dialogueText={activeMascotObj.voiceIntro}
                />
                <div className="text-center sm:text-left space-y-1">
                  <div className="font-heading font-black text-lg text-slate-800 flex items-center justify-center sm:justify-start gap-1.5">
                    <span>{activeMascotObj.name} the {activeMascotObj.species}</span>
                  </div>
                  <p className="text-xs font-bold text-amber-700">{activeMascotObj.tagline}</p>
                  <p className="text-xs text-slate-500 font-medium">{activeMascotObj.personality}</p>
                </div>
              </div>

              {/* Child Nickname Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  What should {activeMascotObj.name} call you? (Fun Nickname)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    maxLength={15}
                    value={childNickname}
                    onChange={(e) => setChildNickname(e.target.value)}
                    placeholder="e.g. StarKid, Sunny, Maya"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-amber-400 focus:outline-none text-sm font-bold text-slate-800"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  🔒 Child privacy rule: Please use a fun nickname, not a real last name.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <Button
                  variant="coral"
                  size="md"
                  onClick={handleFinishOnboarding}
                  disabled={isLoading}
                  className="flex-2 font-heading font-black"
                >
                  {isLoading ? 'Creating Adventure...' : 'Start Fresh From Scratch! ⭐'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* STEP 4: FRESH START CELEBRATION                                   */}
          {/* ================================================================= */}
          {step === 4 && (
            <motion.div
              key="step-complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-5 py-4"
            >
              <div className="inline-flex p-4 rounded-full bg-sunny text-4xl shadow-lg animate-bounce">
                🌟
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-heading font-black text-slate-800">
                  You're Ready to Shine, {childNickname}!
                </h2>
                <p className="text-sm text-slate-600 font-medium max-w-sm mx-auto">
                  Your profile has started fresh from scratch: 0 stars, Level 1 Seedling Speaker, and a whole world to explore with {activeMascotObj.name}!
                </p>
              </div>

              {/* Starting Stats Display */}
              <div className="flex items-center justify-center gap-4 py-2">
                <div className="bg-sunny-100 border border-sunny-300 px-4 py-2 rounded-2xl text-amber-900 font-heading font-black text-sm">
                  ⭐ 0 Star Points
                </div>
                <div className="bg-orange-50 border border-orange-200 px-4 py-2 rounded-2xl text-orange-800 font-heading font-black text-sm">
                  🔥 0 Day Streak
                </div>
                <div className="bg-sky-50 border border-sky-200 px-4 py-2 rounded-2xl text-sky-800 font-heading font-black text-sm">
                  🌱 Level 1 Speaker
                </div>
              </div>

              <Button
                variant="sunny"
                size="lg"
                onClick={() => {
                  onClose();
                  if (onCompleted) onCompleted();
                }}
                className="w-full py-4 text-base font-heading font-black shadow-lg"
              >
                Let's Go Speak! 🎙️
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
