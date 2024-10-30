import { getWordList } from './loader';
import { cosineSimilarity } from '../embeddings';
import { WordDictionary } from './types';
import { PAIR_SIMILARITY_THRESHOLD } from '../constants';

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

export const findRandomWordPair = async (_dictionary: WordDictionary): Promise<[string, string]> => {
  const wordList = getWordList();
  const seed = getDateSeed();
  const maxAttempts = 100;
  
  // Generate deterministic indices for both start and end words
  const startWordIndex = Math.floor(seededRandom(seed) * wordList.length);
  const startWord = wordList[startWordIndex];
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate deterministic end word index based on seed and attempt number
    const endWordIndex = Math.floor(seededRandom(seed + attempt.toString()) * wordList.length);
    
    if (endWordIndex === startWordIndex) continue;
    
    const endWord = wordList[endWordIndex];
    const similarity = await cosineSimilarity(startWord, endWord);
    
    console.log(`Attempt ${attempt + 1}: Testing pair ${startWord} -> ${endWord} (similarity: ${similarity})`);
    
    if (similarity < PAIR_SIMILARITY_THRESHOLD) {
      console.log(`Found suitable pair: ${startWord} -> ${endWord} (similarity: ${similarity})`);
      return [startWord, endWord];
    }
  }
  
  throw new Error('Failed to find suitable word pair after maximum attempts');
};