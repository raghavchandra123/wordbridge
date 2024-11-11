import pako from 'pako';
import { WordDictionary } from './types';
import { loadWordChunk } from './chunkLoader';

let wordBaseformMap: { [key: string]: string } | null = null;
let commonWords: string[] = [];
let wordList: string[] = [];

const EXPECTED_VECTOR_DIMENSION = 300;

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
  console.log(`🔤 Getting vector for word: "${word}"`);
  if (!wordBaseformMap) {
    console.error('❌ Word baseform map not initialized - loadEmbeddings() must be called first');
    throw new Error('Word baseform map not initialized');
  }
  
  const baseform = wordBaseformMap[word];
  if (!baseform) {
    console.error(`❌ No baseform found for word: "${word}" in wordBaseformMap`);
    throw new Error(`No baseform found for word: "${word}"`);
  }
  
  console.log(`📝 Using baseform: "${baseform}" for word: "${word}"`);
  
  const chunkData = await loadWordChunk(baseform);
  if (!chunkData) {
    console.error(`❌ No chunk data found containing baseform: "${baseform}"`);
    throw new Error(`No chunk data found for baseform: "${baseform}"`);
  }

  const vector = chunkData[baseform];
  if (!vector) {
    console.error(`❌ Vector not found in chunk for baseform: "${baseform}"`);
    throw new Error(`Vector not found for baseform: "${baseform}"`);
  }

  if (vector.length !== EXPECTED_VECTOR_DIMENSION) {
    console.error(`❌ Invalid vector dimensionality for "${word}": got ${vector.length}, expected ${EXPECTED_VECTOR_DIMENSION}`);
    throw new Error(`Invalid vector dimensionality for "${word}"`);
  }

  console.log(`✅ Successfully loaded vector for word: "${word}" (baseform: "${baseform}", dimensions: ${vector.length})`);
  return vector;
};

export const cosineSimilarity = async (word1: string, word2: string): Promise<number> => {
  console.log(`\n📊 Calculating similarity between "${word1}" and "${word2}"`);
  
  const vec1 = await getWordVector(word1);
  const vec2 = await getWordVector(word2);
  
  if (!vec1 || !vec2) {
    throw new Error('Failed to get vectors for similarity calculation');
  }
  
  console.log(`✅ Found vectors for both words:
    - ${word1}: ${vec1.length} dimensions
    - ${word2}: ${vec2.length} dimensions`);
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    normA += vec1[i] * vec1[i];
    normB += vec2[i] * vec2[i];
  }
  
  if (normA === 0 || normB === 0) {
    console.error(`❌ Zero magnitude vector detected:
      - ${word1} magnitude: ${Math.sqrt(normA)}
      - ${word2} magnitude: ${Math.sqrt(normB)}`);
    throw new Error('Zero magnitude vector detected');
  }
  
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  
  if (isNaN(similarity)) {
    console.error(`❌ NaN similarity detected:
      - Dot product: ${dotProduct}
      - Norm A: ${normA}
      - Norm B: ${normB}
      - Calculation: ${dotProduct} / (${Math.sqrt(normA)} * ${Math.sqrt(normB)})`);
    throw new Error('NaN similarity detected');
  }
  
  console.log(`✅ Similarity calculation successful:
    - Dot product: ${dotProduct}
    - Norm A: ${Math.sqrt(normA)}
    - Norm B: ${Math.sqrt(normB)}
    - Final similarity: ${similarity}`);
  
  return similarity;
};

export const getWordList = (): string[] => wordList;
export const getBaseForm = (word: string): string | null => wordBaseformMap?.[word] || null;
export const isValidWord = (word: string): boolean => wordBaseformMap ? word in wordBaseformMap : false;