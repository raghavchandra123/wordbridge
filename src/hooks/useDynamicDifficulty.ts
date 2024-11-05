import { useState, useEffect } from 'react';
import {
  INITIAL_MIN_THRESHOLD,
  INITIAL_THRESHOLD_RANGE,
  MIN_POSSIBLE_THRESHOLD,
  MAX_POSSIBLE_THRESHOLD,
  HINT_PENALTY,
  NEW_GAME_PENALTY,
  WORD_REJECT_PENALTY,
  COMPLETION_REWARD,
} from '@/lib/constants';

export const useDynamicDifficulty = () => {
  const [minThreshold, setMinThreshold] = useState(INITIAL_MIN_THRESHOLD);

  const adjustDifficulty = (adjustment: number) => {
    setMinThreshold(prevThreshold => {
      const newThreshold = Math.max(
        MIN_POSSIBLE_THRESHOLD,
        Math.min(
          MAX_POSSIBLE_THRESHOLD - INITIAL_THRESHOLD_RANGE,
          prevThreshold + adjustment
        )
      );
      console.log(`Difficulty adjusted by ${adjustment}. New min threshold: ${newThreshold.toFixed(3)}`);
      return newThreshold;
    });
  };

  const onHintUsed = () => adjustDifficulty(HINT_PENALTY);
  const onNewGameWithoutCompletion = () => adjustDifficulty(NEW_GAME_PENALTY);
  const onWordRejected = () => adjustDifficulty(WORD_REJECT_PENALTY);
  const onGameCompleted = () => adjustDifficulty(-COMPLETION_REWARD);

  return {
    minThreshold,
    maxThreshold: minThreshold + INITIAL_THRESHOLD_RANGE,
    onHintUsed,
    onNewGameWithoutCompletion,
    onWordRejected,
    onGameCompleted,
  };
};