import { useState, useEffect } from 'react';
import { GameState } from '@/lib/types';
import { loadEmbeddings } from '@/lib/embeddings';
import { initializeGame } from '@/lib/services/gameService';

export const useGameInitialization = () => {
  const [game, setGame] = useState<GameState>({
    startWord: '',
    targetWord: '',
    currentChain: [],
    wordProgresses: [],
    isComplete: false,
    score: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initGame = async () => {
      try {
        await loadEmbeddings();
        const initialGame = await initializeGame();
        setGame(initialGame);
      } catch (error) {
        console.error('Game initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initGame();
  }, []);

  return { game, setGame, isLoading };
};