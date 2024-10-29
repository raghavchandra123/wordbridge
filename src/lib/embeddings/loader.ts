import { WordDictionary } from './types';

let dictionary: WordDictionary | null = null;
let wordList: string[] = [];
let wordBaseformMap: { [key: string]: string } | null = null;
let commonWords: string[] = [];

export const loadEmbeddings = async () => {
  if (dictionary && wordBaseformMap && commonWords.length > 0) {
    return dictionary;
  }
  
  try {
    // Load common words
    const commonWordsResponse = await fetch('/data/common_words.txt');
    if (!commonWordsResponse.ok) throw new Error('Failed to load common words');
    const commonWordsText = await commonWordsResponse.text();
    commonWords = commonWordsText.split('\n').filter(word => word.trim());
    
    // Load word to baseform mapping
    const wordBaseformResponse = await fetch('/data/word_baseform.json');
    if (!wordBaseformResponse.ok) throw new Error('Failed to load word baseform mappings');
    wordBaseformMap = await wordBaseformResponse.json();
    
    // Load concept embeddings - this is a simple word: vector dictionary
    const embedsResponse = await fetch('/data/concept_embeds.json');
    if (!embedsResponse.ok) throw new Error('Failed to load concept embeddings');
    const rawData = await embedsResponse.json();
    
    // Convert raw arrays to Float32Arrays
    dictionary = Object.fromEntries(
      Object.entries(rawData).map(([word, vector]) => [word, new Float32Array(vector as number[])])
    );
    
    // Create word list from common words that have vectors
    wordList = commonWords.filter(word => {
      const baseform = wordBaseformMap?.[word];
      return baseform && dictionary?.[baseform] !== undefined;
    });
    
    return dictionary;
  } catch (error) {
    console.error('Failed to load embeddings:', error);
    throw error;
  }
};

export const getWordList = (): string[] => wordList;
export const getBaseForm = (word: string): string | null => wordBaseformMap?.[word] || null;
export const isValidWord = (word: string): boolean => wordBaseformMap ? word in wordBaseformMap : false;