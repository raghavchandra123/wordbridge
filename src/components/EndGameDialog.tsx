import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GameState } from "@/lib/types";
import { generateShareText } from "@/lib/utils/share";
import { toast } from "@/components/ui/use-toast";
import { Share, Shuffle, Trophy } from "lucide-react";
import { findRandomWordPair } from "@/lib/embeddings/game";
import { useNavigate } from "react-router-dom";

interface EndGameDialogProps {
  game: GameState;
  open: boolean;
  onClose: () => void;
  setGame: (game: GameState) => void;
}

const EndGameDialog = ({ game, open, onClose, setGame }: EndGameDialogProps) => {
  const navigate = useNavigate();
  
  const nextPuzzleTime = new Date();
  nextPuzzleTime.setHours(24, 0, 0, 0);
  
  const timeUntilNext = nextPuzzleTime.getTime() - Date.now();
  const hoursUntilNext = Math.floor(timeUntilNext / (1000 * 60 * 60));
  const minutesUntilNext = Math.floor((timeUntilNext % (1000 * 60 * 60)) / (1000 * 60));

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
      toast({
        description: "Failed to generate new words. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Congratulations!
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-lg text-center">
            You connected {game.startWord} to {game.targetWord} in {game.score} steps!
          </p>
          
          <Button 
            onClick={handleShare}
            className="w-full bg-[#97BED9] hover:bg-[#97BED9]/90 text-white"
          >
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>

          <Button 
            onClick={() => navigate('/leaderboard')}
            className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-white"
          >
            <Trophy className="mr-2 h-4 w-4" />
            View Leaderboard
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
          
          <p className="text-sm text-center text-muted-foreground">
            Next puzzle in {hoursUntilNext}h {minutesUntilNext}m
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EndGameDialog;
