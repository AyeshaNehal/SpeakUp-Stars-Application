import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Volume2,
  VolumeX,
  ArrowRight,
  ArrowLeft,
  Clock,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ProgressBar } from '../../components/common/ProgressBar';
import { SparkyMascot, SparkyTheme } from '../../components/mascot/SparkyMascot';
import { useParentAuth } from '../../context/ParentAuthContext';
import { speechHelper } from '../../services/speech/tts';
import { AgeGroup } from '../../types';

// PII & full name detector for child nickname
function validateChildNickname(name: string): { isValid: boolean; errorMessage?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, errorMessage: 'Please enter a nickname for your child.' };
  }
  if (trimmed.length < 2) {
    return { isValid: false, errorMessage: 'Nickname should be at least 2 characters long.' };
  }
  if (trimmed.length > 15) {
    return { isValid: false, errorMessage: 'Nickname must be 15 characters or less.' };
  }
  if (/@|\.com|\.org|\.net|\.io/i.test(trimmed)) {
    return { isValid: false, errorMessage: 'Emails or domain names are not allowed as nicknames.' };
  }
  if (/\d{4,}/.test(trimmed) || /\+?\d{2,}/.test(trimmed)) {
    return { isValid: false, errorMessage: 'Phone numbers are not allowed as nicknames.' };
  }
  // If user entered two or more words (e.g. John Smith), reject full names
  const words = trimmed.split(/\s+/);
  if (words.length > 2) {
    return { isValid: false, errorMessage: 'Please use a single fun nickname, not a full name.' };
  }
  return { isValid: true };
}

const INTEREST_OPTIONS = [
  { id: 'animals', label: 'Animals 🐶', color: 'bg-amber-100 border-amber-300 text-amber-900' },
  { id: 'space', label: 'Space 🚀', color: 'bg-sky-100 border-sky-300 text-sky-900' },
  { id: 'dinosaurs', label: 'Dinosaurs 🦕', color: 'bg-emerald-100 border-emerald-300 text-emerald-900' },
  { id: 'food', label: 'Yummy Food 🍕', color: 'bg-rose-100 border-rose-300 text-rose-900' },
  { id: 'superheroes', label: 'Superheroes 🦸', color: 'bg-purple-100 border-purple-300 text-purple-900' },
  { id: 'sports', label: 'Sports ⚽', color: 'bg-orange-100 border-orange-300 text-orange-900' },
  { id: 'music', label: 'Music 🎵', color: 'bg-pink-100 border-pink-300 text-pink-900' },
  { id: 'art', label: 'Art & Colors 🎨', color: 'bg-indigo-100 border-indigo-300 text-indigo-900' },
];

const COMFORT_LEVELS = [
  { id: 'shy', emoji: '🙈', label: 'Shy', desc: 'Speaking feels scary or big. We suggest 30s gentle mode.' },
  { id: 'nervous', emoji: '😬', label: 'A little nervous', desc: 'A bit fluttery inside, but wants to try.' },
  { id: 'okay', emoji: '🙂', label: 'Okay', desc: 'Ready for normal adventures and fun topics.' },
  { id: 'brave', emoji: '🦁', label: 'Super brave', desc: 'Loves talking and ready for storytelling!' },
] as const;

const THEMES: { id: SparkyTheme; label: string; color: string }[] = [
  { id: 'sunny', label: 'Sparky Classic (Sunny)', color: 'bg-amber-400' },
  { id: 'mint', label: 'Mint Explorer', color: 'bg-emerald-400' },
  { id: 'sky', label: 'Sky Blue Wonder', color: 'bg-sky-400' },
  { id: 'purple', label: 'Purple Starlight', color: 'bg-purple-400' },
  { id: 'coral', label: 'Coral Flame', color: 'bg-rose-400' },
];

const TIME_LIMITS = [
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min (Recommended)' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
  { value: 0, label: 'Unlimited' },
];

