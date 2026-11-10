/**
 * CHILD PRIVACY NOTE (Rule 1, Rule 5):
 * - Sparky Mascot Component
 * - A friendly, round, fluffy creature rendered 100% locally via SVG and Framer Motion.
 * - Supports equipping hats, outfits, themes, and backgrounds from the Reward Shop.
 * - ZERO external image requests or tracking.
 */

import React from 'react';
import { motion } from 'framer-motion';

export type SparkyTheme = 'sunny' | 'sky' | 'coral' | 'mint' | 'purple' | 'cosmic';

export interface SparkyMascotProps {
  theme?: SparkyTheme;
  braveryLevel?: number; // 1 to 5
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isWaving?: boolean;
  equippedHat?: string | null;
  equippedOutfit?: string | null;
  equippedBackground?: string | null;
  className?: string;
  onClick?: () => void;
}

export const SparkyMascot: React.FC<SparkyMascotProps> = ({
  theme = 'sunny',
  braveryLevel = 3,
  size = 'lg',
  equippedHat = null,
  equippedOutfit = null,
  equippedBackground = null,
  className = '',
  onClick,
}) => {
  // Theme Color Configurations
  const themeColors: Record<SparkyTheme, { main: string; shadow: string; highlight: string; blush: string }> = {
    sunny: { main: '#FFD12E', shadow: '#E5A500', highlight: '#FFF59D', blush: '#FF8A80' },
    sky: { main: '#38BDF8', shadow: '#0284C7', highlight: '#BAE6FD', blush: '#F472B6' },
    coral: { main: '#FF6B6B', shadow: '#D92626', highlight: '#FFC5C5', blush: '#FFA07A' },
    mint: { main: '#3FD094', shadow: '#059669', highlight: '#A7F3D0', blush: '#F472B6' },
    purple: { main: '#B388FF', shadow: '#792EE8', highlight: '#E9D5FF', blush: '#FF80AB' },
    cosmic: { main: '#4F46E5', shadow: '#312E81', highlight: '#A5B4FC', blush: '#F43F5E' },
  };

  const currentTheme = themeColors[theme] || themeColors.sunny;

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-36 h-36',
    lg: 'w-48 h-48 sm:w-56 sm:h-56',
    xl: 'w-60 h-60 sm:w-72 sm:h-72',
  };

  // Background Styles
  const backgroundStyles: Record<string, string> = {
    bg_cosmos: 'bg-gradient-to-b from-indigo-950 via-slate-900 to-purple-950 border-2 border-indigo-400/40 rounded-full',
    bg_meadow: 'bg-gradient-to-b from-sky-200 via-emerald-100 to-emerald-200 border-2 border-emerald-300 rounded-full',
    bg_clouds: 'bg-gradient-to-b from-amber-100 via-sky-100 to-sky-200 border-2 border-amber-300 rounded-full',
    bg_jungle: 'bg-gradient-to-b from-emerald-800 via-teal-900 to-green-950 border-2 border-emerald-400 rounded-full',
  };

  const bgClass = equippedBackground ? backgroundStyles[equippedBackground] || '' : '';

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative inline-flex items-center justify-center select-none ${sizeClasses[size]} ${bgClass} ${className}`}
    >
      <motion.svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xl"
        animate={{
          y: [0, -6, 0],
          rotate: braveryLevel === 2 ? [-1, 2, -1] : [0, 1, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: 'easeInOut',
        }}
      >
        <defs>
          {/* Radial gradient for round fluffy 3D body */}
          <radialGradient id={`sparky-body-${theme}`} cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor={currentTheme.highlight} />
            <stop offset="60%" stopColor={currentTheme.main} />
            <stop offset="100%" stopColor={currentTheme.shadow} />
          </radialGradient>

          {/* Eye sparkle gradient */}
          <radialGradient id="sparkle-gold" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF" />
            <stop offset="100%" stopColor="#FFE082" />
          </radialGradient>
        </defs>

        {/* ------------------------------------------------------------------ */}
        {/* BACK ACCESSORY: SUPERHERO CAPE (Fluttering behind body) */}
        {/* ------------------------------------------------------------------ */}
        {equippedOutfit === 'outfit_superhero_cape' && (
          <motion.path
            d="M55 90 C30 140 38 185 65 190 C78 175 75 125 78 100 Z
               M145 90 C170 140 162 185 135 190 C122 175 125 125 122 100 Z"
            fill="#E11D48"
            stroke="#9F1239"
            strokeWidth="2"
            animate={{ skewX: [-3, 3, -3] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          />
        )}

        {/* Fluffy Ear Tufts (Left & Right) */}
        <motion.path
          d="M48 65 C32 40 18 68 35 92 C20 105 38 125 55 110 Z"
          fill={currentTheme.shadow}
          animate={{ rotate: [-2, 4, -2] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        />
        <motion.path
          d="M152 65 C168 40 182 68 165 92 C180 105 162 125 145 110 Z"
          fill={currentTheme.shadow}
          animate={{ rotate: [2, -4, 2] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        />

        {/* Main Fluffy Round Body */}
        <path
          d="M100 28
             C128 26 155 42 165 68
             C176 96 172 130 152 154
             C132 178 98 182 72 172
             C44 162 26 132 30 102
             C33 70 65 30 100 28 Z"
          fill={`url(#sparky-body-${theme})`}
        />

        {/* Little Fluffy Feet */}
        <ellipse cx="72" cy="174" rx="16" ry="10" fill={currentTheme.shadow} />
        <ellipse cx="128" cy="174" rx="16" ry="10" fill={currentTheme.shadow} />

        {/* ------------------------------------------------------------------ */}
        {/* OUTFIT ACCESSORIES (Front layer on body) */}
        {/* ------------------------------------------------------------------ */}
        {equippedOutfit === 'outfit_explorer_vest' && (
          <g>
            {/* Safari Explorer Vest */}
            <path
              d="M66 120 C64 160 84 170 94 170 L94 125 Z"
              fill="#D97706"
              stroke="#92400E"
              strokeWidth="2"
            />
            <path
              d="M134 120 C136 160 116 170 106 170 L106 125 Z"
              fill="#D97706"
              stroke="#92400E"
              strokeWidth="2"
            />
            {/* Pockets */}
            <rect x="72" y="145" width="14" height="12" rx="3" fill="#B45309" />
            <rect x="114" y="145" width="14" height="12" rx="3" fill="#B45309" />
          </g>
        )}

        {equippedOutfit === 'outfit_space_suit' && (
          <g>
            {/* Astronaut Chest Plate */}
            <rect x="78" y="125" width="44" height="38" rx="8" fill="#E2E8F0" stroke="#64748B" strokeWidth="2.5" />
            <circle cx="88" cy="138" r="4" fill="#3B82F6" />
            <circle cx="100" cy="138" r="4" fill="#10B981" />
            <circle cx="112" cy="138" r="4" fill="#EF4444" />
            <rect x="85" y="148" width="30" height="6" rx="2" fill="#94A3B8" />
          </g>
        )}

        {equippedOutfit === 'outfit_sparkle_scarf' && (
          <g>
            {/* Cozy Warm Fluffy Scarf */}
            <path
              d="M60 116 C80 128 120 128 140 116 C144 126 124 136 100 136 C76 136 56 126 60 116 Z"
              fill="#F43F5E"
              stroke="#BE123C"
              strokeWidth="2"
            />
            {/* Hanging tail */}
            <path d="M120 126 L124 162 L138 160 L132 124 Z" fill="#F43F5E" stroke="#BE123C" strokeWidth="1.5" />
          </g>
        )}

        {/* Rosy Cheeks */}
        <circle cx="62" cy="122" r="11" fill={currentTheme.blush} opacity={0.65} />
        <circle cx="138" cy="122" r="11" fill={currentTheme.blush} opacity={0.65} />

        {/* Eyes (Adapts by Bravery Level) */}
        {braveryLevel === 1 ? (
          // Shy / Gentle closed happy eyes
          <g stroke="#1E293B" strokeWidth="4" strokeLinecap="round">
            <path d="M68 106 Q78 98 86 106" fill="none" />
            <path d="M114 106 Q122 98 132 106" fill="none" />
          </g>
        ) : (
          // Bright, shiny round eyes with cute catchlights
          <g>
            <ellipse cx="78" cy="104" rx="10" ry="13" fill="#1E293B" />
            <circle cx="75" cy="99" r="4" fill="#FFFFFF" />
            <circle cx="82" cy="108" r="2" fill="#FFFFFF" />

            <ellipse cx="122" cy="104" rx="10" ry="13" fill="#1E293B" />
            <circle cx="119" cy="99" r="4" fill="#FFFFFF" />
            <circle cx="126" cy="108" r="2" fill="#FFFFFF" />
          </g>
        )}

        {/* Mouth (Adapts by Bravery Level) */}
        {braveryLevel <= 2 ? (
          <path
            d="M93 124 Q100 130 107 124"
            stroke="#1E293B"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
        ) : (
          <g>
            <path
              d="M87 118 Q100 144 113 118 Z"
              fill="#E11D48"
              stroke="#1E293B"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <path d="M94 120 Q100 124 106 120" stroke="#FFFFFF" strokeWidth="3" fill="none" />
          </g>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* HEAD ACCESSORIES / HATS */}
        {/* ------------------------------------------------------------------ */}
        {equippedHat === 'hat_party_crown' && (
          <g>
            {/* Golden Party Crown */}
            <path
              d="M74 32 L88 6 L100 24 L112 6 L126 32 Z"
              fill="#F59E0B"
              stroke="#B45309"
              strokeWidth="2.5"
            />
            <circle cx="88" cy="10" r="3" fill="#EF4444" />
            <circle cx="100" cy="22" r="3" fill="#3B82F6" />
            <circle cx="112" cy="10" r="3" fill="#10B981" />
          </g>
        )}

        {equippedHat === 'hat_wizard' && (
          <g>
            {/* Starry Wizard Hat */}
            <ellipse cx="100" cy="34" rx="42" ry="10" fill="#6D28D9" stroke="#4C1D95" strokeWidth="2" />
            <path d="M72 32 L110 -15 L128 32 Z" fill="#7C3AED" stroke="#4C1D95" strokeWidth="2" />
            {/* Golden Star on hat */}
            <path d="M102 12 L104 17 L109 17 L105 20 L107 25 L102 22 L97 25 L99 20 L95 17 L100 17 Z" fill="#FDE047" />
          </g>
        )}

        {equippedHat === 'hat_space_helmet' && (
          <g>
            {/* Glass Space Bubble Visor */}
            <circle cx="100" cy="115" r="54" fill="#38BDF8" fillOpacity="0.25" stroke="#BAE6FD" strokeWidth="4" />
            <ellipse cx="86" cy="85" rx="14" ry="7" fill="#FFFFFF" fillOpacity="0.5" />
          </g>
        )}

        {equippedHat === 'hat_detective' && (
          <g>
            {/* Detective Plaid Cap */}
            <ellipse cx="100" cy="36" rx="40" ry="10" fill="#78350F" />
            <path d="M70 34 C72 10 128 10 130 34 Z" fill="#92400E" stroke="#78350F" strokeWidth="2" />
            <ellipse cx="100" cy="40" rx="34" ry="6" fill="#B45309" />
          </g>
        )}

        {equippedHat === 'hat_flower' && (
          <g>
            {/* Flower Garland across head */}
            <circle cx="74" cy="40" r="7" fill="#EC4899" />
            <circle cx="74" cy="40" r="3" fill="#FDE047" />

            <circle cx="91" cy="32" r="7" fill="#3B82F6" />
            <circle cx="91" cy="32" r="3" fill="#FDE047" />

            <circle cx="109" cy="32" r="7" fill="#F59E0B" />
            <circle cx="109" cy="32" r="3" fill="#FFFFFF" />

            <circle cx="126" cy="40" r="7" fill="#10B981" />
            <circle cx="126" cy="40" r="3" fill="#FDE047" />
          </g>
        )}

        {/* Fluffy Cute Little Hands */}
        <motion.path
          d="M48 128 C36 122 42 142 54 136 Z"
          fill={currentTheme.shadow}
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        <motion.path
          d="M152 128 C164 122 158 142 146 136 Z"
          fill={currentTheme.shadow}
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </motion.svg>
    </motion.div>
  );
};
