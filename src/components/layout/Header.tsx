import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Flame, Volume2, VolumeX, ShieldCheck, Sliders, RefreshCw } from 'lucide-react';
import { AgeGroup } from '../../types';
import { AccessibilityModal } from '../common/AccessibilityModal';
import { UnifiedAuthOnboardingModal } from '../auth/UnifiedAuthOnboardingModal';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useI18n } from '../../context/I18nContext';
import { useParentAuth } from '../../context/ParentAuthContext';
import { rewardsService } from '../../services/rewards/rewardsService';
import { ALL_MASCOTS, MascotId } from '../mascot/MascotCompanion';

interface HeaderProps {
  currentAgeGroup?: AgeGroup;
  onAgeGroupChange?: (group: AgeGroup) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentAgeGroup = '6-8',
  onAgeGroupChange,
}) => {
  const { soundEffectsEnabled, setSoundEffectsEnabled } = useAccessibility();
  const { languageMeta } = useI18n();
  const { activeChild, resetAllToScratch } = useParentAuth();
  const [showA11yModal, setShowA11yModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Dynamic user data from real store only
  const childId = activeChild?.id || '';
  const childName = activeChild?.nickname || 'Star Speaker';
  const points = childId ? rewardsService.getPoints(childId) : 0;
  const streak = childId ? rewardsService.getStreak(childId).currentStreak : 0;

  const currentMascotId = (localStorage.getItem('speakup_selected_mascot') as MascotId) || 'sparky';
  const mascotObj = ALL_MASCOTS.find((m) => m.id === currentMascotId) || ALL_MASCOTS[0];

  const toggleSound = () => {
    setSoundEffectsEnabled(!soundEffectsEnabled);
  };

  const handleResetScratch = () => {
    if (window.confirm('Reset everything to scratch? All stars, streaks, and user state will start fresh from 0.')) {
      resetAllToScratch();
      setShowAuthModal(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b-2 border-slate-100 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Left: Mobile Brand OR Laptop Greeting */}
          <div className="flex items-center gap-3">
            {/* Mobile brand (hidden on desktop since sidebar shows it) */}
            <NavLink
              to="/"
              className="md:hidden flex items-center gap-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sunny-400 rounded-xl"
            >
              <div className="w-10 h-10 rounded-xl bg-sunny flex items-center justify-center text-xl shadow-xs">
                ⭐
              </div>
              <div>
                <span className="font-heading font-black text-lg text-slate-800 leading-tight">
                  SpeakUp <span className="text-amber-500">Stars</span>
                </span>
              </div>
            </NavLink>

            {/* Desktop Greeting */}
            <div className="hidden md:flex items-center gap-2 text-slate-700">
              <span className="text-2xl">{mascotObj.emoji}</span>
              <span className="font-heading font-bold text-lg lg:text-xl text-slate-800">
                Hi, <span className="text-amber-600 font-black">{childName}</span>!
              </span>
            </div>
          </div>

          {/* Right side: Age Switcher, Star Counter, Streak, A11y & Sound FX */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Age Tier Selector (tablet & laptop) */}
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-heading font-bold">
              {(['3-5', '6-8', '9-12'] as AgeGroup[]).map((group) => (
                <button
                  key={group}
                  onClick={() => onAgeGroupChange && onAgeGroupChange(group)}
                  className={`
                    px-3 py-1.5 rounded-xl transition-all min-h-[36px]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400
                    ${
                      currentAgeGroup === group
                        ? 'bg-sky-400 text-white shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }
                  `}
                >
                  Ages {group}
                </button>
              ))}
            </div>

            {/* Daily Streak Pill */}
            <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-2xl text-orange-700 font-heading font-bold text-sm shadow-xs">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-bounce" />
              <span>{streak} Days</span>
            </div>

            {/* Star Bank Pill */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1.5 bg-sunny-100 border-2 border-sunny-300 px-3.5 py-1.5 rounded-2xl text-amber-900 font-heading font-black text-sm sm:text-base shadow-xs"
            >
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 fill-amber-400 animate-star-twinkle" />
              <span>{points}</span>
            </motion.div>

            {/* Switch User / Mascot Button */}
            <button
              onClick={() => setShowAuthModal(true)}
              aria-label="Switch User or Mascot"
              title="Switch User, Age, or Mascot"
              className="
                min-h-[44px] px-3 flex items-center justify-center rounded-2xl
                bg-amber-50 hover:bg-amber-100 text-amber-800 border-2 border-amber-300
                font-heading font-black text-xs gap-1.5 transition-all shadow-xs cursor-pointer
              "
            >
              <span>{mascotObj.emoji}</span>
              <span className="hidden lg:inline">{mascotObj.name}</span>
            </button>

            {/* Reset From Scratch Button */}
            <button
              onClick={handleResetScratch}
              aria-label="Reset To Scratch"
              title="Reset everything to scratch (0 points, 0 streak)"
              className="
                min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl
                bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200
                transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 cursor-pointer
              "
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Accessibility Quick-Control Button */}
            <button
              onClick={() => setShowA11yModal(true)}
              aria-label="Accessibility & Polish Settings"
              title="Accessibility & Language Settings"
              className="
                min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl
                bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200
                transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-400
                gap-1 px-2.5 cursor-pointer
              "
            >
              <Sliders className="w-4 h-4" />
              <span className="text-xs font-bold hidden xl:inline">{languageMeta.flag}</span>
            </button>

            {/* Sound FX Toggle (min 44px on mobile, 48px on tablet) */}
            <button
              onClick={toggleSound}
              aria-label={soundEffectsEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
              className="
                min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl
                bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200
                transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-400 cursor-pointer
              "
            >
              {soundEffectsEnabled ? (
                <Volume2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {/* Mobile Parent Shortcut */}
            <NavLink
              to="/parent"
              aria-label="Parent Dashboard"
              className="
                md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl
                bg-purple-100 text-purple-700 border border-purple-200
                focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-400
              "
            >
              <ShieldCheck className="w-5 h-5" />
            </NavLink>
          </div>
        </div>
      </header>

      {/* Accessibility & Polish Modal */}
      <AccessibilityModal
        isOpen={showA11yModal}
        onClose={() => setShowA11yModal(false)}
      />

      {/* Unified Auth & Character Choice Onboarding Modal */}
      <UnifiedAuthOnboardingModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};
