import { WordDictionary } from './types';

let wordBaseformMap: { [key: string]: string } | null = null;
let commonWords: string[] = [];
let wordList: string[] = [];

let cachedChunk: { 
  words: WordDictionary; 
  firstWord: string; 
  lastWord: string;
  chunkIndex: number;
} | null = null;

export const loadEmbeddings = async () => {
  console.log("🔄 Loading initial embeddings data...");
  
  if (wordBaseformMap && commonWords.length > 0) {
    console.log("✅ Using cached embeddings data");
    return true;
  }
  
  try {
    console.log("📖 Loading common words list...");
    const commonWordsResponse = await fetch('/data/common_words.txt');
    if (!commonWordsResponse.ok) throw new Error('Failed to load common words');
    const commonWordsText = await commonWordsResponse.text();
    commonWords = commonWordsText.split('\n').filter(word => word.trim());
    console.log(`✅ Loaded ${commonWords.length} common words`);
    
    console.log("📖 Loading word baseform mappings...");
    const wordBaseformResponse = await fetch('/data/word_baseform.json');
    if (!wordBaseformResponse.ok) throw new Error('Failed to load word baseform mappings');
    wordBaseformMap = await wordBaseformResponse.json();
    console.log("✅ Word baseform mappings loaded");
    
    wordList = commonWords.filter(word => wordBaseformMap?.[word]);
    console.log(`✅ Generated word list with ${wordList.length} words`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to load initial data:', error);
    throw error;
  }
};

export const getWordList = (): string[] => wordList;
export const getBaseForm = (word: string): string | null => wordBaseformMap?.[word] || null;
export const isValidWord = (word: string): boolean => wordBaseformMap ? word in wordBaseformMap : false;

const loadWordChunk = async (word: string): Promise<WordDictionary | null> => {
  try {
    let left = 0;
    let right = 8; // Number of chunks - 1
    
    console.log(`🔍 Binary searching for chunk containing word: ${word}`);
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      console.log(`  Checking chunk ${mid} (left=${left}, right=${right})`);
      
      try {
        console.log(`  📖 Loading chunk ${mid}...`);
        const response = await fetch(`/data/chunks/embeddings_chunk_${mid}.gz`);
        
        if (!response.ok) {
          console.log(`  ❌ Chunk ${mid} not found, searching lower chunks`);
          right = mid - 1;
          continue;
        }
        
        const chunkData = await response.json();
        const words = Object.keys(chunkData);
        
        if (words.length === 0) {
          console.log(`  ⚠️ Chunk ${mid} is empty, searching lower chunks`);
          right = mid - 1;
          continue;
        }
        
        console.log(`  📊 Chunk ${mid} word range: ${words[0]} to ${words[words.length - 1]}`);
        
        // Check if word falls in this chunk's range
        if (word >= words[0] && (word <= words[words.length - 1] || mid === right)) {
          console.log(`  ✅ Found word in chunk ${mid}`);
          
          // Convert byte arrays back to Float32Arrays
          const processedChunk = Object.fromEntries(
            Object.entries(chunkData).map(([key, vectorBytes]) => [
              key,
              new Float32Array(vectorBytes as number[])
            ])
          );
          
          // Cache the chunk
          cachedChunk = {
            words: processedChunk,
            firstWord: words[0],
            lastWord: words[words.length - 1],
            chunkIndex: mid
          };
          
          return processedChunk;
        }
        
        if (word < words[0]) {
          console.log(`  🔍 Word comes before chunk ${mid}, searching lower chunks`);
          right = mid - 1;
        } else {
          console.log(`  🔍 Word comes after chunk ${mid}, searching higher chunks`);
          left = mid + 1;
        }
      } catch (error) {
        console.error(`  ❌ Error loading chunk ${mid}:`, error);
        right = mid - 1;
      }
    }
    
    console.log(`❌ Word not found in any chunk: ${word}`);
    return null;
  } catch (error) {
    console.error('❌ Error in loadWordChunk:', error);
    return null;
  }
};

export const getWordVector = async (word: string): Promise<Float32Array | null> => {
  if (!wordBaseformMap) return null;
  
  const baseform = wordBaseformMap[word];
  if (!baseform) return null;
  
  // Check if word is in cached chunk
  if (cachedChunk && 
      baseform >= cachedChunk.firstWord && 
      baseform <= cachedChunk.lastWord) {
    console.log(`✨ Cache hit for word "${word}" in chunk ${cachedChunk.chunkIndex}`);
    return cachedChunk.words[baseform] || null;
  }
  
  console.log(`🔄 Cache miss for word "${word}", loading appropriate chunk...`);
  const chunkData = await loadWordChunk(baseform);
  if (!chunkData) return null;
  
  return chunkData[baseform] || null;
};

export const cosineSimilarity = async (word1: string, word2: string): Promise<number> => {
  console.log(`📊 Calculating similarity between "${word1}" and "${word2}"`);
  
  const vec1 = await getWordVector(word1);
  const vec2 = await getWordVector(word2);
  
  if (!vec1 || !vec2) {
    console.log(`❌ Could not find vectors for both words`);
    return 0;
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    normA += vec1[i] * vec1[i];
    normB += vec2[i] * vec2[i];
  }
  
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  console.log(`✅ Similarity: ${similarity}`);
  return similarity;
};