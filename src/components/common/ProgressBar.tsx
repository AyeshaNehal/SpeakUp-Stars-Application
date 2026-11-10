import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

export type ProgressBarVariant = 'sunny' | 'mint' | 'sky' | 'coral' | 'purple' | 'rainbow';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  variant?: ProgressBarVariant;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showStarThumb?: boolean;
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'sunny',
  size = 'md',
  label,
  showStarThumb = true,
  showPercentage = false,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const variantBarStyles: Record<ProgressBarVariant, string> = {
    sunny: 'bg-gradient-to-r from-sunny-300 via-sunny to-amber-500 shadow-sm',
    mint: 'bg-gradient-to-r from-mint-300 via-mint to-emerald-500 shadow-sm',
    sky: 'bg-gradient-to-r from-sky-300 via-sky to-blue-500 shadow-sm',
    coral: 'bg-gradient-to-r from-coral-300 via-coral to-rose-500 shadow-sm',
    purple: 'bg-gradient-to-r from-purple-300 via-purple to-indigo-500 shadow-sm',
    rainbow: 'bg-gradient-to-r from-coral via-sunny via-mint via-sky to-purple shadow-sm',
  };

  const heightStyles = {
    sm: 'h-3.5',
    md: 'h-5',
    lg: 'h-7',
  };

  const starThumbSizes = {
    sm: 'w-6 h-6 -right-2',
    md: 'w-8 h-8 -right-3',
    lg: 'w-10 h-10 -right-4',
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1.5 px-1 font-heading text-sm sm:text-base font-bold text-slate-700">
          {label && <span>{label}</span>}
          {showPercentage && <span className="text-amber-600 font-extrabold">{Math.round(percentage)}%</span>}
        </div>
      )}

      {/* Progress Track */}
      <div
        className={`
          w-full bg-slate-200/90 rounded-full p-1
          shadow-inner relative overflow-visible
          border-2 border-slate-300/60
          ${heightStyles[size]}
        `}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        {/* Animated Bar Fill */}
        <motion.div
          className={`h-full rounded-full relative ${variantBarStyles[variant]}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 16 }}
        >
          {/* Subtle light highlight bar */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-white/40 rounded-t-full pointer-events-none" />

          {/* Cheerful Star Thumb at the lead edge */}
          {showStarThumb && percentage > 4 && (
            <div
              className={`
                absolute top-1/2 -translate-y-1/2 flex items-center justify-center
                bg-sunny text-amber-900 rounded-full shadow-md border-2 border-white
                animate-star-twinkle
                ${starThumbSizes[size]}
              `}
            >
              <Star className="w-3/5 h-3/5 fill-amber-500 text-amber-600" />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
