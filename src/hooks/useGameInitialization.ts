import { useState, useEffect } from 'react';
import { GameState } from '@/lib/types';
import { loadEmbeddings } from '@/lib/embeddings';
import { initializeGame } from '@/lib/services/gameService';
import { isValidWord } from '@/lib/embeddings';

export const useGameInitialization = (startWord?: string, targetWord?: string) => {
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
        
        if (startWord && targetWord && isValidWord(startWord) && isValidWord(targetWord)) {
          // Initialize with provided words
          setGame({
            startWord,
            targetWord,
            currentChain: [startWord],
            wordProgresses: [],
            isComplete: false,
            score: 0,
          });
        } else {
          // Initialize with random words
          const initialGame = await initializeGame();
          setGame(initialGame);
        }
      } catch (error) {
        console.error('Game initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initGame();
  }, [startWord, targetWord]);

  return { game, setGame, isLoading };
};