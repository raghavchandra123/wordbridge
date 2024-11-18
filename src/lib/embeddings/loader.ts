import { WordDictionary } from './types';

let wordBaseformMap: { [key: string]: string } | null = null;
let commonWords: string[] = [];
let wordList: string[] = [];
let wordVectors: WordDictionary = {};

const VECTOR_SIZE = 300;

export const loadEmbeddings = async () => {
  console.log("🔄 Loading initial embeddings data...");
  
  if (wordBaseformMap && commonWords.length > 0) {
    console.log("✅ Using cached embeddings data");
    return true;
  }
  
  try {
    console.log("📖 Loading common words list...");
    const commonWordsResponse = await fetch('/data/common_words.txt');
    const commonWordsText = await commonWordsResponse.text();
    commonWords = commonWordsText.split('\n').filter(word => word.trim());
    console.log(`✅ Loaded ${commonWords.length} common words`);
    
    console.log("📖 Loading word baseform mappings...");
    const wordBaseformResponse = await fetch('/data/word_baseform.json');
    wordBaseformMap = await wordBaseformResponse.json();
    console.log("✅ Word baseform mappings loaded");
    
    wordList = commonWords.filter(word => wordBaseformMap?.[word]);
    console.log(`✅ Generated word list with ${wordList.length} words`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to load initial data:', error);
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

  // If we haven't loaded this word's vector yet
  if (!wordVectors[baseform]) {
    try {
      const vectorResponse = await fetch(`/data/words/${baseform}.vec`);
      const vectorData = await vectorResponse.arrayBuffer();
      wordVectors[baseform] = new Float32Array(vectorData);
    } catch (error) {
      console.error(`Failed to load vector for word "${baseform}":`, error);
      throw error;
    }
  }

  const vector = wordVectors[baseform];
  if (!vector) {
    throw new Error(`Vector not found for baseform: "${baseform}"`);
  }

  if (vector.length !== VECTOR_SIZE) {
    throw new Error(`Invalid vector dimensionality for "${word}"`);
  }

  return vector;
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