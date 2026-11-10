/**
 * SPEAKUP STARS: ECHO EXPLORER MINI-GAME
 * Follow Sparky or Pip through the Crystal Echo Caves!
 * Echo back the rhythm words & tongue-twisters to illuminate glowing cave crystals.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GameHeader } from '../../components/games/GameHeader';
import { GameResultsModal } from '../../components/games/GameResultsModal';
import { MascotCompanion, ALL_MASCOTS, MascotId } from '../../components/mascot/MascotCompanion';
import { gameRewardService } from '../../services/games/gameRewardService';
import { GameResults, GameStatus } from '../../services/games/types';
import { Play, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

const ECHO_PHRASES = [
  { phrase: 'Red lorry, yellow lorry!', hint: 'Say it with bouncy rhythm! 🚛' },
  { phrase: 'Brave little star shines bright!', hint: 'Project with confidence! 🌟' },
  { phrase: 'She sells seashells by the shore!', hint: 'Keep your tongue nimble! 🐚' },
  { phrase: 'Big brown bear bounces boldly!', hint: 'Strong, steady voice! 🐻' },
  { phrase: 'Zooming rockets touch the sky!', hint: 'Soar with joyful energy! 🚀' },
];

export const EchoExplorerGamePage: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<GameStatus>('ready');
  const [lowGraphics, setLowGraphics] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [litCrystals, setLitCrystals] = useState<number>(0);
  const [starPointsEarned, setStarPointsEarned] = useState<number>(15);
  const [gameResults, setGameResults] = useState<GameResults | null>(null);
  const [isEchoing, setIsEchoing] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentMascot = (localStorage.getItem('speakup_selected_mascot') as MascotId) || 'pip';
  const mascotObj = ALL_MASCOTS.find((m) => m.id === currentMascot) || ALL_MASCOTS[1];

  const currentEcho = ECHO_PHRASES[currentIndex % ECHO_PHRASES.length];

  const handleStartGame = () => {
    setStatus('playing');
    setTimeRemaining(60);
    setLitCrystals(0);
    setCurrentIndex(0);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleEchoDone = () => {
    setIsEchoing(true);
    setLitCrystals((prev) => prev + 1);
    setStarPointsEarned((prev) => Math.min(50, prev + 5));

    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#38BDF8', '#818CF8', '#C084FC', '#F472B6'],
      });
    } catch {
      // Ignore
    }

    setTimeout(() => {
      setIsEchoing(false);
      setCurrentIndex((prev) => prev + 1);
    }, 800);
  };

  const endGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('completed');

    const totalDuration = 60;
    const elapsedSeconds = totalDuration - timeRemaining;
    const results = gameRewardService.finalizeGameSession({
      childId: 'active_child',
      gameId: 'echo_explorer',
      gameTitle: 'Echo Explorer',
      metrics: {
        durationSeconds: elapsedSeconds,
        averageVolume: 0.7,
        peakVolume: 0.9,
        steadyVoiceTimeSeconds: litCrystals * 5,
        steadyVoiceRatio: Math.min(1, (litCrystals * 5) / 30),
        eruptionCount: litCrystals,
      },
    });
    setGameResults(results);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-5rem)] bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-950 text-white select-none overflow-hidden pb-12">
      <GameHeader
        title="Echo Explorer 💎"
        timeRemaining={timeRemaining}
        totalDuration={60}
        starPointsEarned={starPointsEarned}
        isPaused={status === 'paused'}
        lowGraphics={lowGraphics}
        onTogglePause={() => setStatus((s) => (s === 'playing' ? 'paused' : 'playing'))}
        onToggleGraphics={() => setLowGraphics((g) => !g)}
        onExitGame={() => navigate('/games')}
      />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Crystal Cave Display with Glowing Crystals */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-purple-900/40 via-indigo-950 to-slate-900 border-3 border-indigo-400/40 shadow-2xl flex flex-col items-center text-center space-y-6">
          {/* Row of Glowing Crystals */}
          <div className="flex items-center gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5].map((idx) => {
              const isLit = litCrystals >= idx;
              return (
                <motion.div
                  key={idx}
                  animate={isLit ? { scale: [1, 1.25, 1], filter: 'drop-shadow(0 0 15px #818CF8)' } : {}}
                  className={`w-12 h-16 sm:w-16 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl border-2 transition-all duration-300 ${
                    isLit
                      ? 'bg-gradient-to-tr from-sky-400 to-indigo-500 border-sky-300 text-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-white/20'
                  }`}
                >
                  💎
                </motion.div>
              );
            })}
          </div>

          <MascotCompanion
            mascotId={mascotObj.id}
            size="md"
            showDialogue={true}
            dialogueText={`Listen to my echo: "${currentEcho.phrase}"`}
          />

          {status === 'playing' ? (
            <div className="space-y-4 max-w-lg">
              <div className="bg-black/50 backdrop-blur-md px-6 py-4 rounded-3xl border-2 border-indigo-300/60 shadow-inner">
                <span className="text-xs font-bold text-sky-300 uppercase tracking-widest block mb-1">
                  Echo Phrase
                </span>
                <p className="text-2xl sm:text-3xl font-heading font-black text-amber-300 tracking-wide">
                  "{currentEcho.phrase}"
                </p>
                <p className="text-xs text-indigo-200 mt-2 font-medium">{currentEcho.hint}</p>
              </div>

              <div className="flex justify-center gap-4 pt-2">
                <button
                  onClick={handleEchoDone}
                  disabled={isEchoing}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-white font-heading font-black text-base shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>Echoed Clearly! ✨</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-2xl font-heading font-black text-sky-300">
                Light Up the Crystal Cave!
              </h2>
              <p className="text-sm text-indigo-200 max-w-md">
                Listen to each playful tongue-twister and repeat it back with rhythm and confidence!
              </p>
              <button
                onClick={handleStartGame}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-heading font-black text-base shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 mx-auto"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                <span>Enter Echo Caves! 💎</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {gameResults && (
        <GameResultsModal
          isOpen={status === 'completed'}
          results={gameResults}
          onPlayAgain={() => {
            setStatus('ready');
            setGameResults(null);
          }}
          onBackToGames={() => navigate('/games')}
        />
      )}
    </div>
  );
};
