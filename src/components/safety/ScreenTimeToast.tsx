import React from 'react';
import { useI18n } from '../../context/I18nContext';
import { SparkyMascot } from '../mascot/SparkyMascot';
import { Moon, Clock, Heart } from 'lucide-react';

interface ScreenTimeToastProps {
  isVisible: boolean;
  onRestVoice: () => void;
  onSnooze: () => void;
}

export const ScreenTimeToast: React.FC<ScreenTimeToastProps> = ({
  isVisible,
  onRestVoice,
  onSnooze,
}) => {
  const { t } = useI18n();

  if (!isVisible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-24 md:bottom-8 right-4 left-4 md:left-auto md:w-96 z-40 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-3xl p-4 shadow-2xl border-2 border-indigo-400/40 animate-fade-in select-none"
    >
      <div className="flex items-start gap-3">
        {/* Tiny mascot */}
        <div className="w-12 h-12 rounded-2xl bg-indigo-800/80 flex items-center justify-center shrink-0 border border-indigo-400/30">
          <SparkyMascot theme="cosmic" size="sm" />
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-1.5 text-amber-300 font-heading font-black text-xs uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5 fill-pink-400 text-pink-400" />
            <span>Voice Wellness Check</span>
          </div>

          <p className="text-xs sm:text-sm text-indigo-100 font-medium leading-snug">
            {t('screentime.reminder')}
          </p>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={onRestVoice}
              className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 font-heading font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>{t('screentime.rest')}</span>
            </button>

            <button
              onClick={onSnooze}
              className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-indigo-200 text-xs font-semibold transition-all flex items-center gap-1"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{t('screentime.continue')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
