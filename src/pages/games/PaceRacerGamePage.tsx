/**
 * SPEAKUP STARS: PACE RACER MINI-GAME
 * Race Dash the Cheetah or Sparky down the Rainbow Track!
 * Stay in the sweet conversational pacing zone (80-110 WPM) to hit nitro boosts!
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GameHeader } from '../../components/games/GameHeader';
import { GameResultsModal } from '../../components/games/GameResultsModal';
import { MascotCompanion, ALL_MASCOTS, MascotId } from '../../components/mascot/MascotCompanion';
import { gameRewardService } from '../../services/games/gameRewardService';
import { GameResults, GameStatus } from '../../services/games/types';
import { Play, Gauge, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

const READING_PROMPTS = [
  'Once upon a time in a rainbow sky, a brave little star learned how to fly.',
  'The friendly cheetah zoomed past the river, waving hello to the dancing otters.',
  'Deep in the quiet forest, tiny mushrooms glowed like emerald fairy lamps.',
  'Ready, set, speak with joy! Your words are bright and full of wonder.',
];

export const PaceRacerGamePage: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<GameStatus>('ready');
  const [lowGraphics, setLowGraphics] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [starPointsEarned, setStarPointsEarned] = useState<number>(15);
  const [gameResults, setGameResults] = useState<GameResults | null>(null);

  // Speedometer & Race Position State
  const [carPosition, setCarPosition] = useState<number>(20); // 0 to 100%
  const [currentSpeed] = useState<number>(92); // Target: 80 - 110 WPM (Green Zone)
  const [nitroCount, setNitroCount] = useState<number>(0);
  const [promptIndex, setPromptIndex] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentMascot = (localStorage.getItem('speakup_selected_mascot') as MascotId) || 'dash';
  const mascotObj = ALL_MASCOTS.find((m) => m.id === currentMascot) || ALL_MASCOTS[3];

  const currentPrompt = READING_PROMPTS[promptIndex % READING_PROMPTS.length];

  const handleStartGame = () => {
    setStatus('playing');
    setTimeRemaining(60);
    setCarPosition(15);
    setNitroCount(0);
    setPromptIndex(0);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });

      // Gradually advance racer based on steady pacing
      setCarPosition((pos) => Math.min(100, pos + 1.4));
    }, 1000);
  };

  const handleNitroBoost = () => {
    setNitroCount((prev) => prev + 1);
    setCarPosition((pos) => Math.min(100, pos + 12));
    setStarPointsEarned((prev) => Math.min(50, prev + 5));
    setPromptIndex((prev) => prev + 1);

    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#34D399', '#38BDF8', '#FBBF24'],
      });
    } catch {
      // Ignore
    }
  };

  const endGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('completed');

    const totalDuration = 60;
    const elapsedSeconds = totalDuration - timeRemaining;
    const results = gameRewardService.finalizeGameSession({
      childId: 'active_child',
      gameId: 'pace_racer',
      gameTitle: 'Pace Racer',
      metrics: {
        durationSeconds: elapsedSeconds,
        averageVolume: 0.7,
        peakVolume: 0.85,
        steadyVoiceTimeSeconds: nitroCount * 8,
        steadyVoiceRatio: Math.min(1, (nitroCount * 8) / 40),
        eruptionCount: nitroCount,
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
    <div className="relative min-h-[calc(100vh-5rem)] bg-gradient-to-b from-slate-900 via-teal-950/40 to-slate-900 text-white select-none overflow-hidden pb-12">
      <GameHeader
        title="Pace Racer 🏎️"
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
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-emerald-950/60 via-slate-900 to-slate-900 border-3 border-emerald-500/40 shadow-2xl flex flex-col items-center text-center space-y-6">
          {/* Race Track Visualization */}
          <div className="w-full bg-slate-800/80 rounded-2xl p-4 border border-emerald-400/30">
            <div className="flex justify-between text-xs font-bold text-emerald-300 mb-2">
              <span>START 🏁</span>
              <span>🏎️ Turbo Distance: {Math.round(carPosition)}%</span>
              <span>FINISH 🏆</span>
            </div>
            <div className="relative w-full h-8 bg-slate-950 rounded-xl overflow-hidden border border-white/10 flex items-center px-1">
              {/* Finish Line */}
              <div className="absolute right-3 text-lg">🏁</div>
              {/* Race Car Position */}
              <motion.div
                className="text-2xl absolute"
                animate={{ left: `${Math.min(90, carPosition)}%` }}
                transition={{ ease: 'easeOut', duration: 0.3 }}
              >
                🏎️
              </motion.div>
            </div>
          </div>

          <MascotCompanion
            mascotId={mascotObj.id}
            size="md"
            showDialogue={true}
            dialogueText={
              status === 'playing'
                ? 'Read clearly at conversational speed to keep the car flying!'
                : 'Stay in the green speed zone to win the championship!'
            }
          />

          {status === 'playing' ? (
            <div className="space-y-4 max-w-lg w-full">
              {/* Speedometer Gauge HUD */}
              <div className="flex items-center justify-center gap-4 bg-black/40 px-6 py-3 rounded-2xl border border-emerald-400/40">
                <Gauge className="w-6 h-6 text-emerald-400 animate-pulse" />
                <div className="text-left">
                  <div className="text-xs uppercase font-bold text-slate-400">Pacing Speedometer</div>
                  <div className="text-lg font-heading font-black text-emerald-300">
                    {currentSpeed} WPM (Sweet Green Zone ✨)
                  </div>
                </div>
              </div>

              {/* Current Practice Prompt */}
              <div className="bg-black/50 p-6 rounded-3xl border-2 border-emerald-300/40 shadow-inner text-center">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest block mb-1">
                  Read at Steady Speed:
                </span>
                <p className="text-xl sm:text-2xl font-heading font-black text-amber-200 leading-relaxed">
                  "{currentPrompt}"
                </p>
              </div>

              <div className="flex justify-center gap-4 pt-2">
                <button
                  onClick={handleNitroBoost}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-heading font-black text-base shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Zap className="w-5 h-5 fill-slate-950" />
                  <span>Read In Green Zone! Nitro Boost 🚀</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-2xl font-heading font-black text-emerald-300">
                The Conversational Speed Track!
              </h2>
              <p className="text-sm text-emerald-200 max-w-md">
                Speaking neither too fast like a runaway rocket nor too sleepy slow. Keep your speed steady in the green zone to win!
              </p>
              <button
                onClick={handleStartGame}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-heading font-black text-base shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 mx-auto"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                <span>Start Pace Racer! 🏎️</span>
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
