import { cosineSimilarity } from '../embeddings';
import { ADJACENT_WORD_MIN_SIMILARITY, TARGET_WORD_MIN_SIMILARITY } from '../constants';

export const validateWordWithPrevious = async (word: string, previousWord: string) => {
  const similarity = await cosineSimilarity(previousWord, word);
  
  return {
    isValid: similarity >= ADJACENT_WORD_MIN_SIMILARITY,
    similarity
  };
};

export const validateWordWithTarget = async (word: string, targetWord: string) => {
  const similarity = await cosineSimilarity(word, targetWord);
  
  return {
    similarity,
    isComplete: similarity >= TARGET_WORD_MIN_SIMILARITY
  };
};