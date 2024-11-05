import { getWordList, getBaseForm } from './loader';
import { cosineSimilarity } from '../embeddings';
import { WordDictionary } from './types';

interface WordPairOptions {
  minThreshold?: number;
  maxThreshold?: number;
}

export const findRandomWordPair = async (options: WordPairOptions = {}): Promise<[string, string]> => {
  const wordList = getWordList();
  let attempts = 0;
  const maxAttempts = 300;
  
  while (attempts < maxAttempts) {
    const rawWord1 = wordList[Math.floor(Math.random() * wordList.length)];
    const rawWord2 = wordList[Math.floor(Math.random() * wordList.length)];
    
    const word1 = getBaseForm(rawWord1) || rawWord1;
    const word2 = getBaseForm(rawWord2) || rawWord2;
    
    if (word1 === word2) continue;
    
    const similarity = await cosineSimilarity(word1, word2);
    
    const minThreshold = options.minThreshold ?? 0;
    const maxThreshold = options.maxThreshold ?? 0.08;
    
    if (similarity >= minThreshold && similarity <= maxThreshold) {
      console.log(`Found word pair with similarity: ${similarity.toFixed(3)}`);
      return [word1, word2];
    }
    
    attempts++;
  }
  
  throw new Error('Failed to find suitable word pair');
};