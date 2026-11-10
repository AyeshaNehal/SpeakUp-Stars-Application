/**
 * SPEAKUP STARS: STORY DICE MINI-GAME
 * Roll 3 magical dice (Character + Location + Object) and weave a creative tale!
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GameHeader } from '../../components/games/GameHeader';
import { GameResultsModal } from '../../components/games/GameResultsModal';
import { MascotCompanion, ALL_MASCOTS, MascotId } from '../../components/mascot/MascotCompanion';
import { gameRewardService } from '../../services/games/gameRewardService';
import { GameResults, GameStatus } from '../../services/games/types';
import { Sparkles, Dices, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

const DICE_CHARACTERS = [
  { name: 'Friendly Dragon', emoji: '🐉' },
  { name: 'Little Astronaut', emoji: '🧑‍🚀' },
  { name: 'Talking Puppy', emoji: '🐶' },
  { name: 'Wise Owl', emoji: '🦉' },
  { name: 'Playful Robot', emoji: '🤖' },
];

const DICE_LOCATIONS = [
  { name: 'Candy Volcano', emoji: '🌋' },
  { name: 'Floating Cloud Castle', emoji: '🏰' },
  { name: 'Underwater Cave', emoji: '🌊' },
  { name: 'Secret Treehouse', emoji: '🏡' },
  { name: 'Rainbow Galaxy', emoji: '🌌' },
];

const DICE_OBJECTS = [
  { name: 'Magic Wand', emoji: '🪄' },
  { name: 'Flying Skateboard', emoji: '🛹' },
  { name: 'Golden Compass', emoji: '🧭' },
  { name: 'Giant Ice Cream', emoji: '🍦' },
  { name: 'Singing Crystal', emoji: '💎' },
];

export const StoryDiceGamePage: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<GameStatus>('ready');
  const [lowGraphics, setLowGraphics] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [starPointsEarned, setStarPointsEarned] = useState<number>(15);
  const [gameResults, setGameResults] = useState<GameResults | null>(null);

  // Active Dice
  const [charDice, setCharDice] = useState(DICE_CHARACTERS[0]);
  const [locDice, setLocDice] = useState(DICE_LOCATIONS[0]);
  const [objDice, setObjDice] = useState(DICE_OBJECTS[0]);
  const [isRolling, setIsRolling] = useState(false);
  const [storiesTold, setStoriesTold] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentMascot = (localStorage.getItem('speakup_selected_mascot') as MascotId) || 'barnaby';
  const mascotObj = ALL_MASCOTS.find((m) => m.id === currentMascot) || ALL_MASCOTS[4];

  const rollDice = () => {
    setIsRolling(true);
    let rolls = 0;
    const interval = setInterval(() => {
      setCharDice(DICE_CHARACTERS[Math.floor(Math.random() * DICE_CHARACTERS.length)]);
      setLocDice(DICE_LOCATIONS[Math.floor(Math.random() * DICE_LOCATIONS.length)]);
      setObjDice(DICE_OBJECTS[Math.floor(Math.random() * DICE_OBJECTS.length)]);
      rolls++;
      if (rolls >= 8) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 80);
  };

  const handleStartGame = () => {
    setStatus('playing');
    setTimeRemaining(60);
    setStoriesTold(0);
    rollDice();

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

  const handleFinishStory = () => {
    setStoriesTold((prev) => prev + 1);
    setStarPointsEarned((prev) => Math.min(50, prev + 10));

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#A855F7', '#C084FC', '#FBBF24', '#34D399'],
      });
    } catch {
      // Ignore
    }

    rollDice();
  };

  const endGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('completed');

    const totalDuration = 60;
    const elapsedSeconds = totalDuration - timeRemaining;
    const results = gameRewardService.finalizeGameSession({
      childId: 'active_child',
      gameId: 'story_dice',
      gameTitle: 'Story Dice',
      metrics: {
        durationSeconds: elapsedSeconds,
        averageVolume: 0.75,
        peakVolume: 0.9,
        steadyVoiceTimeSeconds: storiesTold * 20,
        steadyVoiceRatio: Math.min(1, (storiesTold * 20) / 40),
        eruptionCount: storiesTold,
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
    <div className="relative min-h-[calc(100vh-5rem)] bg-gradient-to-b from-slate-900 via-purple-950/40 to-slate-900 text-white select-none overflow-hidden pb-12">
      <GameHeader
        title="Story Dice 🎲"
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
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-purple-950/60 via-slate-900 to-slate-900 border-3 border-purple-500/40 shadow-2xl flex flex-col items-center text-center space-y-6">
          <MascotCompanion
            mascotId={mascotObj.id}
            size="md"
            showDialogue={true}
            dialogueText={
              status === 'playing'
                ? `Link the ${charDice.name}, the ${locDice.name}, and the ${objDice.name} in your tale!`
                : 'Roll the magical dice and weave a brave story!'
            }
          />

          {/* 3 Magical Dice Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-xl">
            <motion.div
              animate={isRolling ? { rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] } : {}}
              className="p-5 rounded-3xl bg-gradient-to-b from-amber-400/20 to-amber-600/20 border-2 border-amber-400/60 flex flex-col items-center gap-2"
            >
              <span className="text-xs uppercase tracking-wider font-bold text-amber-300">Character</span>
              <span className="text-5xl">{charDice.emoji}</span>
              <span className="font-heading font-black text-sm text-white">{charDice.name}</span>
            </motion.div>

            <motion.div
              animate={isRolling ? { rotate: [0, -15, 15, 0], scale: [1, 1.1, 1] } : {}}
              className="p-5 rounded-3xl bg-gradient-to-b from-sky-400/20 to-sky-600/20 border-2 border-sky-400/60 flex flex-col items-center gap-2"
            >
              <span className="text-xs uppercase tracking-wider font-bold text-sky-300">Location</span>
              <span className="text-5xl">{locDice.emoji}</span>
              <span className="font-heading font-black text-sm text-white">{locDice.name}</span>
            </motion.div>

            <motion.div
              animate={isRolling ? { rotate: [0, 20, -20, 0], scale: [1, 1.1, 1] } : {}}
              className="p-5 rounded-3xl bg-gradient-to-b from-purple-400/20 to-purple-600/20 border-2 border-purple-400/60 flex flex-col items-center gap-2"
            >
              <span className="text-xs uppercase tracking-wider font-bold text-purple-300">Magical Item</span>
              <span className="text-5xl">{objDice.emoji}</span>
              <span className="font-heading font-black text-sm text-white">{objDice.name}</span>
            </motion.div>
          </div>

          {status === 'playing' ? (
            <div className="space-y-4 max-w-md w-full">
              <div className="flex justify-center gap-3">
                <button
                  onClick={rollDice}
                  disabled={isRolling}
                  className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-heading font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Re-roll Dice 🎲</span>
                </button>

                <button
                  onClick={handleFinishStory}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-heading font-black text-sm shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Story Told! (+10 ⭐)</span>
                </button>
              </div>
              <p className="text-xs text-purple-200">Stories told: {storiesTold}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-2xl font-heading font-black text-purple-300">
                Roll &amp; Weave a Tale!
              </h2>
              <p className="text-sm text-purple-200 max-w-md">
                Three wild dice will give you a character, location, and object. Link them in your story to ignite creative flow!
              </p>
              <button
                onClick={handleStartGame}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-400 hover:to-violet-500 text-white font-heading font-black text-base shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 mx-auto"
              >
                <Dices className="w-5 h-5 fill-white" />
                <span>Roll Story Dice! 🎲</span>
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
