import { getWordList } from '../embeddings/loader';
import { cosineSimilarity } from '../embeddings';
import { GameState } from '../types';
import { SIMILARITY_THRESHOLDS } from '../constants';

// Find a random pair of words that are sufficiently dissimilar
export const findRandomWordPair = async (): Promise<[string, string]> => {
  console.log("🎲 Finding random word pair...");
  const wordList = getWordList();
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    const word1 = wordList[Math.floor(Math.random() * wordList.length)];
    const word2 = wordList[Math.floor(Math.random() * wordList.length)];
    
    if (word1 === word2) {
      console.log(`⚠️ Same words selected (${word1}), trying again...`);
      continue;
    }
    
    console.log(`🔄 Attempt ${attempts + 1}: Testing pair "${word1}" and "${word2}"`);
    const similarity = await cosineSimilarity(word1, word2);
    console.log(`📊 Similarity between "${word1}" and "${word2}": ${similarity}`);
    
    if (similarity < SIMILARITY_THRESHOLDS.MIN) {
      console.log(`✅ Found suitable word pair: "${word1}" → "${word2}"`);
      return [word1, word2];
    }
    
    console.log(`❌ Words too similar (${similarity}), trying again...`);
    attempts++;
  }
  
  console.error(`❌ Failed to find suitable word pair after ${maxAttempts} attempts`);
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