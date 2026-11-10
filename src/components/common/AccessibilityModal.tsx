import React, { useEffect } from 'react';
import { useAccessibility, TextSizeOption, ColorBlindOption, SpeechSpeedOption } from '../../context/AccessibilityContext';
import { useI18n } from '../../context/I18nContext';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../../services/i18n/translations';
import {
  Eye,
  Type,
  Volume2,
  Sparkles,
  Zap,
  Globe,
  X,
  RotateCcw,
  Sliders,
  Check,
  Keyboard,
  Moon,
} from 'lucide-react';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({ isOpen, onClose }) => {
  const a11y = useAccessibility();
  const { language, setLanguage, t, isRTL } = useI18n();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="a11y-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in select-none"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border-4 border-sky-300 max-h-[90vh] overflow-y-auto text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-700">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 id="a11y-modal-title" className="text-xl sm:text-2xl font-heading font-black text-slate-800">
                {t('a11y.title')}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Customize fonts, contrast, languages, and sound comfort.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Accessibility Settings"
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-6">
          {/* 1. Language & RTL Selector */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-heading font-bold text-slate-700">
              <Globe className="w-4 h-4 text-sky-600" />
              <span>Language &amp; Region / زبان اور علاقہ</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code as SupportedLanguage)}
                    className={`py-2 px-3 rounded-2xl border-2 text-xs font-heading font-bold transition-all flex flex-col items-center gap-1 ${
                      isSelected
                        ? 'bg-sky-500 border-sky-600 text-white shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-base">{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                    {lang.dir === 'rtl' && (
                      <span className="text-[9px] opacity-75 font-normal">(RTL)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Visual & Reading Accommodations */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-heading font-bold text-slate-700">
              <Eye className="w-4 h-4 text-amber-600" />
              <span>Visual &amp; Reading Helpers</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Dyslexia Font Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <div className="font-heading font-bold text-xs sm:text-sm text-slate-800">
                    {t('a11y.dyslexia')}
                  </div>
                  <div className="text-[11px] text-slate-500">{t('a11y.dyslexiaDesc')}</div>
                </div>
                <button
                  role="switch"
                  aria-checked={a11y.dyslexiaFont}
                  onClick={() => a11y.setDyslexiaFont(!a11y.dyslexiaFont)}
                  className={`w-12 h-7 rounded-full transition-colors relative p-1 shrink-0 ${
                    a11y.dyslexiaFont ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      a11y.dyslexiaFont ? (isRTL ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* High Contrast Mode */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <div className="font-heading font-bold text-xs sm:text-sm text-slate-800">
                    {t('a11y.contrast')}
                  </div>
                  <div className="text-[11px] text-slate-500">{t('a11y.contrastDesc')}</div>
                </div>
                <button
                  role="switch"
                  aria-checked={a11y.highContrast}
                  onClick={() => a11y.setHighContrast(!a11y.highContrast)}
                  className={`w-12 h-7 rounded-full transition-colors relative p-1 shrink-0 ${
                    a11y.highContrast ? 'bg-slate-900' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      a11y.highContrast ? (isRTL ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Text Scale Buttons */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-slate-600" />
                <span className="font-heading font-bold text-xs sm:text-sm text-slate-800">
                  {t('a11y.textScale')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {(['normal', 'large', 'extra-large'] as TextSizeOption[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => a11y.setTextSize(size)}
                    className={`px-3 py-1.5 rounded-xl border font-heading font-bold text-xs transition-all ${
                      a11y.textSize === size
                        ? 'bg-sky-500 text-white border-sky-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {size === 'normal' ? 'Normal A' : size === 'large' ? 'Large A+' : 'Giant A++'}
                  </button>
                ))}
              </div>
            </div>

            {/* Color-Blind Mode Selector */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-xs sm:text-sm text-slate-800">
                  {t('a11y.colorblind')}
                </span>
                <span className="text-[11px] text-slate-500">Accessible distinction palettes</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(['none', 'protanopia', 'deuteranopia', 'tritanopia'] as ColorBlindOption[]).map((cb) => (
                  <button
                    key={cb}
                    onClick={() => a11y.setColorBlindMode(cb)}
                    className={`py-1.5 px-2 rounded-xl border text-xs font-heading font-bold transition-all capitalize ${
                      a11y.colorBlindMode === cb
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cb === 'none' ? 'Standard' : cb}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Audio & Speech Controls */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-heading font-bold text-slate-700">
              <Volume2 className="w-4 h-4 text-emerald-600" />
              <span>Sound, Speech &amp; Motion</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Calm Sound Mode */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <div className="font-heading font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-purple-600" />
                    <span>{t('a11y.calmMode')}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">{t('a11y.calmModeDesc')}</div>
                </div>
                <button
                  role="switch"
                  aria-checked={a11y.calmMode}
                  onClick={() => a11y.setCalmMode(!a11y.calmMode)}
                  className={`w-12 h-7 rounded-full transition-colors relative p-1 shrink-0 ${
                    a11y.calmMode ? 'bg-purple-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      a11y.calmMode ? (isRTL ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Reduced Motion Mode */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <div className="font-heading font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span>{t('a11y.reducedMotion')}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Stops fast spinning and bouncing.</div>
                </div>
                <button
                  role="switch"
                  aria-checked={a11y.reducedMotion}
                  onClick={() => a11y.setReducedMotion(!a11y.reducedMotion)}
                  className={`w-12 h-7 rounded-full transition-colors relative p-1 shrink-0 ${
                    a11y.reducedMotion ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      a11y.reducedMotion ? (isRTL ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Speech Rate Controls */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span className="font-heading font-bold text-xs sm:text-sm text-slate-800">
                  {t('a11y.speechSpeed')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {([0.75, 1.0, 1.25] as SpeechSpeedOption[]).map((speed) => (
                  <button
                    key={speed}
                    onClick={() => a11y.setSpeechSpeed(speed)}
                    className={`px-3 py-1.5 rounded-xl border font-heading font-bold text-xs transition-all ${
                      a11y.speechSpeed === speed
                        ? 'bg-emerald-500 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {speed === 0.75 ? '0.75x Slow 🐢' : speed === 1.0 ? '1.0x Normal 🌟' : '1.25x Fast 🚀'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Keyboard Navigation Shortcuts Guide */}
          <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200 text-left space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-heading font-black text-sky-900">
              <Keyboard className="w-4 h-4 text-sky-700" />
              <span>Full Keyboard Navigation Shortcuts</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 font-medium">
              <div>
                <kbd className="px-1.5 py-0.5 bg-white rounded-md border border-slate-300 font-mono text-[10px]">
                  Space
                </kbd>{' '}
                or{' '}
                <kbd className="px-1.5 py-0.5 bg-white rounded-md border border-slate-300 font-mono text-[10px]">
                  Enter
                </kbd>{' '}
                : Spin wheel &amp; select buttons
              </div>
              <div>
                <kbd className="px-1.5 py-0.5 bg-white rounded-md border border-slate-300 font-mono text-[10px]">
                  Tab
                </kbd>{' '}
                /{' '}
                <kbd className="px-1.5 py-0.5 bg-white rounded-md border border-slate-300 font-mono text-[10px]">
                  Shift+Tab
                </kbd>{' '}
                : Move focus through controls
              </div>
              <div>
                <kbd className="px-1.5 py-0.5 bg-white rounded-md border border-slate-300 font-mono text-[10px]">
                  Esc
                </kbd>{' '}
                : Close any modal / popup immediately
              </div>
              <div className="flex items-center gap-1 text-emerald-700 font-bold">
                <Check className="w-3.5 h-3.5" />
                <span>WCAG 2.1 AA Accessibility Compliant</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <button
            onClick={a11y.resetToDefaults}
            className="px-3.5 py-2 rounded-xl text-xs font-heading font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-heading font-black text-sm shadow-md transition-all active:scale-95"
          >
            {t('btn.done')}
          </button>
        </div>
      </div>
    </div>
  );
};
