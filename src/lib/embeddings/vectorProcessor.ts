import pako from 'pako';
import { VECTOR_SIZE } from './constants';
import { convertFloat16ToFloat32 } from './float16Converter';
import { WordDictionary } from './types';

// Browser-compatible base64 to bytes conversion
const base64ToBytes = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const processCompressedData = (compressedData: ArrayBuffer): WordDictionary => {
  const decompressed = pako.inflate(new Uint8Array(compressedData));
  const textDecoder = new TextDecoder();
  const jsonString = textDecoder.decode(decompressed);
  const chunkData = JSON.parse(jsonString);

  const processedChunk: WordDictionary = {};
  
  for (const [word, vectorBase64] of Object.entries(chunkData)) {
    // Convert the base64 string to bytes using browser-compatible method
    const bytes = base64ToBytes(vectorBase64 as string);
    
    if (bytes.length !== VECTOR_SIZE * 2) { // float16 uses 2 bytes per number
      console.error(`❌ Invalid vector size for word "${word}": ${bytes.length} bytes`);
      continue;
    }
    
    // Convert float16 to float32
    const float32Array = new Float32Array(VECTOR_SIZE);
    for (let i = 0; i < VECTOR_SIZE; i++) {
      const uint16Value = (bytes[i * 2 + 1] << 8) | bytes[i * 2];
      float32Array[i] = convertFloat16ToFloat32(uint16Value);
    }
    
    processedChunk[word] = float32Array;
  }

  return processedChunk;
};