import pako from 'pako';
import { WordDictionary } from './types';
import { loadWordChunk } from './chunkLoader';

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

// Get the vector for a specific word
export const getWordVector = async (word: string): Promise<Float32Array | null> => {
  console.log(`🔤 Getting vector for word: "${word}"`);
  if (!wordBaseformMap) {
    console.log('❌ Word baseform map not initialized');
    return null;
  }
  
  const baseform = wordBaseformMap[word];
  if (!baseform) {
    console.log(`❌ No baseform found for word: "${word}"`);
    return null;
  }
  
  console.log(`📝 Using baseform: "${baseform}" for word: "${word}"`);
  
  const chunkData = await loadWordChunk(baseform);
  return chunkData?.[baseform] || null;
};

// Calculate cosine similarity between two words
export const cosineSimilarity = async (word1: string, word2: string): Promise<number> => {
  console.log(`📊 Calculating similarity between "${word1}" and "${word2}"`);
  
  const vec1 = await getWordVector(word1);
  const vec2 = await getWordVector(word2);
  
  if (!vec1 || !vec2) {
    console.log(`❌ Could not find vectors for both words`);
    return 0;
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    normA += vec1[i] * vec1[i];
    normB += vec2[i] * vec2[i];
  }
  
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  console.log(`✅ Similarity between "${word1}" and "${word2}": ${similarity}`);
  return similarity;
};

export const getWordList = (): string[] => wordList;
export const getBaseForm = (word: string): string | null => wordBaseformMap?.[word] || null;
export const isValidWord = (word: string): boolean => wordBaseformMap ? word in wordBaseformMap : false;