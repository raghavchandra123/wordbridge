import { getWordList, cosineSimilarity } from '../embeddings';
import { ADJACENT_WORD_MIN_SIMILARITY } from '../constants';

export const generateHint = async (
  previousWord: string,
  targetWord: string,
  currentProgress: number,
  usedWords: string[]
): Promise<string | null> => {
  const commonWords = getWordList();
  const maxAttempts = 200; // Total 200 attempts (100 with stricter threshold, 100 with normal threshold)
  let attempts = 0;
  let requireProgressImprovement = true;
  let stricterThreshold = true; // First 100 attempts use 1.5x threshold

  while (attempts < maxAttempts) {
    // After 100 attempts, remove the progress improvement requirement and relax threshold
    if (attempts === 100) {
      requireProgressImprovement = false;
      stricterThreshold = false;
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
      const requiredSimilarity = stricterThreshold 
        ? ADJACENT_WORD_MIN_SIMILARITY * 1.5 
        : ADJACENT_WORD_MIN_SIMILARITY;

      if (prevSimilarity < requiredSimilarity) {
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