import { WordDictionary } from './types';

const CHUNK_SIZE = 300; // Updated chunk size
const MAX_CHUNKS = 138; // New total number of chunks

// Cache for loaded chunks
const chunkCache: { [chunkIndex: number]: WordDictionary } = {};

// Helper to find closest words in loaded chunks
const findClosestWordsInCache = (targetWord: string): {
  beforeWord?: { word: string; chunkIndex: number };
  afterWord?: { word: string; chunkIndex: number };
} => {
  let beforeWord: { word: string; chunkIndex: number } | undefined;
  let afterWord: { word: string; chunkIndex: number } | undefined;

  // Scan through all loaded chunks
  Object.entries(chunkCache).forEach(([chunkIndex, chunk]) => {
    const words = Object.keys(chunk).sort();
    
    // Find closest word before target
    const beforeIndex = words.findIndex(word => word > targetWord) - 1;
    if (beforeIndex >= 0) {
      const word = words[beforeIndex];
      if (!beforeWord || word > beforeWord.word) {
        beforeWord = { word, chunkIndex: parseInt(chunkIndex) };
      }
    }
    
    // Find closest word after target
    const afterIndex = words.findIndex(word => word >= targetWord);
    if (afterIndex !== -1) {
      const word = words[afterIndex];
      if (!afterWord || word < afterWord.word) {
        afterWord = { word, chunkIndex: parseInt(chunkIndex) };
      }
    }
  });

  return { beforeWord, afterWord };
};

export async function loadWordChunk(word: string): Promise<WordDictionary | null> {
  try {
    // First check the cache for closest matches
    const { beforeWord, afterWord } = findClosestWordsInCache(word);
    
    // If we find the word in an already loaded chunk, return that chunk
    if (beforeWord && afterWord && beforeWord.chunkIndex === afterWord.chunkIndex) {
      const chunk = chunkCache[beforeWord.chunkIndex];
      if (word in chunk) {
        return chunk;
      }
    }

    // Initialize binary search bounds
    let left = 0;
    let right = MAX_CHUNKS - 1;

    // If we have closest matches, narrow the search range
    if (beforeWord && afterWord) {
      left = Math.min(beforeWord.chunkIndex, afterWord.chunkIndex);
      right = Math.max(beforeWord.chunkIndex, afterWord.chunkIndex);
    }
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      
      // Check if chunk is already in cache
      if (chunkCache[mid]) {
        const words = Object.keys(chunkCache[mid]);
        if (word >= words[0] && word <= words[words.length - 1]) {
          return chunkCache[mid];
        }
        if (word < words[0]) {
          right = mid - 1;
        } else {
          left = mid + 1;
        }
        continue;
      }
      
      // Load new chunk if not in cache
      try {
        const response = await fetch(`/data/chunks/embeddings_chunk_${mid}.gz`);
        
        if (!response.ok) {
          right = mid - 1;
          continue;
        }
        
        const chunkData = await response.json();
        const words = Object.keys(chunkData);
        
        if (words.length === 0) {
          right = mid - 1;
          continue;
        }
        
        // Process and cache the chunk
        const processedChunk = Object.fromEntries(
          Object.entries(chunkData).map(([key, vector]) => [
            key,
            new Float32Array(vector as number[])
          ])
        );
        
        chunkCache[mid] = processedChunk;
        
        // Check if word is in this chunk
        if (word >= words[0] && (word <= words[words.length - 1] || mid === right)) {
          return processedChunk;
        }
        
        if (word < words[0]) {
          right = mid - 1;
        } else {
          left = mid + 1;
        }
      } catch {
        right = mid - 1;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error loading word chunk:', error);
    return null;
  }
}