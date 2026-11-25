/**
 * SPEAKUP STARS: VOICE & SPEECH MINI-GAMES ARCADE
 * 5 Active Mini-Games:
 * 1. Volume Volcano (Typing Blast & Voice Eruption)
 * 2. Echo Explorer (Crystal Echo Caves rhythm & tongue twisters)
 * 3. Feelings Catch (Emotion expression theater)
 * 4. Story Dice (3-dice storytelling adventure)
 * 5. Pace Racer (Conversational speed turbo track)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MINI_GAMES_CATALOG, MiniGameConfig } from '../../services/games/types';
import { rewardsService } from '../../services/rewards/rewardsService';
import { useParentAuth } from '../../context/ParentAuthContext';
import { MascotCompanion, ALL_MASCOTS, MascotId } from '../../components/mascot/MascotCompanion';
import { Play, Sparkles, ShieldCheck, Flame, Star } from 'lucide-react';

export const GamesHubPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeChild } = useParentAuth();

  const childId = activeChild?.id || '';
  const currentPoints = childId ? rewardsService.getPoints(childId) : 0;
  const streakInfo = childId ? rewardsService.getStreak(childId) : { currentStreak: 0, lastPracticeDate: null, streakFreezesAvailable: 1, freezeUsedToday: false, message: 'Ready for day 1!' };

  const currentMascot = (localStorage.getItem('speakup_selected_mascot') as MascotId) || 'sparky';
  const mascotObj = ALL_MASCOTS.find((m) => m.id === currentMascot) || ALL_MASCOTS[0];

  const gameRoutes: Record<string, string> = {
    volume_volcano: '/games/volcano',
    echo_explorer: '/games/echo',
    feelings_catch: '/games/feelings',
    story_dice: '/games/dice',
    pace_racer: '/games/racer',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 select-none">
      {/* Top Banner: Joyful Arcade Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 p-5 sm:p-6 text-white shadow-lg border-2 border-amber-300">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="text-center md:text-left space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-heading font-black">
              <Sparkles className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
              <span>Voice &amp; Speaking Mini-Games Arcade</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black tracking-tight drop-shadow-xs">
              Play &amp; Speak Up! 🎮
            </h1>
            <p className="text-xs sm:text-sm text-amber-100 font-medium leading-relaxed">
              Blast volcanoes with typing &amp; voice, race cars at perfect speech pacing, explore crystal caves, and weave stories with {mascotObj.name}!
            </p>

            <div className="inline-flex items-center gap-1.5 text-[11px] text-white/90 bg-black/15 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>100% on-device speech &amp; typing. Audio is NEVER saved or sent away.</span>
            </div>
          </div>

          {/* Right Mascot & Points Card */}
          <div className="flex flex-col items-center gap-1.5 bg-white/15 backdrop-blur-md p-3 rounded-2xl border border-white/20 min-w-[170px]">
            <MascotCompanion mascotId={mascotObj.id} size="sm" />
            <div className="flex items-center gap-2 text-white font-heading font-black text-xs">
              <span className="flex items-center gap-1 bg-amber-600/40 px-2 py-0.5 rounded-lg">
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                <span>{currentPoints} Stars</span>
              </span>
              <span className="flex items-center gap-1 bg-orange-600/40 px-2 py-0.5 rounded-lg">
                <Flame className="w-3.5 h-3.5 text-orange-200" />
                <span>{streakInfo.currentStreak}d Streak</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Game: Volume Volcano */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-heading font-black text-slate-800 flex items-center gap-2">
            <span>🌋 Featured Game: Volume Volcano</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              Typing &amp; Voice Blast!
            </span>
          </h2>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-white border-2 border-orange-300 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row items-center gap-5 p-4 sm:p-5">
          <div className="w-full md:w-44 h-36 rounded-xl bg-gradient-to-b from-sky-100 to-orange-100 flex items-center justify-center relative overflow-hidden border border-orange-200 shrink-0">
            <span className="text-5xl group-hover:scale-105 transition-transform duration-300">
              🌋
            </span>
            <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-white/90 backdrop-blur-xs rounded-lg py-0.5 px-2 text-center text-[11px] font-heading font-bold text-orange-800">
              ⌨️ Typing Test + 🎙️ Voice
            </div>
          </div>

          <div className="flex-1 space-y-2 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[11px] font-heading font-black">
                60-Second Round ⏱️
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-heading font-black">
                Earn Up to +50 Stars ⭐
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-heading font-black text-slate-800">
              Volume Volcano
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xl">
              Type brave words or speak into your mic! Watch the molten magma pressure build up until the volcano explodes with fiery fountains, gems, and star confetti!
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1 pt-0.5">
              {['Typing Courage', 'Voice Projection', 'Word Speed'].map((skill, idx) => (
                <span key={idx} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                  ✓ {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="w-full md:w-auto shrink-0">
            <button
              onClick={() => navigate('/games/volcano')}
              className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-heading font-black text-sm shadow-md transition-all transform hover:scale-102 active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Play Volcano! 🌋</span>
            </button>
          </div>
        </div>
      </section>

      {/* Grid of All 4 Remaining Mini-Games */}
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-heading font-black text-slate-800 flex items-center gap-2">
          <span>More Speech Games</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
            All 5 Games Playable!
          </span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {MINI_GAMES_CATALOG.filter((g) => g.id !== 'volume_volcano').map((game: MiniGameConfig) => {
            const targetRoute = gameRoutes[game.id] || '/games';
            return (
              <div
                key={game.id}
                className="relative rounded-2xl bg-white border border-slate-200 hover:border-amber-400 p-4 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-50 to-sky-50 flex items-center justify-center text-2xl mb-2.5 border border-slate-200">
                    {game.icon}
                  </div>
                  <h4 className="font-heading font-black text-base text-slate-800 mb-1">
                    {game.title}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mb-2.5">
                    {game.description}
                  </p>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-700">
                    <span>⭐ +25 Points</span>
                    <span>⏱️ 60s Round</span>
                  </div>

                  <button
                    onClick={() => navigate(targetRoute)}
                    className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-sunny to-amber-400 hover:from-amber-300 hover:to-amber-500 text-amber-950 font-heading font-black text-xs shadow-xs transition-all hover:scale-102 active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-amber-950" />
                    <span>Play Now!</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
