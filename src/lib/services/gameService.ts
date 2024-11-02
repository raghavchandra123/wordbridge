import { getWordList } from '../embeddings/loader';
import { cosineSimilarity } from '../embeddings';
import { GameState } from '../types';
import { 
  WORD_PAIR_MIN_SIMILARITY, 
  ADJACENT_WORD_MIN_SIMILARITY,
  TARGET_WORD_MIN_SIMILARITY
} from '../constants';
import { checkConceptNetRelation } from '../conceptnet';
import { calculateProgress } from '../embeddings/utils';
import { toast } from '@/components/ui/use-toast';
import { pauseBackgroundLoading, resumeBackgroundLoading } from '../embeddings/backgroundLoader';

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
  console.log(`🔍 Starting validation sequence for word "${word}":
    - Previous word: "${previousWord}"
    - Target word: "${targetWord}"`);
  
  // Pause background loading during validation
  pauseBackgroundLoading();
  
  try {
    // Step 1: Run previous word checks in parallel
    console.log(`📊 Step 1: Running parallel checks with previous word "${previousWord}"...`);
    
    let previousWordValid = false;
    
    // Create a race between similarity and ConceptNet checks
    try {
      await Promise.race([
        // Similarity check
        cosineSimilarity(previousWord, word).then(similarity => {
          if (similarity >= ADJACENT_WORD_MIN_SIMILARITY) {
            console.log(`✅ Similarity check passed: ${similarity.toFixed(3)}`);
            previousWordValid = true;
            return true;
          }
          return false;
        }),
        
        // ConceptNet check
        checkConceptNetRelation(previousWord, word).then(hasRelation => {
          if (hasRelation) {
            console.log('✅ ConceptNet relation found');
            previousWordValid = true;
            return true;
          }
          return false;
        })
      ]);
    } catch (error) {
      console.error('❌ Error during previous word validation:', error);
    }

    if (!previousWordValid) {
      console.log(`❌ Word "${word}" failed previous word validation`);
      return {
        isValid: false,
        similarityToTarget: 0,
        message: `Try a word more similar to "${previousWord}"`
      };
    }

    // Step 2: Run both target word checks in parallel and wait for both to complete
    console.log(`📊 Step 2: Running target word checks for "${targetWord}"...`);
    
    const [conceptNetWithTarget, similarityToTarget] = await Promise.all([
      checkConceptNetRelation(word, targetWord),
      cosineSimilarity(word, targetWord)
    ]);

    console.log(`📊 Target word check results:
      - ConceptNet: ${conceptNetWithTarget ? "✅ Found" : "❌ Not found"}
      - Similarity: ${similarityToTarget.toFixed(3)}`);

    return { 
      isValid: true, 
      similarityToTarget
    };
  } finally {
    // Resume background loading after validation is complete
    resumeBackgroundLoading();
  }
};

export const updateGameWithNewWord = (
  game: GameState,
  word: string,
  similarityToTarget: number,
  editingIndex: number | null
): GameState => {
  const progress = calculateProgress(similarityToTarget);
  
  console.log(`📝 Updating game state with word "${word}":
    - Similarity to target: ${similarityToTarget}
    - Progress: ${progress}
    - Editing index: ${editingIndex}`);
  
  if (editingIndex !== null) {
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
