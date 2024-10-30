import pako from 'pako';
import { WordDictionary } from './types';

const CHUNK_SIZE = 300;
const MAX_CHUNKS = 138;

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
    const { beforeWord, afterWord } = findClosestWordsInCache(word);
    
    if (beforeWord && afterWord && beforeWord.chunkIndex === afterWord.chunkIndex) {
      const chunk = chunkCache[beforeWord.chunkIndex];
      if (word in chunk) {
        return chunk;
      }
    }

    let left = 0;
    let right = MAX_CHUNKS - 1;

    if (beforeWord && afterWord) {
      left = Math.min(beforeWord.chunkIndex, afterWord.chunkIndex);
      right = Math.max(beforeWord.chunkIndex, afterWord.chunkIndex);
    }
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      
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
      
      try {
        const chunkPath = `/data/chunks/embeddings_chunk_${mid}.gz`;
        console.log(`Loading chunk from: ${chunkPath}`);
        
        const response = await fetch(chunkPath);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const compressedData = await response.arrayBuffer();
        const decompressedData = pako.inflate(new Uint8Array(compressedData), { to: 'string' });
        const chunkData = JSON.parse(decompressedData);
        
        if (!chunkData || Object.keys(chunkData).length === 0) {
          right = mid - 1;
          continue;
        }
        
        const processedChunk = Object.fromEntries(
          Object.entries(chunkData).map(([key, vector]) => [
            key,
            new Float32Array(new Uint8Array(vector as any).buffer)
          ])
        );
        
        chunkCache[mid] = processedChunk;
        
        const words = Object.keys(processedChunk);
        if (word >= words[0] && (word <= words[words.length - 1] || mid === right)) {
          return processedChunk;
        }
        
        if (word < words[0]) {
          right = mid - 1;
        } else {
          left = mid + 1;
        }
      } catch (error) {
        console.error(`Error loading chunk ${mid}:`, error);
        right = mid - 1;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error loading word chunk:', error);
    return null;
  }
}
