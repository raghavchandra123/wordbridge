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
    <div className="space-y-4" ref={setContainerRef}>
      <div className="flex flex-col items-center gap-2">
        <div className="w-full">
          <WordDisplay 
            word={game.startWord} 
            progress={0}
            containerWidth={containerWidth} 
          />
        </div>
        <ArrowDown style={{ color: THEME_COLORS.GRADIENT.MID2 }} size={20} />
        <div className="w-full">
          <WordDisplay 
            word={game.targetWord} 
            progress={100}
            containerWidth={containerWidth} 
          />
        </div>
      </div>

      <div className="relative w-full h-2 rounded-full overflow-hidden my-2" 
        style={{ backgroundColor: `${THEME_COLORS.GRADIENT.MID2}33` }}
      >
        <div 
          className="h-full transition-all"
          style={{ 
            width: `${progress}%`,
            background: `linear-gradient(to right, ${THEME_COLORS.START}, ${THEME_COLORS.END})`
          }}
        />
      </div>

      <div className="space-y-1">
        {game.currentChain.map((word, index) => (
          <Button
            key={index}
            variant="ghost"
            className={`w-full py-2 text-center font-medium transition-colors hover:bg-opacity-10 ${
              index === 0 ? 'opacity-100' : ''
            }`}
            onClick={() => onWordClick(index === editingIndex ? null : index)}
            disabled={index === 0 || game.isComplete}
            style={{ 
              opacity: index === 0 ? 1 : undefined,
              pointerEvents: index === 0 ? 'none' : undefined,
              color: THEME_COLORS.TEXT.PRIMARY
            }}
          >
            <WordDisplay 
              word={word} 
              progress={index === 0 ? 0 : index === game.currentChain.length - 1 ? progress : game.wordProgresses[index]}
              containerWidth={containerWidth} 
            />
          </Button>
        ))}
      </div>

      {!game.isComplete && (
        <form onSubmit={onWordSubmit} className="space-y-2">
          <Input
            value={currentWord}
            onChange={(e) => onWordChange(e.target.value.toLowerCase())}
            placeholder={editingIndex !== null ? `Change word #${editingIndex + 1}` : "Enter a word..."}
            className="text-center text-lg"
            style={{ 
              backgroundColor: `${THEME_COLORS.GRADIENT.MID3}33`,
              borderColor: THEME_COLORS.GRADIENT.MID2
            }}
            disabled={isChecking}
          />
          <div className="flex gap-2">
            <Button 
              type="submit" 
              className="flex-1 text-lg text-white hover:opacity-90"
              style={{ backgroundColor: THEME_COLORS.GRADIENT.MID2 }}
              disabled={isChecking}
            >
              {isChecking ? "Checking..." : (editingIndex !== null ? "Update Word" : "Submit Word")}
            </Button>
            {editingIndex !== null && (
              <Button 
                type="button" 
                variant="outline"
                className="text-lg hover:opacity-90"
                style={{ borderColor: THEME_COLORS.GRADIENT.MID2, color: THEME_COLORS.GRADIENT.MID2 }}
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
