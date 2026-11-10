/**
 * SPEAKUP STARS: MULTI-CHARACTER MASCOT SYSTEM
 * - 5 Hand-Crafted 100% Local SVG Animated Mascots:
 *   1. Sparky the Friendly Dragon (Warm, enthusiastic, bold)
 *   2. Pip the Penguin (Gentle, cheerful, sweet)
 *   3. Luna the Starry Owl (Curious, wise, thoughtful)
 *   4. Dash the Cheetah (Energetic, speedy, brave)
 *   5. Barnaby the Cozy Bear (Calm, grounding, reassuring)
 * - Zero external assets or trackers. Pure SVG + Framer Motion.
 */

import React from 'react';
import { motion } from 'framer-motion';

export type MascotId = 'sparky' | 'pip' | 'luna' | 'dash' | 'barnaby';

export interface MascotInfo {
  id: MascotId;
  name: string;
  species: string;
  title: string;
  tagline: string;
  emoji: string;
  color: string;
  bgGradient: string;
  voiceIntro: string;
  personality: string;
}

export const ALL_MASCOTS: MascotInfo[] = [
  {
    id: 'sparky',
    name: 'Sparky',
    species: 'Friendly Dragon',
    title: 'The Brave Spark',
    tagline: 'Ready to find your fire and roar with courage! 🔥',
    emoji: '🐉',
    color: '#FFD12E',
    bgGradient: 'from-amber-400 to-orange-500',
    voiceIntro: "Hi! I'm Sparky! Let's find your brave voice together!",
    personality: 'Enthusiastic, bold, warm & celebratory',
  },
  {
    id: 'pip',
    name: 'Pip',
    species: 'Little Penguin',
    title: 'The Gentle Explorer',
    tagline: 'Taking joyful little steps into big brave speaking! 🐧',
    emoji: '🐧',
    color: '#38BDF8',
    bgGradient: 'from-sky-400 to-blue-600',
    voiceIntro: "Waddle we talk about today? You're doing amazing already!",
    personality: 'Kind, gentle, sweet & cheering',
  },
  {
    id: 'luna',
    name: 'Luna',
    species: 'Starry Owl',
    title: 'The Wise Guide',
    tagline: 'Listening deeply, thinking big, and sharing wonder! 🦉',
    emoji: '🦉',
    color: '#A78BFA',
    bgGradient: 'from-purple-500 to-indigo-700',
    voiceIntro: "Whoo-whoo! Your ideas are bright like the night stars!",
    personality: 'Thoughtful, curious, smart & patient',
  },
  {
    id: 'dash',
    name: 'Dash',
    species: 'Speedy Cheetah',
    title: 'The Energy Champion',
    tagline: 'Sprint into storytelling with boundless energy! ⚡',
    emoji: '🐆',
    color: '#34D399',
    bgGradient: 'from-emerald-400 to-teal-600',
    voiceIntro: "Zoom! Ready, set, speak! You've got superstar speed!",
    personality: 'Fast, playful, vibrant & adventurous',
  },
  {
    id: 'barnaby',
    name: 'Barnaby',
    species: 'Cozy Bear',
    title: 'The Calming Friend',
    tagline: 'Deep belly breaths, warm smiles, and grounded courage! 🐻',
    emoji: '🐻',
    color: '#F97316',
    bgGradient: 'from-amber-600 to-yellow-700',
    voiceIntro: "Take a deep breath with me. Your voice is strong and steady.",
    personality: 'Calm, comforting, grounding & patient',
  },
];

export interface MascotCompanionProps {
  mascotId?: MascotId;
  braveryLevel?: number; // 1 to 5
  size?: 'sm' | 'md' | 'lg' | 'xl';
  equippedHat?: string | null;
  className?: string;
  onClick?: () => void;
  showDialogue?: boolean;
  dialogueText?: string;
}

