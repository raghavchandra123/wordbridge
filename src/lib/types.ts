export interface GameState {
  startWord: string;
  targetWord: string;
  currentChain: string[];
  wordProgresses: number[];
  isComplete: boolean;
  score: number;
  initialProgress?: number;
  metadata?: {
    seedDate?: string;
  };
}

export interface HighScore {
  score: number;
  date: string;
  words: {
    start: string;
    target: string;
  };
}