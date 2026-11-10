import React from 'react';
import { Volume2, Flame, Award } from 'lucide-react';

interface VoiceEnergyHUDProps {
  volume: number; // 0 to 1
  isErupting: boolean;
  isSteady: boolean;
  eruptionCount: number;
  steadyTimeSeconds: number;
}

export const VoiceEnergyHUD: React.FC<VoiceEnergyHUDProps> = ({
  volume,
  isErupting,
  isSteady,
  eruptionCount,
  steadyTimeSeconds,
}) => {
  const percentage = Math.min(100, Math.round(volume * 100));

  // Determine active zone
  let statusText = 'Speak into your mic to power the volcano!';
  let statusBadgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
  let barGradient = 'from-slate-300 to-slate-400';

  if (isErupting) {
    statusText = '🔥 MEGA ERUPTION! Incredible Brave Voice!';
    statusBadgeClass = 'bg-orange-500 text-white border-orange-600 animate-bounce';
    barGradient = 'from-amber-400 via-orange-500 to-rose-600';
  } else if (isSteady) {
    statusText = '✨ Steady Voice! Magma is rising nicely!';
    statusBadgeClass = 'bg-emerald-500 text-white border-emerald-600';
    barGradient = 'from-emerald-400 to-teal-500';
  } else if (volume > 0.05) {
    statusText = '🗣️ Louder & clearer—project your voice!';
    statusBadgeClass = 'bg-sky-100 text-sky-800 border-sky-300';
    barGradient = 'from-sky-400 to-blue-500';
  }

  return (
    <div className="w-full max-w-xl mx-auto p-3 sm:p-4 bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-lg select-none">
      {/* Status Tip Pill */}
      <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-heading font-black border transition-all ${statusBadgeClass}`}
        >
          <Volume2 className="w-4 h-4" />
          <span>{statusText}</span>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-2 text-xs font-heading font-bold text-slate-600">
          <span className="flex items-center gap-1 bg-orange-50 text-orange-700 px-2.5 py-1 rounded-xl border border-orange-200">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>{eruptionCount} Eruptions</span>
          </span>
          <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-xl border border-emerald-200">
            <Award className="w-3.5 h-3.5 text-emerald-500" />
            <span>{Math.round(steadyTimeSeconds)}s Steady</span>
          </span>
        </div>
      </div>

      {/* Real-time Meter Bar */}
      <div className="relative w-full h-5 sm:h-6 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
        {/* Steady Zone Target Indicator Marks */}
        <div
          className="absolute inset-y-0 bg-emerald-500/15 border-x-2 border-emerald-500/40 z-10 pointer-events-none"
          style={{ left: '30%', width: '35%' }}
          title="Target Steady Voice Zone"
        />
        <div
          className="absolute inset-y-0 bg-orange-500/15 border-l-2 border-orange-500/40 z-10 pointer-events-none"
          style={{ left: '65%', right: 0 }}
          title="Eruption Peak Zone"
        />

        {/* Active Volume Fill */}
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-75 shadow-xs ${barGradient}`}
          style={{ width: `${Math.max(2, percentage)}%` }}
        />
      </div>

      {/* Meter Zone Labels */}
      <div className="flex justify-between items-center text-[10px] sm:text-xs font-heading font-bold text-slate-600 mt-1.5 px-1">
        <span>🤫 Soft</span>
        <span className="text-emerald-700 font-extrabold">🎯 Steady Zone (30-65%)</span>
        <span className="text-orange-700 font-extrabold">🌋 Eruption! (&gt;65%)</span>
      </div>
    </div>
  );
};
