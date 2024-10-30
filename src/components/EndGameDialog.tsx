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
import { Share } from "lucide-react";

interface EndGameDialogProps {
  game: GameState;
  open: boolean;
  onClose: () => void;
}

const EndGameDialog = ({ game, open, onClose }: EndGameDialogProps) => {
  const nextPuzzleTime = new Date();
  nextPuzzleTime.setHours(24, 0, 0, 0);
  
  const timeUntilNext = nextPuzzleTime.getTime() - Date.now();
  const hoursUntilNext = Math.floor(timeUntilNext / (1000 * 60 * 60));
  const minutesUntilNext = Math.floor((timeUntilNext % (1000 * 60 * 60)) / (1000 * 60));

  const handleShare = async () => {
    const fullText = generateShareText(game);
    const lines = fullText.split('\n');
    const title = lines[0];
    const text = lines.slice(1).join('\n').trim();
    
    try {
      if (navigator.share) {
        await navigator.share({
          text: fullText,
          title,
        });
      } else {
        await navigator.clipboard.writeText(fullText);
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
            className="w-full bg-[#FF8B8B] hover:bg-[#FF8B8B]/90 text-white"
          >
            <Share className="mr-2 h-4 w-4" />
            Share Result
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