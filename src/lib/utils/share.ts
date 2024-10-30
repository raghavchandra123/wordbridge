import { GameState } from "@/lib/types";

const getColorEmoji = (progress: number): string => {
  if (progress <= 25) {
    return "🟦";
  } else if (progress <= 50) {
    return "🟩";
  } else if (progress <= 75) {
    return "🟨";
  } else {
    return "🟥";
  }
};

const generateWordEmojis = (word: string, progress: number): string => {
  return Array(word.length).fill(getColorEmoji(progress)).join("");
};

export const generateShareText = (game: GameState): string => {
  const chainLength = game.currentChain.length - 1;
  let shareText = `I Connected ${game.startWord.toUpperCase()} to ${game.targetWord.toUpperCase()} in ${chainLength} words!\n\n`;
  
  for (let i = 1; i < game.currentChain.length; i++) {
    const word = game.currentChain[i];
    const progress = i === game.currentChain.length - 1 ? 100 : game.wordProgresses[i - 1];
    shareText += generateWordEmojis(word, progress) + "\n";
  }
  
  shareText += "\nYou can try it here: https://wordbridge.gptengineer.run/";
  
  return shareText;
};