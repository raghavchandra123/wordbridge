import pako from 'pako';
import { WordDictionary } from './types';

const CHUNK_SIZE = 300;
const MAX_CHUNKS = 138;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Cache for loaded chunks
const chunkCache: { [chunkIndex: number]: WordDictionary } = {};

// Helper to find closest words in loaded chunks
const findClosestWordsInCache = (targetWord: string): {
  beforeWord?: { word: string; chunkIndex: number };
  afterWord?: { word: string; chunkIndex: number };
} => {
  let beforeWord: { word: string; chunkIndex: number } | undefined;
  let afterWord: { word: string; chunkIndex: number } | undefined;

  Object.entries(chunkCache).forEach(([chunkIndex, chunk]) => {
    const words = Object.keys(chunk).sort();
    
    const beforeIndex = words.findIndex(word => word > targetWord) - 1;
    if (beforeIndex >= 0) {
      const word = words[beforeIndex];
      if (!beforeWord || word > beforeWord.word) {
        beforeWord = { word, chunkIndex: parseInt(chunkIndex) };
      }
    }
    
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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url: string, retries = MAX_RETRIES): Promise<ArrayBuffer> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.arrayBuffer();
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying fetch for ${url}, ${retries} attempts remaining...`);
      await delay(RETRY_DELAY);
      return fetchWithRetry(url, retries - 1);
    }
    throw error;
  }
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
        
        const compressedData = await fetchWithRetry(chunkPath);
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
        // If we fail to load a chunk, try the next one
        right = mid - 1;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error loading word chunk:', error);
    return null;
  }
}