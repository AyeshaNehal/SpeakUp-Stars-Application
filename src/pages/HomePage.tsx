import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Mic, Trophy, Heart, ArrowRight, UserPlus, Gamepad2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { ProgressBar } from '../components/common/ProgressBar';
import { Modal } from '../components/common/Modal';
import { MascotCompanion, ALL_MASCOTS, MascotId } from '../components/mascot/MascotCompanion';
import { ChildOnboardingModal } from '../components/onboarding/ChildOnboardingModal';
import { UnifiedAuthOnboardingModal } from '../components/auth/UnifiedAuthOnboardingModal';
import { useParentAuth } from '../context/ParentAuthContext';
import { rewardsService } from '../services/rewards/rewardsService';
import { parentDashboardService } from '../services/dashboard/parentDashboardService';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { activeChild, parent } = useParentAuth();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isChildOnboardingOpen, setIsChildOnboardingOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentBravery, setCurrentBravery] = useState<number>(3);

  const currentMascotId = (localStorage.getItem('speakup_selected_mascot') as MascotId) || 'sparky';
  const mascotObj = ALL_MASCOTS.find((m) => m.id === currentMascotId) || ALL_MASCOTS[0];
  const kidName = activeChild?.nickname || 'Superstar';

  const childId = activeChild?.id || '';
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const allSessions = childId ? parentDashboardService.getSessions(childId, parent?.id) : [];
  const todaySessions = allSessions.filter((s) => s.createdAt.startsWith(todayDateStr));
  const speechesCompleted = todaySessions.length;
  const dailyGoal = 3;
  const goalPercent = Math.min(100, Math.round((speechesCompleted / dailyGoal) * 100));

  const allBadges = childId ? rewardsService.getBadges(childId) : [];
  const unlockedBadges = allBadges.filter((b) => b.unlocked);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-4xl sm:rounded-5xl bg-gradient-to-br from-sunny-200 via-sunny to-amber-300 p-6 sm:p-8 lg:p-10 border-3 border-amber-300 shadow-md">
        {/* Decorative background bubbles */}
        <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/20 blur-xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-10 w-36 h-36 rounded-full bg-amber-400/30 blur-lg pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-xs px-3.5 py-1.5 rounded-full text-amber-900 font-heading font-bold text-xs sm:text-sm shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
              <span>Daily Speaking Adventure</span>
            </div>

            <h1 className="text-fluid-hero font-heading font-black text-amber-950 tracking-tight">
              Ready to find your <span className="underline decoration-wavy decoration-coral">voice</span>, {kidName}?
            </h1>

            <p className="text-fluid-subtitle text-amber-900/90 font-medium max-w-xl">
              {mascotObj.tagline} Choose your adventure, play mini-games, and collect shiny star points!
            </p>

            {/* Quick Action Buttons with 56px touch target */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="coral"
                size="lg"
                icon={<Mic className="w-6 h-6" />}
                onClick={() => navigate('/record')}
              >
                Speak Now!
              </Button>

              <Button
                variant="sky"
                size="lg"
                icon={<Sparkles className="w-6 h-6" />}
                onClick={() => navigate('/wheel')}
              >
                Spin Topic Wheel
              </Button>

              <Button
                variant="sunny"
                size="md"
                icon={<Gamepad2 className="w-5 h-5" />}
                onClick={() => navigate('/games')}
              >
                Play Mini-Games 🎮
              </Button>

              <Button
                variant="mint"
                size="md"
                icon={<UserPlus className="w-5 h-5" />}
                onClick={() => setIsAuthModalOpen(true)}
              >
                Login / Choose Mascot ✨
              </Button>
            </div>
          </div>

          {/* Right Mascot Hero Visual: Chosen Speaking Companion */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center lg:items-end">
            <div className="relative flex flex-col items-center">
              <MascotCompanion
                mascotId={mascotObj.id}
                braveryLevel={currentBravery}
                size="lg"
                showDialogue={true}
                dialogueText={`Hi ${kidName}! ${mascotObj.voiceIntro}`}
                onClick={() => setIsAuthModalOpen(true)}
                className="cursor-pointer"
              />
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="mt-2 bg-white/95 hover:bg-white text-slate-800 px-4 py-2 rounded-full text-xs font-heading font-black shadow-md border-2 border-amber-300 transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5"
              >
                <span>{mascotObj.emoji}</span>
                <span>Change Mascot ({mascotObj.name})</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout: Responsive 2-column layout on laptop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Main Section: Daily Mission & Quick Topics */}
        <section className="lg:col-span-8 space-y-6">
          {/* Daily Goal Card */}
          <Card variant="white" padding="md" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-mint-100 text-mint-700 flex items-center justify-center text-xl shadow-xs">
                  {speechesCompleted > 0 ? '🎯' : '👋'}
                </div>
                <div>
                  <h2 className="font-heading font-bold text-xl text-slate-800">
                    Today's Star Mission
                  </h2>
                  <p className="text-sm text-slate-500 font-semibold">
                    {speechesCompleted === 0
                      ? "Let's do your first speech! (0 of 3 speeches completed)"
                      : `${speechesCompleted} of ${dailyGoal} speeches completed`}
                  </p>
                </div>
              </div>
              <span className="text-xs sm:text-sm font-heading font-bold text-emerald-700 bg-mint-100 px-3 py-1 rounded-full">
                +15 Bonus Stars ⭐
              </span>
            </div>

            <ProgressBar
              value={goalPercent}
              variant="mint"
              size="md"
              showPercentage
              label={`Speech Goal: ${goalPercent}% Complete`}
            />
          </Card>

          {/* Featured Speaking Categories Grid */}
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="font-heading font-black text-xl text-slate-800">
                Popular Adventures
              </h3>
              <button
                onClick={() => navigate('/wheel')}
                className="text-sky-600 hover:text-sky-700 font-heading font-bold text-sm flex items-center gap-1 min-h-[44px] min-w-[44px]"
              >
                See All <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card
                variant="sky"
                isInteractive
                padding="md"
                onClick={() => navigate('/record')}
                className="flex items-start gap-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-sky-200 text-3xl flex items-center justify-center flex-shrink-0 shadow-xs">
                  🚀
                </div>
                <div>
                  <h4 className="font-heading font-bold text-lg text-slate-800">
                    Space Explorers
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Describe your journey to Mars and what aliens look like!
                  </p>
                  <span className="inline-block mt-3 text-xs font-bold text-sky-700 bg-white/80 px-2.5 py-1 rounded-lg">
                    Level: All Ages
                  </span>
                </div>
              </Card>

              <Card
                variant="coral"
                isInteractive
                padding="md"
                onClick={() => navigate('/record')}
                className="flex items-start gap-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-coral-200 text-3xl flex items-center justify-center flex-shrink-0 shadow-xs">
                  🦕
                </div>
                <div>
                  <h4 className="font-heading font-bold text-lg text-slate-800">
                    Dino Kingdom
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    If you had a pet T-Rex, what games would you play?
                  </p>
                  <span className="inline-block mt-3 text-xs font-bold text-coral-700 bg-white/80 px-2.5 py-1 rounded-lg">
                    Level: Fun & Fast
                  </span>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Right / Side Panel: Streaks, Star Badges & Parent Tip */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Rewards Preview Card */}
          <Card variant="purple" padding="md" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-black text-lg text-purple-950 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-purple-600" />
                Badge Trophy Room
              </h3>
              <button
                onClick={() => navigate('/rewards')}
                className="text-xs font-bold text-purple-700 hover:underline min-h-[36px]"
              >
                View
              </button>
            </div>

            {unlockedBadges.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-center px-2">
                <span className="text-3xl mb-1">👋</span>
                <p className="text-xs font-heading font-bold text-purple-900">
                  Let's do your first speech!
                </p>
                <p className="text-[11px] text-purple-700/80">
                  Complete speeches to unlock shiny badges.
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-around py-2">
                {unlockedBadges.slice(0, 3).map((b) => (
                  <div key={b.key} className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center text-2xl border-2 border-purple-200">
                      {b.icon}
                    </div>
                    <span className="text-xs font-heading font-bold text-purple-950 mt-1.5">{b.name}</span>
                  </div>
                ))}
              </div>
            )}

            <ProgressBar
              value={unlockedBadges.length}
              max={allBadges.length || 6}
              variant="purple"
              size="sm"
              label={`${unlockedBadges.length} / ${allBadges.length || 6} Badges Unlocked`}
            />
          </Card>

          {/* Quick Speech Tip Card */}
          <Card variant="sunny" padding="md" className="space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-heading font-bold">
              <Heart className="w-5 h-5 text-coral fill-coral" />
              <span>Friendly Tip for Today</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-950 font-medium">
              "Take a deep breath like blowing out birthday candles before you speak. You've got this!"
            </p>
          </Card>
        </aside>
      </div>

      {/* Component Showcase Modal */}
      <Modal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        title="SpeakUp Stars Design System"
        icon={<Sparkles className="w-6 h-6 text-sunny-500" />}
        footer={
          <Button variant="sunny" size="md" onClick={() => setIsDemoModalOpen(false)}>
            Awesome, Let's Play!
          </Button>
        }
      >
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">
            This modal demonstrates the responsive kid-friendly modal component with high contrast,
            accessible close targets (56px+), and bubbly bouncy styling!
          </p>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h4 className="font-heading font-bold text-slate-800 text-sm">
              Design System Highlights:
            </h4>
            <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
              <li>Heading font: <strong>Fredoka</strong></li>
              <li>Body font: <strong>Nunito</strong></li>
              <li>Mobile-first layout (360px+ to 1280px+)</li>
              <li>Big tactile 3D buttons with 56px touch targets</li>
              <li>Sunny yellow, sky blue, coral, mint, and purple palette</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* Unified Auth, Age & Character Onboarding Modal */}
      <UnifiedAuthOnboardingModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Child Onboarding & Daily Courage Check-in Flow */}
      <ChildOnboardingModal
        isOpen={isChildOnboardingOpen}
        childId={activeChild?.id || ''}
        parentId={parent?.id || ''}
        initialNickname={activeChild?.nickname || ''}
        ageBand={activeChild?.ageBand || '6-8'}
        onClose={() => setIsChildOnboardingOpen(false)}
        onCompleted={(res) => {
          setIsChildOnboardingOpen(false);
          setCurrentBravery(res.braveryLevel);
        }}
      />
    </div>
  );
};
