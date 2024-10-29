import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import WordDisplay from "./WordDisplay";
import { GameState } from "@/lib/types";
import { calculateProgress } from "@/lib/embeddings/utils";

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
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center text-2xl font-bold">
        <div className="p-4 bg-[#FF8B8B]/70 rounded-lg border border-[#FF8B8B]">
          <WordDisplay word={game.startWord} progress={100} />
        </div>
        <div className="text-[#FF8B8B]">→</div>
        <div className="p-4 bg-[#FFD93D]/70 rounded-lg border border-[#FFD93D]">
          <WordDisplay word={game.targetWord} progress={0} />
        </div>
      </div>

      <Progress value={progress} />

      <div className="space-y-2">
        {game.currentChain.map((word, index) => (
          <Button
            key={index}
            variant="ghost"
            className="w-full p-3 text-center font-medium border transition-colors"
            onClick={() => onWordClick(index === editingIndex ? null : index)}
            disabled={index === 0 || game.isComplete}
          >
            <WordDisplay 
              word={word} 
              progress={index === 0 ? 100 : calculateProgress(progress)} 
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
            className="text-center text-lg"
            disabled={isChecking}
          />
          <div className="flex gap-2">
            <Button type="submit" className="flex-1 text-lg" disabled={isChecking}>
              {isChecking ? "Checking..." : (editingIndex !== null ? "Update Word" : "Submit Word")}
            </Button>
            {editingIndex !== null && (
              <Button 
                type="button" 
                variant="outline"
                onClick={() => onWordClick(null)}
                className="text-lg"
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