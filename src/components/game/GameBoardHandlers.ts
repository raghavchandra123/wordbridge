import { GameState } from "@/lib/types";
import { findRandomWordPair } from "@/lib/embeddings";
import { generateShareText } from "@/lib/utils/share";
import { toast } from "../ui/use-toast";
import { generateHint } from "@/lib/utils/hintGenerator";

export const useGameBoardHandlers = (
  game: GameState,
  setGame: (game: GameState) => void,
  onWordClick: (index: number | null) => void,
  editingIndex: number | null,
  onWordChange: (word: string) => void,
  onWordRejected: () => void,
  onHintUsed: () => void,
  onNewGameWithoutCompletion: () => void,
  minThreshold: number,
  maxThreshold: number,
  recalculateChainProgress: (chain: string[]) => Promise<number[]>
) => {
  const handleRetry = () => {
    onNewGameWithoutCompletion();
    setGame({
      ...game,
      currentChain: [game.startWord],
      wordProgresses: [],
      isComplete: false,
      score: 0
    });
  };

  const handleBackButton = async () => {
    if (editingIndex !== null) {
      onWordClick(null);
    } else if (game.currentChain.length > 1) {
      onWordRejected();
      const newChain = [...game.currentChain];
      newChain.pop();
      
      const newProgresses = await recalculateChainProgress(newChain);
      
      setGame({
        ...game,
        currentChain: newChain,
        wordProgresses: newProgresses,
        score: newChain.length - 1
      });
    }
  };

  const handleShare = async () => {
    const shareText = generateShareText(game);
    try {
      if (navigator.share) {
        await navigator.share({
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({
          description: "Copied to clipboard!",
        });
      }
    } catch (err) {
      console.error('Share failed:', err);
      toast({
        description: "Sharing failed. Please try again",
        variant: "destructive",
      });
    }
  };

  const handleNewWords = async () => {
    if (!game.isComplete) {
      onNewGameWithoutCompletion();
    }
    try {
      const [startWord, targetWord] = await findRandomWordPair({ 
        minThreshold,
        maxThreshold 
      });
      setGame({
        startWord,
        targetWord,
        currentChain: [startWord],
        wordProgresses: [],
        isComplete: false,
        score: 0
      });
    } catch (err) {
      console.error('Failed to generate new words:', err);
      toast({
        description: "Failed to generate new words. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleHint = async () => {
    onHintUsed();
    try {
      const previousWord = game.currentChain[game.currentChain.length - 1];
      const currentProgress = game.wordProgresses[game.wordProgresses.length - 1] || 0;
      
      const hint = await generateHint(
        previousWord,
        game.targetWord,
        currentProgress,
        game.currentChain
      );

      if (hint) {
        onWordChange(hint);
        setTimeout(() => {
          const form = document.querySelector('form');
          if (form) {
            form.dispatchEvent(new Event('submit', { cancelable: true }));
          }
        }, 100);
      } else {
        toast({
          description: "Couldn't find a hint at this time. Try a different word!",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating hint:', error);
      toast({
        description: "Error generating hint. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    handleRetry,
    handleBackButton,
    handleShare,
    handleNewWords,
    handleHint
  };
};