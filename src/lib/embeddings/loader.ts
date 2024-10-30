import pako from 'pako';
import { WordDictionary } from './types';

let wordBaseformMap: { [key: string]: string } | null = null;
let commonWords: string[] = [];
let wordList: string[] = [];
const chunkCache: { [chunkIndex: number]: WordDictionary } = {};
let cachedChunk: { 
  words: WordDictionary; 
  firstWord: string; 
  lastWord: string;
  chunkIndex: number;
} | null = null;

async function loadCompressedChunk(chunkIndex: number): Promise<WordDictionary | null> {
  if (chunkCache[chunkIndex]) {
    return chunkCache[chunkIndex];
  }

  try {
    const response = await fetch(`/data/chunks/embeddings_chunk_${chunkIndex}.gz`);
    if (!response.ok) {
      console.error(`Failed to fetch chunk ${chunkIndex}: ${response.status}`);
      return null;
    }

    const compressedData = await response.arrayBuffer();
    const decompressedData = pako.inflate(new Uint8Array(compressedData), { to: 'string' });
    const chunkData = JSON.parse(decompressedData);
    
    const processedData = Object.fromEntries(
      Object.entries(chunkData).map(([key, vectorBytes]) => [
        key,
        new Float32Array(vectorBytes as number[])
      ])
    );
    
    chunkCache[chunkIndex] = processedData;
    return processedData;
  } catch (error) {
    console.error(`Error loading chunk ${chunkIndex}:`, error);
    return null;
  }
}

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

// Binary search to find the correct chunk for a word
async function findWordChunk(word: string): Promise<WordDictionary | null> {
  console.log(`🔍 Binary searching for chunk containing word: "${word}"`);
  let left = 0;
  let right = 8; // Number of chunks - 1
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    console.log(`  Checking chunk ${mid} (left=${left}, right=${right})`);
    
    const chunkData = await loadCompressedChunk(mid);
    
    if (!chunkData) {
      console.log(`  ❌ Failed to load chunk ${mid}, searching lower chunks`);
      right = mid - 1;
      continue;
    }
    
    const words = Object.keys(chunkData);
    if (words.length === 0) {
      console.log(`  ⚠️ Chunk ${mid} is empty, searching lower chunks`);
      right = mid - 1;
      continue;
    }
    
    console.log(`  📊 Chunk ${mid} word range: ${words[0]} to ${words[words.length - 1]}`);
    
    if (word >= words[0] && (word <= words[words.length - 1] || mid === right)) {
      console.log(`  ✅ Found word "${word}" in chunk ${mid}`);
      cachedChunk = {
        words: chunkData,
        firstWord: words[0],
        lastWord: words[words.length - 1],
        chunkIndex: mid
      };
      return chunkData;
    }
    
    if (word < words[0]) {
      console.log(`  🔍 Word comes before chunk ${mid}, searching lower chunks`);
      right = mid - 1;
    } else {
      console.log(`  🔍 Word comes after chunk ${mid}, searching higher chunks`);
      left = mid + 1;
    }
  }
  
  console.log(`❌ Word "${word}" not found in any chunk`);
  return null;
}

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
  
  // Check cache first
  if (cachedChunk && 
      baseform >= cachedChunk.firstWord && 
      baseform <= cachedChunk.lastWord) {
    console.log(`✨ Cache hit for baseform "${baseform}" in chunk ${cachedChunk.chunkIndex}`);
    return cachedChunk.words[baseform] || null;
  }
  
  console.log(`🔄 Cache miss for baseform "${baseform}", loading appropriate chunk...`);
  const chunkData = await findWordChunk(baseform);
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
