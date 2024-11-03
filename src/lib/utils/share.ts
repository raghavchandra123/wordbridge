import { GameState } from "@/lib/types";

const getColorEmoji = (progress: number): string => {
  if (progress <= 20) {
    return "🟦"; // Blue for start
  } else if (progress <= 40) {
    return "🟩"; // Green for early progress
  } else if (progress <= 60) {
    return "🟧"; // Orange for mid progress
  } else if (progress <= 80) {
    return "🟨"; // Yellow for mid progress
  } else {
    return "🟥"; // Red for end/target
  }
};

const generateWordEmojis = (word: string, progress: number): string => {
  return Array(word.length).fill(getColorEmoji(progress)).join("");
};

export const generateShareText = (game: GameState): string => {
  const chainLength = game.currentChain.length - 1;
  const gameUrl = `${window.location.origin.replace('preview--', '')}/${game.startWord}/${game.targetWord}`;
  
  let shareText = `I Connected ${game.startWord.toUpperCase()} to ${game.targetWord.toUpperCase()} in ${chainLength} steps!\n\n`;
  
  // Add start word
  shareText += `${game.startWord.toUpperCase()}\n`;
  
  // Add each word's emojis
  for (let i = 1; i < game.currentChain.length; i++) {
    const progress = i === game.currentChain.length - 1 ? 100 : game.wordProgresses[i - 1];
    const emojis = generateWordEmojis(game.currentChain[i], progress);
    shareText += `${emojis}\n`;
  }
  
  // Add target word after the last emoji line
  shareText += `${game.targetWord.toUpperCase()}\n\n`;
  
  shareText += `Play with these words: ${gameUrl}`;
  
  return shareText;
};