export const MascotCompanion: React.FC<MascotCompanionProps> = ({
  mascotId = 'sparky',
  braveryLevel = 3,
  size = 'lg',
  equippedHat = null,
  className = '',
  onClick,
  showDialogue = false,
  dialogueText,
}) => {
  const mascot = ALL_MASCOTS.find((m) => m.id === mascotId) || ALL_MASCOTS[0];

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-36 h-36',
    lg: 'w-48 h-48 sm:w-56 sm:h-56',
    xl: 'w-60 h-60 sm:w-72 sm:h-72',
  };

  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      {/* Optional Speech Bubble */}
      {showDialogue && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="mb-2 bg-white px-4 py-2 rounded-2xl border-2 border-slate-200 shadow-md text-xs sm:text-sm font-heading font-black text-slate-800 max-w-xs text-center relative z-20"
        >
          {dialogueText || mascot.voiceIntro}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b-2 border-r-2 border-slate-200 rotate-45" />
        </motion.div>
      )}

      <motion.div
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative inline-flex items-center justify-center cursor-pointer ${sizeClasses[size]}`}
      >
        <motion.svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xl"
          animate={{
            y: [0, -5, 0],
            rotate: braveryLevel === 2 ? [-1, 1, -1] : [0, 0.5, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: 'easeInOut',
          }}
        >
          <defs>
            {/* Sparky Dragon Gradients */}
            <radialGradient id="sparky-grad" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFF59D" />
              <stop offset="60%" stopColor="#FFD12E" />
              <stop offset="100%" stopColor="#E5A500" />
            </radialGradient>

            {/* Pip Penguin Gradients */}
            <radialGradient id="pip-grad" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="60%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </radialGradient>
            <radialGradient id="pip-belly" cx="50%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F1F5F9" />
            </radialGradient>

            {/* Luna Owl Gradients */}
            <radialGradient id="luna-grad" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#DDD6FE" />
              <stop offset="60%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#5B21B6" />
            </radialGradient>

            {/* Dash Cheetah Gradients */}
            <radialGradient id="dash-grad" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="60%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </radialGradient>

            {/* Barnaby Bear Gradients */}
            <radialGradient id="barnaby-grad" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#D97706" />
              <stop offset="60%" stopColor="#B45309" />
              <stop offset="100%" stopColor="#78350F" />
            </radialGradient>
          </defs>

          {/* ============================================================= */}
          {/* 1. SPARKY THE DRAGON                                           */}
          {/* ============================================================= */}
          {mascot.id === 'sparky' && (
            <g id="sparky-char">
              {/* Little Wings */}
              <motion.path
                d="M 50 110 C 20 85, 30 50, 65 75 Z"
                fill="#FF8A80"
                stroke="#D92626"
                strokeWidth="2"
                animate={{ rotate: [-4, 4, -4] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
              <motion.path
                d="M 150 110 C 180 85, 170 50, 135 75 Z"
                fill="#FF8A80"
                stroke="#D92626"
                strokeWidth="2"
                animate={{ rotate: [4, -4, 4] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />

              {/* Round dragon body */}
              <ellipse cx="100" cy="115" rx="62" ry="58" fill="url(#sparky-grad)" stroke="#E5A500" strokeWidth="3" />

              {/* Dragon tummy patch */}
              <ellipse cx="100" cy="128" rx="36" ry="32" fill="#FFF9C4" />

              {/* Dragon Horns */}
              <path d="M 72 65 C 65 42, 75 32, 85 46 Z" fill="#FFA726" stroke="#E65100" strokeWidth="2" />
              <path d="M 128 65 C 135 42, 125 32, 115 46 Z" fill="#FFA726" stroke="#E65100" strokeWidth="2" />

              {/* Big Expressive Eyes */}
              <ellipse cx="80" cy="102" rx="13" ry="16" fill="#2E1B0E" />
              <ellipse cx="120" cy="102" rx="13" ry="16" fill="#2E1B0E" />
              {/* Eye sparkles */}
              <circle cx="76" cy="97" r="4.5" fill="#FFF" />
              <circle cx="83" cy="106" r="2" fill="#FFF" />
              <circle cx="116" cy="97" r="4.5" fill="#FFF" />
              <circle cx="123" cy="106" r="2" fill="#FFF" />

              {/* Cheerful Dragon Smile */}
              <path d="M 88 122 Q 100 134 112 122" stroke="#2E1B0E" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              {/* Rosy Blushes */}
              <ellipse cx="64" cy="116" rx="8" ry="5" fill="#FF8A80" opacity="0.6" />
              <ellipse cx="136" cy="116" rx="8" ry="5" fill="#FF8A80" opacity="0.6" />

              {/* Flame spark on forehead */}
              <path d="M 100 56 C 96 68, 104 68, 100 76 C 108 72, 106 62, 100 56 Z" fill="#FF5252" />
            </g>
          )}

          {/* ============================================================= */}
          {/* 2. PIP THE PENGUIN                                             */}
          {/* ============================================================= */}
          {mascot.id === 'pip' && (
            <g id="pip-char">
              {/* Flippers */}
              <motion.ellipse
                cx="46"
                cy="118"
                rx="14"
                ry="30"
                fill="#1E293B"
                stroke="#0F172A"
                strokeWidth="2"
                transform="rotate(-20 46 118)"
                animate={{ rotate: [-25, -15, -25] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
              />
              <motion.ellipse
                cx="154"
                cy="118"
                rx="14"
                ry="30"
                fill="#1E293B"
                stroke="#0F172A"
                strokeWidth="2"
                transform="rotate(20 154 118)"
                animate={{ rotate: [25, 15, 25] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
              />

              {/* Penguin Body */}
              <ellipse cx="100" cy="115" rx="60" ry="62" fill="url(#pip-grad)" stroke="#0F172A" strokeWidth="3" />

              {/* White Belly */}
              <ellipse cx="100" cy="125" rx="42" ry="46" fill="url(#pip-belly)" />

              {/* Big Curious Eyes */}
              <ellipse cx="82" cy="98" rx="12" ry="15" fill="#0F172A" />
              <ellipse cx="118" cy="98" rx="12" ry="15" fill="#0F172A" />
              <circle cx="79" cy="94" r="4.5" fill="#FFF" />
              <circle cx="85" cy="103" r="2" fill="#FFF" />
              <circle cx="115" cy="94" r="4.5" fill="#FFF" />
              <circle cx="121" cy="103" r="2" fill="#FFF" />

              {/* Orange Beak */}
              <polygon points="90,108 110,108 100,122" fill="#F97316" stroke="#EA580C" strokeWidth="2" strokeLinejoin="round" />

              {/* Yellow Bowtie */}
              <polygon points="92,130 84,138 84,122" fill="#FBBF24" />
              <polygon points="108,130 116,138 116,122" fill="#FBBF24" />
              <circle cx="100" cy="130" r="4" fill="#F59E0B" />

              {/* Rosy Cheeks */}
              <ellipse cx="68" cy="112" rx="7" ry="4" fill="#F472B6" opacity="0.6" />
              <ellipse cx="132" cy="112" rx="7" ry="4" fill="#F472B6" opacity="0.6" />

              {/* Little feet */}
              <ellipse cx="84" cy="172" rx="12" ry="7" fill="#F97316" />
              <ellipse cx="116" cy="172" rx="12" ry="7" fill="#F97316" />
            </g>
          )}

          {/* ============================================================= */}
          {/* 3. LUNA THE STARRY OWL                                         */}
          {/* ============================================================= */}
          {mascot.id === 'luna' && (
            <g id="luna-char">
              {/* Ear Tufts */}
              <polygon points="65,65 52,40 80,56" fill="#5B21B6" />
              <polygon points="135,65 148,40 120,56" fill="#5B21B6" />

              {/* Owl Body */}
              <ellipse cx="100" cy="115" rx="60" ry="60" fill="url(#luna-grad)" stroke="#4C1D95" strokeWidth="3" />

              {/* Owl Chest Feathers */}
              <ellipse cx="100" cy="130" rx="36" ry="34" fill="#EDE9FE" />
              <path d="M 88 124 Q 94 130 100 124 Q 106 130 112 124" stroke="#8B5CF6" strokeWidth="2" fill="none" />
              <path d="M 88 136 Q 94 142 100 136 Q 106 142 112 136" stroke="#8B5CF6" strokeWidth="2" fill="none" />

              {/* Starry Spectacles Frame */}
              <circle cx="78" cy="100" r="19" fill="#FFF" stroke="#FBBF24" strokeWidth="3" />
              <circle cx="122" cy="100" r="19" fill="#FFF" stroke="#FBBF24" strokeWidth="3" />
              <line x1="97" y1="100" x2="103" y2="100" stroke="#FBBF24" strokeWidth="3" />

              {/* Smart Owl Pupils */}
              <circle cx="78" cy="100" r="10" fill="#312E81" />
              <circle cx="122" cy="100" r="10" fill="#312E81" />
              <circle cx="75" cy="97" r="3.5" fill="#FFF" />
              <circle cx="119" cy="97" r="3.5" fill="#FFF" />

              {/* Curved Beak */}
              <polygon points="96,112 104,112 100,123" fill="#F59E0B" />

              {/* Wings */}
              <path d="M 46 100 Q 35 130 52 145" stroke="#4C1D95" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M 154 100 Q 165 130 148 145" stroke="#4C1D95" strokeWidth="4" fill="none" strokeLinecap="round" />
            </g>
          )}

          {/* ============================================================= */}
          {/* 4. DASH THE CHEETAH                                            */}
          {/* ============================================================= */}
          {mascot.id === 'dash' && (
            <g id="dash-char">
              {/* Ears */}
              <ellipse cx="64" cy="64" rx="14" ry="14" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
              <ellipse cx="64" cy="64" rx="8" ry="8" fill="#FDE68A" />
              <ellipse cx="136" cy="64" rx="14" ry="14" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
              <ellipse cx="136" cy="64" rx="8" ry="8" fill="#FDE68A" />

              {/* Round Cheetah Head/Body */}
              <ellipse cx="100" cy="115" rx="60" ry="56" fill="url(#dash-grad)" stroke="#B45309" strokeWidth="3" />

              {/* White Muzzle */}
              <ellipse cx="100" cy="126" rx="26" ry="18" fill="#FFFBEB" />

              {/* Cheetah Spots */}
              <circle cx="68" cy="88" r="4" fill="#78350F" />
              <circle cx="132" cy="88" r="4" fill="#78350F" />
              <circle cx="58" cy="114" r="4.5" fill="#78350F" />
              <circle cx="142" cy="114" r="4.5" fill="#78350F" />
              <circle cx="92" cy="68" r="3" fill="#78350F" />
              <circle cx="108" cy="68" r="3" fill="#78350F" />

              {/* Tear Marks (Cheetah Signature) */}
              <path d="M 82 108 Q 80 120 86 128" stroke="#78350F" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 118 108 Q 120 120 114 128" stroke="#78350F" strokeWidth="3" fill="none" strokeLinecap="round" />

              {/* Big Energetic Eyes */}
              <ellipse cx="80" cy="100" rx="12" ry="14" fill="#1C1917" />
              <ellipse cx="120" cy="100" rx="12" ry="14" fill="#1C1917" />
              <circle cx="77" cy="96" r="4.5" fill="#FFF" />
              <circle cx="117" cy="96" r="4.5" fill="#FFF" />

              {/* Cute Nose & Bold Smile */}
              <polygon points="96,120 104,120 100,125" fill="#78350F" />
              <path d="M 94 128 Q 100 134 106 128" stroke="#1C1917" strokeWidth="3" fill="none" strokeLinecap="round" />

              {/* Sporty Headband */}
              <rect x="52" y="70" width="96" height="10" rx="4" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.5" />
              <polygon points="100,67 103,73 97,73" fill="#FBBF24" />
            </g>
          )}

          {/* ============================================================= */}
          {/* 5. BARNABY THE COZY BEAR                                       */}
          {/* ============================================================= */}
          {mascot.id === 'barnaby' && (
            <g id="barnaby-char">
              {/* Round Bear Ears */}
              <circle cx="60" cy="68" r="16" fill="#B45309" stroke="#78350F" strokeWidth="2.5" />
              <circle cx="60" cy="68" r="8" fill="#FDE68A" />
              <circle cx="140" cy="68" r="16" fill="#B45309" stroke="#78350F" strokeWidth="2.5" />
              <circle cx="140" cy="68" r="8" fill="#FDE68A" />

              {/* Big Huggable Bear Body */}
              <ellipse cx="100" cy="116" rx="64" ry="58" fill="url(#barnaby-grad)" stroke="#78350F" strokeWidth="3" />

              {/* Big Friendly Snout */}
              <ellipse cx="100" cy="126" rx="30" ry="22" fill="#FDE68A" />

              {/* Warm Eyes */}
              <ellipse cx="78" cy="98" rx="10" ry="12" fill="#1E1B18" />
              <ellipse cx="122" cy="98" rx="10" ry="12" fill="#1E1B18" />
              <circle cx="76" cy="95" r="4" fill="#FFF" />
              <circle cx="120" cy="95" r="4" fill="#FFF" />

              {/* Heart Bear Nose & Gentle Smile */}
              <ellipse cx="100" cy="118" rx="8" ry="6" fill="#3E2723" />
              <path d="M 92 128 Q 100 136 108 128" stroke="#3E2723" strokeWidth="3" fill="none" strokeLinecap="round" />

              {/* Cozy Red Scarf */}
              <path d="M 58 145 C 80 152, 120 152, 142 145 C 130 162, 70 162, 58 145 Z" fill="#EF4444" stroke="#B91C1C" strokeWidth="2" />
              <rect x="115" y="148" width="14" height="24" rx="3" fill="#DC2626" />
            </g>
          )}

          {/* Optional Equipped Hat Overlay */}
          {equippedHat && (
            <g id="equipped-hat">
              {equippedHat.includes('wizard') && (
                <path d="M 60 70 L 100 20 L 140 70 Z" fill="#6366F1" stroke="#4338CA" strokeWidth="2" />
              )}
              {equippedHat.includes('crown') && (
                <polygon points="70,68 80,48 90,62 100,44 110,62 120,48 130,68" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
              )}
              {equippedHat.includes('cap') && (
                <path d="M 68 70 Q 100 48 132 70 L 152 74 Q 132 66 110 66 Z" fill="#EF4444" />
              )}
            </g>
          )}
        </motion.svg>
      </motion.div>
    </div>
  );
};
