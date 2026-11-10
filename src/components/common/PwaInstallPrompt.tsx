import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferredPrompt || isDismissed) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <div
      role="region"
      aria-label="Install App"
      className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-40 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-xl border-2 border-white/50 flex items-center justify-between gap-3 animate-fade-in select-none"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-white/30 flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5 text-slate-900" />
        </div>
        <div>
          <div className="font-heading font-black text-xs sm:text-sm leading-tight">
            Install SpeakUp Stars! 🌟
          </div>
          <div className="text-[11px] font-medium text-slate-800 leading-tight">
            Practice offline anytime from your home screen.
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleInstall}
          className="px-3 py-1.5 rounded-xl bg-slate-950 text-white font-heading font-bold text-xs hover:bg-slate-800 transition-all flex items-center gap-1 active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          aria-label="Dismiss Install Prompt"
          className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-slate-900 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
