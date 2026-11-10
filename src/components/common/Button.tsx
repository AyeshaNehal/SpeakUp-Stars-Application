import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export type ButtonVariant = 'sunny' | 'sky' | 'coral' | 'mint' | 'purple' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  isBouncy?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'sunny',
  size = 'lg',
  children,
  icon,
  iconRight,
  isBouncy = true,
  fullWidth = false,
  className = '',
  disabled = false,
  ...rest
}) => {
  // Variant styles with 3D shadow depths
  const variantStyles: Record<ButtonVariant, string> = {
    sunny: 'bg-sunny hover:bg-sunny-300 text-amber-950 btn-3d-sunny font-heading',
    sky: 'bg-sky hover:bg-sky-300 text-sky-950 btn-3d-sky font-heading',
    coral: 'bg-coral hover:bg-coral-300 text-white btn-3d-coral font-heading',
    mint: 'bg-mint hover:bg-mint-300 text-emerald-950 btn-3d-mint font-heading',
    purple: 'bg-purple hover:bg-purple-300 text-white btn-3d-purple font-heading',
    outline: 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm font-heading',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-heading',
  };

  // Ensure minimum 56px touch target for kid usability on mobile
  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'min-h-[44px] min-w-[44px] px-4 py-2 text-base rounded-2xl gap-2',
    md: 'min-h-[52px] min-w-[52px] px-5 py-2.5 text-lg rounded-2xl gap-2.5',
    lg: 'min-h-[56px] min-w-[56px] px-6 py-3.5 text-xl rounded-3xl gap-3',
    xl: 'min-h-[64px] min-w-[64px] px-8 py-4 text-2xl rounded-4xl gap-3.5 font-bold',
  };

  const motionProps = isBouncy && !disabled
    ? {
        whileHover: { scale: 1.03, y: -2 },
        whileTap: { scale: 0.97, y: 3 },
        transition: { type: 'spring' as const, stiffness: 450, damping: 18 },
      }
    : {};

  return (
    <motion.button
      disabled={disabled}
      className={`
        inline-flex items-center justify-center font-bold tracking-wide
        transition-all duration-150 select-none cursor-pointer
        focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sunny-400 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...motionProps}
      {...rest}
    >
      {icon && <span className="flex-shrink-0 transition-transform">{icon}</span>}
      <span className="truncate leading-none">{children}</span>
      {iconRight && <span className="flex-shrink-0 transition-transform">{iconRight}</span>}
    </motion.button>
  );
};