export const ChildWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    parent,
    accountState,
    saveChildWizardStep,
    completeChildWizard,
    refreshAccountState,
  } = useParentAuth();

  // Child data being set up
  const existingChild = accountState?.activeChild || accountState?.children[0];

  const [currentStep, setCurrentStep] = useState<number>(() => existingChild?.onboardingStep || 1);
  const [nickname, setNickname] = useState(existingChild?.nickname || '');
  const [exactAge, setExactAge] = useState<number | null>(existingChild?.exactAge || null);
  const [avatarTheme, setAvatarTheme] = useState<SparkyTheme>(
    (existingChild?.avatarId as SparkyTheme) || 'sunny'
  );
  const [interests, setInterests] = useState<string[]>(existingChild?.interests || []);
  const [comfortLevel, setComfortLevel] = useState<'shy' | 'nervous' | 'okay' | 'brave'>(
    existingChild?.comfortLevel || 'okay'
  );

  // Parent Options (Step 6)
  const [dailyTimeLimit, setDailyTimeLimit] = useState<number>(
    existingChild?.dailyTimeLimitMinutes ?? 15
  );
  const [gentleMode, setGentleMode] = useState<boolean>(Boolean(existingChild?.gentleMode));
  const [faceAnalysis, setFaceAnalysis] = useState<boolean>(Boolean(existingChild?.faceAnalysis));

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Compute age band
  const ageBand: AgeGroup =
    exactAge !== null
      ? exactAge <= 5
        ? '3-5'
        : exactAge <= 8
        ? '6-8'
        : '9-12'
      : (existingChild?.ageBand || '6-8');

  // Read aloud prompt for current step
  const getStepPrompt = (step: number): string => {
    switch (step) {
      case 1:
        return "Hi there! What fun nickname should Sparky call you?";
      case 2:
        return "How old are you? Tap your age number!";
      case 3:
        return "Pick your favorite color for Sparky!";
      case 4:
        return "What kind of things do you love talking about? Pick your favorites or tap skip!";
      case 5:
        return "How do you feel when speaking in front of others?";
      case 6:
        return "Parent settings: Set daily time limits and camera options.";
      case 7:
        return `Welcome to SpeakUp Stars, ${nickname || 'friend'}! We are going to have so much fun together!`;
      default:
        return "Let's set up your profile!";
    }
  };

  const handleReadAloud = (text?: string) => {
    const toSpeak = text || getStepPrompt(currentStep);
    setIsSpeaking(true);
    speechHelper.speak(toSpeak, () => setIsSpeaking(false));
  };

  // Auto-save progress after each step
  const persistStep = async (nextStep: number) => {
    if (!parent) return;
    setIsSaving(true);
    try {
      await saveChildWizardStep({
        id: existingChild?.id,
        nickname: nickname.trim(),
        exactAge: exactAge || undefined,
        ageBand,
        avatarId: avatarTheme,
        interests,
        comfortLevel,
        dailyTimeLimitMinutes: dailyTimeLimit,
        gentleMode,
        faceAnalysis,
        onboardingStep: nextStep,
      });
    } catch {
      // Ignore background save errors
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    setErrorMessage(null);

    // Validation for step 1
    if (currentStep === 1) {
      const val = validateChildNickname(nickname);
      if (!val.isValid) {
        setErrorMessage(val.errorMessage || 'Please check nickname.');
        return;
      }
    }

    // Validation for step 2
    if (currentStep === 2) {
      if (exactAge === null) {
        setErrorMessage('Please select your child’s age (3 to 12).');
        return;
      }
    }

    // If comfort level is shy, automatically suggest gentle mode
    if (currentStep === 5 && (comfortLevel === 'shy' || comfortLevel === 'nervous')) {
      setGentleMode(true);
    }

    if (currentStep < 7) {
      const next = currentStep + 1;
      await persistStep(next);
      setCurrentStep(next);
      handleReadAloud(getStepPrompt(next));
    } else {
      // Step 7: Finalize
      setIsSaving(true);
      try {
        if (existingChild?.id) {
          await completeChildWizard(existingChild.id);
        } else {
          await saveChildWizardStep({
            nickname: nickname.trim(),
            exactAge: exactAge || undefined,
            ageBand,
            avatarId: avatarTheme,
            interests,
            comfortLevel,
            dailyTimeLimitMinutes: dailyTimeLimit,
            gentleMode,
            faceAnalysis,
            onboardingCompleted: true,
            onboardingStep: 7,
          });
        }
        await refreshAccountState();
        navigate('/');
      } catch {
        setErrorMessage('Could not finalize profile.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      persistStep(prev);
      handleReadAloud(getStepPrompt(prev));
    } else {
      navigate('/onboarding/pin');
    }
  };

  const toggleInterest = (id: string) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const progressPercent = Math.round((currentStep / 7) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sunny-50 via-sky-50 to-purple-50 flex items-center justify-center p-3 sm:p-6 py-6 sm:py-10">
      <div className="w-full max-w-4xl space-y-4">
        {/* Navigation & Progress Header */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            icon={<ArrowLeft className="w-4 h-4" />}
            className="text-xs font-heading font-bold min-h-[44px]"
          >
            Back
          </Button>

          <div className="flex-1 max-w-md">
            <ProgressBar
              value={currentStep}
              max={7}
              variant="sunny"
              size="sm"
              label={`Step ${currentStep} of 7 (${progressPercent}%)`}
            />
          </div>

          <button
            type="button"
            onClick={() => handleReadAloud()}
            aria-label="Sparky read aloud"
            className="flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 px-3.5 py-2 rounded-2xl text-xs font-heading font-black shadow-xs transition-colors min-h-[44px]"
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-4 h-4 text-amber-700 animate-spin" />
                <span className="hidden sm:inline">Speaking...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-amber-700" />
                <span className="hidden sm:inline">Read Aloud</span>
              </>
            )}
          </button>
        </div>

        {/* Responsive Grid: Laptop (Sparky Left, Question Right), Phone (Stacked) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Mascot Stage */}
          <div className="lg:col-span-5 bg-white/80 backdrop-blur-md rounded-4xl border-3 border-amber-300 p-6 flex flex-col items-center justify-center text-center shadow-md">
            <SparkyMascot
              size="lg"
              isWaving={currentStep === 1 || currentStep === 7}
              braveryLevel={
                comfortLevel === 'shy' ? 1 : comfortLevel === 'nervous' ? 2 : comfortLevel === 'okay' ? 3 : 5
              }
              theme={avatarTheme}
            />

            <div className="mt-4 bg-amber-50 border-2 border-amber-200 px-4 py-2.5 rounded-2xl text-amber-950 font-heading font-bold text-sm shadow-xs max-w-xs">
              "{getStepPrompt(currentStep)}"
            </div>

            {nickname && (
              <div className="mt-3 inline-flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-amber-200 text-xs font-heading font-black text-amber-900">
                <span>⭐</span>
                <span>{nickname}</span>
                {exactAge && <span className="text-slate-400 font-normal">({ageBand})</span>}
              </div>
            )}
          </div>

          {/* Right Column: Interactive Step Question */}
          <div className="lg:col-span-7 flex flex-col">
            <Card variant="white" padding="lg" className="border-3 border-amber-300 shadow-xl flex-1 flex flex-col justify-between space-y-6">
              {errorMessage && (
                <div
                  role="alert"
                  className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-rose-800 text-xs font-semibold"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* STEP 1: NICKNAME */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-heading font-black tracking-wider uppercase bg-sky-100 text-sky-800 px-2.5 py-1 rounded-lg">
                      Step 1 • Kid Nickname
                    </span>
                    <h2 className="font-heading font-black text-2xl text-slate-800 mt-2">
                      Pick a fun nickname!
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Pick a playful name your child loves. No real full names or last names allowed.
                    </p>
                  </div>

                  <div>
                    <input
                      id="child-nickname-input"
                      type="text"
                      maxLength={15}
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="e.g. StarKid, Sunny, Rocket, Maya"
                      className="w-full px-5 py-4 rounded-3xl border-3 border-sky-300 font-heading font-black text-xl sm:text-2xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-sky-200 min-h-[56px]"
                      autoFocus
                    />
                    <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-500 leading-relaxed">
                      💡 <strong>Hint:</strong> Pick a fun nickname, not your last name! We automatically reject full names, emails, and phone numbers for privacy protection.
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: AGE */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-heading font-black tracking-wider uppercase bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg">
                      Step 2 • Age &amp; Speaking Level
                    </span>
                    <h2 className="font-heading font-black text-2xl text-slate-800 mt-2">
                      How old is {nickname || 'your child'}?
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Choose age 3 to 12. We only store the age band, never birthdates!
                    </p>
                  </div>

                  {/* Big Number Buttons 3 to 12 */}
                  <div className="grid grid-cols-5 gap-2.5">
                    {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
                      const isSelected = exactAge === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          data-testid={`age-${num}`}
                          onClick={() => setExactAge(num)}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl font-heading font-black text-xl sm:text-2xl min-h-[56px] transition-all border-3 ${
                            isSelected
                              ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-md scale-105 ring-4 ring-amber-200'
                              : 'bg-slate-50 hover:bg-amber-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span>{num}</span>
                        </button>
                      );
                    })}
                  </div>

                  {exactAge !== null && (
                    <div className="p-3.5 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-heading font-bold text-emerald-900">
                      <span>Assigned Age Band:</span>
                      <span className="bg-emerald-200 text-emerald-950 px-3 py-1 rounded-xl">
                        {exactAge <= 5
                          ? 'Little Explorers (Ages 3-5)'
                          : exactAge <= 8
                          ? 'Brave Adventurers (Ages 6-8)'
                          : 'Star Champions (Ages 9-12)'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: AVATAR / SPARKY COLOR */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-heading font-black tracking-wider uppercase bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg">
                      Step 3 • Companion Sparky Style
                    </span>
                    <h2 className="font-heading font-black text-2xl text-slate-800 mt-2">
                      Choose Sparky's Color!
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Pick your child's favorite look. Sparky adapts instantly.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {THEMES.map((theme) => {
                      const isSelected = avatarTheme === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setAvatarTheme(theme.id)}
                          className={`flex items-center gap-3 p-3.5 rounded-2xl font-heading font-bold text-sm text-left transition-all border-3 min-h-[56px] ${
                            isSelected
                              ? 'bg-amber-50 text-amber-950 border-amber-400 shadow-md ring-4 ring-amber-200'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span className={`w-8 h-8 rounded-full ${theme.color} border-2 border-white shadow-xs flex-shrink-0`} />
                          <span className="flex-1">{theme.label}</span>
                          {isSelected && <Check className="w-5 h-5 text-amber-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 4: INTERESTS (Optional multi-select) */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-heading font-black tracking-wider uppercase bg-purple-100 text-purple-800 px-2.5 py-1 rounded-lg">
                        Step 4 • Interests (Optional)
                      </span>
                      <button
                        type="button"
                        onClick={handleNext}
                        className="text-xs font-heading font-bold text-slate-400 hover:text-slate-600 underline"
                      >
                        Skip for now
                      </button>
                    </div>
                    <h2 className="font-heading font-black text-2xl text-slate-800 mt-2">
                      What topics does {nickname || 'your child'} love?
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      We use these topics to weight the spinning Topic Wheel toward fun ideas they enjoy!
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {INTEREST_OPTIONS.map((item) => {
                      const isSelected = interests.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleInterest(item.id)}
                          className={`px-4 py-2.5 rounded-2xl font-heading font-bold text-xs sm:text-sm border-2 transition-all min-h-[48px] flex items-center gap-2 ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-700 shadow-md scale-105'
                              : `${item.color} hover:scale-102`
                          }`}
                        >
                          <span>{item.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 5: COMFORT LEVEL */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-heading font-black tracking-wider uppercase bg-rose-100 text-rose-800 px-2.5 py-1 rounded-lg">
                      Step 5 • Speaking Comfort
                    </span>
                    <h2 className="font-heading font-black text-2xl text-slate-800 mt-2">
                      How does {nickname || 'your child'} feel about speaking?
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Choose an emoji. For shy kids, we automatically suggest 30-second gentle mode.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {COMFORT_LEVELS.map((lvl) => {
                      const isSelected = comfortLevel === lvl.id;
                      return (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => setComfortLevel(lvl.id)}
                          className={`p-4 rounded-2xl border-3 text-left transition-all min-h-[56px] ${
                            isSelected
                              ? 'bg-rose-50 border-rose-400 shadow-md ring-4 ring-rose-200'
                              : 'bg-white hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{lvl.emoji}</span>
                            <div>
                              <p className="font-heading font-black text-sm text-slate-800">{lvl.label}</p>
                              <p className="text-[11px] text-slate-500">{lvl.desc}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 6: PARENT OPTIONS */}
              {currentStep === 6 && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-heading font-black tracking-wider uppercase bg-sky-100 text-sky-800 px-2.5 py-1 rounded-lg">
                      Step 6 • Parent Settings
                    </span>
                    <h2 className="font-heading font-black text-2xl text-slate-800 mt-2">
                      Daily Time Limits &amp; Practice Modes
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Configure safety limits for {nickname || 'your child'}. You can adjust these anytime using your PIN.
                    </p>
                  </div>

                  {/* Daily Time Limit */}
                  <div className="space-y-2">
                    <label className="block text-xs font-heading font-bold text-slate-700 uppercase">
                      <Clock className="w-4 h-4 inline mr-1 text-slate-500" /> Daily Practice Time Limit
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {TIME_LIMITS.map((t) => {
                        const isSelected = dailyTimeLimit === t.value;
                        return (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => setDailyTimeLimit(t.value)}
                            className={`py-2 px-1 text-center rounded-xl text-xs font-heading font-bold border-2 transition-all min-h-[44px] ${
                              isSelected
                                ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {t.label.split(' ')[0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Gentle Mode Toggle */}
                  <label className="flex items-start gap-3 p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={gentleMode}
                      onChange={(e) => setGentleMode(e.target.checked)}
                      className="w-5 h-5 mt-0.5 text-sky-600 rounded focus:ring-sky-400 cursor-pointer"
                    />
                    <div>
                      <p className="font-heading font-bold text-xs sm:text-sm text-slate-800">
                        Gentle Practice Mode (Recommended for Shy Speakers)
                      </p>
                      <p className="text-xs text-slate-500">
                        Keeps speeches short (30 seconds) and disables countdown buzzers for pressure-free practice.
                      </p>
                    </div>
                  </label>

                  {/* Face Analysis Toggle */}
                  <label className="flex items-start gap-3 p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={faceAnalysis}
                      onChange={(e) => setFaceAnalysis(e.target.checked)}
                      className="w-5 h-5 mt-0.5 text-sky-600 rounded focus:ring-sky-400 cursor-pointer"
                    />
                    <div>
                      <p className="font-heading font-bold text-xs sm:text-sm text-slate-800">
                        On-Device Eye Contact &amp; Smile Encouragement
                      </p>
                      <p className="text-xs text-slate-500">
                        Calculates smile and eye contact ratio in memory at 2fps. Zero images or video frames are ever recorded or uploaded.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* STEP 7: WELCOME BY SPARKY */}
              {currentStep === 7 && (
                <div className="space-y-5 text-center sm:text-left">
                  <div>
                    <span className="text-[10px] font-heading font-black tracking-wider uppercase bg-sunny text-amber-950 px-2.5 py-1 rounded-lg">
                      Step 7 • Ready to Blast Off!
                    </span>
                    <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-800 mt-2">
                      Welcome, {nickname}! 🌟
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                      Sparky says: "You're all set! I'm so excited to hear your brave voice!"
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-sunny-100 via-amber-50 to-mint-50 rounded-3xl border-2 border-amber-300 space-y-2 text-xs sm:text-sm text-amber-950">
                    <div className="flex items-center justify-between font-heading font-bold">
                      <span>Nickname:</span>
                      <span className="text-amber-800 font-black">{nickname}</span>
                    </div>
                    <div className="flex items-center justify-between font-heading font-bold">
                      <span>Age Band:</span>
                      <span className="text-amber-800 font-black">Ages {ageBand}</span>
                    </div>
                    <div className="flex items-center justify-between font-heading font-bold">
                      <span>Daily Limit:</span>
                      <span className="text-amber-800 font-black">{dailyTimeLimit ? `${dailyTimeLimit} min` : 'Unlimited'}</span>
                    </div>
                    <div className="flex items-center justify-between font-heading font-bold">
                      <span>Gentle Mode:</span>
                      <span className="text-amber-800 font-black">{gentleMode ? 'Enabled' : 'Standard'}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 font-medium">
                    ⭐ Starting fresh from 0 stars and Level 1. Complete your first speech to earn shiny badges!
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="md"
                  data-testid="wizard-back-btn"
                  onClick={handleBack}
                  className="min-h-[56px] text-xs sm:text-sm"
                >
                  Back
                </Button>

                <Button
                  variant="sunny"
                  size="lg"
                  data-testid="wizard-continue-btn"
                  onClick={handleNext}
                  disabled={isSaving}
                  className="flex-1 justify-center min-h-[56px] text-sm sm:text-base font-heading font-black"
                >
                  {isSaving ? (
                    'Saving Progress...'
                  ) : currentStep === 7 ? (
                    <>Start Speaking Adventure! 🚀</>
                  ) : (
                    <>Continue <ArrowRight className="w-5 h-5" /></>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
