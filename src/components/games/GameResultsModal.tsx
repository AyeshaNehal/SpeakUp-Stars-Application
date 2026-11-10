import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameResults } from '../../services/games/types';
import { SparkyMascot } from '../mascot/SparkyMascot';
import { Sparkles, Trophy, RotateCcw, Compass, CheckCircle2 } from 'lucide-react';

interface GameResultsModalProps {
  isOpen: boolean;
  results: GameResults | null;
  onPlayAgain: () => void;
  onBackToGames: () => void;
}

export const GameResultsModal: React.FC<GameResultsModalProps> = ({
  isOpen,
  results,
  onPlayAgain,
  onBackToGames,
}) => {
  useEffect(() => {
    if (isOpen && results) {
      // Fire celebratory confetti
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#ec4899', '#38bdf8', '#10b981', '#f97316'],
      });
    }
  }, [isOpen, results]);

  if (!isOpen || !results) return null;

  const { metrics, mascotPraise, encouragingFeedback, growthLevel } = results;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-amber-300 text-center select-none overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Decorative Sunburst Background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Mascot Joyful Header */}
        <div className="mx-auto my-2 w-28 h-28 flex items-center justify-center">
          <SparkyMascot theme="sunny" size="md" isWaving />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-heading font-black mb-2">
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          <span>Brave Speaking Round Complete!</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-heading font-black text-slate-800 mb-1">
          Hooray! Fantastic Energy! 🌋
        </h2>

        {/* Star Points Award Banner */}
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 shadow-inner flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-white flex items-center justify-center text-2xl shadow-md">
            ⭐
          </div>
          <div className="text-left">
            <div className="text-xs font-heading font-bold text-slate-500 uppercase tracking-wider">
              Stars Earned
            </div>
            <div className="text-2xl font-heading font-black text-amber-700 flex items-center gap-1">
              <span>+{metrics.starPointsEarned} Star Points!</span>
              <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />
            </div>
          </div>
        </div>

        {/* Key Stats Pill Row */}
        <div className="grid grid-cols-2 gap-2 my-3 text-left">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-500 font-heading font-bold">Steady Voice</span>
            <div className="text-lg font-heading font-black text-emerald-700">
              {Math.round(metrics.steadyVoiceTimeSeconds)}s / 60s
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-500 font-heading font-bold">Growth Stage</span>
            <div className="text-lg font-heading font-black text-purple-700">
              {growthLevel} 🌱
            </div>
          </div>
        </div>

        {/* Mascot Kind Feedback Card */}
        <div className="my-4 p-4 rounded-2xl bg-sky-50/80 border border-sky-200 text-left">
          <p className="text-sm font-heading font-bold text-sky-900 leading-snug mb-2">
            &quot;{mascotPraise}&quot;
          </p>
          <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
            {encouragingFeedback.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 mt-5">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-heading font-black text-base shadow-lg shadow-orange-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Play Again</span>
          </button>

          <button
            onClick={onBackToGames}
            className="py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-heading font-bold text-sm transition-all flex items-center justify-center gap-1.5"
          >
            <Compass className="w-4 h-4" />
            <span>All Games</span>
          </button>
        </div>
      </div>
    </div>
  );
};
