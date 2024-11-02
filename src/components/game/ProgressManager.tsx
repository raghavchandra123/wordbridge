import { useState, useCallback } from 'react';
import { GameState } from '@/lib/types';
import { cosineSimilarity } from '@/lib/embeddings';
import { calculateProgress } from '@/lib/embeddings/utils';

export const useProgressManager = (game: GameState, setGame: (game: GameState) => void) => {
  const [currentProgress, setCurrentProgress] = useState(0);

  const updateProgress = useCallback(async (word: string) => {
    if (!word || !game.targetWord) return 0;
    const similarity = await cosineSimilarity(word, game.targetWord);
    const progress = calculateProgress(similarity);
    setCurrentProgress(progress);
    return progress;
  }, [game.targetWord]);

  const recalculateChainProgress = useCallback(async (chain: string[]) => {
    if (chain.length <= 1) return [];
    
    const newProgresses = [];
    for (let i = 1; i < chain.length; i++) {
      const similarity = await cosineSimilarity(chain[i], game.targetWord);
      const progress = calculateProgress(similarity);
      newProgresses.push(progress);
    }
    return newProgresses;
  }, [game.targetWord]);

  return { currentProgress, updateProgress, recalculateChainProgress };
};