import { GameState } from "@/lib/types";

const getColorEmoji = (progress: number): string => {
  if (progress <= 25) {
    return "🟦"; // Blue for start
  } else if (progress <= 50) {
    return "🟩"; // Green for early progress
  } else if (progress <= 75) {
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
  let shareText = `I Connected ${game.startWord.toUpperCase()} to ${game.targetWord.toUpperCase()} in ${chainLength} words!\n\n`;
  
  // Add each word's emojis with the actual words at start and end
  for (let i = 1; i < game.currentChain.length; i++) {
    const word = game.currentChain[i];
    const progress = i === game.currentChain.length - 1 ? 100 : game.wordProgresses[i - 1];
    const emojis = generateWordEmojis(word, progress);
    
    if (i === 1) {
      shareText += `${game.startWord.toUpperCase()} ${emojis}\n`;
    } else if (i === game.currentChain.length - 1) {
      shareText += `${emojis} ${game.targetWord.toUpperCase()}\n`;
    } else {
      shareText += `${emojis}\n`;
    }
  }
  
  shareText += "\nYou can try it here: https://wordbridge.gptengineer.run/";
  
  return shareText;
};