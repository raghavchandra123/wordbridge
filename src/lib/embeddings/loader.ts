import { WordDictionary } from './types';
import { VECTOR_SIZE } from './constants';

let wordBaseformMap: { [key: string]: string } | null = null;
let commonWords: string[] = [];
let wordList: string[] = [];
let wordVectors: { [key: string]: Float32Array } = {};

export const loadEmbeddings = async () => {
  try {
    console.log("🔄 Loading initial embeddings data...");
    
    console.log("📖 Loading common words list...");
    const commonWordsResponse = await fetch('/data/common_words.txt');
    const commonWordsText = await commonWordsResponse.text();
    commonWords = commonWordsText.split('\n').filter(Boolean);
    console.log(`✅ Loaded ${commonWords.length} common words`);
    
    console.log("📖 Loading word baseform mappings...");
    const wordBaseformResponse = await fetch('/data/word_baseform.json');
    wordBaseformMap = await wordBaseformResponse.json();
    console.log("✅ Word baseform mappings loaded");
    
    wordList = commonWords.filter(word => wordBaseformMap?.[word]);
    console.log(`✅ Generated word list with ${wordList.length} words`);
    
  } catch (error) {
    console.error("❌ Error loading embeddings:", error);
    throw error;
  }
};

export const getWordList = () => wordList;

export const isValidWord = (word: string): boolean => {
  return !!wordBaseformMap?.[word.toLowerCase()];
};

export const getBaseForm = (word: string): string | null => {
  return wordBaseformMap?.[word.toLowerCase()] || null;
};

export const getWordVector = async (word: string): Promise<Float32Array> => {
  console.log(`🔍 Getting vector for word: "${word}"`);
  const baseform = getBaseForm(word);
  
  if (!baseform) {
    console.error(`❌ No baseform found for word: "${word}"`);
    throw new Error(`No baseform found for word: "${word}"`);
  }

  console.log(`📝 Base form for "${word}" is "${baseform}"`);

  // If we haven't loaded this word's vector yet
  if (!wordVectors[baseform]) {
    try {
      console.log(`📥 Loading vector file for word "${baseform}"`);
      const vectorResponse = await fetch(`/data/words/${baseform}.vec`);
      
      if (!vectorResponse.ok) {
        console.error(`❌ Failed to fetch vector file for "${baseform}". Status: ${vectorResponse.status}`);
        throw new Error(`Failed to fetch vector file for "${baseform}"`);
      }
      
      const vectorData = await vectorResponse.arrayBuffer();
      console.log(`📊 Vector data size for "${baseform}": ${vectorData.byteLength} bytes`);
      
      // Read the vector length from the first 4 bytes
      const vectorLengthView = new Int32Array(vectorData.slice(0, 4));
      const vectorLength = vectorLengthView[0];
      console.log(`📏 Vector length from file: ${vectorLength}`);
      
      if (vectorLength !== VECTOR_SIZE) {
        console.error(`❌ Unexpected vector length in file: ${vectorLength} (expected ${VECTOR_SIZE})`);
        throw new Error(`Invalid vector size in file for word "${baseform}"`);
      }
      
      // Read the actual vector data starting from byte 4
      const vectorDataView = new Float32Array(vectorData.slice(4));
      console.log(`📊 Vector data loaded: ${vectorDataView.length} elements`);
      
      wordVectors[baseform] = vectorDataView;
      console.log(`✅ Successfully loaded vector for "${baseform}"`);
    } catch (error) {
      console.error(`❌ Failed to load vector for word "${baseform}":`, error);
      throw error;
    }
  } else {
    console.log(`📎 Using cached vector for "${baseform}"`);
  }

  const vector = wordVectors[baseform];
  if (!vector) {
    console.error(`❌ Vector not found for baseform: "${baseform}"`);
    throw new Error(`Vector not found for baseform: "${baseform}"`);
  }

  if (vector.length !== VECTOR_SIZE) {
    console.error(`❌ Invalid vector size for "${baseform}": ${vector.length} (expected ${VECTOR_SIZE})`);
    throw new Error(`Invalid vector size for word "${baseform}"`);
  }

  return vector;
};

export const cosineSimilarity = async (word1: string, word2: string): Promise<number> => {
  console.log(`📐 Calculating similarity between "${word1}" and "${word2}"`);
  try {
    const vector1 = await getWordVector(word1);
    const vector2 = await getWordVector(word2);
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < VECTOR_SIZE; i++) {
      dotProduct += vector1[i] * vector2[i];
      norm1 += vector1[i] * vector1[i];
      norm2 += vector2[i] * vector2[i];
    }
    
    const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    console.log(`✅ Similarity between "${word1}" and "${word2}": ${similarity.toFixed(4)}`);
    return similarity;
  } catch (error) {
    console.error(`❌ Error calculating similarity between "${word1}" and "${word2}":`, error);
    throw error;
  }
};