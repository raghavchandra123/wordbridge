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