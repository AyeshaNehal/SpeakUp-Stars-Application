/**
 * CHILD PRIVACY NOTE (Rule 1, Rule 2):
 * - Mascot "Thinking" Analysis Loading Screen
 * - Purely client-side animation while local speech analysis runs.
 * - Displays Sparky pondering and highlighting privacy-safe on-device processing.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { SparkyMascot, SparkyTheme } from '../mascot/SparkyMascot';

export interface AnalysisLoadingScreenProps {
  theme?: SparkyTheme;
  onAnalysisComplete?: () => void;
  className?: string;
}

const THINKING_STEPS = [
  { icon: '🎧', title: 'Sparky is listening closely...', subtitle: 'Reviewing your speech words' },
  { icon: '🛡️', title: 'Running child privacy protection...', subtitle: 'Keeping personal details safe & on-device' },
  { icon: '🌟', title: 'Measuring clarity and courage...', subtitle: 'Finding all your proud moments' },
  { icon: '🏆', title: 'Polishing your reward stars...', subtitle: 'Almost ready to shine!' },
];

export const AnalysisLoadingScreen: React.FC<AnalysisLoadingScreenProps> = ({
  theme = 'sunny',
  className = '',
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < THINKING_STEPS.length - 1 ? prev + 1 : prev));
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const currentStep = THINKING_STEPS[currentStepIndex];

  return (
    <div className={`min-h-[60vh] flex flex-col items-center justify-center p-6 text-center select-none ${className}`}>
      {/* Animated Thinking Mascot Container */}
      <div className="relative mb-6">
        {/* Floating Sparkle Rings */}
        <motion.div
          className="absolute -inset-6 rounded-full bg-sunny-200/50 blur-xl"
          animate={{ scale: [0.9, 1.2, 0.9], opacity: [0.5, 0.9, 0.5] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        />

        {/* Thought Bubbles / Idea Spark */}
        <motion.div
          className="absolute -top-6 -right-4 w-12 h-12 rounded-full bg-white border-2 border-sunny shadow-lg flex items-center justify-center text-2xl z-20"
          animate={{ y: [0, -8, 0], rotate: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          💡
        </motion.div>

        <motion.div
          className="absolute -top-1 right-8 w-5 h-5 rounded-full bg-white border border-sunny shadow-xs z-10"
          animate={{ scale: [0.8, 1.2, 0.8] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        />

        <SparkyMascot
          theme={theme}
          size="lg"
          braveryLevel={3}
          className="animate-pulse"
        />
      </div>

      {/* Thinking Status Pill */}
      <motion.div
        key={currentStepIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="max-w-md w-full bg-white rounded-3xl p-6 border-3 border-sunny-200 shadow-xl space-y-3"
      >
        <div className="flex items-center justify-center gap-2 text-2xl">
          <span>{currentStep.icon}</span>
          <span className="font-heading font-black text-slate-800 text-lg sm:text-xl">
            {currentStep.title}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          {currentStep.subtitle}
        </p>

        {/* Step Progress Indicators */}
        <div className="flex items-center justify-center gap-2 pt-2">
          {THINKING_STEPS.map((_, idx) => (
            <motion.div
              key={idx}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                idx === currentStepIndex
                  ? 'w-8 bg-coral'
                  : idx < currentStepIndex
                  ? 'w-2.5 bg-mint'
                  : 'w-2.5 bg-slate-200'
              }`}
            />
          ))}
        </div>
      </motion.div>

      {/* On-Device Safety Badge */}
      <div className="inline-flex items-center gap-2 mt-6 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-heading font-bold border border-emerald-200">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>100% On-Device Privacy Guaranteed</span>
      </div>
    </div>
  );
};
