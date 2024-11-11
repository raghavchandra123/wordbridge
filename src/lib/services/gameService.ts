import { getWordList } from '../embeddings/loader';
import { cosineSimilarity } from '../embeddings';
import { GameState } from '../types';
import { INITIAL_MIN_THRESHOLD, INITIAL_THRESHOLD_RANGE } from '../constants';
import { validateWordWithTarget, validateWordWithPrevious } from './wordValidationService';

const getDateSeed = () => {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
};

const seededRandom = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
};

export const findDailyWordPair = async (): Promise<[string, string]> => {
  const wordList = getWordList();
  const seed = getDateSeed();
  const random = seededRandom(seed);
  
  const word1Index = Math.floor(random * wordList.length);
  let word2Index;
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    word2Index = Math.floor(seededRandom(seed + attempts) * wordList.length);
    if (word1Index === word2Index) continue;
    
    const similarity = await cosineSimilarity(
      wordList[word1Index],
      wordList[word2Index]
    );
    
    if (similarity >= INITIAL_MIN_THRESHOLD && similarity <= INITIAL_MIN_THRESHOLD + INITIAL_THRESHOLD_RANGE) {
      return [wordList[word1Index], wordList[word2Index]];
    }
    
    attempts++;
  } while (attempts < maxAttempts);
  
  throw new Error('Failed to find suitable word pair');
};

export const validateWordForChain = async (
  word: string,
  previousWord: string,
  targetWord: string
): Promise<{ isValid: boolean; similarityToTarget: number; message?: string }> => {
  const previousValidation = await validateWordWithPrevious(word, previousWord);
  
  if (!previousValidation.isValid) {
    return {
      isValid: false,
      similarityToTarget: 0,
      message: `Try a word more similar to "${previousWord}"`
    };
  }

  const targetValidation = await validateWordWithTarget(word, targetWord);
  
  return { 
    isValid: true,
    similarityToTarget: targetValidation.similarity
  };
};

export const initializeGame = async (): Promise<GameState> => {
  const [startWord, targetWord] = await findDailyWordPair();
  const similarity = await cosineSimilarity(startWord, targetWord);
  const progress = Math.max(0, Math.min(100, (similarity + 0.2) / 0.45 * 100));
  const today = new Date().toISOString().split('T')[0];
  
  return {
    startWord,
    targetWord,
    currentChain: [startWord],
    wordProgresses: [],
    isComplete: false,
    score: 0,
    initialProgress: progress,
    metadata: {
      seedDate: today
    }
  };
};