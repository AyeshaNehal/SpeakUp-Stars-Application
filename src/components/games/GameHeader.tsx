import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Pause, Play, Sparkles, Zap, Timer } from 'lucide-react';

interface GameHeaderProps {
  title: string;
  timeRemaining: number;
  totalDuration: number;
  starPointsEarned: number;
  isPaused: boolean;
  lowGraphics: boolean;
  onTogglePause: () => void;
  onToggleGraphics: () => void;
  onExitGame?: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  title,
  timeRemaining,
  totalDuration,
  starPointsEarned,
  isPaused,
  lowGraphics,
  onTogglePause,
  onToggleGraphics,
  onExitGame,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onExitGame) {
      onExitGame();
    } else {
      navigate('/games');
    }
  };

  const progressPercent = Math.max(0, Math.min(100, (timeRemaining / totalDuration) * 100));

  return (
    <header className="w-full flex items-center justify-between gap-2 px-3 sm:px-6 py-2.5 sm:py-3 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs z-30 select-none">
      {/* Left: Back to Games */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleBack}
          aria-label="Back to Mini-Games"
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-heading font-bold text-sm transition-all flex items-center gap-1 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Games</span>
        </button>

        <h1 className="font-heading font-black text-base sm:text-lg text-slate-800 tracking-tight flex items-center gap-1.5">
          <span>{title}</span>
        </h1>
      </div>

      {/* Center: 60-second Round Timer */}
      <div className="flex items-center gap-2 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200 shadow-inner">
        <Timer className="w-4 h-4 text-amber-500 animate-pulse" />
        <span className="font-heading font-black text-sm sm:text-base text-slate-800 tabular-nums">
          {timeRemaining}s
        </span>
        <div className="w-16 sm:w-24 h-2 bg-slate-200 rounded-full overflow-hidden hidden xs:block">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Right: Star Points, Graphics Toggle & Pause */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Star Points Badge */}
        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl text-amber-700 font-heading font-black text-xs sm:text-sm">
          <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
          <span>+{starPointsEarned}</span>
        </div>

        {/* Low Graphics Mode Toggle */}
        <button
          onClick={onToggleGraphics}
          title={lowGraphics ? 'Switch to High Graphics' : 'Switch to Low Graphics (Saves battery)'}
          className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
            lowGraphics
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
              : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Zap className={`w-4 h-4 ${lowGraphics ? 'text-emerald-500 fill-emerald-400' : ''}`} />
          <span className="hidden md:inline">{lowGraphics ? 'Low FX' : 'High FX'}</span>
        </button>

        {/* Pause / Resume Button */}
        <button
          onClick={onTogglePause}
          aria-label={isPaused ? 'Resume Game' : 'Pause Game'}
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-heading font-bold text-xs sm:text-sm transition-all flex items-center gap-1 active:scale-95"
        >
          {isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4" />}
          <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
        </button>
      </div>
    </header>
  );
};
