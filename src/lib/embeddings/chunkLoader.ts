import { WordDictionary } from './types';

const CHUNK_SIZE = 5000;

export async function loadWordChunk(word: string): Promise<WordDictionary | null> {
  try {
    console.log(`[ChunkLoader] Starting binary search for word: ${word}`);
    
    let left = 0;
    let right = 100; // Set high to handle future changes in chunk count
    
    console.log(`[ChunkLoader] Initial search range: left=${left}, right=${right}`);
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      console.log(`[ChunkLoader] Trying chunk ${mid} (left=${left}, right=${right})`);
      
      try {
        const response = await fetch(`/data/chunks/embeddings_chunk_${mid}.gz`);
        console.log(`[ChunkLoader] Chunk ${mid} response status:`, response.status);
        
        if (!response.ok) {
          console.log(`[ChunkLoader] Chunk ${mid} not found, adjusting right boundary`);
          right = mid - 1;
          continue;
        }
        
        const chunkData = await response.json();
        const words = Object.keys(chunkData);
        
        if (words.length === 0) {
          console.log(`[ChunkLoader] Chunk ${mid} is empty, adjusting right boundary`);
          right = mid - 1;
          continue;
        }
        
        console.log(`[ChunkLoader] Chunk ${mid} word range: ${words[0]} to ${words[words.length - 1]}`);
        console.log(`[ChunkLoader] Searching for word '${word}' in range`);
        
        // Check if word falls in this chunk's range
        if (word >= words[0] && (word <= words[words.length - 1] || mid === right)) {
          console.log(`[ChunkLoader] Found word in chunk ${mid}!`);
          console.log(`[ChunkLoader] Word vector exists:`, word in chunkData);
          
          return Object.fromEntries(
            Object.entries(chunkData).map(([key, vector]) => [
              key,
              new Float32Array(vector as number[])
            ])
          );
        }
        
        if (word < words[0]) {
          console.log(`[ChunkLoader] Word comes before chunk ${mid}, adjusting right boundary`);
          right = mid - 1;
        } else {
          console.log(`[ChunkLoader] Word comes after chunk ${mid}, adjusting left boundary`);
          left = mid + 1;
        }
      } catch (error) {
        console.log(`[ChunkLoader] Error processing chunk ${mid}:`, error);
        right = mid - 1;
      }
    }
    
    console.log(`[ChunkLoader] Binary search complete. Word not found in any chunk.`);
    return null;
  } catch (error) {
    console.error('[ChunkLoader] Error in loadWordChunk:', error);
    return null;
  }
}