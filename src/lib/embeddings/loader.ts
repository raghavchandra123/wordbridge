import pako from 'pako';
import { WordDictionary } from './types';

let wordBaseformMap: { [key: string]: string } | null = null;
let commonWords: string[] = [];
let wordList: string[] = [];

// Cache for the currently loaded chunk
let cachedChunk: { 
  words: WordDictionary; 
  firstWord: string; 
  lastWord: string;
  chunkIndex: number;
} | null = null;

// Load and decompress a chunk file
async function loadCompressedChunk(chunkIndex: number): Promise<WordDictionary | null> {
  try {
    const response = await fetch(`/data/chunks/embeddings_chunk_${chunkIndex}.gz`);
    if (!response.ok) return null;

    // Get the compressed data as an ArrayBuffer
    const compressedData = await response.arrayBuffer();
    
    // Decompress the data using pako
    const decompressedData = pako.inflate(new Uint8Array(compressedData), { to: 'string' });
    
    // Parse the JSON data
    const chunkData = JSON.parse(decompressedData);
    
    // Convert byte arrays back to Float32Arrays
    return Object.fromEntries(
      Object.entries(chunkData).map(([key, vectorBytes]) => [
        key,
        new Float32Array(vectorBytes as number[])
      ])
    );
  } catch (error) {
    console.error('Error loading chunk:', error);
    return null;
  }
}

// Initialize the word embeddings system
export const loadEmbeddings = async () => {
  if (wordBaseformMap && commonWords.length > 0) return true;
  
  try {
    // Load common words
    const commonWordsResponse = await fetch('/data/common_words.txt');
    const commonWordsText = await commonWordsResponse.text();
    commonWords = commonWordsText.split('\n').filter(word => word.trim());
    
    // Load word baseform mappings
    const wordBaseformResponse = await fetch('/data/word_baseform.json');
    wordBaseformMap = await wordBaseformResponse.json();
    
    // Generate word list
    wordList = commonWords.filter(word => wordBaseformMap?.[word]);
    
    return true;
  } catch (error) {
    console.error('Failed to load initial data:', error);
    throw error;
  }
};

// Binary search to find the correct chunk for a word
async function findWordChunk(word: string): Promise<WordDictionary | null> {
  let left = 0;
  let right = 8; // Number of chunks - 1
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const chunkData = await loadCompressedChunk(mid);
    
    if (!chunkData) {
      right = mid - 1;
      continue;
    }
    
    const words = Object.keys(chunkData);
    if (words.length === 0) {
      right = mid - 1;
      continue;
    }
    
    if (word >= words[0] && (word <= words[words.length - 1] || mid === right)) {
      cachedChunk = {
        words: chunkData,
        firstWord: words[0],
        lastWord: words[words.length - 1],
        chunkIndex: mid
      };
      return chunkData;
    }
    
    if (word < words[0]) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }
  
  return null;
}

// Get the vector for a specific word
export const getWordVector = async (word: string): Promise<Float32Array | null> => {
  if (!wordBaseformMap) return null;
  
  const baseform = wordBaseformMap[word];
  if (!baseform) return null;
  
  // Check cache first
  if (cachedChunk && 
      baseform >= cachedChunk.firstWord && 
      baseform <= cachedChunk.lastWord) {
    return cachedChunk.words[baseform] || null;
  }
  
  const chunkData = await findWordChunk(baseform);
  return chunkData?.[baseform] || null;
};

// Calculate cosine similarity between two words
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

export const getWordList = (): string[] => wordList;
export const getBaseForm = (word: string): string | null => wordBaseformMap?.[word] || null;
export const isValidWord = (word: string): boolean => wordBaseformMap ? word in wordBaseformMap : false;