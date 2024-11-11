import pako from 'pako';
import { WordDictionary } from './types';
import { MAX_CHUNKS, MAX_RETRIES, RETRY_DELAY } from './constants';
import { processCompressedData } from './vectorProcessor';
import { markChunkAsLoaded } from './backgroundLoader';

const CACHE_NAME = 'word-bridge-embeddings-v1';
const chunkCache: { [chunkIndex: number]: WordDictionary } = {};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url: string, retries = MAX_RETRIES): Promise<ArrayBuffer> => {
  try {
    // Try to get from cache first
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(url);
    
    if (cachedResponse) {
      console.log(`📦 Using cached data for: ${url}`);
      return await cachedResponse.arrayBuffer();
    }

    console.log(`📥 Fetching: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Clone the response before consuming it
    const responseToCache = response.clone();
    const data = await response.arrayBuffer();

    // Cache the response for future use
    await cache.put(url, responseToCache);
    console.log(`✅ Successfully fetched and cached ${url} (${data.byteLength} bytes)`);
    
    return data;
  } catch (error) {
    if (retries > 0) {
      console.log(`⚠️ Retry ${MAX_RETRIES - retries + 1}/${MAX_RETRIES} for ${url}`);
      await delay(RETRY_DELAY);
      return fetchWithRetry(url, retries - 1);
    }
    throw error;
  }
};

export const loadChunkByIndex = async (chunkIndex: number): Promise<WordDictionary> => {
  if (chunkCache[chunkIndex]) {
    console.log(`🗃️ Using memory cache for chunk ${chunkIndex}`);
    return chunkCache[chunkIndex];
  }

  // Fixed path construction to match the actual file structure
  const chunkPath = `/data/chunks/embeddings_chunk_${chunkIndex}.gz`;
  
  try {
    const compressedData = await fetchWithRetry(chunkPath);
    const processedChunk = processCompressedData(compressedData);
    chunkCache[chunkIndex] = processedChunk;
    markChunkAsLoaded(chunkIndex);
    return processedChunk;
  } catch (error) {
    console.error(`❌ Error loading chunk ${chunkIndex}:`, error);
    throw error;
  }
};

export async function loadWordChunk(word: string): Promise<WordDictionary | null> {
  // Binary search through chunks to find the right one
  let left = 0;
  let right = MAX_CHUNKS - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    
    try {
      const chunk = await loadChunkByIndex(mid);
      const words = Object.keys(chunk);
      
      if (!words.length) {
        right = mid - 1;
        continue;
      }
      
      if (word >= words[0] && word <= words[words.length - 1]) {
        return chunk;
      }
      
      if (word < words[0]) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    } catch (error) {
      console.error(`❌ Error in chunk ${mid}:`, error);
      right = mid - 1;
    }
  }
  
  return null;
}