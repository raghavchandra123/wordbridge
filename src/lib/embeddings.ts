import { WordDictionary, WordEmbedding } from './types';

let dictionary: WordDictionary | null = null;
let wordList: string[] = [];

// For development, we'll use a small test dictionary
// This will be replaced with proper chunked binary loading
const TEST_DICTIONARY: WordDictionary = {
  "cat": {
    vector: new Float32Array(Array(300).fill(0.1))
  },
  "dog": {
    vector: new Float32Array(Array(300).fill(0.2))
  },
  "animal": {
    vector: new Float32Array(Array(300).fill(0.15))
  },
  "pet": {
    vector: new Float32Array(Array(300).fill(0.18))
  }
};

export const loadEmbeddings = async () => {
  if (dictionary) return dictionary;
  
  // For now, we'll use the test dictionary
  // Later this will be replaced with actual binary chunk loading
  dictionary = TEST_DICTIONARY;
  wordList = Object.keys(dictionary);
  return dictionary;
};

export const getWordList = async (): Promise<string[]> => {
  if (wordList.length) return wordList;
  await loadEmbeddings();
  return Object.keys(dictionary!);
};

export const cosineSimilarity = (a: WordEmbedding, b: WordEmbedding): number => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < 300; i++) {
    dotProduct += a.vector[i] * b.vector[i];
    normA += a.vector[i] * a.vector[i];
    normB += b.vector[i] * b.vector[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const calculateProgress = (similarity: number): number => {
  const progress = ((similarity - 0.1) / (0.7 - 0.1)) * 100;
  return Math.max(0, Math.min(100, progress));
};

export const findRandomWordPair = async (): Promise<[string, string]> => {
  const words = await getWordList();
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    const word1 = words[Math.floor(Math.random() * words.length)];
    const word2 = words[Math.floor(Math.random() * words.length)];
    
    if (word1 === word2) continue;
    
    const similarity = cosineSimilarity(dictionary![word1], dictionary![word2]);
    if (similarity < 0.1) {
      return [word1, word2];
    }
    
    attempts++;
  }
  
  // If we can't find a pair, return a default pair from our test dictionary
  return ["cat", "dog"];
};