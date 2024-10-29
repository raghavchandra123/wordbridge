import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GameState } from "@/lib/types";
import { shareGame } from "@/lib/utils/share";

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
            You completed today's puzzle in {game.currentChain.length - 1} steps!
          </p>
          <Button 
            onClick={() => shareGame(game)}
            className="w-full bg-[#FF8B8B] hover:bg-[#FF8B8B]/90 text-white"
          >
            Share
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