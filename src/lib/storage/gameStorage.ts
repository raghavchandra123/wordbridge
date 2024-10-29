import { GameState } from "@/lib/types";

const GAME_STORAGE_KEY = 'word-bridge-current-game';

export const saveGameProgress = (game: GameState) => {
  localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify({
    ...game,
    date: new Date().toISOString().split('T')[0]
  }));
};

export const loadGameProgress = (): GameState | null => {
  const saved = localStorage.getItem(GAME_STORAGE_KEY);
  if (!saved) return null;
  
  const game = JSON.parse(saved);
  const savedDate = game.date;
  const today = new Date().toISOString().split('T')[0];
  
  if (savedDate !== today) return null;
  
  delete game.date;
  return game;
};