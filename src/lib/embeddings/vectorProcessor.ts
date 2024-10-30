import pako from 'pako';
import { VECTOR_SIZE } from './constants';
import { convertFloat16ToFloat32 } from './float16Converter';
import { WordDictionary } from './types';

export const processCompressedData = (compressedData: ArrayBuffer): WordDictionary => {
  // Decompress the gzipped data
  const decompressed = pako.inflate(new Uint8Array(compressedData));
  
  // Parse the JSON string (it was encoded as UTF-8 in Python)
  const textDecoder = new TextDecoder('utf-8');
  const jsonString = textDecoder.decode(decompressed);
  const vectorData = JSON.parse(jsonString);

  const processedChunk: WordDictionary = {};
  
  // Process each word-vector pair
  for (const [word, vector] of Object.entries(vectorData)) {
    if (!Array.isArray(vector) || vector.length !== VECTOR_SIZE) {
      console.error(`Invalid vector for word "${word}": expected ${VECTOR_SIZE} dimensions`);
      continue;
    }
    
    processedChunk[word] = new Float32Array(vector);
  }

  return processedChunk;
};