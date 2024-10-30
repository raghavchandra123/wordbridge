import { getWordList } from '../embeddings/loader';
import { cosineSimilarity } from '../embeddings';
import { GameState } from '../types';
import { SIMILARITY_THRESHOLD } from '../constants/colors';
import { checkConceptNetRelation } from '../conceptnet';

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
    
    if (similarity < SIMILARITY_THRESHOLD) {
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
  console.log(`🔍 Validating word "${word}" in chain...`);
  
  // Check similarity with previous word
  const similarityToPrevious = await cosineSimilarity(previousWord, word);
  console.log(`📊 Similarity to previous word: ${similarityToPrevious}`);
  
  // If similarity is below threshold, check ConceptNet
  if (similarityToPrevious < SIMILARITY_THRESHOLD) {
    const hasRelation = await checkConceptNetRelation(previousWord, word);
    console.log(`🔗 ConceptNet relation check: ${hasRelation ? "Found" : "Not found"}`);
    
    if (!hasRelation) {
      return {
        isValid: false,
        similarityToTarget: 0,
        message: `Try a word that's more closely related to "${previousWord}"`
      };
    }
  }
  
  // If we get here, either similarity was good or ConceptNet found a relation
  // Now check similarity to target
  const similarityToTarget = await cosineSimilarity(word, targetWord);
  console.log(`📊 Similarity to target word: ${similarityToTarget}`);
  
  // For target word, also check ConceptNet if similarity is low
  if (similarityToTarget < SIMILARITY_THRESHOLD) {
    const hasTargetRelation = await checkConceptNetRelation(word, targetWord);
    if (!hasTargetRelation) {
      return {
        isValid: false,
        similarityToTarget,
        message: `This word isn't getting closer to the target word "${targetWord}"`
      };
    }
  }
  
  return { 
    isValid: true, 
    similarityToTarget 
  };
};

export const initializeGame = async (): Promise<GameState> => {
  console.log("🎮 Initializing new game...");
  const [startWord, targetWord] = await findDailyWordPair();
  console.log(`✅ Game initialized with start word "${startWord}" and target word "${targetWord}"`);
  return {
    startWord,
    targetWord,
    currentChain: [startWord],
    isComplete: false,
    score: 0
  };
};
