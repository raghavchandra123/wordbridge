import { getWordList } from '../embeddings/loader';
import { cosineSimilarity } from '../embeddings';
import { GameState } from '../types';
import { SIMILARITY_THRESHOLDS } from '../constants';

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
  console.log("🎲 Finding daily word pair...");
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
    
    if (similarity < SIMILARITY_THRESHOLDS.MIN) {
      return [wordList[word1Index], wordList[word2Index]];
    }
    
    attempts++;
  } while (attempts < maxAttempts);
  
  throw new Error('Failed to find suitable word pair');
};

// Check if a word is valid for the chain
export const validateWordForChain = async (
  word: string,
  previousWord: string,
  targetWord: string
): Promise<{ isValid: boolean; similarityToTarget: number; message?: string }> => {
  console.log(`🔍 Validating word "${word}" in chain...`);
  console.log(`  Previous word: "${previousWord}"`);
  console.log(`  Target word: "${targetWord}"`);
  
  const similarity = await cosineSimilarity(previousWord, word);
  const similarityToTarget = await cosineSimilarity(word, targetWord);
  
  console.log(`📊 Similarities:`);
  console.log(`  To previous word: ${similarity}`);
  console.log(`  To target word: ${similarityToTarget}`);
  
  if (similarity < SIMILARITY_THRESHOLDS.MIN && similarityToTarget < SIMILARITY_THRESHOLDS.TARGET) {
    console.log(`❌ Word "${word}" not similar enough to continue chain`);
    return {
      isValid: false,
      similarityToTarget,
      message: `Try a word that's more closely related to "${previousWord}"`
    };
  }
  
  console.log(`✅ Word "${word}" is valid for the chain`);
  return {
    isValid: true,
    similarityToTarget
  };
};

// Initialize a new game state
export const initializeGame = async (): Promise<GameState> => {
  console.log("🎮 Initializing new game...");
  const [startWord, targetWord] = await findRandomWordPair();
  console.log(`✅ Game initialized with start word "${startWord}" and target word "${targetWord}"`);
  return {
    startWord,
    targetWord,
    currentChain: [startWord],
    isComplete: false,
    score: 0
  };
};
