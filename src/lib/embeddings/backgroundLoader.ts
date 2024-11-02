import { loadWordChunk } from './chunkLoader';
import { MAX_CHUNKS } from './constants';

let loadedChunks = new Set<number>();
let isLoading = false;

export const markChunkAsLoaded = (chunkIndex: number) => {
  loadedChunks.add(chunkIndex);
};

export const isChunkLoaded = (chunkIndex: number) => {
  return loadedChunks.has(chunkIndex);
};

const loadNextUnloadedChunk = async () => {
  if (isLoading) return;
  
  // Find the next unloaded chunk
  for (let i = 0; i < MAX_CHUNKS; i++) {
    if (!loadedChunks.has(i)) {
      isLoading = true;
      try {
        console.log(`🔄 Background loading chunk ${i}/${MAX_CHUNKS - 1}`);
        const chunkPath = `/data/chunks/embeddings_chunk_${i}.gz`;
        await loadWordChunk(chunkPath);
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

export const startBackgroundLoading = () => {
  const scheduleNextChunkLoad = () => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => loadNextUnloadedChunk(), { timeout: 1000 });
    } else {
      setTimeout(loadNextUnloadedChunk, 100);
    }
  };

  // Set up continuous background loading
  const intervalId = setInterval(() => {
    if (!isLoading && loadedChunks.size < MAX_CHUNKS) {
      scheduleNextChunkLoad();
    }
  }, 1000);

  return intervalId;
};

export const loadInitialChunks = async (words: string[]) => {
  console.log("🔄 Loading chunks for initial words");
  for (const word of words) {
    try {
      await loadWordChunk(word);
    } catch (error) {
      console.error(`❌ Failed to load chunk for word "${word}":`, error);
    }
  }
};