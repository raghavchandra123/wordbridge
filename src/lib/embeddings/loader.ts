import { WordDictionary } from './types';
import { convertRawDictionary } from './utils';

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
    console.log('Starting embeddings loading process...');
    
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
    
    // Load concept embeddings
    const embedsResponse = await fetch('/data/concept_embeds.json');
    if (!embedsResponse.ok) throw new Error('Failed to load concept embeddings');
    const rawData = await embedsResponse.json();
    console.log('Raw embeddings data loaded, structure:', {
      type: typeof rawData,
      isNull: rawData === null,
      isObject: typeof rawData === 'object',
      keys: Object.keys(rawData || {}).length,
      sampleKey: Object.keys(rawData || {})[0],
    });
    
    // Convert raw data to dictionary format
    dictionary = convertRawDictionary(rawData);
    console.log('Converted embeddings dictionary:', Object.keys(dictionary).length, 'entries');
    
    // Create word list from common words that have vectors
    wordList = commonWords.filter(word => {
      const baseform = wordBaseformMap?.[word];
      return baseform && dictionary?.[baseform]?.vector !== undefined;
    });
    
    console.log('Filtered to valid common words with vectors:', wordList.length);
    return dictionary;
  } catch (error) {
    console.error('Failed to load embeddings:', error);
    throw error;
  }
};

export const getWordList = (): string[] => wordList;
export const getBaseForm = (word: string): string | null => wordBaseformMap?.[word] || null;
export const isValidWord = (word: string): boolean => wordBaseformMap ? word in wordBaseformMap : false;