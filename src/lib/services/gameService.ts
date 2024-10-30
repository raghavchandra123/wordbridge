import { getWordList } from '../embeddings/loader';
import { cosineSimilarity } from '../embeddings';
import { GameState } from '../types';
import { CHAIN_SIMILARITY_THRESHOLD, PROGRESS_MIN_SIMILARITY } from '../constants';
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
  
  // Generate two different random indices using different seed modifications
  const startWordIndex = Math.floor(seededRandom(seed + "start") * wordList.length);
  const endWordIndex = Math.floor(seededRandom(seed + "end") * wordList.length);
  
  if (startWordIndex === endWordIndex) {
    // In the unlikely case they're the same, adjust the end index
    return [wordList[startWordIndex], wordList[(endWordIndex + 1) % wordList.length]];
  }
  
  const startWord = wordList[startWordIndex];
  const endWord = wordList[endWordIndex];
  
  console.log(`📊 Testing word pair: ${startWord} -> ${endWord}`);
  const similarity = await cosineSimilarity(startWord, endWord);
  console.log(`📊 Word pair similarity: ${similarity}`);
  
  if (similarity < PROGRESS_MIN_SIMILARITY) {
    console.log(`✅ Found suitable word pair: ${startWord} -> ${endWord}`);
    return [startWord, endWord];
  }
  
  // If similarity is too high, shift the end word
  return [startWord, wordList[(endWordIndex + 1) % wordList.length]];
};

export const validateWordForChain = async (
  word: string,
  previousWord: string,
  targetWord: string
): Promise<{ isValid: boolean; similarityToTarget: number; message?: string }> => {
  console.log(`🔍 Validating word "${word}" after "${previousWord}" towards "${targetWord}"`);
  
  const similarityToPrevious = await cosineSimilarity(previousWord, word);
  console.log(`📊 Similarity to previous word: ${similarityToPrevious}`);
  
  if (similarityToPrevious < CHAIN_SIMILARITY_THRESHOLD) {
    console.log(`🔄 Checking ConceptNet relation between "${previousWord}" and "${word}"`);
    const hasRelation = await checkConceptNetRelation(previousWord, word);
    console.log(`🔄 ConceptNet relation found: ${hasRelation}`);
    
    if (!hasRelation) {
      console.log(`❌ Word rejected - no similarity or ConceptNet relation`);
      return {
        isValid: false,
        similarityToTarget: 0,
        message: `Try a word more similar to "${previousWord}"`
      };
    }
    console.log(`✅ Word accepted via ConceptNet relation`);
  }
  
  const similarityToTarget = await cosineSimilarity(word, targetWord);
  console.log(`📊 Similarity to target word: ${similarityToTarget}`);
  
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
    wordProgresses: [],
    isComplete: false,
    score: 0
  };
};