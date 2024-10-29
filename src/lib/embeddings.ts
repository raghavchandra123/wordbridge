import { WordDictionary, WordEmbedding } from './types';

let dictionary: WordDictionary | null = null;
let wordList: string[] = [];
let wordBaseformMap: { [key: string]: string } | null = null;

export const loadEmbeddings = async () => {
  if (dictionary && wordBaseformMap) {
    console.log('Using cached embeddings dictionary');
    return dictionary;
  }
  
  try {
    console.log('Attempting to load embeddings from files...');
    
    // Load word to baseform mapping
    const wordBaseformResponse = await fetch('/data/word_baseform.json');
    if (!wordBaseformResponse.ok) throw new Error('Failed to load word baseform mappings');
    wordBaseformMap = await wordBaseformResponse.json();
    console.log('Loaded word baseform mappings:', Object.keys(wordBaseformMap).length, 'entries');
    
    // Load baseform to vector mapping
    const embedsResponse = await fetch('/data/concept_embeds.json');
    if (!embedsResponse.ok) throw new Error('Failed to load concept embeddings');
    dictionary = await embedsResponse.json();
    console.log('Loaded concept embeddings:', Object.keys(dictionary).length, 'entries');
    
    // Create word list from all valid words (including variations)
    wordList = Object.keys(wordBaseformMap);
    
    return dictionary;
  } catch (error) {
    console.error('Failed to load embeddings:', error);
    console.log('Falling back to test dictionary');
    // Fallback to test dictionary if files aren't found
    dictionary = {
      "cat": { vector: new Float32Array(Array(300).fill(0.1)) },
      "dog": { vector: new Float32Array(Array(300).fill(0.2)) },
      "animal": { vector: new Float32Array(Array(300).fill(0.15)) },
      "pet": { vector: new Float32Array(Array(300).fill(0.18)) }
    };
    wordBaseformMap = {
      "cat": "cat",
      "dog": "dog",
      "animal": "animal",
      "pet": "pet"
    };
    wordList = Object.keys(wordBaseformMap);
    return dictionary;
  }
};

export const getWordList = async (): Promise<string[]> => {
  if (wordList.length) return wordList;
  await loadEmbeddings();
  return wordList;
};

export const isValidWord = (word: string): boolean => {
  const isValid = wordBaseformMap ? word in wordBaseformMap : false;
  console.log('Word validation check:', word, isValid ? 'valid' : 'invalid');
  return isValid;
};

export const cosineSimilarity = (a: WordEmbedding | undefined, b: WordEmbedding | undefined): number => {
  if (!a?.vector || !b?.vector) {
    console.log('Cosine similarity calculation failed - missing vectors:', { 
      hasVectorA: !!a?.vector, 
      hasVectorB: !!b?.vector 
    });
    return 0;
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < 300; i++) {
    dotProduct += a.vector[i] * b.vector[i];
    normA += a.vector[i] * a.vector[i];
    normB += b.vector[i] * b.vector[i];
  }
  
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  console.log('Calculated cosine similarity:', similarity);
  return similarity;
};

export const calculateProgress = (similarity: number): number => {
  const progress = ((similarity - 0.1) / (0.7 - 0.1)) * 100;
  const clampedProgress = Math.max(0, Math.min(100, progress));
  console.log('Progress calculation:', { similarity, rawProgress: progress, clampedProgress });
  return clampedProgress;
};

export const findRandomWordPair = async (): Promise<[string, string]> => {
  console.log('Finding random word pair...');
  const words = await getWordList();
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    const word1 = words[Math.floor(Math.random() * words.length)];
    const word2 = words[Math.floor(Math.random() * words.length)];
    
    if (word1 === word2) continue;
    
    // Get base forms for the words
    const base1 = wordBaseformMap?.[word1] || word1;
    const base2 = wordBaseformMap?.[word2] || word2;
    
    if (!dictionary?.[base1] || !dictionary?.[base2]) continue;
    
    const similarity = cosineSimilarity(dictionary[base1], dictionary[base2]);
    console.log('Checking word pair:', { word1, word2, similarity });
    
    if (similarity < 0.1) {
      console.log('Found suitable word pair:', { word1, word2, similarity });
      return [word1, word2];
    }
    
    attempts++;
  }
  
  console.log('Failed to find suitable word pair, using fallback pair');
  return ["cat", "dog"];
};