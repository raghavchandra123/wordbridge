import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import WordDisplay from "./WordDisplay";
import { GameState } from "@/lib/types";
import { ArrowDown } from "lucide-react";
import { THEME_COLORS } from "@/lib/constants/colors";

interface GameBoardProps {
  game: GameState;
  currentWord: string;
  editingIndex: number | null;
  isChecking: boolean;
  onWordSubmit: (e: React.FormEvent) => void;
  onWordChange: (word: string) => void;
  onWordClick: (index: number | null) => void;
  progress: number;
}

const GameBoard = ({
  game,
  currentWord,
  editingIndex,
  isChecking,
  onWordSubmit,
  onWordChange,
  onWordClick,
  progress,
}: GameBoardProps) => {
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const containerWidth = containerRef?.offsetWidth ?? 300;

  return (
    <div className="space-y-8" ref={setContainerRef}>
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 rounded-lg w-full">
          <WordDisplay 
            word={game.startWord} 
            progress={100}
            containerWidth={containerWidth} 
          />
        </div>
        <ArrowDown className="text-[#f55c7a]" size={24} />
        <div className="p-4 rounded-lg w-full">
          <WordDisplay 
            word={game.targetWord} 
            progress={0}
            containerWidth={containerWidth} 
          />
        </div>
      </div>

      <Progress 
        value={progress} 
        className="h-2 bg-[#f6bc66]/20" 
        indicatorClassName="bg-gradient-to-r from-[#f6bc66] to-[#f55c7a]" 
      />

      <div className="space-y-2">
        {game.currentChain.map((word, index) => (
          <Button
            key={index}
            variant="ghost"
            className="w-full p-3 text-center font-medium transition-colors hover:bg-transparent"
            onClick={() => onWordClick(index === editingIndex ? null : index)}
            disabled={index === 0 || game.isComplete}
          >
            <WordDisplay 
              word={word} 
              progress={index === 0 ? 100 : progress}
              containerWidth={containerWidth} 
            />
          </Button>
        ))}
      </div>

      {!game.isComplete && (
        <form onSubmit={onWordSubmit} className="space-y-4">
          <Input
            value={currentWord}
            onChange={(e) => onWordChange(e.target.value.toLowerCase())}
            placeholder={editingIndex !== null ? `Change word #${editingIndex + 1}` : "Enter a word..."}
            className="text-center text-lg bg-[#f6bc66]/10 border-[#f55c7a]/20"
            disabled={isChecking}
          />
          <div className="flex gap-2">
            <Button 
              type="submit" 
              className="flex-1 text-lg bg-[#f55c7a] hover:bg-[#f55c7a]/90 text-white"
              disabled={isChecking}
            >
              {isChecking ? "Checking..." : (editingIndex !== null ? "Update Word" : "Submit Word")}
            </Button>
            {editingIndex !== null && (
              <Button 
                type="button" 
                variant="outline"
                onClick={() => onWordClick(null)}
                className="text-lg border-[#f55c7a] text-[#f55c7a] hover:bg-[#f55c7a]/10"
                disabled={isChecking}
              >
                Add New Word
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default GameBoard;