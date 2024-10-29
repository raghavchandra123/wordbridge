import { GameState } from "@/lib/types";

export const generateShareText = (game: GameState): string => {
  const steps = game.currentChain.length - 1;
  return `I connected ${game.startWord} to ${game.targetWord} in ${steps} steps! Try it out here: https://wordbridge.example.com`;
};

export const generateShareImage = async (game: GameState): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Set canvas size based on longest word
  const maxLength = Math.max(...game.currentChain.map(w => w.length));
  canvas.width = maxLength * 60 + 40;
  canvas.height = game.currentChain.length * 60 + 40;
  
  // Draw background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw squares for each word
  game.currentChain.forEach((word, wordIndex) => {
    const showLetters = wordIndex === 0 || wordIndex === game.currentChain.length - 1;
    
    word.split('').forEach((letter, letterIndex) => {
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        letterIndex * 60 + 20,
        wordIndex * 60 + 20,
        50,
        50
      );
      
      if (showLetters) {
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(
          letter.toUpperCase(),
          letterIndex * 60 + 35,
          wordIndex * 60 + 55
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
      // Fallback to clipboard
      copyToClipboard(text);
    }
  } else {
    copyToClipboard(text);
  }
};

const copyToClipboard = async (text: string) => {
  await navigator.clipboard.writeText(text);
};