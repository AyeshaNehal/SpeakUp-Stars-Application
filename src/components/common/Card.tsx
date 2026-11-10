import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export type CardVariant = 'white' | 'sunny' | 'sky' | 'coral' | 'mint' | 'purple' | 'subtle';

export interface CardProps extends HTMLMotionProps<'div'> {
  variant?: CardVariant;
  children: React.ReactNode;
  isInteractive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  borderStyle?: 'solid' | 'dashed' | 'none';
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  variant = 'white',
  children,
  isInteractive = false,
  padding = 'md',
  borderStyle = 'solid',
  className = '',
  onClick,
  ...rest
}) => {
  const variantStyles: Record<CardVariant, string> = {
    white: 'bg-white text-slate-800 border-slate-100 shadow-bubble-card',
    sunny: 'bg-sunny-50 text-amber-950 border-sunny-200 shadow-sm',
    sky: 'bg-sky-50 text-sky-950 border-sky-200 shadow-sm',
    coral: 'bg-coral-50 text-rose-950 border-coral-200 shadow-sm',
    mint: 'bg-mint-50 text-emerald-950 border-mint-200 shadow-sm',
    purple: 'bg-purple-50 text-purple-950 border-purple-200 shadow-sm',
    subtle: 'bg-slate-50 text-slate-700 border-slate-200 shadow-none',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6 lg:p-7',
    lg: 'p-6 sm:p-8 lg:p-10',
  };

  const borderClasses = {
    solid: 'border-2 sm:border-3',
    dashed: 'border-2 sm:border-3 border-dashed',
    none: 'border-0',
  };

  const interactiveClasses = isInteractive
    ? 'cursor-pointer hover:shadow-lg transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sunny-400'
    : '';

  const motionProps = isInteractive
    ? {
        whileHover: { y: -4, scale: 1.01 },
        whileTap: { scale: 0.98, y: 0 },
        transition: { type: 'spring' as const, stiffness: 400, damping: 20 },
      }
    : {};

  return (
    <motion.div
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      className={`
        rounded-3xl sm:rounded-4xl
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${borderClasses[borderStyle]}
        ${interactiveClasses}
        ${className}
      `}
      {...motionProps}
      {...rest}
    >
      {children}
    </motion.div>
  );
};
