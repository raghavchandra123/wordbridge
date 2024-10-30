import { GameState } from "@/lib/types";

const getColorEmoji = (progress: number): string => {
  if (progress <= 25) {
    return "🟦"; // Blue
  } else if (progress <= 50) {
    return "🟩"; // Green
  } else if (progress <= 75) {
    return "🟨"; // Yellow
  } else {
    return "🟥"; // Red
  }
};

const generateWordEmojis = (word: string, progress: number): string => {
  return Array(word.length).fill(getColorEmoji(progress)).join("");
};

export const generateShareText = (game: GameState): string => {
  const chainLength = game.currentChain.length - 1;
  let shareText = `Connected ${game.startWord} to ${game.targetWord} in ${chainLength} words!\n\n`;
  
  shareText += `${game.startWord}\n`;
  
  for (let i = 1; i < game.currentChain.length; i++) {
    const word = game.currentChain[i];
    const progress = i === game.currentChain.length - 1 ? 100 : game.wordProgresses[i - 1];
    shareText += generateWordEmojis(word, progress) + "\n";
  }
  
  shareText += `${game.targetWord}\n\n`;
  shareText += "Try it out at https://wordbridge.example.com";
  
  return shareText;
};