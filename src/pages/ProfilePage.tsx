import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Flame, Star, Sparkles, Check, RefreshCw, Edit3, Lock, Users } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { AgeGroup } from '../types';
import { useParentAuth } from '../context/ParentAuthContext';
import { rewardsService } from '../services/rewards/rewardsService';
import { MascotCompanion, ALL_MASCOTS, MascotId } from '../components/mascot/MascotCompanion';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const context = useOutletContext<{ ageGroup: AgeGroup; setAgeGroup: (ag: AgeGroup) => void }>();
  const { activeChild, updateChildProfile, resetAllToScratch, childrenList } = useParentAuth();

  const ageGroup = context?.ageGroup || activeChild?.ageBand || '6-8';
  const setAgeGroup = context?.setAgeGroup || (() => {});

  const childId = activeChild?.id || '';
  const kidName = activeChild?.nickname || 'Star Speaker';

  const [currentMascot, setCurrentMascot] = useState<MascotId>(() => {
    return (localStorage.getItem('speakup_selected_mascot') as MascotId) || 'sparky';
  });

  // Edit Modal State (PIN required)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editNickname, setEditNickname] = useState(kidName);
  const [editAgeBand, setEditAgeBand] = useState<AgeGroup>(ageGroup);
  const [pin, setPin] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Real Dynamic Values (0 stars, 0-day streak, Level 1 for new users)
  const starPoints = childId ? rewardsService.getPoints(childId) : 0;
  const streakInfo = childId ? rewardsService.getStreak(childId) : { currentStreak: 0, lastPracticeDate: null, streakFreezesAvailable: 1, freezeUsedToday: false, message: 'Ready for day 1!' };
  const levelInfo = rewardsService.getLevelInfo(starPoints);

  const handleSelectMascot = (id: MascotId) => {
    setCurrentMascot(id);
    localStorage.setItem('speakup_selected_mascot', id);
  };

  const handleOpenEdit = () => {
    setEditNickname(activeChild?.nickname || '');
    setEditAgeBand(activeChild?.ageBand || '6-8');
    setPin('');
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChild?.id) return;
    setEditError(null);
    setIsSaving(true);

    try {
      const res = await updateChildProfile(
        activeChild.id,
        {
          nickname: editNickname.trim(),
          ageBand: editAgeBand,
        },
        pin
      );

      if (res.success) {
        setAgeGroup(editAgeBand);
        setIsEditModalOpen(false);
      } else {
        setEditError(res.message || 'Incorrect PIN or update failed.');
      }
    } catch {
      setEditError('Unable to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToScratch = () => {
    if (window.confirm('Are you sure you want to reset everything to scratch? All points, streaks, and data will reset to 0.')) {
      resetAllToScratch();
      navigate('/login');
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

            {/* Edit Profile Button (Requires PIN) */}
            <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenEdit}
                icon={<Edit3 className="w-4 h-4 text-purple-600" />}
                className="text-xs font-heading font-bold"
              >
                Edit Nickname &amp; Age Band (PIN Required)
              </Button>

              {childrenList.length > 1 && (
                <Button
                  variant="sky"
                  size="sm"
                  onClick={() => navigate('/child-select')}
                  icon={<Users className="w-4 h-4" />}
                  className="text-xs font-heading font-bold"
                >
                  Switch Child Profile
                </Button>
              )}
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

          {/* Reset All To Scratch Button */}
          <Card variant="white" padding="md" className="space-y-3 border-2 border-slate-100 shadow-sm">
            <h3 className="font-heading font-black text-sm text-slate-800">Account Safety &amp; Reset</h3>
            <div>
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
              Difficulty &amp; Age Band
            </h2>
            <div className="space-y-2.5">
              {[
                { group: '3-5' as AgeGroup, title: 'Little Stars (Ages 3-5)', desc: 'Short playful prompts & picture cards', icon: '🎈' },
                { group: '6-8' as AgeGroup, title: 'Brave Explorers (Ages 6-8)', desc: 'Fun questions, 30-second speech goals', icon: '🚀' },
                { group: '9-12' as AgeGroup, title: 'Master Orators (Ages 9-12)', desc: 'Story structure, debates & creativity', icon: '🌟' },
              ].map((tier) => (
                <button
                  key={tier.group}
                  onClick={handleOpenEdit}
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

      {/* Edit Child Profile Modal (PIN Required) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Child Profile (Parent Gate)"
        icon={<Lock className="w-6 h-6 text-purple-600" />}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <p className="text-xs text-slate-500">
            Enter your Parent PIN to update nickname or change the age band. Changing age band updates content and recomputes age-adjusted speech norms.
          </p>

          {editError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
              {editError}
            </div>
          )}

          <div>
            <label className="block text-xs font-heading font-bold text-slate-700 uppercase mb-1">
              Child Nickname
            </label>
            <input
              type="text"
              required
              maxLength={15}
              value={editNickname}
              onChange={(e) => setEditNickname(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-purple-400 focus:outline-none text-slate-800 text-sm font-bold min-h-[48px]"
            />
          </div>

          <div>
            <label className="block text-xs font-heading font-bold text-slate-700 uppercase mb-1">
              Age Band
            </label>
            <select
              value={editAgeBand}
              onChange={(e) => setEditAgeBand(e.target.value as AgeGroup)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-purple-400 focus:outline-none text-slate-800 text-sm font-bold min-h-[48px] bg-white"
            >
              <option value="3-5">Little Explorers (Ages 3-5)</option>
              <option value="6-8">Brave Adventurers (Ages 6-8)</option>
              <option value="9-12">Star Champions (Ages 9-12)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-heading font-bold text-slate-700 uppercase mb-1">
              Parent PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              required
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 4-6 digit PIN"
              className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-purple-400 focus:outline-none text-center text-lg font-mono tracking-widest min-h-[48px]"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="purple"
              size="md"
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
