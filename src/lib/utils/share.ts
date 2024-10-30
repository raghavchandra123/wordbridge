import { GameState } from "@/lib/types";
import { THEME_COLORS } from "@/lib/constants";

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
  const chainLength = game.currentChain.length - 1; // -1 because we don't count the start word
  let shareText = `Connected ${game.startWord} to ${game.targetWord} in ${chainLength} words!\n\n`;
  
  // Add start word
  shareText += `${game.startWord}\n`;
  
  // Add emojis for each word in the chain (except start word)
  for (let i = 1; i < game.currentChain.length; i++) {
    const word = game.currentChain[i];
    const progress = i === game.currentChain.length - 1 ? 100 : game.wordProgresses[i - 1];
    shareText += generateWordEmojis(word, progress) + "\n";
  }
  
  // Add target word
  shareText += `${game.targetWord}\n\n`;
  
  // Add link
  shareText += "Try it out at https://wordbridge.example.com";
  
  return shareText;
};

const drawWord = (
  ctx: CanvasRenderingContext2D,
  word: string,
  y: number,
  progress: number,
  squareSize: number,
  gap: number,
  canvasWidth: number,
  showLetters: boolean = true
) => {
  const wordWidth = word.length * (squareSize + gap) - gap;
  let x = (canvasWidth - wordWidth) / 2;

  word.split('').forEach((letter) => {
    // Calculate color based on progress
    let color;
    if (progress <= 33) {
      color = THEME_COLORS.START;
    } else if (progress <= 66) {
      color = THEME_COLORS.GRADIENT.MID1;
    } else if (progress <= 90) {
      color = THEME_COLORS.GRADIENT.MID2;
    } else {
      color = THEME_COLORS.END;
    }

    // Draw square background
    ctx.fillStyle = color;
    ctx.strokeStyle = THEME_COLORS.BORDER;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, squareSize, squareSize, 8);
    ctx.fill();
    ctx.stroke();

    // Draw letter only if showLetters is true
    if (showLetters) {
      ctx.fillStyle = THEME_COLORS.TEXT.PRIMARY;
      ctx.font = 'bold 24px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letter.toUpperCase(), x + squareSize / 2, y + squareSize / 2);
    }

    x += squareSize + gap;
  });
};

export const generateShareImage = async (game: GameState): Promise<string> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const squareSize = 60;
  const gap = 10;
  const padding = 40;
  const wordHeight = squareSize + gap;

  const maxWordLength = Math.max(
    game.startWord.length,
    game.targetWord.length,
    ...game.currentChain.map(w => w.length)
  );

  canvas.width = maxWordLength * (squareSize + gap) + padding * 2;
  canvas.height = (game.currentChain.length + 1) * wordHeight + padding * 2;

  // Draw background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw title
  ctx.fillStyle = THEME_COLORS.TEXT.PRIMARY;
  ctx.font = 'bold 24px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(`Word Bridge - ${game.score} steps`, canvas.width / 2, padding);

  // Draw words with their respective progresses
  game.currentChain.forEach((word, index) => {
    const progress = index === 0 ? 0 : 
                    index === game.currentChain.length - 1 ? 100 : 
                    game.wordProgresses[index - 1];
    
    // Show letters only for start and end words
    const showLetters = index === 0 || index === game.currentChain.length - 1;
    
    drawWord(
      ctx,
      word,
      padding + index * wordHeight + wordHeight,
      progress,
      squareSize,
      gap,
      canvas.width,
      showLetters
    );
  });

  return canvas.toDataURL('image/png');
};
