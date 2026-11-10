/**
 * CHILD SAFETY & DESIGN NOTE:
 * - Animated Brave Voice / Speaking Skills Meter
 * - Visualizes growth through non-discouraging levels:
 *   Seedling 🌱 -> Sprout 🌿 -> Flower 🌸 -> Tree 🌳 -> Star ⭐
 * - Explicitly labeled as a speaking skills meter, not a test of inner confidence.
 * - Always celebratory and encouraging.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { GrowthLevelInfo, GROWTH_LEVELS } from '../../services/ai/aiFeedbackService';

interface BraveVoiceMeterProps {
  score: number; // 0-100
  growthLevel: GrowthLevelInfo;
}

export const BraveVoiceMeter: React.FC<BraveVoiceMeterProps> = ({ score, growthLevel }) => {
  const levels = [
    GROWTH_LEVELS.Seedling,
    GROWTH_LEVELS.Sprout,
    GROWTH_LEVELS.Flower,
    GROWTH_LEVELS.Tree,
    GROWTH_LEVELS.Star,
  ];

  // Visual percentage for filling track
  const progressPercent = Math.max(10, Math.min(100, score));

  return (
    <div className="bg-gradient-to-b from-sunny-50/60 to-amber-50/40 p-5 sm:p-6 rounded-4xl border-3 border-amber-200/80 shadow-md space-y-4">
      {/* Header & Explicit Child-Friendly Label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-xl bg-sunny-200 text-amber-900 shadow-2xs">
              <Sparkles className="w-4 h-4 text-amber-700 animate-spin" />
            </span>
            <h3 className="font-heading font-black text-lg sm:text-xl text-slate-800 tracking-tight">
              Brave Voice Speaking Skills Meter
            </h3>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
            Measures your speaking practice growth & effort — not your inner feelings!
          </p>
        </div>

        {/* Current Growth Badge */}
        <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 text-xs sm:text-sm font-heading font-black shadow-xs ${growthLevel.colorClass}`}>
          <span className="text-base">{growthLevel.emoji}</span>
          <span>{growthLevel.title}</span>
        </div>
      </div>

      {/* Main Animated Star / Rocket Progress Track */}
      <div className="relative pt-4 pb-2">
        {/* Background Track */}
        <div className="relative h-6 sm:h-7 w-full bg-slate-200/80 rounded-full overflow-hidden p-1 shadow-inner border border-slate-300">
          {/* Animated Glowing Fill Bar */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-teal-400 via-sunny-400 to-amber-400 shadow-lg relative"
          >
            {/* Shimmer light effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
          </motion.div>
        </div>

        {/* Milestones / Growth Icons along the track */}
        <div className="flex items-center justify-between px-1 mt-3">
          {levels.map((lvl) => {
            const isCurrent = lvl.level === growthLevel.level;
            const isAchieved = score >= lvl.minScore;

            return (
              <div key={lvl.level} className="flex flex-col items-center space-y-1">
                <motion.div
                  animate={isCurrent ? { scale: [1, 1.25, 1], rotate: [0, 6, -6, 0] } : { scale: 1 }}
                  transition={{ repeat: isCurrent ? Infinity : 0, duration: 2.2 }}
                  className={`
                    w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-lg sm:text-xl shadow-md border-2 transition-all
                    ${
                      isCurrent
                        ? 'bg-sunny-300 border-amber-500 ring-4 ring-sunny-200 shadow-lg'
                        : isAchieved
                        ? 'bg-white border-teal-300 text-teal-800'
                        : 'bg-slate-100 border-slate-300 opacity-60'
                    }
                  `}
                >
                  {lvl.emoji}
                </motion.div>
                <span
                  className={`text-[10px] sm:text-[11px] font-heading font-bold ${
                    isCurrent ? 'text-amber-950 font-black' : isAchieved ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {lvl.level}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cheerful Description */}
      <div className="p-3 bg-white/90 rounded-2xl border border-amber-200 text-center text-xs sm:text-sm text-slate-700 font-medium shadow-2xs">
        {growthLevel.description}
      </div>
    </div>
  );
};
