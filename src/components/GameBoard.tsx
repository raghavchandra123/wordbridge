import { useState } from "react";
import { Input } from "./ui/input";
import WordDisplay from "./WordDisplay";
import { GameState } from "@/lib/types";
import { ArrowDown } from "lucide-react";
import { THEME_COLORS } from "@/lib/constants";
import { Button } from "./ui/button";

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
        <div className="p-4 w-full">
          <WordDisplay 
            word={game.startWord} 
            progress={0}
            containerWidth={containerWidth} 
          />
        </div>
        <ArrowDown style={{ color: THEME_COLORS.BORDER.LIGHT }} size={24} />
        <div className="p-4 w-full">
          <WordDisplay 
            word={game.targetWord} 
            progress={100}
            containerWidth={containerWidth} 
          />
        </div>
      </div>

      <div className="relative w-full h-2 rounded-full overflow-hidden bg-opacity-20" style={{ backgroundColor: THEME_COLORS.START }}>
        <div 
          className="h-full transition-all"
          style={{ 
            width: `${progress}%`,
            background: `linear-gradient(to right, ${THEME_COLORS.START}, ${THEME_COLORS.END})`
          }}
        />
      </div>

      <div className="space-y-2">
        {game.currentChain.map((word, index) => (
          <Button
            key={index}
            variant="ghost"
            className="w-full p-3 text-center font-medium transition-colors hover:bg-opacity-10"
            onClick={() => onWordClick(index === editingIndex ? null : index)}
            disabled={index === 0 || game.isComplete}
          >
            <WordDisplay 
              word={word} 
              progress={index === 0 ? 0 : progress}
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
            className="text-center text-lg bg-opacity-20"
            disabled={isChecking}
          />
          <div className="flex gap-2">
            <Button 
              type="submit" 
              className="flex-1 text-lg text-white"
              style={{ backgroundColor: THEME_COLORS.END }}
              disabled={isChecking}
            >
              {isChecking ? "Checking..." : (editingIndex !== null ? "Update Word" : "Submit Word")}
            </Button>
            {editingIndex !== null && (
              <Button 
                type="button" 
                variant="outline"
                className="text-lg"
                style={{ borderColor: THEME_COLORS.BORDER.LIGHT, color: THEME_COLORS.BORDER.LIGHT }}
                disabled={isChecking}
                onClick={() => onWordClick(null)}
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