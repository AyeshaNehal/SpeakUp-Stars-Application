/**
 * CHILD PRIVACY NOTE (Rule 1, Rule 2, Rule 5):
 * - Interactive Spin Wheel Component
 * - Displays topic emoji + short titles on colorful SVG segments.
 * - Supports keyboard Space navigation, realistic easing, deceleration peg ticks,
 *   reduced-motion preferences, and confetti celebration.
 */

import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import confetti from 'canvas-confetti';
import { soundEffects } from '../../services/sound/soundEffects';
import { Topic } from '../../services/topics/topicService';

export interface SpinWheelProps {
  topics: Topic[];
  isSpinning: boolean;
  onSpinStart: () => void;
  onSpinEnd: (landedTopic: Topic) => void;
  soundEnabled?: boolean;
}

const SEGMENT_COLORS = [
  '#FFD12E', // Sunny
  '#38BDF8', // Sky
  '#FF6B6B', // Coral
  '#3FD094', // Mint
  '#B388FF', // Purple
  '#FB923C', // Orange
  '#34D399', // Emerald
  '#F472B6', // Pink
];

export const SpinWheelCanvas: React.FC<SpinWheelProps> = ({
  topics,
  isSpinning,
  onSpinStart,
  onSpinEnd,
  soundEnabled = true,
}) => {
  const wheelControls = useAnimation();
  const [currentRotation, setCurrentRotation] = useState(0);
  const [flapperAngle, setFlapperAngle] = useState(0);

  // Take up to 8 topics for the wheel visual segments
  const displayTopics = topics.slice(0, 8);
  const numSegments = displayTopics.length;
  const segmentAngle = 360 / numSegments;

  // Sound enabled synchronization
  useEffect(() => {
    soundEffects.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  // Reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const spinWheel = async () => {
    if (isSpinning || numSegments === 0) return;

    onSpinStart();

    // Random target segment index
    const targetIndex = Math.floor(Math.random() * numSegments);
    const targetTopic = displayTopics[targetIndex];

    // Compute rotation so that targetIndex lands directly under the top pointer (at 270 degrees / top center)
    // In our SVG: 0 deg is at 3 o'clock. Top pointer is at 12 o'clock (-90 deg or 270 deg).
    // Segment i spans [i * segmentAngle, (i + 1) * segmentAngle].
    // Segment center is (i + 0.5) * segmentAngle.
    // To align center with top (-90):
    // (rotation + (targetIndex + 0.5) * segmentAngle) % 360 = 270
    // => rotation = 270 - (targetIndex + 0.5) * segmentAngle + extra full spins
    const fullSpins = prefersReducedMotion ? 1 : 4 + Math.floor(Math.random() * 2);
    const extraDegrees = fullSpins * 360;
    const targetDegree = 270 - (targetIndex + 0.5) * segmentAngle;
    const finalDegree = currentRotation + extraDegrees + ((targetDegree - (currentRotation % 360) + 360) % 360);

    setCurrentRotation(finalDegree);

    if (prefersReducedMotion) {
      // Gentle settle for reduced motion users
      await wheelControls.start({
        rotate: finalDegree,
        transition: { duration: 0.6, ease: 'easeOut' },
      });
      triggerCelebration(targetTopic);
      return;
    }

    // Realistic easing animation with deceleration peg tick sound effect
    const spinDuration = 3.6; // seconds
    let startTime: number | null = null;
    let lastPegIndex = -1;

    const animateTicks = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;
      const progress = Math.min(1, elapsed / spinDuration);

      // Cubic-bezier easeOut: 1 - Math.pow(1 - progress, 3)
      const currentDeg = currentRotation + (finalDegree - currentRotation) * (1 - Math.pow(1 - progress, 3));
      const currentSegment = Math.floor((currentDeg + segmentAngle / 2) / segmentAngle);

      if (currentSegment !== lastPegIndex) {
        lastPegIndex = currentSegment;
        soundEffects.playTick();
        setFlapperAngle(-18);
        setTimeout(() => setFlapperAngle(0), 40);
      }

      if (progress < 1) {
        requestAnimationFrame(animateTicks);
      }
    };

    requestAnimationFrame(animateTicks);

    await wheelControls.start({
      rotate: finalDegree,
      transition: {
        duration: spinDuration,
        ease: [0.15, 0.85, 0.25, 1], // realistic gradual friction deceleration
      },
    });

    triggerCelebration(targetTopic);
  };

  const triggerCelebration = (targetTopic: Topic) => {
    soundEffects.playCelebration();

    // Trigger colorful confetti shower
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: SEGMENT_COLORS,
    });

    onSpinEnd(targetTopic);
  };

  // Keyboard Spacebar to spin
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpinning && e.target === document.body) {
        e.preventDefault();
        spinWheel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpinning, currentRotation, numSegments]);

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[440px] aspect-square">
      {/* Outer Glow Halo */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-sunny/20 via-sky/20 to-coral/20 blur-2xl pointer-events-none" />

      {/* Ticker Flapper / Pointer at Top Center */}
      <div className="absolute -top-3 z-30 flex flex-col items-center drop-shadow-lg">
        <motion.div
          animate={{ rotate: flapperAngle }}
          transition={{ type: 'spring', stiffness: 600, damping: 15 }}
          className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[28px] border-t-rose-500 filter drop-shadow-md"
        />
        <div className="w-5 h-5 -mt-8 rounded-full bg-white border-3 border-rose-500 shadow-sm" />
      </div>

      {/* Outer Wheel Rim */}
      <div className="relative w-full h-full p-3 rounded-full bg-white shadow-2xl border-4 sm:border-6 border-slate-100 flex items-center justify-center">
        {/* Animated Rotating Wheel Disk */}
        <motion.div
          animate={wheelControls}
          className="w-full h-full rounded-full relative overflow-hidden shadow-inner cursor-pointer"
          onClick={spinWheel}
          tabIndex={0}
          role="button"
          aria-label="Spin the Topic Wheel"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              spinWheel();
            }
          }}
        >
          <svg viewBox="-100 -100 200 200" className="w-full h-full">
            {displayTopics.map((topic, i) => {
              const startAngle = (i * segmentAngle * Math.PI) / 180;
              const endAngle = ((i + 1) * segmentAngle * Math.PI) / 180;

              const x1 = Math.cos(startAngle) * 98;
              const y1 = Math.sin(startAngle) * 98;
              const x2 = Math.cos(endAngle) * 98;
              const y2 = Math.sin(endAngle) * 98;

              // Arc path
              const pathData = `M 0 0 L ${x1} ${y1} A 98 98 0 0 1 ${x2} ${y2} Z`;

              // Text position at center of arc
              const midAngle = startAngle + (endAngle - startAngle) / 2;
              const textRadius = 64;
              const tx = Math.cos(midAngle) * textRadius;
              const ty = Math.sin(midAngle) * textRadius;
              const textRotation = (midAngle * 180) / Math.PI + 90;

              const bgColor = SEGMENT_COLORS[i % SEGMENT_COLORS.length];

              return (
                <g key={topic.id}>
                  {/* Segment Pie Slice */}
                  <path
                    d={pathData}
                    fill={bgColor}
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                  />

                  {/* Segment Label (Emoji + Truncated Title) */}
                  <g transform={`translate(${tx}, ${ty}) rotate(${textRotation})`}>
                    <text
                      textAnchor="middle"
                      y="-4"
                      fontSize="14"
                      className="select-none pointer-events-none"
                    >
                      {topic.emoji}
                    </text>
                    <text
                      textAnchor="middle"
                      y="11"
                      fontSize="6.5"
                      fontFamily="Fredoka, sans-serif"
                      fontWeight="bold"
                      fill="#1E293B"
                      className="select-none pointer-events-none tracking-tight"
                    >
                      {topic.title.length > 13 ? `${topic.title.slice(0, 11)}..` : topic.title}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Perimeter Pegs */}
            {displayTopics.map((_, i) => {
              const angle = (i * segmentAngle * Math.PI) / 180;
              const px = Math.cos(angle) * 93;
              const py = Math.sin(angle) * 93;
              return (
                <circle
                  key={`peg-${i}`}
                  cx={px}
                  cy={py}
                  r="3.5"
                  fill="#FFFFFF"
                  stroke="#CBD5E1"
                  strokeWidth="1.5"
                />
              );
            })}
          </svg>
        </motion.div>

        {/* Center HUB Spin Button */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          disabled={isSpinning}
          onClick={spinWheel}
          aria-label="Spin the wheel button"
          className="
            absolute z-20 w-20 h-20 sm:w-24 sm:h-24 rounded-full
            bg-white shadow-xl border-4 sm:border-5 border-sunny-400
            flex flex-col items-center justify-center cursor-pointer
            focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sunny-400
            disabled:opacity-80 disabled:cursor-not-allowed
          "
        >
          <span className="text-2xl sm:text-3xl animate-bounce">⭐</span>
          <span className="text-xs sm:text-sm font-heading font-black text-amber-950 uppercase tracking-wider">
            {isSpinning ? 'SPINNING' : 'SPIN!'}
          </span>
        </motion.button>
      </div>
    </div>
  );
};
