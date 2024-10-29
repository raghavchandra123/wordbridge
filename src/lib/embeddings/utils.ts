import { WordDictionary } from './types';

export const cosineSimilarity = (word1: string, word2: string, dictionary: WordDictionary): number => {
  if (!dictionary[word1] || !dictionary[word2]) {
    console.log('Missing vectors for words:', { word1, word2 });
    return 0;
  }

  const vec1 = dictionary[word1];
  const vec2 = dictionary[word2];
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    normA += vec1[i] * vec1[i];
    normB += vec2[i] * vec2[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const calculateProgress = (similarity: number): number => {
  const progress = ((similarity - 0.05) / (0.3 - 0.05)) * 100;
  return Math.max(0, Math.min(100, progress));
};