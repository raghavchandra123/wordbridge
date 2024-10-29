export interface WordDictionary {
  [word: string]: Float32Array;
}

export interface GameState {
  startWord: string;
  targetWord: string;
  currentChain: string[];
  isComplete: boolean;
  score: number;
}

export interface HighScore {
  startWord: string;
  targetWord: string;
  chain: string[];
  score: number;
  timestamp: number;
}