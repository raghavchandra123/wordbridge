import { Button } from "../ui/button";
import WordInput from "./WordInput";
import { Share, Shuffle, Lightbulb } from "lucide-react";
import { GameState } from "@/lib/types";

interface GameBoardControlsProps {
  game: GameState;
  currentWord: string;
  onWordChange: (word: string) => void;
  onWordSubmit: (e: React.FormEvent) => void;
  editingIndex: number | null;
  isChecking: boolean;
  handleBackButton: () => void;
  handleHint: () => void;
  handleNewWords: () => void;
  handleShare: () => void;
  isGeneratingHint: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
}

export const GameBoardControls = ({
  game,
  currentWord,
  onWordChange,
  onWordSubmit,
  editingIndex,
  isChecking,
  handleBackButton,
  handleHint,
  handleNewWords,
  handleShare,
  isGeneratingHint,
  inputRef,
}: GameBoardControlsProps) => {
  if (game.isComplete) {
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
          onClick={() => window.location.reload()}
          className="w-full bg-[#FF8B8B] hover:bg-[#FF8B8B]/90 text-white"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <WordInput
        currentWord={currentWord}
        onWordChange={onWordChange}
        onWordSubmit={onWordSubmit}
        editingIndex={editingIndex}
        isChecking={isChecking}
        onEditCancel={handleBackButton}
        inputRef={inputRef}
      />
      <div className="flex gap-2 mt-2">
        <Button 
          onClick={handleHint}
          variant="outline"
          className="flex-1"
          disabled={isGeneratingHint}
        >
          <Lightbulb className="mr-2 h-4 w-4" />
          {isGeneratingHint ? "Finding Hint..." : "Hint"}
        </Button>
        <Button 
          onClick={handleNewWords}
          variant="outline"
          className="flex-1"
        >
          <Shuffle className="mr-2 h-4 w-4" />
          New Game
        </Button>
      </div>
    </>
  );
};