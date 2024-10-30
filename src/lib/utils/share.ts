import { GameState } from "@/lib/types";
import { THEME_COLORS } from "@/lib/constants";

export const generateShareText = (game: GameState): string => {
  const steps = game.currentChain.length - 1;
  return `I connected ${game.startWord} to ${game.targetWord} in ${steps} steps! Try it out here: https://wordbridge.example.com`;
};

export const generateShareImage = async (game: GameState): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  const maxWordLength = Math.max(...game.currentChain.map(w => w.length));
  const squareSize = 50;
  const padding = 20;
  const gap = 10;
  
  canvas.width = maxWordLength * (squareSize + gap) + padding * 2;
  canvas.height = game.currentChain.length * (squareSize + gap) + padding * 2;
  
  // Draw background
  ctx.fillStyle = THEME_COLORS.BACKGROUND;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw words
  game.currentChain.forEach((word, wordIndex) => {
    const showLetters = wordIndex === 0 || wordIndex === game.currentChain.length - 1;
    const progress = wordIndex === 0 ? 0 : 
                    wordIndex === game.currentChain.length - 1 ? game.wordProgresses[wordIndex] : 
                    game.wordProgresses[wordIndex];
    
    const startRGB = hexToRgb(THEME_COLORS.START);
    const endRGB = hexToRgb(THEME_COLORS.END);
    
    word.split('').forEach((letter, letterIndex) => {
      const x = letterIndex * (squareSize + gap) + padding;
      const y = wordIndex * (squareSize + gap) + padding;
      
      // Draw square background
      const color = interpolateColor(startRGB, endRGB, progress / 100);
      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`;
      ctx.strokeStyle = THEME_COLORS.GRADIENT.MID2;
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.roundRect(x, y, squareSize, squareSize, 8);
      ctx.fill();
      ctx.stroke();
      
      if (showLetters) {
        ctx.fillStyle = THEME_COLORS.TEXT.PRIMARY;
        ctx.font = 'bold 24px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          letter.toUpperCase(),
          x + squareSize / 2,
          y + squareSize / 2
        );
      }
    });
  });
  
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

export const shareGame = async (game: GameState) => {
  const text = generateShareText(game);
  const imageBlob = await generateShareImage(game);
  
  if (navigator.share) {
    try {
      await navigator.share({
        text,
        files: [new File([imageBlob], 'wordbridge.png', { type: 'image/png' })]
      });
    } catch (err) {
      console.error('Share failed:', err);
      copyToClipboard(text);
    }
  } else {
    copyToClipboard(text);
  }
};

const copyToClipboard = async (text: string) => {
  await navigator.clipboard.writeText(text);
};