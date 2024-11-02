import { getWordList } from '../embeddings/loader';
import { cosineSimilarity } from '../embeddings';
import { GameState } from '../types';
import { 
  WORD_PAIR_MIN_SIMILARITY, 
  ADJACENT_WORD_MIN_SIMILARITY,
} from '../constants';
import { checkConceptNetRelation } from '../conceptnet';
import { calculateProgress } from '../embeddings/utils';

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
    
    if (similarity < WORD_PAIR_MIN_SIMILARITY) {
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
  console.log(`🔍 Validating word "${word}" for chain (previous: "${previousWord}", target: "${targetWord}")`);
  
  // Start both checks in parallel for previous word
  const [conceptNetResult, similarityToPrevious] = await Promise.all([
    checkConceptNetRelation(previousWord, word),
    cosineSimilarity(previousWord, word)
  ]);

  const isValidWithPrevious = conceptNetResult || similarityToPrevious >= ADJACENT_WORD_MIN_SIMILARITY;
  
  if (!isValidWithPrevious) {
    console.log(`❌ Word "${word}" is not valid with previous word`);
    return {
      isValid: false,
      similarityToTarget: 0,
      message: `Try a word more similar to "${previousWord}"`
    };
  }

  // Calculate similarity to target for progress, but don't block based on it
  const similarityToTarget = await cosineSimilarity(word, targetWord);
  console.log(`✅ Word "${word}" is valid. Similarity to target: ${similarityToTarget}`);
  
  return { 
    isValid: true, 
    similarityToTarget
  };
};

export const updateGameWithNewWord = (
  game: GameState,
  word: string,
  similarityToTarget: number,
  editingIndex: number | null
): GameState => {
  const progress = calculateProgress(similarityToTarget);
  
  if (editingIndex !== null) {
    // When editing an existing word
    const newChain = [...game.currentChain.slice(0, editingIndex), word];
    const newProgresses = [...game.wordProgresses];
    if (editingIndex > 0) {
      newProgresses[editingIndex - 1] = progress;
    }
    return {
      ...game,
      currentChain: newChain,
      wordProgresses: newProgresses,
      score: newChain.length - 1
    };
  } else {
    // When adding a new word
    return {
      ...game,
      currentChain: [...game.currentChain, word],
      wordProgresses: [...game.wordProgresses, progress],
      score: game.currentChain.length
    };
  }
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