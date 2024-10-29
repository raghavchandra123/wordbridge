import { WordDictionary } from './types';

let dictionary: WordDictionary | null = null;
let wordList: string[] = [];
let wordBaseformMap: { [key: string]: string } | null = null;
let commonWords: string[] = [];

export const loadEmbeddings = async () => {
  if (dictionary && wordBaseformMap && commonWords.length > 0) {
    return dictionary;
  }
  
  try {
    const commonWordsResponse = await fetch('/data/common_words.txt');
    if (!commonWordsResponse.ok) throw new Error('Failed to load common words');
    const commonWordsText = await commonWordsResponse.text();
    commonWords = commonWordsText.split('\n').filter(word => word.trim());
    
    const wordBaseformResponse = await fetch('/data/word_baseform.json');
    if (!wordBaseformResponse.ok) throw new Error('Failed to load word baseform mappings');
    wordBaseformMap = await wordBaseformResponse.json();
    
    const embedsResponse = await fetch('/data/concept_embeds.json');
    if (!embedsResponse.ok) throw new Error('Failed to load concept embeddings');
    const rawData = await embedsResponse.json();
    
    dictionary = Object.fromEntries(
      Object.entries(rawData).map(([word, vector]) => [word, new Float32Array(vector as number[])])
    );
    
    wordList = commonWords.filter(word => {
      const baseform = wordBaseformMap?.[word];
      return baseform && dictionary?.[baseform] !== undefined;
    });
    
    return dictionary;
  } catch (error) {
    console.error('Failed to load embeddings:', error);
    throw error;
  }
};

export const getWordList = (): string[] => wordList;
export const getBaseForm = (word: string): string | null => wordBaseformMap?.[word] || null;
export const isValidWord = (word: string): boolean => wordBaseformMap ? word in wordBaseformMap : false;

export const cosineSimilarity = (word1: string, word2: string): number => {
  if (!dictionary || !wordBaseformMap) return 0;

  const base1 = wordBaseformMap[word1];
  const base2 = wordBaseformMap[word2];
  
  if (!base1 || !base2 || !dictionary[base1] || !dictionary[base2]) {
    return 0;
  }

  const vec1 = dictionary[base1];
  const vec2 = dictionary[base2];
  
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
  const progress = ((similarity - 0.1) / (0.7 - 0.1)) * 100;
  return Math.max(0, Math.min(100, progress));
};

export const findRandomWordPair = async (): Promise<[string, string]> => {
  const wordList = getWordList();
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    const word1 = wordList[Math.floor(Math.random() * wordList.length)];
    const word2 = wordList[Math.floor(Math.random() * wordList.length)];
    
    if (word1 === word2) continue;
    
    const similarity = cosineSimilarity(word1, word2);
    
    if (similarity < 0.1) {
      return [word1, word2];
    }
    
    attempts++;
  }
  
  throw new Error('Failed to find suitable word pair');
};