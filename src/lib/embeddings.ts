import { WordDictionary, WordEmbedding } from './types';

let dictionary: WordDictionary | null = null;
let wordList: string[] = [];
let wordBaseformMap: { [key: string]: string } | null = null;
let commonWords: string[] = [];

export const loadEmbeddings = async () => {
  if (dictionary && wordBaseformMap && commonWords.length > 0) {
    console.log('Using cached embeddings dictionary');
    return dictionary;
  }
  
  try {
    console.log('Attempting to load embeddings from files...');
    
    // Load common words
    const commonWordsResponse = await fetch('/data/common_words.txt');
    if (!commonWordsResponse.ok) throw new Error('Failed to load common words');
    const commonWordsText = await commonWordsResponse.text();
    commonWords = commonWordsText.split('\n').filter(word => word.trim());
    console.log('Loaded common words:', commonWords.length, 'entries');
    
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

    // Print sample of embeddings for verification
    const sampleWords = Object.keys(dictionary).slice(0, 3);
    console.log('Sample of loaded embeddings:');
    sampleWords.forEach(word => {
      const vector = dictionary![word].vector;
      console.log(`Word: ${word}`);
      console.log(`Vector (first 5 dimensions): [${Array.from(vector).slice(0, 5).join(', ')}]`);
    });
    
    // Create word list from common words that have vectors
    wordList = commonWords.filter(word => {
      const baseform = wordBaseformMap?.[word];
      return baseform && dictionary?.[baseform]?.vector !== undefined;
    });
    
    console.log('Filtered to valid common words with vectors:', wordList.length);
    console.log('Sample of valid words:', wordList.slice(0, 5));
    
    // Debug: Log a sample of the loaded data
    const sampleWord = wordList[0];
    console.log('Sample word data:', {
      word: sampleWord,
      baseform: wordBaseformMap[sampleWord],
      hasVector: dictionary[wordBaseformMap[sampleWord]] !== undefined
    });
    
    return dictionary;
  } catch (error) {
    console.error('Failed to load embeddings:', error);
    console.log('Falling back to test dictionary');
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
    commonWords = wordList;
    return dictionary;
  }
};

export const getWordList = async (): Promise<string[]> => {
  if (wordList.length) return wordList;
  await loadEmbeddings();
  return wordList;
};

export const getBaseForm = (word: string): string | null => {
  if (!wordBaseformMap) return null;
  const baseform = wordBaseformMap[word];
  console.log('Getting base form:', { word, baseform });
  return baseform || null;
};

export const isValidWord = (word: string): boolean => {
  const isValid = wordBaseformMap ? word in wordBaseformMap : false;
  console.log('Word validation check:', word, isValid ? 'valid' : 'invalid');
  return isValid;
};

export const cosineSimilarity = (word1: string, word2: string): number => {
  if (!dictionary || !wordBaseformMap) {
    console.log('Dictionary or baseform map not loaded');
    return 0;
  }

  const base1 = wordBaseformMap[word1];
  const base2 = wordBaseformMap[word2];
  
  console.log('Comparing words:', {
    word1,
    word2,
    base1,
    base2,
    hasVector1: dictionary[base1]?.vector !== undefined,
    hasVector2: dictionary[base2]?.vector !== undefined
  });

  if (!base1 || !base2 || !dictionary[base1]?.vector || !dictionary[base2]?.vector) {
    console.log('Missing vectors for words');
    return 0;
  }

  const vec1 = dictionary[base1].vector;
  const vec2 = dictionary[base2].vector;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    normA += vec1[i] * vec1[i];
    normB += vec2[i] * vec2[i];
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
  await loadEmbeddings(); // Ensure embeddings are loaded
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    const word1 = wordList[Math.floor(Math.random() * wordList.length)];
    const word2 = wordList[Math.floor(Math.random() * wordList.length)];
    
    if (word1 === word2) continue;
    
    const similarity = cosineSimilarity(word1, word2);
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