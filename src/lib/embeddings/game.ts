import { getWordList } from './loader';
import { cosineSimilarity } from './utils';
import { WordDictionary } from './types';

export const findRandomWordPair = async (dictionary: WordDictionary): Promise<[string, string]> => {
  console.log('Finding random word pair...');
  const wordList = getWordList();
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    const word1 = wordList[Math.floor(Math.random() * wordList.length)];
    const word2 = wordList[Math.floor(Math.random() * wordList.length)];
    
    if (word1 === word2) continue;
    
    const similarity = cosineSimilarity(word1, word2, dictionary);
    console.log('Checking word pair:', { word1, word2, similarity });
    
    if (similarity < 0.1) {
      console.log('Found suitable word pair:', { word1, word2, similarity });
      return [word1, word2];
    }
    
    attempts++;
  }
  
  throw new Error('Failed to find suitable word pair');
};