import { getWordList } from './loader';
import { cosineSimilarity } from '../embeddings';
import { WordDictionary } from './types';

export const findRandomWordPair = async (_dictionary: WordDictionary): Promise<[string, string]> => {
  const wordList = getWordList();
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    const word1 = wordList[Math.floor(Math.random() * wordList.length)];
    const word2 = wordList[Math.floor(Math.random() * wordList.length)];
    
    if (word1 === word2) continue;
    
    const similarity = await cosineSimilarity(word1, word2);
    
    if (similarity < 0.1) {
      return [word1, word2];
    }
    
    attempts++;
  }
  
  throw new Error('Failed to find suitable word pair');
};