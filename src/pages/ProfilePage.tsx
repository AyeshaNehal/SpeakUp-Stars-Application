import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Flame, Star, Sparkles, Check, RefreshCw, LogIn } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { AgeGroup } from '../types';
import { useParentAuth } from '../context/ParentAuthContext';
import { rewardsService } from '../services/rewards/rewardsService';
import { MascotCompanion, ALL_MASCOTS, MascotId } from '../components/mascot/MascotCompanion';
import { UnifiedAuthOnboardingModal } from '../components/auth/UnifiedAuthOnboardingModal';

export const ProfilePage: React.FC = () => {
  const context = useOutletContext<{ ageGroup: AgeGroup; setAgeGroup: (ag: AgeGroup) => void }>();
  const { activeChild, resetAllToScratch } = useParentAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const ageGroup = context?.ageGroup || activeChild?.ageBand || '6-8';
  const setAgeGroup = context?.setAgeGroup || (() => {});

  const childId = activeChild?.id || 'default_child';
  const kidName = activeChild?.nickname || localStorage.getItem('speakup_child_nickname') || 'Star Speaker';

  const [currentMascot, setCurrentMascot] = useState<MascotId>(() => {
    return (localStorage.getItem('speakup_selected_mascot') as MascotId) || 'sparky';
  });

  // Real Dynamic Values
  const starPoints = rewardsService.getPoints(childId);
  const streakInfo = rewardsService.getStreak(childId);
  const levelInfo = rewardsService.getLevelInfo(starPoints);

  const handleSelectMascot = (id: MascotId) => {
    setCurrentMascot(id);
    localStorage.setItem('speakup_selected_mascot', id);
  };

  const handleResetToScratch = () => {
    if (window.confirm('Are you sure you want to reset everything to scratch? All points, streaks, and data will reset to 0.')) {
      resetAllToScratch();
      setShowAuthModal(true);
    }
  };

  const mascotObj = ALL_MASCOTS.find((m) => m.id === currentMascot) || ALL_MASCOTS[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <Card variant="white" padding="lg" className="border-3 border-amber-200 shadow-md">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Active Mascot Hero Portrait */}
          <div className="relative">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-4xl bg-gradient-to-tr from-amber-100 via-sunny-100 to-orange-100 flex items-center justify-center shadow-md border-4 border-amber-300">
              <MascotCompanion mascotId={currentMascot} size="md" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-coral text-white font-heading font-black text-xs px-3 py-1 rounded-full shadow-sm border-2 border-white">
              LVL {levelInfo.level}
            </div>
          </div>

          {/* Name & Kid Info */}
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-fluid-title font-heading font-black text-slate-800">
                {kidName} the Star Speaker
              </h1>
              <span className="bg-sky-100 text-sky-800 text-xs font-heading font-bold px-3 py-1 rounded-full">
                Ages {ageGroup} Tier
              </span>
              <span className="bg-amber-100 text-amber-900 text-xs font-heading font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <span>{mascotObj.emoji}</span>
                <span>{mascotObj.name} Companion</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Companion: <strong>{mascotObj.species}</strong>. {mascotObj.tagline}
            </p>

            {/* Dynamic Stats Pills (Starting at 0 from scratch!) */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
              <div className="flex items-center gap-1.5 bg-sunny-50 border border-sunny-200 px-3.5 py-1.5 rounded-2xl text-amber-900 font-heading font-black text-xs sm:text-sm shadow-xs">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>{starPoints} Stars</span>
              </div>
              <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-3.5 py-1.5 rounded-2xl text-orange-800 font-heading font-black text-xs sm:text-sm shadow-xs">
                <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
                <span>{streakInfo.currentStreak} Days Streak</span>
              </div>
              <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 px-3.5 py-1.5 rounded-2xl text-purple-800 font-heading font-bold text-xs sm:text-sm shadow-xs">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>Level {levelInfo.level}: {levelInfo.title}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Grid: Mascot Selector & Age Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Choose Your Speaking Mascot */}
        <div className="md:col-span-7 space-y-4">
          <Card variant="white" padding="md" className="space-y-4 border-2 border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-black text-lg text-slate-800">
                Choose Your Speaking Mascot
              </h2>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                {ALL_MASCOTS.length} Available
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALL_MASCOTS.map((m) => {
                const isSelected = currentMascot === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMascot(m.id)}
                    className={`
                      p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3
                      focus-visible:ring-4 focus-visible:ring-sunny-400 focus-visible:outline-none
                      ${
                        isSelected
                          ? 'bg-amber-50 border-amber-400 shadow-md scale-102'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }
                    `}
                  >
                    <div className="text-3xl p-2 bg-white rounded-xl shadow-xs border border-slate-100">
                      {m.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-heading font-black text-sm text-slate-800 flex items-center gap-1">
                        <span>{m.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 stroke-[3]" />}
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold truncate">{m.species}</p>
                      <p className="text-[10px] text-amber-700 font-medium truncate">{m.personality}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Account Controls & Reset From Scratch */}
          <Card variant="white" padding="md" className="space-y-3 border-2 border-slate-100 shadow-sm">
            <h3 className="font-heading font-black text-sm text-slate-800">Account & Profile Actions</h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="sunny"
                size="sm"
                icon={<LogIn className="w-4 h-4" />}
                onClick={() => setShowAuthModal(true)}
              >
                Login with Google / Password
              </Button>

              <Button
                variant="outline"
                size="sm"
                icon={<RefreshCw className="w-4 h-4 text-rose-500" />}
                onClick={handleResetToScratch}
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Reset All To Scratch (0 Stars)
              </Button>
            </div>
          </Card>
        </div>

        {/* Age Tier Switcher */}
        <div className="md:col-span-5 space-y-4">
          <Card variant="white" padding="md" className="space-y-4 border-2 border-slate-100 shadow-sm">
            <h2 className="font-heading font-black text-lg text-slate-800">
              Difficulty & Age Band
            </h2>
            <div className="space-y-2.5">
              {[
                { group: '3-5' as AgeGroup, title: 'Little Stars (Ages 3-5)', desc: 'Short playful prompts & picture cards', icon: '🎈' },
                { group: '6-8' as AgeGroup, title: 'Brave Explorers (Ages 6-8)', desc: 'Fun questions, 30-second speech goals', icon: '🚀' },
                { group: '9-12' as AgeGroup, title: 'Master Orators (Ages 9-12)', desc: 'Story structure, debates & creativity', icon: '🌟' },
              ].map((tier) => (
                <button
                  key={tier.group}
                  onClick={() => setAgeGroup(tier.group)}
                  className={`
                    w-full text-left p-3.5 rounded-2xl border-2 transition-all min-h-[56px]
                    flex items-start justify-between gap-3 cursor-pointer
                    focus-visible:ring-4 focus-visible:ring-sky-400 focus-visible:outline-none
                    ${
                      ageGroup === tier.group
                        ? 'bg-sky-50 border-sky-400 text-sky-950 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }
                  `}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-xl">{tier.icon}</span>
                    <div>
                      <p className="font-heading font-bold text-sm">{tier.title}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{tier.desc}</p>
                    </div>
                  </div>
                  {ageGroup === tier.group && (
                    <div className="w-6 h-6 rounded-full bg-sky text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Unified Auth Onboarding Modal */}
      <UnifiedAuthOnboardingModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};
