import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import WordDisplay from "./WordDisplay";
import { GameState } from "@/lib/types";
import { ArrowDown } from "lucide-react";

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
    <div className="space-y-8 bg-[#fff8f0] border border-[#f6bc66] rounded-lg p-6" ref={setContainerRef}>
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 rounded-lg w-full">
          <WordDisplay 
            word={game.startWord} 
            progress={100}
            containerWidth={containerWidth} 
          />
        </div>
        <ArrowDown className="text-[#f6bc66]" size={24} />
        <div className="p-4 rounded-lg w-full">
          <WordDisplay 
            word={game.targetWord} 
            progress={0}
            containerWidth={containerWidth} 
          />
        </div>
      </div>

      <div className="relative w-full h-2 bg-[#f55c7a]/20 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#f55c7a] to-[#f6bc66] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

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
            className="text-center text-lg bg-[#f55c7a]/10 border-[#f6bc66]/20"
            disabled={isChecking}
          />
          <div className="flex gap-2">
            <Button 
              type="submit" 
              className="flex-1 text-lg bg-[#ffb366] hover:bg-[#ffb366]/90 text-white"
              disabled={isChecking}
            >
              {isChecking ? "Checking..." : (editingIndex !== null ? "Update Word" : "Submit Word")}
            </Button>
            {editingIndex !== null && (
              <Button 
                type="button" 
                variant="outline"
                onClick={() => onWordClick(null)}
                className="text-lg border-[#f6bc66] text-[#f6bc66] hover:bg-[#f6bc66]/10"
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