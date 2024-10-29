import { WordDictionary, WordEmbedding } from './types';

let dictionary: WordDictionary | null = null;
let wordList: string[] = [];
let wordBaseformMap: { [key: string]: string } | null = null;

export const loadEmbeddings = async () => {
  if (dictionary && wordBaseformMap) return dictionary;
  
  try {
    // Load word to baseform mapping
    const wordBaseformResponse = await fetch('/data/word_baseform.json');
    wordBaseformMap = await wordBaseformResponse.json();
    
    // Load baseform to vector mapping
    const embedsResponse = await fetch('/data/concept_embeds.json');
    dictionary = await embedsResponse.json();
    
    // Create word list from all valid words (including variations)
    wordList = Object.keys(wordBaseformMap);
    
    return dictionary;
  } catch (error) {
    console.error('Failed to load embeddings, falling back to test dictionary');
    // Fallback to test dictionary if files aren't found
    dictionary = {
      "cat": { vector: new Float32Array(Array(300).fill(0.1)) },
      "dog": { vector: new Float32Array(Array(300).fill(0.2)) },
      "animal": { vector: new Float32Array(Array(300).fill(0.15)) },
      "pet": { vector: new Float32Array(Array(300).fill(0.18)) }
    };
    wordList = Object.keys(dictionary);
    return dictionary;
  }
};

export const getWordList = async (): Promise<string[]> => {
  if (wordList.length) return wordList;
  await loadEmbeddings();
  return wordList;
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
    
    // Get base forms for the words
    const base1 = wordBaseformMap?.[word1] || word1;
    const base2 = wordBaseformMap?.[word2] || word2;
    
    const similarity = cosineSimilarity(dictionary![base1], dictionary![base2]);
    if (similarity < 0.1) {
      return [word1, word2];
    }
    
    attempts++;
  }
  
  // If we can't find a pair, return a default pair
  return ["cat", "dog"];
};
