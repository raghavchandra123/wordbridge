import { VECTOR_SIZE } from './constants';

let wordBaseformMap: { [key: string]: string } | null = null;
let commonWords: string[] = [];
let wordList: string[] = [];

export const loadEmbeddings = async () => {
  if (wordBaseformMap && commonWords.length > 0) {
    return true;
  }
  
  try {
    const commonWordsResponse = await fetch('/data/common_words.txt');
    const commonWordsText = await commonWordsResponse.text();
    commonWords = commonWordsText.split('\n').filter(word => word.trim());
    
    const wordBaseformResponse = await fetch('/data/word_baseform.json');
    wordBaseformMap = await wordBaseformResponse.json();
    
    wordList = commonWords.filter(word => wordBaseformMap?.[word]);
    
    return true;
  } catch (error) {
    console.error('Failed to load initial data:', error);
    throw error;
  }
};

export const getWordVector = async (word: string): Promise<Float32Array | null> => {
  if (!wordBaseformMap) {
    throw new Error('Word baseform map not initialized');
  }
  
  const baseform = wordBaseformMap[word];
  if (!baseform) {
    throw new Error(`No baseform found for word: "${word}"`);
  }
  
  const response = await fetch(`/data/words/${baseform}.vec`);
  if (!response.ok) {
    throw new Error(`Failed to fetch vector for word: ${baseform}`);
  }
  
  const buffer = await response.arrayBuffer();
  const dataView = new DataView(buffer);
  
  const vectorLength = dataView.getUint32(0, true);
  if (vectorLength !== VECTOR_SIZE) {
    throw new Error(`Invalid vector length for "${word}": got ${vectorLength}, expected ${VECTOR_SIZE}`);
  }
  
  return new Float32Array(buffer.slice(4));
};

export const cosineSimilarity = async (word1: string, word2: string): Promise<number> => {
  const vec1 = await getWordVector(word1);
  const vec2 = await getWordVector(word2);
  
  if (!vec1 || !vec2) {
    throw new Error('Failed to get vectors for similarity calculation');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    normA += vec1[i] * vec1[i];
    normB += vec2[i] * vec2[i];
  }
  
  if (normA === 0 || normB === 0) {
    throw new Error('Zero magnitude vector detected');
  }
  
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  
  if (isNaN(similarity)) {
    throw new Error('NaN similarity detected');
  }
  
  return similarity;
};

export const getWordList = (): string[] => wordList;
export const getBaseForm = (word: string): string | null => wordBaseformMap?.[word] || null;
export const isValidWord = (word: string): boolean => wordBaseformMap ? word in wordBaseformMap : false;