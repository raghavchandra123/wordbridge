import { Button } from "../ui/button";
import { Share, Shuffle } from "lucide-react";
import { GameState } from "@/lib/types";

interface GameControlButtonsProps {
  game: GameState;
  handleShare: () => void;
  handleRetry: () => void;
  handleNewWords: () => void;
}

export const GameControlButtons = ({
  game,
  handleShare,
  handleRetry,
  handleNewWords,
}: GameControlButtonsProps) => {
  return (
    <div className="flex flex-col gap-2">
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
    </div>
  );
};