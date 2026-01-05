
import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import Controls from './components/Controls';
import Overlay from './components/Overlay';
import Shop from './components/Shop';
import { GameState, GameLevel, AbilityType } from './types';
import { LEVELS, XP_PER_LEVEL } from './constants';
import { getCelestialGuidance } from './geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    deaths: 0,
    currentLevelIndex: 0,
    isGameOver: false,
    message: "Press START to begin your ascent.",
    progression: {
      level: 1,
      xp: 0,
      shards: 0,
      unlockedAbilities: []
    },
    showShop: false
  });
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingGuidance, setLoadingGuidance] = useState(false);
  const [inputState, setInputState] = useState({
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    dash: false
  });

  const handleLevelComplete = useCallback(() => {
    // Grant bonus XP for level completion
    const bonusXp = XP_PER_LEVEL;
    
    setGameState(prev => {
      const nextXp = prev.progression.xp + bonusXp;
      const nextLevel = Math.floor(nextXp / 500) + 1;
      
      const newProgression = {
        ...prev.progression,
        xp: nextXp,
        level: nextLevel
      };

      if (prev.currentLevelIndex < LEVELS.length - 1) {
        return {
          ...prev,
          progression: newProgression,
          currentLevelIndex: prev.currentLevelIndex + 1,
          message: `Level ${prev.currentLevelIndex + 2}: ${LEVELS[prev.currentLevelIndex + 1].name}`,
          showShop: true // Show upgrade screen between levels
        };
      } else {
        return { 
          ...prev, 
          progression: newProgression,
          isGameOver: true, 
          message: "YOU REACHED THE SUMMIT!" 
        };
      }
    });
    setIsPlaying(false);
  }, [gameState.currentLevelIndex]);

  const handleShardCollected = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      progression: {
        ...prev.progression,
        shards: prev.progression.shards + 1,
        xp: prev.progression.xp + 50
      }
    }));
  }, []);

  const handleDeath = useCallback(async () => {
    setGameState(prev => ({ ...prev, deaths: prev.deaths + 1 }));
    
    if (gameState.deaths % 5 === 0 && gameState.deaths > 0) {
      setLoadingGuidance(true);
      const level = LEVELS[gameState.currentLevelIndex];
      const guidance = await getCelestialGuidance(gameState.deaths, level.name);
      setGameState(prev => ({ ...prev, message: guidance }));
      setLoadingGuidance(false);
    }
  }, [gameState.deaths, gameState.currentLevelIndex]);

  const toggleStart = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setGameState(prev => ({ ...prev, isGameOver: false, showShop: false }));
    }
  };

  const handlePurchase = (ability: AbilityType, cost: number) => {
    setGameState(prev => {
      if (prev.progression.shards < cost) return prev;
      return {
        ...prev,
        progression: {
          ...prev.progression,
          shards: prev.progression.shards - cost,
          unlockedAbilities: [...prev.progression.unlockedAbilities, ability]
        }
      };
    });
  };

  return (
    <div className="relative w-full h-screen bg-stone-950 flex flex-col items-center justify-center overflow-hidden font-sans select-none">
      {/* Game Header */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <div className="flex gap-2">
          <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <i className="fas fa-skull text-red-400"></i>
            <span>{gameState.deaths}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <i className="fas fa-gem text-cyan-400"></i>
            <span>{gameState.progression.shards}</span>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <div className="bg-white/10 backdrop-blur-md px-4 py-1 rounded-full border border-white/20 text-white text-xs font-bold uppercase tracking-widest">
            {LEVELS[gameState.currentLevelIndex].name}
          </div>
          <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <div 
              className="h-full bg-cyan-500 transition-all duration-500" 
              style={{ width: `${(gameState.progression.xp % 500) / 5}%` }}
            />
          </div>
          <span className="text-[8px] text-white/50 font-bold uppercase tracking-tighter">LVL {gameState.progression.level}</span>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="relative w-full aspect-video md:w-[800px] bg-black shadow-2xl overflow-hidden rounded-xl border-4 border-stone-800">
        <GameCanvas 
          isPlaying={isPlaying}
          level={LEVELS[gameState.currentLevelIndex]}
          input={inputState}
          onLevelComplete={handleLevelComplete}
          onDeath={handleDeath}
          onShardCollected={handleShardCollected}
          abilities={gameState.progression.unlockedAbilities}
        />
        
        {!isPlaying && !gameState.showShop && (
          <Overlay 
            message={gameState.message} 
            loading={loadingGuidance}
            onStart={toggleStart}
            isGameOver={gameState.isGameOver}
            shards={gameState.progression.shards}
            onOpenShop={() => setGameState(p => ({ ...p, showShop: true }))}
          />
        )}

        {gameState.showShop && (
          <Shop 
            progression={gameState.progression}
            onPurchase={handlePurchase}
            onClose={toggleStart}
          />
        )}
      </div>

      <Controls 
        onInputUpdate={(newInput) => setInputState(prev => ({ ...prev, ...newInput }))} 
        isPlaying={isPlaying}
      />
      
      <DesktopKeyHandler setInputState={setInputState} />
    </div>
  );
};

const DesktopKeyHandler: React.FC<{ setInputState: React.Dispatch<React.SetStateAction<any>> }> = ({ setInputState }) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent, isDown: boolean) => {
      const map: Record<string, string> = {
        'ArrowLeft': 'left', 'a': 'left',
        'ArrowRight': 'right', 'd': 'right',
        'ArrowUp': 'up', 'w': 'up',
        'ArrowDown': 'down', 's': 'down',
        ' ': 'jump', 'k': 'jump', 'z': 'jump',
        'Shift': 'dash', 'l': 'dash', 'x': 'dash'
      };
      const key = map[e.key];
      if (key) {
        setInputState((prev: any) => ({ ...prev, [key]: isDown }));
      }
    };
    const onDown = (e: KeyboardEvent) => handleKey(e, true);
    const onUp = (e: KeyboardEvent) => handleKey(e, false);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [setInputState]);
  return null;
};

export default App;
