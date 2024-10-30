import { GameState } from "@/lib/types";
import { THEME_COLORS } from "@/lib/constants";

export const generateShareText = (game: GameState): string => {
  return `Word Bridge: Connected ${game.startWord} to ${game.targetWord} in ${game.score} steps! Try it at https://wordbridge.example.com`;
};

export const generateShareImage = async (game: GameState): Promise<Blob> => {
  console.log('SQUARE CHECK: Generating share image with game state:', game);
  
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
  
  // Draw words
  const drawWord = (word: string, y: number, progress: number) => {
    console.log(`SQUARE CHECK: Drawing word "${word}" with progress ${progress}`);
    
    const startRGB = hexToRgb(THEME_COLORS.START);
    const endRGB = hexToRgb(THEME_COLORS.END);
    const color = interpolateColor(startRGB, endRGB, progress / 100);
    
    word.split('').forEach((letter, i) => {
      const x = (canvas.width - word.length * (squareSize + gap)) / 2 + i * (squareSize + gap);
      
      // Draw square
      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`;
      ctx.strokeStyle = THEME_COLORS.GRADIENT.MID2;
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.roundRect(x, y, squareSize, squareSize, 8);
      ctx.fill();
      ctx.stroke();
      
      // Draw letter
      ctx.fillStyle = THEME_COLORS.TEXT.PRIMARY;
      ctx.font = 'bold 24px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letter.toUpperCase(), x + squareSize / 2, y + squareSize / 2);
    });
  };
  
  // Draw start word
  drawWord(game.startWord, padding + wordHeight, 0);
  
  // Draw target word
  drawWord(game.targetWord, canvas.height - padding - squareSize, 100);
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!);
    });
  });
};

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

const interpolateColor = (
  start: { r: number, g: number, b: number },
  end: { r: number, g: number, b: number },
  progress: number
) => {
  return {
    r: Math.round(start.r + (end.r - start.r) * progress),
    g: Math.round(start.g + (end.g - start.g) * progress),
    b: Math.round(start.b + (end.b - start.b) * progress)
  };
};