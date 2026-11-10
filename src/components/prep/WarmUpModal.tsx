/**
 * CHILD PRIVACY NOTE (Rule 1, Rule 2, Rule 5):
 * - Interactive Speech Warm-Up Modal
 * - Zero external dependencies, audio synthesized locally or via browser Web Speech API.
 * - ZERO camera, microphone, or tracking telemetry used during warm-up.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Sparkles, RefreshCw, CheckCircle2, Wind, Smile, MessageSquareQuote } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { speechHelper } from '../../services/speech/tts';
import { soundEffects } from '../../services/sound/soundEffects';
import { AgeGroup } from '../../types';

export interface WarmUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  ageBand?: AgeGroup;
}

type WarmUpTab = 'breathing' | 'silly_face' | 'tongue_twister';

interface SillyFacePrompt {
  id: string;
  emoji: string;
  title: string;
  instruction: string;
  sparkyTip: string;
}

interface TongueTwister {
  id: string;
  text: string;
  minAge: number;
  highlightWords: string[];
}

const SILLY_FACES: SillyFacePrompt[] = [
  {
    id: 'lion',
    emoji: '🦁',
    title: 'The Roaring Lion',
    instruction: 'Open your mouth as wide as a cave, stick out your tongue, and give a big silent "ROAR!"',
    sparkyTip: 'Stretches your jaw and loosens your throat so your voice booms!',
  },
  {
    id: 'pufferfish',
    emoji: '🐡',
    title: 'The Pufferfish Pop',
    instruction: 'Puff your cheeks full of air like a big round balloon, hold it... then pop them gently with your hands!',
    sparkyTip: 'Wakes up your cheek muscles for clear and crisp words!',
  },
  {
    id: 'monkey',
    emoji: '🐵',
    title: 'The Silly Monkey Grin',
    instruction: 'Show all your top teeth, then all your bottom teeth, and wiggle your nose like a cheeky monkey!',
    sparkyTip: 'Relaxes your smiling muscles so speaking feels effortless and fun!',
  },
  {
    id: 'lemon',
    emoji: '🍋',
    title: 'The Sour Lemon Squeeze',
    instruction: 'Scrunch up your whole face as tight as a lemon drop... 3, 2, 1... now explode into a giant sunny smile!',
    sparkyTip: 'Releases any nervous tension from your forehead down to your chin!',
  },
];

const TONGUE_TWISTERS: TongueTwister[] = [
  // 3-5
  {
    id: 'twister-1',
    text: 'Red lorry, yellow lorry, red lorry, yellow lorry!',
    minAge: 3,
    highlightWords: ['Red', 'yellow', 'lorry'],
  },
  {
    id: 'twister-2',
    text: 'Big black bug bit a big black bear!',
    minAge: 3,
    highlightWords: ['Big', 'black', 'bear'],
  },
  {
    id: 'twister-3',
    text: 'Friendly frogs fly furiously fast!',
    minAge: 3,
    highlightWords: ['Friendly', 'frogs', 'fast'],
  },
  // 6-8
  {
    id: 'twister-4',
    text: 'Six slippery snails slid slowly seaward!',
    minAge: 6,
    highlightWords: ['Six', 'slippery', 'snails'],
  },
  {
    id: 'twister-5',
    text: 'She sells sea shells by the sunny seashore!',
    minAge: 6,
    highlightWords: ['She', 'sells', 'shells'],
  },
  {
    id: 'twister-6',
    text: 'Fuzzy Wuzzy was a bear, Fuzzy Wuzzy had no hair!',
    minAge: 6,
    highlightWords: ['Fuzzy', 'Wuzzy', 'bear'],
  },
  // 9-12
  {
    id: 'twister-7',
    text: 'Peter Piper picked a peck of pickled peppers!',
    minAge: 9,
    highlightWords: ['Peter', 'Piper', 'pickled'],
  },
  {
    id: 'twister-8',
    text: 'Which wristwatches are truly Swiss wristwatches?',
    minAge: 9,
    highlightWords: ['wristwatches', 'Swiss'],
  },
  {
    id: 'twister-9',
    text: 'A proper copper coffee pot makes pure purple punch!',
    minAge: 9,
    highlightWords: ['proper', 'copper', 'coffee'],
  },
];

export const WarmUpModal: React.FC<WarmUpModalProps> = ({ isOpen, onClose, ageBand = '6-8' }) => {
  const [activeTab, setActiveTab] = useState<WarmUpTab>('breathing');
  const [breathPhase, setBreathPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [breathCount, setBreathCount] = useState(1);
  const [faceIndex, setFaceIndex] = useState(0);
  const [twisterIndex, setTwisterIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Filter tongue twisters according to child age band
  const ageNumber = ageBand === '3-5' ? 3 : ageBand === '9-12' ? 9 : 6;
  const filteredTwisters = TONGUE_TWISTERS.filter((t) => t.minAge <= ageNumber);
  const currentTwister = filteredTwisters[twisterIndex % filteredTwisters.length] || filteredTwisters[0];
  const currentFace = SILLY_FACES[faceIndex % SILLY_FACES.length];

  // Breathing loop timer (4s In -> 2s Hold -> 4s Out)
  useEffect(() => {
    if (!isOpen || activeTab !== 'breathing') return;

    let timer: NodeJS.Timeout;
    if (breathPhase === 'in') {
      timer = setTimeout(() => setBreathPhase('hold'), 4000);
    } else if (breathPhase === 'hold') {
      timer = setTimeout(() => setBreathPhase('out'), 2000);
    } else if (breathPhase === 'out') {
      timer = setTimeout(() => {
        setBreathPhase('in');
        setBreathCount((prev) => prev + 1);
      }, 4000);
    }

    return () => clearTimeout(timer);
  }, [isOpen, activeTab, breathPhase]);

  // Clean up speech synthesis if modal closes
  useEffect(() => {
    if (!isOpen) {
      speechHelper.stop();
      setIsSpeaking(false);
    }
  }, [isOpen]);

  const handleSpeak = (text: string) => {
    if (isSpeaking) {
      speechHelper.stop();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    speechHelper.speak(text, () => {
      setIsSpeaking(false);
    });
  };

  const nextSillyFace = () => {
    speechHelper.stop();
    setIsSpeaking(false);
    setFaceIndex((prev) => (prev + 1) % SILLY_FACES.length);
    soundEffects.playTick();
  };

  const nextTwister = () => {
    speechHelper.stop();
    setIsSpeaking(false);
    setTwisterIndex((prev) => (prev + 1) % filteredTwisters.length);
    soundEffects.playTick();
  };

  const handleFinishWarmUp = () => {
    soundEffects.playCelebration();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sparky's Pre-Speech Warm-Up"
      icon={<Sparkles className="w-7 h-7 text-amber-500 fill-amber-400 animate-pulse" />}
      maxWidth="lg"
      footer={
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs font-heading font-bold text-slate-500 text-center sm:text-left">
            ✨ Take your time! Warming up builds strong speaking confidence.
          </span>
          <Button
            variant="mint"
            size="md"
            icon={<CheckCircle2 className="w-5 h-5" />}
            onClick={handleFinishWarmUp}
            className="w-full sm:w-auto"
          >
            I'm Ready to Speak! 🚀
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Navigation Tabs (Min 52px Touch Target) */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-3xl border border-slate-200">
          <button
            onClick={() => {
              setActiveTab('breathing');
              speechHelper.stop();
              setIsSpeaking(false);
            }}
            className={`
              min-h-[52px] py-2.5 px-3 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1.5
              font-heading font-bold text-xs sm:text-sm transition-all cursor-pointer select-none
              ${
                activeTab === 'breathing'
                  ? 'bg-white text-sky-700 shadow-sm border border-sky-200'
                  : 'text-slate-500 hover:text-slate-800'
              }
            `}
          >
            <Wind className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'breathing' ? 'text-sky-500' : ''}`} />
            <span>1. Breathe 🫧</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('silly_face');
              speechHelper.stop();
              setIsSpeaking(false);
            }}
            className={`
              min-h-[52px] py-2.5 px-3 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1.5
              font-heading font-bold text-xs sm:text-sm transition-all cursor-pointer select-none
              ${
                activeTab === 'silly_face'
                  ? 'bg-white text-coral-700 shadow-sm border border-coral-200'
                  : 'text-slate-500 hover:text-slate-800'
              }
            `}
          >
            <Smile className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'silly_face' ? 'text-coral-500' : ''}`} />
            <span>2. Silly Face 🤪</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('tongue_twister');
              speechHelper.stop();
              setIsSpeaking(false);
            }}
            className={`
              min-h-[52px] py-2.5 px-3 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1.5
              font-heading font-bold text-xs sm:text-sm transition-all cursor-pointer select-none
              ${
                activeTab === 'tongue_twister'
                  ? 'bg-white text-purple-700 shadow-sm border border-purple-200'
                  : 'text-slate-500 hover:text-slate-800'
              }
            `}
          >
            <MessageSquareQuote
              className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'tongue_twister' ? 'text-purple-500' : ''}`}
            />
            <span>3. Twister 👅</span>
          </button>
        </div>

        {/* Tab 1: Breathing Bubbles */}
        <AnimatePresence mode="wait">
          {activeTab === 'breathing' && (
            <motion.div
              key="breathing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center text-center space-y-6 py-2"
            >
              <div className="space-y-1">
                <h4 className="text-xl sm:text-2xl font-heading font-black text-slate-800">
                  Breathing Bubble Relaxation
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Follow the bubble! Deep belly breaths help calm the butterflies in your tummy.
                </p>
              </div>

              {/* Interactive Breathing Sphere */}
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
                {/* Outermost gentle glow ring */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-sky-200/40"
                  animate={{
                    scale: breathPhase === 'in' ? [0.85, 1.25] : breathPhase === 'hold' ? 1.25 : [1.25, 0.85],
                    opacity: breathPhase === 'hold' ? 0.7 : [0.3, 0.6],
                  }}
                  transition={{
                    duration: breathPhase === 'hold' ? 2 : 4,
                    ease: 'easeInOut',
                  }}
                />

                {/* Main animated bubble */}
                <motion.div
                  className={`
                    w-40 h-40 sm:w-48 sm:h-48 rounded-full flex flex-col items-center justify-center p-4 text-center select-none shadow-xl
                    ${
                      breathPhase === 'in'
                        ? 'bg-gradient-to-tr from-sky-400 to-cyan-300 text-white'
                        : breathPhase === 'hold'
                        ? 'bg-gradient-to-tr from-amber-300 to-sunny-200 text-amber-950'
                        : 'bg-gradient-to-tr from-mint to-emerald-300 text-white'
                    }
                  `}
                  animate={{
                    scale: breathPhase === 'in' ? [0.75, 1.15] : breathPhase === 'hold' ? 1.15 : [1.15, 0.75],
                  }}
                  transition={{
                    duration: breathPhase === 'hold' ? 2 : 4,
                    ease: 'easeInOut',
                  }}
                >
                  <span className="text-3xl sm:text-4xl mb-1">
                    {breathPhase === 'in' ? '🌬️' : breathPhase === 'hold' ? '✨' : '🫧'}
                  </span>
                  <span className="font-heading font-black text-lg sm:text-xl tracking-wide uppercase drop-shadow-xs">
                    {breathPhase === 'in' ? 'Breathe In' : breathPhase === 'hold' ? 'Hold It...' : 'Breathe Out'}
                  </span>
                  <span className="text-xs font-bold opacity-90 mt-1">
                    {breathPhase === 'in'
                      ? 'Smell the flowers...'
                      : breathPhase === 'hold'
                      ? 'Gentle & still'
                      : 'Blow out birthday candles!'}
                  </span>
                </motion.div>
              </div>

              {/* Breath Counter and Read Aloud */}
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-xs font-heading font-bold text-sky-800">
                  Calm Breaths: {breathCount}
                </span>

                <button
                  onClick={() =>
                    handleSpeak(
                      'Breathe in slowly through your nose, like smelling sweet flowers. Hold it gently. Now blow out softly, like blowing soap bubbles!'
                    )
                  }
                  className="min-h-[44px] px-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs font-heading font-bold flex items-center gap-2 hover:bg-slate-50 cursor-pointer shadow-2xs"
                  aria-label="Read breathing instructions aloud"
                >
                  {isSpeaking ? (
                    <VolumeX className="w-4 h-4 text-coral" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-sky-600" />
                  )}
                  <span>Read Aloud</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Tab 2: Silly Face Prompt */}
          {activeTab === 'silly_face' && (
            <motion.div
              key="silly_face"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center text-center space-y-6 py-2"
            >
              <div className="space-y-1">
                <h4 className="text-xl sm:text-2xl font-heading font-black text-slate-800">
                  Loosen Up Your Face Muscles!
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Actors and singers make silly faces before going on stage. Try this one!
                </p>
              </div>

              {/* Silly Face Card */}
              <motion.div
                key={currentFace.id}
                initial={{ scale: 0.9, rotate: -2 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 20 }}
                className="w-full max-w-md bg-gradient-to-br from-coral-50 via-white to-amber-50 rounded-4xl p-6 sm:p-8 border-3 border-coral-200 shadow-md space-y-4"
              >
                <div className="text-6xl sm:text-7xl animate-bounce">{currentFace.emoji}</div>
                <h5 className="text-2xl font-heading font-black text-coral-600">{currentFace.title}</h5>
                <p className="text-base sm:text-lg font-heading font-bold text-slate-800 bg-white/80 p-4 rounded-2xl border border-coral-100">
                  "{currentFace.instruction}"
                </p>

                <div className="bg-amber-100/70 p-3 rounded-2xl border border-amber-200 text-xs sm:text-sm text-amber-950 font-medium">
                  💡 <strong>Sparky's Secret:</strong> {currentFace.sparkyTip}
                </div>
              </motion.div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  variant="coral"
                  size="md"
                  icon={<RefreshCw className="w-5 h-5" />}
                  onClick={nextSillyFace}
                >
                  Another Silly Face! 🤪
                </Button>

                <button
                  onClick={() => handleSpeak(`${currentFace.title}. ${currentFace.instruction}`)}
                  className="min-h-[48px] px-4 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-heading font-bold flex items-center gap-2 hover:bg-slate-50 cursor-pointer shadow-2xs"
                  aria-label="Read prompt aloud"
                >
                  {isSpeaking ? (
                    <VolumeX className="w-4 h-4 text-coral" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-coral" />
                  )}
                  <span>Read Aloud</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Tab 3: Tongue Twister */}
          {activeTab === 'tongue_twister' && (
            <motion.div
              key="tongue_twister"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center text-center space-y-6 py-2"
            >
              <div className="space-y-1">
                <h4 className="text-xl sm:text-2xl font-heading font-black text-slate-800">
                  Tongue Twister Gymnastics
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Say it slow, then say it fast! Can you say it 3 times without stumbling?
                </p>
              </div>

              {/* Tongue Twister Display Card */}
              <motion.div
                key={currentTwister.id}
                initial={{ scale: 0.9, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 20 }}
                className="w-full max-w-md bg-gradient-to-br from-purple-50 via-white to-sky-50 rounded-4xl p-6 sm:p-8 border-3 border-purple-200 shadow-md space-y-4"
              >
                <div className="inline-block px-3.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-heading font-black uppercase tracking-wider">
                  Ages {currentTwister.minAge}+ Challenge
                </div>

                <p className="text-xl sm:text-2xl font-heading font-black text-purple-950 leading-relaxed">
                  "{currentTwister.text}"
                </p>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <span className="text-xs font-bold text-slate-500">Speed Challenge:</span>
                  <span className="px-2.5 py-1 rounded-xl bg-purple-100 text-purple-800 text-xs font-heading font-bold">
                    🐢 Slow
                  </span>
                  <span className="text-slate-300">➜</span>
                  <span className="px-2.5 py-1 rounded-xl bg-purple-100 text-purple-800 text-xs font-heading font-bold">
                    🐰 Fast
                  </span>
                  <span className="text-slate-300">➜</span>
                  <span className="px-2.5 py-1 rounded-xl bg-purple-600 text-white text-xs font-heading font-bold shadow-2xs">
                    🚀 Rocket!
                  </span>
                </div>
              </motion.div>

              {/* Twister controls */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  variant="purple"
                  size="md"
                  icon={<RefreshCw className="w-5 h-5" />}
                  onClick={nextTwister}
                >
                  Try Another Twister 👅
                </Button>

                <button
                  onClick={() => handleSpeak(currentTwister.text)}
                  className="min-h-[48px] px-4 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-heading font-bold flex items-center gap-2 hover:bg-slate-50 cursor-pointer shadow-2xs"
                  aria-label="Read tongue twister aloud"
                >
                  {isSpeaking ? (
                    <VolumeX className="w-4 h-4 text-coral" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-purple-600" />
                  )}
                  <span>Read Aloud</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
};
