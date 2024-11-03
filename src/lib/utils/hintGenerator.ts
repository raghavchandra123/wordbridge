import { getWordList, cosineSimilarity } from '../embeddings';
import { ADJACENT_WORD_MIN_SIMILARITY } from '../constants';

export const generateHint = async (
  previousWord: string,
  targetWord: string,
  currentProgress: number,
  usedWords: string[]
): Promise<string | null> => {
  const commonWords = getWordList();
  const maxAttempts = 200; // Total 200 attempts (100 with progress check, 100 without)
  let attempts = 0;
  let requireProgressImprovement = true;

  while (attempts < maxAttempts) {
    // After 100 attempts, remove the progress improvement requirement
    if (attempts === 100) {
      requireProgressImprovement = false;
    }

    // Randomly select a word
    const randomWord = commonWords[Math.floor(Math.random() * commonWords.length)];
    
    // Skip if word is already used
    if (usedWords.includes(randomWord)) {
      attempts++;
      continue;
    }

    try {
      // Check similarity with previous word
      const prevSimilarity = await cosineSimilarity(randomWord, previousWord);
      if (prevSimilarity < ADJACENT_WORD_MIN_SIMILARITY) {
        attempts++;
        continue;
      }

      // Check similarity with target word
      const targetSimilarity = await cosineSimilarity(randomWord, targetWord);
      const newProgress = Math.max(0, Math.min(100, (targetSimilarity + 0.2) / 0.45 * 100));

      // If we require progress improvement and the word doesn't improve progress, skip
      if (requireProgressImprovement && newProgress <= currentProgress) {
        attempts++;
        continue;
      }

      // If we found a valid hint, return it
      return randomWord;
    } catch (error) {
      console.error('Error calculating similarity:', error);
      attempts++;
      continue;
    }
  }

  return null;
};