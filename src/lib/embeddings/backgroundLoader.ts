import { loadChunkByIndex } from './chunkLoader';
import { MAX_CHUNKS } from './constants';

let loadedChunks = new Set<number>();
let isLoading = false;
let isPaused = false;

const CACHE_NAME = 'word-bridge-embeddings-v1';

export const markChunkAsLoaded = (chunkIndex: number) => {
  loadedChunks.add(chunkIndex);
};

export const isChunkLoaded = (chunkIndex: number) => {
  return loadedChunks.has(chunkIndex);
};

export const pauseBackgroundLoading = () => {
  isPaused = true;
};

export const resumeBackgroundLoading = () => {
  isPaused = false;
};

// New function to check cache status
const checkCacheStatus = async () => {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    
    // Extract chunk numbers from cache keys and mark them as loaded
    keys.forEach(key => {
      const match = key.url.match(/embeddings_chunk_(\d+)\.gz$/);
      if (match) {
        const chunkIndex = parseInt(match[1]);
        markChunkAsLoaded(chunkIndex);
        console.log(`📦 Found cached chunk ${chunkIndex}`);
      }
    });
    
    console.log(`📊 Found ${loadedChunks.size} cached chunks`);
  } catch (error) {
    console.error('Failed to check cache status:', error);
  }
};

const loadNextUnloadedChunk = async () => {
  if (isLoading || isPaused) return;
  
  // Find the next unloaded chunk
  for (let i = 0; i < MAX_CHUNKS; i++) {
    if (!loadedChunks.has(i)) {
      isLoading = true;
      try {
        console.log(`🔄 Background loading chunk ${i}/${MAX_CHUNKS - 1}`);
        await loadChunkByIndex(i);
        loadedChunks.add(i);
        console.log(`✅ Successfully loaded chunk ${i}`);
      } catch (error) {
        console.error(`❌ Failed to load chunk ${i}:`, error);
      } finally {
        isLoading = false;
      }
      break;
    }
  }
};

export const startBackgroundLoading = async () => {
  // Check cache status before starting background loading
  await checkCacheStatus();
  
  const scheduleNextChunkLoad = () => {
    if (!isPaused && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => loadNextUnloadedChunk(), { timeout: 1000 });
    } else if (!isPaused) {
      setTimeout(loadNextUnloadedChunk, 100);
    }
  };

  // Set up continuous background loading
  const intervalId = setInterval(() => {
    if (!isLoading && !isPaused && loadedChunks.size < MAX_CHUNKS) {
      scheduleNextChunkLoad();
    }
  }, 1000);

  return intervalId;
};

export const loadInitialChunks = async (indices: number[]) => {
  console.log("🔄 Loading initial chunks");
  for (const index of indices) {
    if (!loadedChunks.has(index)) {
      try {
        await loadChunkByIndex(index);
        loadedChunks.add(index);
      } catch (error) {
        console.error(`❌ Failed to load chunk ${index}:`, error);
      }
    }
  }
};