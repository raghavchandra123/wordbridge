import { Button } from "../ui/button";
import { Share, Shuffle } from "lucide-react";
import { GameState } from "@/lib/types";
import { generateShareText } from "@/lib/utils/share";
import { handleToast } from "@/lib/utils/toastManager";
import { findRandomWordPair } from "@/lib/embeddings/game";

interface EndGameActionsProps {
  game: GameState;
  setGame: (game: GameState) => void;
  onClose: () => void;
}

export const EndGameActions = ({ game, setGame, onClose }: EndGameActionsProps) => {
  const handleShare = async () => {
    const shareText = generateShareText(game);
    
    try {
      if (navigator.share) {
        await navigator.share({
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        handleToast("Copied to clipboard!");
      }
    } catch (err) {
      console.error('Share failed:', err);
      handleToast("Sharing failed. Please try again", "destructive");
    }
  };

  const handleRetry = () => {
    setGame({
      ...game,
      currentChain: [game.startWord],
      wordProgresses: [],
      isComplete: false,
      score: 0
    });
    onClose();
  };

  const handleNewWords = async () => {
    try {
      const [startWord, targetWord] = await findRandomWordPair({});
      setGame({
        startWord,
        targetWord,
        currentChain: [startWord],
        wordProgresses: [],
        isComplete: false,
        score: 0
      });
      onClose();
    } catch (err) {
      console.error('Failed to generate new words:', err);
      handleToast("Failed to generate new words. Please try again.", "destructive");
    }
  };

  return (
    <>
      <Button 
        onClick={handleShare}
        className="w-full bg-[#97BED9] hover:bg-[#97BED9]/90 text-white"
      >
        <Share className="mr-2 h-4 w-4" />
        Share
      </Button>

      <Button 
        onClick={handleRetry}
        className="w-full bg-[#FF8B8B] hover:bg-[#FF8B8B]/90 text-white"
      >
        Retry
      </Button>

      <Button 
        onClick={handleNewWords}
        variant="outline"
        className="w-full"
      >
        <Shuffle className="mr-2 h-4 w-4" />
        New Game
      </Button>
    </>
  );
};