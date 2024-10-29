import { WordDictionary } from './types';

const CHUNK_SIZE = 5000;

export async function loadWordChunk(word: string): Promise<WordDictionary | null> {
  try {
    let left = 0;
    let right = 100; // Set high to handle future changes in chunk count
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      
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
        
        // Check if word falls in this chunk's range
        if (word >= words[0] && (word <= words[words.length - 1] || mid === right)) {
          return Object.fromEntries(
            Object.entries(chunkData).map(([key, vector]) => [
              key,
              new Float32Array(vector as number[])
            ])
          );
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