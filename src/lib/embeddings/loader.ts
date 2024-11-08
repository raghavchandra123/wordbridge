import { WordDictionary } from './types';
import { loadWordChunk } from './chunkLoader';
import { VECTOR_SIZE } from './constants';

let wordBaseformMap: { [key: string]: string } | null = null;
let commonWords: string[] = [];
let wordList: string[] = [];

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
  
  try {
    const response = await fetch(`/data/words/${baseform}.vec`);
    if (!response.ok) {
      throw new Error(`Failed to fetch vector for word: ${baseform}`);
    }
    
    const buffer = await response.arrayBuffer();
    const dataView = new DataView(buffer);
    
    // Read vector length (first 4 bytes)
    const vectorLength = dataView.getUint32(0, true);
    if (vectorLength !== VECTOR_SIZE) {
      throw new Error(`Invalid vector length for "${word}": got ${vectorLength}, expected ${VECTOR_SIZE}`);
    }
    
    // Read the vector data (float32 array)
    const vector = new Float32Array(buffer.slice(4));
    console.log(`✅ Successfully loaded vector for word: "${word}" (baseform: "${baseform}", dimensions: ${vector.length})`);
    return vector;
  } catch (error) {
    console.error(`❌ Error loading vector for word "${word}":`, error);
    throw error;
  }
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