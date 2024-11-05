import { cosineSimilarity } from '../embeddings';
import { ADJACENT_WORD_MIN_SIMILARITY, TARGET_WORD_MIN_SIMILARITY } from '../constants';

export const validateWordWithPrevious = async (word: string, previousWord: string) => {
  const similarity = await cosineSimilarity(previousWord, word);
  const isValid = similarity >= ADJACENT_WORD_MIN_SIMILARITY;
  
  console.log(`Validation result for "${word}":`, {
    similarity,
    isValid,
    threshold: ADJACENT_WORD_MIN_SIMILARITY
  });

  return {
    isValid,
    similarity
  };
};

export const validateWordWithTarget = async (word: string, targetWord: string) => {
  const similarity = await cosineSimilarity(word, targetWord);
  const isComplete = similarity >= TARGET_WORD_MIN_SIMILARITY;
  
  console.log(`Target word check for "${word}":`, {
    similarity,
    isComplete,
    threshold: TARGET_WORD_MIN_SIMILARITY
  });

  return {
    similarity,
    isComplete
  };
};