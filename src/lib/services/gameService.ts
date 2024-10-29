import { getWordList } from '../embeddings/loader';
import { cosineSimilarity } from '../embeddings';
import { GameState } from '../types';
import { SIMILARITY_THRESHOLDS } from '../constants';

// Find a random pair of words that are sufficiently dissimilar
export const findRandomWordPair = async (): Promise<[string, string]> => {
  const wordList = getWordList();
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    const word1 = wordList[Math.floor(Math.random() * wordList.length)];
    const word2 = wordList[Math.floor(Math.random() * wordList.length)];
    
    if (word1 === word2) continue;
    
    const similarity = await cosineSimilarity(word1, word2);
    if (similarity < SIMILARITY_THRESHOLDS.MIN) {
      return [word1, word2];
    }
    
    attempts++;
  }
  
  throw new Error('Failed to find suitable word pair');
};

// Check if a word is valid for the chain
export const validateWordForChain = async (
  word: string,
  previousWord: string,
  targetWord: string
): Promise<{ isValid: boolean; similarityToTarget: number; message?: string }> => {
  const similarity = await cosineSimilarity(previousWord, word);
  const similarityToTarget = await cosineSimilarity(word, targetWord);
  
  if (similarity < SIMILARITY_THRESHOLDS.MIN && similarityToTarget < SIMILARITY_THRESHOLDS.TARGET) {
    return {
      isValid: false,
      similarityToTarget,
      message: `Try a word that's more closely related to "${previousWord}"`
    };
  }
  
  return {
    isValid: true,
    similarityToTarget
  };
};

// Initialize a new game state
export const initializeGame = async (): Promise<GameState> => {
  const [startWord, targetWord] = await findRandomWordPair();
  return {
    startWord,
    targetWord,
    currentChain: [startWord],
    isComplete: false,
    score: 0
  };
};