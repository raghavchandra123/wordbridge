export interface WordEmbedding {
  vector: Float32Array;
}

export interface WordDictionary {
  [word: string]: WordEmbedding;
}

export type RawEmbedding = number[];
export type RawEmbeddingDictionary = { [word: string]: RawEmbedding };