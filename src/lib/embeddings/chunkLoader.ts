import pako from 'pako';
import { WordDictionary } from './types';
import { MAX_CHUNKS, MAX_RETRIES, RETRY_DELAY, VECTOR_SIZE } from './constants';
import { processCompressedData } from './vectorProcessor';
import { markChunkAsLoaded } from './backgroundLoader';

const chunkCache: { [chunkIndex: number]: WordDictionary } = {};

const findClosestWordsInCache = (targetWord: string): {
  beforeWord?: { word: string; chunkIndex: number };
  afterWord?: { word: string; chunkIndex: number };
} => {
  console.log(`🔍 Finding closest words in cache for: "${targetWord}"`);
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

  console.log(`🎯 Found closest words:
    Before: ${beforeWord ? `"${beforeWord.word}" (chunk ${beforeWord.chunkIndex})` : 'none'}
    After: ${afterWord ? `"${afterWord.word}" (chunk ${afterWord.chunkIndex})` : 'none'}`);

  return { beforeWord, afterWord };
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url: string, retries = MAX_RETRIES): Promise<ArrayBuffer> => {
  try {
    console.log(`📥 Fetching: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.arrayBuffer();
    console.log(`✅ Successfully fetched ${url} (${data.byteLength} bytes)`);
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

export async function loadWordChunk(word: string): Promise<WordDictionary | null> {
  try {
    console.log(`\n🔄 Loading chunk for word: "${word}"`);
    
    const { beforeWord, afterWord } = findClosestWordsInCache(word);
    
    if (beforeWord && afterWord && beforeWord.chunkIndex === afterWord.chunkIndex) {
      const chunk = chunkCache[beforeWord.chunkIndex];
      if (word in chunk) {
        console.log(`✅ Found word "${word}" in cached chunk ${beforeWord.chunkIndex}`);
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
      console.log(`\n🔍 Checking chunk ${mid} (search range: ${left}-${right})`);
      
      if (chunkCache[mid]) {
        const words = Object.keys(chunkCache[mid]);
        console.log(`📦 Using cached chunk ${mid} with ${words.length} words`);
        
        if (word >= words[0] && word <= words[words.length - 1]) {
          console.log(`✅ Word "${word}" falls within chunk ${mid}'s range`);
          return chunkCache[mid];
        }
        if (word < words[0]) {
          console.log(`⬅️ Word "${word}" comes before chunk ${mid}'s range`);
          right = mid - 1;
        } else {
          console.log(`➡️ Word "${word}" comes after chunk ${mid}'s range`);
          left = mid + 1;
        }
        continue;
      }
      
      try {
        const chunkPath = `/data/chunks/embeddings_chunk_${mid}.gz`;
        console.log(`📥 Loading new chunk from: ${chunkPath}`);
        
        const compressedData = await fetchWithRetry(chunkPath);
        console.log(`🗜️ Processing chunk ${mid} (${compressedData.byteLength} bytes)`);
        
        const processedChunk = processCompressedData(compressedData);
        const words = Object.keys(processedChunk);
        
        if (!words.length) {
          console.log(`⚠️ Empty chunk ${mid}, searching lower chunks`);
          right = mid - 1;
          continue;
        }
        
        console.log(`📦 Processed chunk ${mid}: ${words.length} words (${words[0]} to ${words[words.length - 1]})`);
        
        // Verify vector dimensions
        const sampleVector = processedChunk[words[0]];
        if (sampleVector.length !== VECTOR_SIZE) {
          throw new Error(`Invalid vector dimension in chunk ${mid}: ${sampleVector.length}`);
        }
        
        chunkCache[mid] = processedChunk;
        markChunkAsLoaded(mid);
        
        if (word >= words[0] && (word <= words[words.length - 1] || mid === right)) {
          console.log(`✅ Found word "${word}" in newly loaded chunk ${mid}`);
          return processedChunk;
        }
        
        if (word < words[0]) {
          console.log(`⬅️ Word "${word}" comes before chunk ${mid}'s range`);
          right = mid - 1;
        } else {
          console.log(`➡️ Word "${word}" comes after chunk ${mid}'s range`);
          left = mid + 1;
        }
      } catch (error) {
        console.error(`❌ Error loading chunk ${mid}:`, error);
        right = mid - 1;
      }
    }
    
    console.error(`❌ Could not find chunk containing word: "${word}"`);
    return null;
  } catch (error) {
    console.error('❌ Error in loadWordChunk:', error);
    return null;
  }
}
