import { WordDictionary } from './types';
import { loadWordChunk } from './chunkLoader';

let wordBaseformMap: { [key: string]: string } | null = null;
let commonWords: string[] = [];
let wordList: string[] = [];

export const loadEmbeddings = async () => {
  if (wordBaseformMap && commonWords.length > 0) {
    return true;
  }
  
  try {
    const commonWordsResponse = await fetch('/data/common_words.txt');
    if (!commonWordsResponse.ok) throw new Error('Failed to load common words');
    const commonWordsText = await commonWordsResponse.text();
    commonWords = commonWordsText.split('\n').filter(word => word.trim());
    
    const wordBaseformResponse = await fetch('/data/word_baseform.json');
    if (!wordBaseformResponse.ok) throw new Error('Failed to load word baseform mappings');
    wordBaseformMap = await wordBaseformResponse.json();
    
    wordList = commonWords.filter(word => wordBaseformMap?.[word]);
    
    return true;
  } catch (error) {
    console.error('Failed to load initial data:', error);
    throw error;
  }
};

export const getWordList = (): string[] => wordList;
export const getBaseForm = (word: string): string | null => wordBaseformMap?.[word] || null;
export const isValidWord = (word: string): boolean => wordBaseformMap ? word in wordBaseformMap : false;

let cachedChunk: { words: WordDictionary; firstWord: string; lastWord: string } | null = null;

export const getWordVector = async (word: string): Promise<Float32Array | null> => {
  if (!wordBaseformMap) return null;
  
  const baseform = wordBaseformMap[word];
  if (!baseform) return null;
  
  // Check if word is in cached chunk
  if (cachedChunk && baseform >= cachedChunk.firstWord && baseform <= cachedChunk.lastWord) {
    return cachedChunk.words[baseform] || null;
  }
  
  const chunkData = await loadWordChunk(baseform);
  if (!chunkData) return null;
  
  const words = Object.keys(chunkData);
  cachedChunk = {
    words: chunkData,
    firstWord: words[0],
    lastWord: words[words.length - 1]
  };
  
  return chunkData[baseform] || null;
};

export const cosineSimilarity = async (word1: string, word2: string): Promise<number> => {
  const vec1 = await getWordVector(word1);
  const vec2 = await getWordVector(word2);
  
  if (!vec1 || !vec2) return 0;
  
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