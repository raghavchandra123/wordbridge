import { GameState } from "@/lib/types";

export interface GameBoardProps {
  game: GameState;
  setGame: (game: GameState) => void;
  currentWord: string;
  editingIndex: number | null;
  isChecking: boolean;
  onWordSubmit: (e: React.FormEvent) => void;
  onWordChange: (word: string) => void;
  onWordClick: (index: number | null) => void;
  progress: number;
}